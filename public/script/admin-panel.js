// Updated Admin Panel with Server Integration (No Emojis)
// File: public/script/admin-panel.js

class AdminPanel {
    constructor() {
        this.allowedIPs = [
            '192.168.1.100',
            '10.0.0.50',
            '203.0.113.45',
            '192.168.1.243',
            '104.179.159.180'
        ];

        this.apiBaseUrl = this.getApiBaseUrl();
        this.currentUserIP = null;
        this.isAdmin = false;
        this.panelVisible = false;
        this.editableElements = new Map();
        this.originalContent = new Map();
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };

        this.init();
    }

    getApiBaseUrl() {
        // Use environment-specific API URL
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        return 'https://your-admin-api.onrender.com'; // Replace with your actual API URL
    }

    async init() {
        try {
            await this.checkIPAddress();
            if (this.isAdmin) {
                await this.checkServerConnection();
                this.createAdminPanel();
                this.setupEditableElements();
                this.setupEventListeners();
                await this.loadServerContent();
                console.log('Admin panel initialized for authorized user');
            }
        } catch (error) {
            console.error('Admin panel initialization failed:', error);
        }
    }

    async checkServerConnection() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/health`);
            if (!response.ok) {
                throw new Error('Server not responding');
            }
            const data = await response.json();
            console.log('Server connection successful:', data);
        } catch (error) {
            console.warn('Admin server not available, falling back to local storage:', error);
            this.apiBaseUrl = null; // Fall back to localStorage
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

            const isLocalhost = window.location.hostname === 'localhost' ||
                               window.location.hostname === '127.0.0.1' ||
                               window.location.hostname === '';

            this.isAdmin = this.allowedIPs.includes(this.currentUserIP) || isLocalhost;

            if (this.apiBaseUrl && this.isAdmin) {
                try {
                    const response = await fetch(`${this.apiBaseUrl}/api/admin/status`);
                    this.isAdmin = response.ok;
                } catch (error) {
                    console.warn('Admin verification failed, using IP check only');
                }
            }

            console.log(`User IP: ${this.currentUserIP}, Admin Access: ${this.isAdmin}`);
        } catch (error) {
            console.error('IP check failed:', error);
            this.isAdmin = false;
        }
    }

    createAdminPanel() {
        const adminHTML = `
            <div id="admin-panel" class="admin-panel">
                <div class="admin-header">
                    <div class="admin-title">
                        <span class="admin-icon">ADMIN</span>
                        <span>Control Panel</span>
                    </div>
                    <div class="admin-controls">
                        <button id="minimize-btn" class="admin-btn" title="Minimize">-</button>
                        <button id="close-btn" class="admin-btn" title="Close">×</button>
                    </div>
                </div>
                
                <div class="admin-content">
                    <div class="admin-section">
                        <h3>Page Content Editor</h3>
                        <div class="admin-buttons">
                            <button id="toggle-edit-mode" class="admin-action-btn">
                                <span class="btn-icon">EDIT</span>
                                Enable Edit Mode
                            </button>
                            <button id="save-changes" class="admin-action-btn" disabled>
                                <span class="btn-icon">SAVE</span>
                                Save Changes
                            </button>
                            <button id="reset-content" class="admin-action-btn">
                                <span class="btn-icon">RESET</span>
                                Reset Content
                            </button>
                        </div>
                    </div>

                    <div class="admin-section">
                        <h3>Product Management</h3>
                        <div class="admin-buttons">
                            <button id="add-product" class="admin-action-btn">
                                <span class="btn-icon">ADD</span>
                                Add Product
                            </button>
                            <button id="edit-products" class="admin-action-btn">
                                <span class="btn-icon">EDIT</span>
                                Edit Products
                            </button>
                            <button id="manage-images" class="admin-action-btn">
                                <span class="btn-icon">IMG</span>
                                Manage Images
                            </button>
                        </div>
                    </div>

                    <div class="admin-section">
                        <h3>Page Settings</h3>
                        <div class="admin-buttons">
                            <button id="edit-banner" class="admin-action-btn">
                                <span class="btn-icon">BANNER</span>
                                Edit Banner
                            </button>
                            <button id="manage-nav" class="admin-action-btn">
                                <span class="btn-icon">NAV</span>
                                Navigation
                            </button>
                            <button id="seo-settings" class="admin-action-btn">
                                <span class="btn-icon">SEO</span>
                                SEO Settings
                            </button>
                        </div>
                    </div>

                    <div class="admin-section">
                        <h3>Analytics & Tools</h3>
                        <div class="admin-info">
                            <div class="info-item">
                                <span class="info-label">Page:</span>
                                <span class="info-value" id="current-page"></span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">IP:</span>
                                <span class="info-value">${this.currentUserIP}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Editable Elements:</span>
                                <span class="info-value" id="editable-count">0</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Server:</span>
                                <span class="info-value" id="server-status">${this.apiBaseUrl ? 'Connected' : 'Local Only'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="admin-toggle" class="admin-toggle" title="Admin Panel">
                ADMIN
            </div>

            <div id="edit-overlay" class="edit-overlay" style="display: none;">
                <div class="edit-toolbar">
                    <span class="edit-info">Edit Mode Active - Click elements to edit</span>
                    <button id="exit-edit-mode" class="exit-edit-btn">Exit Edit Mode</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', adminHTML);
        this.addAdminStyles();
        document.getElementById('current-page').textContent = this.getCurrentPageName();
    }

    addAdminStyles() {
        const styles = `
            <style id="admin-panel-styles">
                .admin-panel {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    width: 350px;
                    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                    border: 1px solid #444;
                    border-radius: 12px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    z-index: 10000;
                    font-family: 'Inter', sans-serif;
                    color: white;
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease;
                    max-height: 80vh;
                    overflow-y: auto;
                }

                .admin-panel.minimized {
                    height: 50px;
                    overflow: hidden;
                }

                .admin-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: linear-gradient(135deg, #8B7355 0%, #6d5a42 100%);
                    border-radius: 12px 12px 0 0;
                    cursor: move;
                    user-select: none;
                }

                .admin-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    font-size: 14px;
                }

                .admin-icon {
                    font-size: 12px;
                    font-weight: 700;
                    background: rgba(255,255,255,0.2);
                    padding: 2px 6px;
                    border-radius: 4px;
                }

                .admin-controls {
                    display: flex;
                    gap: 4px;
                }

                .admin-btn {
                    width: 24px;
                    height: 24px;
                    border: none;
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s ease;
                    font-weight: 600;
                }

                .admin-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .admin-content {
                    padding: 16px;
                }

                .admin-section {
                    margin-bottom: 20px;
                }

                .admin-section:last-child {
                    margin-bottom: 0;
                }

                .admin-section h3 {
                    font-size: 14px;
                    font-weight: 600;
                    margin: 0 0 12px 0;
                    color: #8B7355;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .admin-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .admin-action-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 12px;
                    background: linear-gradient(135deg, #333 0%, #444 100%);
                    border: 1px solid #555;
                    border-radius: 6px;
                    color: white;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .admin-action-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, #444 0%, #555 100%);
                    border-color: #8B7355;
                    transform: translateY(-1px);
                }

                .admin-action-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                }

                .btn-icon {
                    font-size: 10px;
                    font-weight: 700;
                    background: rgba(139, 115, 85, 0.3);
                    padding: 2px 4px;
                    border-radius: 3px;
                    min-width: 32px;
                    text-align: center;
                }

                .admin-info {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .info-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px 0;
                    border-bottom: 1px solid #444;
                    font-size: 12px;
                }

                .info-item:last-child {
                    border-bottom: none;
                }

                .info-label {
                    color: #aaa;
                    font-weight: 500;
                }

                .info-value {
                    color: #8B7355;
                    font-weight: 600;
                }

                .admin-toggle {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 60px;
                    height: 50px;
                    background: linear-gradient(135deg, #8B7355 0%, #6d5a42 100%);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(139, 115, 85, 0.3);
                    z-index: 9999;
                    transition: all 0.3s ease;
                    color: white;
                }

                .admin-toggle:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 25px rgba(139, 115, 85, 0.4);
                }

                .admin-panel.hidden {
                    display: none;
                }

                .edit-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(139, 115, 85, 0.1);
                    z-index: 9998;
                    pointer-events: none;
                }

                .edit-toolbar {
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    background: linear-gradient(135deg, #8B7355 0%, #6d5a42 100%);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    z-index: 9999;
                    pointer-events: all;
                }

                .edit-info {
                    font-size: 14px;
                    font-weight: 500;
                }

                .exit-edit-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s ease;
                    font-weight: 500;
                }

                .exit-edit-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .editable-element {
                    position: relative;
                    cursor: pointer !important;
                }

                .editable-element::before {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    border: 2px dashed #8B7355;
                    border-radius: 4px;
                    background: rgba(139, 115, 85, 0.1);
                    pointer-events: none;
                    z-index: 1;
                }

                .editable-element::after {
                    content: 'Click to edit';
                    position: absolute;
                    top: -25px;
                    left: 0;
                    background: #8B7355;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 500;
                    white-space: nowrap;
                    pointer-events: none;
                    z-index: 2;
                }

                @media (max-width: 768px) {
                    .admin-panel {
                        width: 300px;
                        right: 10px;
                        top: 10px;
                    }

                    .admin-toggle {
                        bottom: 10px;
                        right: 10px;
                        width: 55px;
                        height: 45px;
                        font-size: 9px;
                    }

                    .edit-toolbar {
                        left: 10px;
                        top: 10px;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 8px;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    setupEventListeners() {
        document.getElementById('minimize-btn').addEventListener('click', () => {
            document.getElementById('admin-panel').classList.toggle('minimized');
        });

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

        // Product management
        document.getElementById('add-product').addEventListener('click', () => {
            this.showAddProductModal();
        });

        document.getElementById('edit-products').addEventListener('click', () => {
            this.showEditProductsModal();
        });

        document.getElementById('manage-images').addEventListener('click', () => {
            this.showImageManagerModal();
        });

        // Page settings
        document.getElementById('edit-banner').addEventListener('click', () => {
            this.showBannerEditor();
        });

        document.getElementById('manage-nav').addEventListener('click', () => {
            this.showNavigationManager();
        });

        document.getElementById('seo-settings').addEventListener('click', () => {
            this.showSEOSettings();
        });

        this.setupDragging();
    }

    setupDragging() {
        const header = document.querySelector('.admin-header');
        const panel = document.getElementById('admin-panel');

        header.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            const rect = panel.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;

            document.addEventListener('mousemove', this.handleDrag.bind(this));
            document.addEventListener('mouseup', this.handleDragEnd.bind(this));
        });
    }

    handleDrag(e) {
        if (!this.isDragging) return;

        e.preventDefault();
        const panel = document.getElementById('admin-panel');
        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;

        panel.style.left = `${Math.max(0, Math.min(x, window.innerWidth - panel.offsetWidth))}px`;
        panel.style.top = `${Math.max(0, Math.min(y, window.innerHeight - panel.offsetHeight))}px`;
        panel.style.right = 'auto';
    }

    handleDragEnd() {
        this.isDragging = false;
        document.removeEventListener('mousemove', this.handleDrag);
        document.removeEventListener('mouseup', this.handleDragEnd);
    }

    setupEditableElements() {
        const editableSelectors = [
            '.hero-content h1',
            '.hero-tagline',
            '.section-title',
            '.section-subtitle',
            '.product-title',
            '.product-description',
            '.product-price',
            '.sale-banner',
            '.faq-question',
            '.faq-answer',
            '.footer-section p',
            '.review-text',
            '.reviewer-info strong'
        ];

        editableSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((element, index) => {
                const elementId = `${selector.replace(/[^a-zA-Z0-9]/g, '_')}_${index}`;
                element.setAttribute('data-admin-id', elementId);
                this.editableElements.set(elementId, element);
                this.originalContent.set(elementId, element.innerHTML);
            });
        });

        document.getElementById('editable-count').textContent = this.editableElements.size;
    }

    toggleEditMode() {
        const editMode = !document.body.classList.contains('edit-mode');
        const toggleBtn = document.getElementById('toggle-edit-mode');
        const saveBtn = document.getElementById('save-changes');
        const overlay = document.getElementById('edit-overlay');

        if (editMode) {
            document.body.classList.add('edit-mode');
            toggleBtn.innerHTML = '<span class="btn-icon">VIEW</span>Disable Edit Mode';
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
        document.body.classList.remove('edit-mode');
        const toggleBtn = document.getElementById('toggle-edit-mode');
        const overlay = document.getElementById('edit-overlay');

        toggleBtn.innerHTML = '<span class="btn-icon">EDIT</span>Enable Edit Mode';
        overlay.style.display = 'none';

        this.editableElements.forEach((element) => {
            element.classList.remove('editable-element');
        });
    }

    editElement(elementId) {
        const element = this.editableElements.get(elementId);
        if (!element) return;

        const currentContent = element.innerHTML;
        const isTextContent = !currentContent.includes('<');

        let newContent;
        if (isTextContent) {
            newContent = prompt('Edit content:', element.textContent);
            if (newContent !== null) {
                element.textContent = newContent;
            }
        } else {
            newContent = prompt('Edit HTML content:', currentContent);
            if (newContent !== null) {
                element.innerHTML = newContent;
            }
        }

        if (newContent !== null) {
            document.getElementById('save-changes').disabled = false;
        }
    }

    async saveChanges() {
        const changes = {};
        this.editableElements.forEach((element, id) => {
            changes[id] = element.innerHTML;
        });

        const page = this.getCurrentPageName();
        const timestamp = new Date().toISOString();

        try {
            if (this.apiBaseUrl) {
                // Save to server
                const response = await fetch(`${this.apiBaseUrl}/api/content`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        page,
                        changes,
                        timestamp
                    })
                });

                if (!response.ok) {
                    throw new Error('Server save failed');
                }

                const result = await response.json();
                console.log('Content saved to server:', result);
            } else {
                // Fallback to localStorage
                localStorage.setItem(`admin_content_${page}`, JSON.stringify(changes));
                console.log('Content saved to localStorage');
            }

            // Visual feedback
            const saveBtn = document.getElementById('save-changes');
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span class="btn-icon">OK</span>Saved!';
            saveBtn.disabled = true;

            setTimeout(() => {
                saveBtn.innerHTML = originalText;
            }, 2000);

        } catch (error) {
            console.error('Save failed:', error);
            // Fallback to localStorage
            localStorage.setItem(`admin_content_${page}`, JSON.stringify(changes));
            alert('Server save failed, saved locally instead');
        }
    }

    async loadServerContent() {
        const page = this.getCurrentPageName();

        try {
            if (this.apiBaseUrl) {
                const response = await fetch(`${this.apiBaseUrl}/api/content`);
                if (response.ok) {
                    const serverContent = await response.json();
                    if (serverContent[page]) {
                        const changes = serverContent[page];
                        Object.entries(changes).forEach(([id, content]) => {
                            if (id === 'lastModified' || id === 'modifiedBy') return;
                            const element = this.editableElements.get(id);
                            if (element) {
                                element.innerHTML = content;
                            }
                        });
                        console.log('Server content loaded for page:', page);
                        return;
                    }
                }
            }

            // Fallback to localStorage
            const savedContent = localStorage.getItem(`admin_content_${page}`);
            if (savedContent) {
                const changes = JSON.parse(savedContent);
                Object.entries(changes).forEach(([id, content]) => {
                    const element = this.editableElements.get(id);
                    if (element) {
                        element.innerHTML = content;
                    }
                });
                console.log('Local content loaded');
            }
        } catch (error) {
            console.error('Failed to load content:', error);
        }
    }

    resetContent() {
        if (confirm('Are you sure you want to reset all content to original? This cannot be undone.')) {
            this.originalContent.forEach((content, id) => {
                const element = this.editableElements.get(id);
                if (element) {
                    element.innerHTML = content;
                }
            });

            const page = this.getCurrentPageName();

            // Clear from server if possible
            if (this.apiBaseUrl) {
                fetch(`${this.apiBaseUrl}/api/content`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ page, changes: {}, timestamp: new Date().toISOString() })
                }).catch(console.error);
            }

            localStorage.removeItem(`admin_content_${page}`);
            document.getElementById('save-changes').disabled = true;
            console.log('Content reset to original');
        }
    }

    getCurrentPageName() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page.replace('.html', '');
    }

    // Modal functions
    showAddProductModal() {
        alert('Add Product feature would open a modal here - Server integration ready');
    }

    showEditProductsModal() {
        alert('Edit Products feature would open a modal here - Server integration ready');
    }

    showImageManagerModal() {
        alert('Image Manager feature would open a modal here - Server integration ready');
    }

    showBannerEditor() {
        const bannerElement = document.querySelector('.sale-banner strong');
        if (bannerElement) {
            const newText = prompt('Edit banner text:', bannerElement.textContent);
            if (newText !== null) {
                bannerElement.textContent = newText;
                this.saveChanges();
            }
        }
    }

    showNavigationManager() {
        alert('Navigation Manager feature would open a modal here - Server integration ready');
    }

    showSEOSettings() {
        alert('SEO Settings feature would open a modal here - Server integration ready');
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.adminPanel = new AdminPanel();
    }, 1000);
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminPanel;
}