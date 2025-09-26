class AdminPanel {
    constructor() {
        this.allowedIPs = [
            '104.28.33.73', '172.59.196.158', '104.179.159.180'
        ];

        this.apiBaseUrl = 'https://adminbackend-4ils.onrender.com';
        this.currentUserIP = null;
        this.isAdmin = false;
        this.editableElements = new Map();
        this.originalContent = new Map();

        this.init();
    }

    getPageIdentifier() {
        const path = window.location.pathname;
        let page = path.split('/').pop() || 'index.html';
        if (!page.includes('.')) page += '.html';
        return page.replace('.html', '');
    }

    async init() {
        try {
            await this.loadContentForAllUsers();
            await this.checkIPAddress();
            if (this.isAdmin) {
                await this.checkServerConnection();
                this.createAdminPanel();
                this.setupEditableElements();
                this.setupEventListeners();
                console.log('Admin panel initialized for IP:', this.currentUserIP);
            } else {
                console.log('Regular user - content loaded, no admin panel. IP:', this.currentUserIP);
            }
        } catch (error) {
            console.error('Initialization failed:', error);
        }
    }

    async loadContentForAllUsers() {
        const pageName = this.getPageIdentifier();
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/content`);
            if (response.ok) {
                const serverContent = await response.json();
                if (serverContent[pageName]) {
                    this.applyContentToPage(serverContent[pageName]);
                    console.log('Content loaded from server for page:', pageName);
                }
            }
        } catch (error) {
            const savedContent = localStorage.getItem(`admin_content_${pageName}`);
            if (savedContent) {
                this.applyContentToPage(JSON.parse(savedContent));
                console.log('Content loaded from localStorage');
            }
        }
    }

    applyContentToPage(changes) {
        const selectors = [
            '.hero-content h1', '.hero-tagline', '.section-title', '.section-subtitle',
            '.product-title', '.product-description', '.product-price', '.sale-banner',
            '.faq-question', '.faq-answer', '.footer-section p', '.review-text'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach((element, index) => {
                const elementId = `${selector.replace(/[^a-zA-Z0-9]/g, '_')}_${index}`;
                if (changes[elementId] && changes[elementId] !== 'lastModified' && changes[elementId] !== 'modifiedBy') {
                    element.innerHTML = changes[elementId];
                }
            });
        });
    }

    async checkServerConnection() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/health`);
            if (!response.ok) throw new Error('Server not responding');
            console.log('Backend connected');
        } catch (error) {
            console.warn('Backend not available, using localStorage fallback');
            this.apiBaseUrl = null;
        }
    }

    async checkIPAddress() {
        try {
            const ipSources = [
                'https://api.ipify.org?format=json',
                'https://ipapi.co/json/',
                'https://ipinfo.io/json'
            ];

            for (const source of ipSources) {
                try {
                    const response = await fetch(source);
                    const data = await response.json();
                    this.currentUserIP = data.ip || data.query;
                    break;
                } catch (err) {
                    continue;
                }
            }

            if (!this.currentUserIP) {
                console.error('Failed to detect IP address');
                this.isAdmin = false;
                return;
            }

            const isLocalhost = window.location.hostname === 'localhost' ||
                               window.location.hostname === '127.0.0.1';

            this.isAdmin = this.allowedIPs.includes(this.currentUserIP) || 
                          (isLocalhost && window.location.hostname === 'localhost');

            if (this.apiBaseUrl && this.currentUserIP) {
                try {
                    const response = await fetch(`${this.apiBaseUrl}/api/admin/status`);
                    const result = await response.json();
                    this.isAdmin = response.ok && result.authorized;
                    console.log('Server admin verification:', result);
                } catch (error) {
                    console.warn('Backend admin verification failed:', error);
                    this.isAdmin = false;
                }
            }

            console.log(`IP: ${this.currentUserIP}, Is Admin: ${this.isAdmin}, Allowed IPs:`, this.allowedIPs);
        } catch (error) {
            console.error('IP check failed:', error);
            this.isAdmin = false;
        }
    }

    createAdminPanel() {
        if (!this.isAdmin) {
            console.log('Attempted to create admin panel for non-admin user');
            return;
        }

        const adminHTML = `
            <div id="admin-panel" class="admin-panel">
                <div class="admin-header">
                    <div class="admin-title">ADMIN PANEL</div>
                    <button id="close-btn" class="admin-btn">×</button>
                </div>
                
                <div class="admin-content">
                    <div class="admin-section">
                        <h3>Content Editor</h3>
                        <button id="toggle-edit-mode" class="admin-action-btn">
                            Enable Edit Mode
                        </button>
                        <button id="save-changes" class="admin-action-btn" disabled>
                            Save Changes
                        </button>
                        <button id="reset-content" class="admin-action-btn">
                            Reset Content
                        </button>
                    </div>

                    <div class="admin-section">
                        <h3>Status</h3>
                        <div class="admin-info">
                            <div>IP: ${this.currentUserIP}</div>
                            <div>Backend: ${this.apiBaseUrl ? 'Connected' : 'Local Only'}</div>
                            <div>Elements: <span id="editable-count">0</span></div>
                            <div>Page: ${this.getPageIdentifier()}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="admin-toggle" class="admin-toggle">Admin</div>
            
            <div id="edit-overlay" class="edit-overlay" style="display: none;">
                <div class="edit-toolbar">
                    <span>Edit Mode Active - Click elements to edit</span>
                    <button id="exit-edit-mode">Exit</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', adminHTML);
        this.addAdminStyles();
    }

    addAdminStyles() {
        const styles = `
            <style>
                .admin-panel {
                    position: fixed; top: 20px; right: 20px; width: 300px;
                    background: #1a1a1a; color: white; border-radius: 12px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3); z-index: 10000;
                    font-family: 'Inter', sans-serif; backdrop-filter: blur(10px);
                }
                .admin-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 12px 16px; background: #8B7355; border-radius: 12px 12px 0 0;
                    cursor: move; font-weight: 600; font-size: 14px;
                }
                .admin-btn {
                    width: 24px; height: 24px; border: none; background: rgba(255,255,255,0.2);
                    color: white; border-radius: 4px; cursor: pointer; display: flex;
                    align-items: center; justify-content: center; transition: background 0.2s;
                }
                .admin-btn:hover { background: rgba(255,255,255,0.3); }
                .admin-content { padding: 16px; }
                .admin-section { margin-bottom: 20px; }
                .admin-section h3 {
                    font-size: 14px; margin: 0 0 12px 0; color: #8B7355;
                    text-transform: uppercase; letter-spacing: 0.5px;
                }
                .admin-action-btn {
                    display: block; width: 100%; padding: 8px 12px; margin-bottom: 8px;
                    background: #333; border: 1px solid #555; border-radius: 6px;
                    color: white; font-size: 12px; cursor: pointer; transition: all 0.2s;
                }
                .admin-action-btn:hover:not(:disabled) {
                    background: #444; border-color: #8B7355; transform: translateY(-1px);
                }
                .admin-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .admin-info { font-size: 12px; line-height: 1.6; }
                .admin-toggle {
                    position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px;
                    background: #8B7355; border-radius: 8px; display: flex; align-items: center;
                    justify-content: center; font-size: 12px; cursor: pointer; z-index: 9999;
                    transition: all 0.3s; box-shadow: 0 4px 20px rgba(139,115,85,0.3);
                }
                .admin-toggle:hover { transform: scale(1.05); }
                .admin-panel.hidden { display: none; }
                .edit-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(139,115,85,0.1); z-index: 9998; pointer-events: none;
                }
                .edit-toolbar {
                    position: fixed; top: 20px; left: 20px; background: #8B7355;
                    color: white; padding: 12px 20px; border-radius: 8px; display: flex;
                    align-items: center; gap: 15px; z-index: 9999; pointer-events: all;
                }
                .edit-toolbar button {
                    background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
                    color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer;
                }
                .editable-element {
                    position: relative; cursor: pointer !important;
                    outline: 2px dashed #8B7355 !important; background: rgba(139,115,85,0.1) !important;
                }
                .editable-element::after {
                    content: 'Click to edit'; position: absolute; top: -25px; left: 0;
                    background: #8B7355; color: white; padding: 2px 8px; border-radius: 4px;
                    font-size: 11px; white-space: nowrap; pointer-events: none; z-index: 2;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    setupEventListeners() {
        if (!this.isAdmin) return;

        document.getElementById('close-btn').addEventListener('click', () => {
            document.getElementById('admin-panel').classList.add('hidden');
        });

        document.getElementById('admin-toggle').addEventListener('click', () => {
            document.getElementById('admin-panel').classList.remove('hidden');
        });

        document.getElementById('toggle-edit-mode').addEventListener('click', () => {
            this.toggleEditMode();
        });

        document.getElementById('exit-edit-mode').addEventListener('click', () => {
            this.exitEditMode();
        });

        document.getElementById('save-changes').addEventListener('click', () => {
            this.saveChanges();
        });

        document.getElementById('reset-content').addEventListener('click', () => {
            this.resetContent();
        });
    }

    setupEditableElements() {
        if (!this.isAdmin) return;

        const selectors = [
            '.hero-content h1', '.hero-tagline', '.section-title', '.section-subtitle',
            '.product-title', '.product-description', '.product-price', '.sale-banner',
            '.faq-question', '.faq-answer', '.footer-section p', '.review-text'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach((element, index) => {
                const elementId = `${selector.replace(/[^a-zA-Z0-9]/g, '_')}_${index}`;
                element.setAttribute('data-admin-id', elementId);
                this.editableElements.set(elementId, element);
                this.originalContent.set(elementId, element.innerHTML);
            });
        });

        document.getElementById('editable-count').textContent = this.editableElements.size;
    }

    toggleEditMode() {
        if (!this.isAdmin) return;

        const editMode = !document.body.classList.contains('edit-mode');
        const toggleBtn = document.getElementById('toggle-edit-mode');
        const saveBtn = document.getElementById('save-changes');
        const overlay = document.getElementById('edit-overlay');

        if (editMode) {
            document.body.classList.add('edit-mode');
            toggleBtn.textContent = 'Disable Edit Mode';
            saveBtn.disabled = false;
            overlay.style.display = 'block';

            this.editableElements.forEach((element, id) => {
                element.classList.add('editable-element');
                element.addEventListener('click', () => this.editElement(id));
            });
        } else {
            this.exitEditMode();
        }
    }

    exitEditMode() {
        if (!this.isAdmin) return;

        document.body.classList.remove('edit-mode');
        document.getElementById('toggle-edit-mode').textContent = 'Enable Edit Mode';
        document.getElementById('edit-overlay').style.display = 'none';

        this.editableElements.forEach((element) => {
            element.classList.remove('editable-element');
        });
    }

    editElement(elementId) {
        if (!this.isAdmin) return;

        const element = this.editableElements.get(elementId);
        if (!element) return;

        const newContent = prompt('Edit content:', element.textContent);
        if (newContent !== null) {
            element.textContent = newContent;
            document.getElementById('save-changes').disabled = false;
        }
    }

    async saveChanges() {
        if (!this.isAdmin) {
            console.error('Unauthorized save attempt');
            return;
        }

        const changes = {};
        this.editableElements.forEach((element, id) => {
            changes[id] = element.innerHTML;
        });

        const pageName = this.getPageIdentifier();

        try {
            if (this.apiBaseUrl) {
                const response = await fetch(`${this.apiBaseUrl}/api/content`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        page: pageName,
                        changes,
                        timestamp: new Date().toISOString()
                    })
                });

                if (!response.ok) throw new Error('Server save failed');
                console.log('Saved to backend');
            } else {
                localStorage.setItem(`admin_content_${pageName}`, JSON.stringify(changes));
                console.log('Saved to localStorage');
            }

            const saveBtn = document.getElementById('save-changes');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saved!';
            saveBtn.disabled = true;

            setTimeout(() => {
                saveBtn.textContent = originalText;
            }, 2000);

        } catch (error) {
            console.error('Save failed:', error);
            localStorage.setItem(`admin_content_${pageName}`, JSON.stringify(changes));
            alert('Server save failed, saved locally');
        }
    }

    async resetContent() {
        if (!this.isAdmin) return;

        if (!confirm('Reset all content to original? This cannot be undone.')) return;

        this.originalContent.forEach((content, id) => {
            const element = this.editableElements.get(id);
            if (element) element.innerHTML = content;
        });

        const pageName = this.getPageIdentifier();

        if (this.apiBaseUrl) {
            try {
                await fetch(`${this.apiBaseUrl}/api/reset`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'content' })
                });
            } catch (error) {
                console.error('Reset failed:', error);
            }
        }

        localStorage.removeItem(`admin_content_${pageName}`);
        document.getElementById('save-changes').disabled = true;
        console.log('Content reset');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.adminPanel = new AdminPanel();
    }, 1000);
});