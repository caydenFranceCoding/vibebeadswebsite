// Production-Ready Admin Panel
// File: public/script/admin-panel.js

class AdminPanel {
    constructor() {
        // Configuration
        this.config = {
            allowedIPs: ['104.28.33.73', '172.59.196.158', '104.179.159.180'],
            apiBaseUrl: 'https://adminbackend-4ils.onrender.com',
            retryAttempts: 3,
            timeout: 10000,
            debounceDelay: 500,
            maxContentLength: 10000
        };

        // State management
        this.state = {
            currentUserIP: null,
            isAdmin: false,
            isEditMode: false,
            isOnline: navigator.onLine,
            lastSave: null,
            hasUnsavedChanges: false,
            isLoading: false
        };

        // Data storage
        this.data = {
            editableElements: new Map(),
            originalContent: new Map(),
            contentChanges: new Map()
        };

        // Initialize
        this.init();
        this.setupNetworkListeners();
        this.setupPerformanceMonitoring();
    }

    // =================
    // INITIALIZATION
    // =================

    async init() {
        try {
            this.showLoadingState('Initializing admin system...');
            
            // Load content for all users first (non-blocking)
            await this.loadContentForAllUsers();
            
            // Check admin status
            await this.checkIPAddress();
            
            if (this.state.isAdmin) {
                await this.initializeAdminFeatures();
            }
        } catch (error) {
            this.handleError('Initialization failed', error);
        } finally {
            this.hideLoadingState();
        }
    }

    async initializeAdminFeatures() {
        try {
            // Check server connection with timeout
            await Promise.race([
                this.checkServerConnection(),
                this.createTimeoutPromise(this.config.timeout)
            ]);

            // Create UI components
            this.createAdminPanel();
            this.setupEditableElements();
            this.setupEventListeners();
            this.setupKeyboardShortcuts();
            
            // Auto-save setup
            this.setupAutoSave();
            
            this.log('Admin panel initialized successfully', 'success');
        } catch (error) {
            this.handleError('Admin initialization failed', error);
        }
    }

    // =================
    // CONTENT MANAGEMENT
    // =================

    async loadContentForAllUsers() {
        const pageName = this.getPageIdentifier();
        
        try {
            // Try server first with timeout
            const response = await Promise.race([
                fetch(`${this.config.apiBaseUrl}/api/content`),
                this.createTimeoutPromise(this.config.timeout)
            ]);

            if (response && response.ok) {
                const serverContent = await response.json();
                if (serverContent[pageName]) {
                    this.applyContentToPage(serverContent[pageName]);
                    this.log(`Content loaded from server for page: ${pageName}`, 'info');
                    return;
                }
            }
        } catch (error) {
            this.log('Server content loading failed, trying localStorage', 'warning');
        }

        // Fallback to localStorage
        this.loadFromLocalStorage(pageName);
    }

    loadFromLocalStorage(pageName) {
        try {
            const savedContent = localStorage.getItem(`admin_content_${pageName}`);
            if (savedContent) {
                const content = JSON.parse(savedContent);
                this.applyContentToPage(content);
                this.log('Content loaded from localStorage', 'info');
            }
        } catch (error) {
            this.log('localStorage content loading failed', 'error');
        }
    }

    applyContentToPage(changes) {
        const selectors = [
            '.hero-content h1', '.hero-tagline', '.section-title', '.section-subtitle',
            '.product-title', '.product-description', '.product-price', '.sale-banner',
            '.faq-question', '.faq-answer', '.footer-section p', '.review-text'
        ];

        let appliedCount = 0;
        
        selectors.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach((element, index) => {
                    const elementId = this.generateElementId(selector, index);
                    if (changes[elementId] && 
                        changes[elementId] !== 'lastModified' && 
                        changes[elementId] !== 'modifiedBy') {
                        element.innerHTML = this.sanitizeContent(changes[elementId]);
                        appliedCount++;
                    }
                });
            } catch (error) {
                this.log(`Error applying content for selector ${selector}`, 'error');
            }
        });

        if (appliedCount > 0) {
            this.log(`Applied ${appliedCount} content changes`, 'success');
        }
    }

    // =================
    // AUTHENTICATION
    // =================

    async checkIPAddress() {
        const ipSources = [
            'https://api.ipify.org?format=json',
            'https://ipapi.co/json/',
            'https://ipinfo.io/json'
        ];

        for (const source of ipSources) {
            try {
                const response = await Promise.race([
                    fetch(source),
                    this.createTimeoutPromise(5000)
                ]);
                
                if (response && response.ok) {
                    const data = await response.json();
                    this.state.currentUserIP = data.ip || data.query;
                    break;
                }
            } catch (error) {
                this.log(`IP source ${source} failed`, 'warning');
                continue;
            }
        }

        if (!this.state.currentUserIP) {
            this.log('Failed to detect IP address', 'error');
            this.state.isAdmin = false;
            return;
        }

        // Check if localhost or allowed IP
        const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        const isAllowedIP = this.config.allowedIPs.includes(this.state.currentUserIP);
        
        this.state.isAdmin = isAllowedIP || isLocalhost;

        // Server verification if available
        if (this.state.isAdmin && this.state.isOnline) {
            try {
                await this.verifyAdminWithServer();
            } catch (error) {
                this.log('Server admin verification failed, using client-side check', 'warning');
            }
        }

        this.log(`IP: ${this.state.currentUserIP}, Admin: ${this.state.isAdmin}`, 'info');
    }

    async verifyAdminWithServer() {
        const response = await Promise.race([
            fetch(`${this.config.apiBaseUrl}/api/admin/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip: this.state.currentUserIP })
            }),
            this.createTimeoutPromise(this.config.timeout)
        ]);

        if (response && response.ok) {
            const result = await response.json();
            this.state.isAdmin = result.authorized;
            this.log('Server admin verification completed', 'success');
        }
    }

    // =================
    // UI CREATION
    // =================

    createAdminPanel() {
        if (!this.state.isAdmin || document.getElementById('admin-panel')) {
            return;
        }

        const adminHTML = this.generateAdminPanelHTML();
        document.body.insertAdjacentHTML('beforeend', adminHTML);
        this.addAdminStyles();
        this.makeAdminPanelDraggable();
        
        // Update status display
        this.updateStatusDisplay();
    }

    generateAdminPanelHTML() {
        const statusClass = this.state.isOnline ? 'online' : 'offline';
        const serverStatus = this.config.apiBaseUrl ? 'Connected' : 'Local Only';
        
        return `
            <div id="admin-panel" class="admin-panel" role="dialog" aria-label="Admin Panel">
                <div class="admin-header" id="admin-header">
                    <div class="admin-title">
                        <span class="admin-icon">⚡</span>
                        ADMIN PANEL
                        <span class="status-indicator ${statusClass}" title="Connection Status"></span>
                    </div>
                    <div class="admin-actions">
                        <button id="minimize-btn" class="admin-btn" title="Minimize" aria-label="Minimize panel">−</button>
                        <button id="close-btn" class="admin-btn" title="Close" aria-label="Close panel">×</button>
                    </div>
                </div>
                
                <div class="admin-content" id="admin-content">
                    <div class="admin-section">
                        <h3><span class="section-icon">✏️</span>Content Editor</h3>
                        <div class="admin-button-group">
                            <button id="toggle-edit-mode" class="admin-action-btn primary" ${!this.state.isOnline ? 'disabled' : ''}>
                                <span class="btn-icon">📝</span>
                                Enable Edit Mode
                            </button>
                            <button id="save-changes" class="admin-action-btn success" disabled>
                                <span class="btn-icon">💾</span>
                                Save Changes
                            </button>
                            <button id="reset-content" class="admin-action-btn danger">
                                <span class="btn-icon">🔄</span>
                                Reset Content
                            </button>
                        </div>
                    </div>

                    <div class="admin-section">
                        <h3><span class="section-icon">📊</span>Status</h3>
                        <div class="admin-info">
                            <div class="info-row">
                                <span class="label">IP Address:</span>
                                <span class="value">${this.state.currentUserIP}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Backend:</span>
                                <span class="value ${statusClass}">${serverStatus}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Elements:</span>
                                <span class="value" id="editable-count">0</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Page:</span>
                                <span class="value">${this.getPageIdentifier()}</span>
                            </div>
                            <div class="info-row" id="last-save-info" style="display: none;">
                                <span class="label">Last Save:</span>
                                <span class="value" id="last-save-time">Never</span>
                            </div>
                        </div>
                    </div>

                    <div class="admin-section">
                        <h3><span class="section-icon">⚙️</span>Advanced</h3>
                        <div class="admin-button-group">
                            <button id="export-content" class="admin-action-btn secondary">
                                <span class="btn-icon">📤</span>
                                Export Content
                            </button>
                            <button id="import-content" class="admin-action-btn secondary">
                                <span class="btn-icon">📥</span>
                                Import Content
                            </button>
                            <button id="clear-cache" class="admin-action-btn secondary">
                                <span class="btn-icon">🗑️</span>
                                Clear Cache
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <button id="admin-toggle" class="admin-toggle" title="Open Admin Panel" aria-label="Open admin panel">
                <span class="toggle-icon">⚡</span>
                <span class="toggle-text">Admin</span>
            </button>
            
            <div id="edit-overlay" class="edit-overlay" style="display: none;" role="region" aria-label="Edit Mode Active">
                <div class="edit-toolbar">
                    <div class="toolbar-info">
                        <span class="edit-indicator"></span>
                        <span>Edit Mode Active - Click elements to edit</span>
                        <span class="changes-counter" id="changes-counter" style="display: none;">
                            Changes: <span id="changes-count">0</span>
                        </span>
                    </div>
                    <div class="toolbar-actions">
                        <button id="save-all-btn" class="toolbar-btn success" disabled>Save All</button>
                        <button id="exit-edit-mode" class="toolbar-btn">Exit Edit Mode</button>
                    </div>
                </div>
            </div>

            <input type="file" id="import-file-input" accept=".json" style="display: none;">
        `;
    }

    // =================
    // EVENT HANDLING
    // =================

    setupEventListeners() {
        if (!this.state.isAdmin) return;

        // Panel controls
        this.addEventListeners([
            ['close-btn', 'click', () => this.togglePanel(false)],
            ['minimize-btn', 'click', () => this.minimizePanel()],
            ['admin-toggle', 'click', () => this.togglePanel(true)],
            
            // Edit mode controls
            ['toggle-edit-mode', 'click', () => this.toggleEditMode()],
            ['exit-edit-mode', 'click', () => this.exitEditMode()],
            ['save-changes', 'click', () => this.saveChanges()],
            ['save-all-btn', 'click', () => this.saveChanges()],
            ['reset-content', 'click', () => this.resetContent()],
            
            // Advanced features
            ['export-content', 'click', () => this.exportContent()],
            ['import-content', 'click', () => this.importContent()],
            ['clear-cache', 'click', () => this.clearCache()],
            ['import-file-input', 'change', (e) => this.handleFileImport(e)]
        ]);

        // Global handlers
        this.setupGlobalEventListeners();
    }

    setupGlobalEventListeners() {
        // Prevent accidental navigation
        window.addEventListener('beforeunload', (e) => {
            if (this.state.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });

        // Auto-save on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && this.state.hasUnsavedChanges) {
                this.autoSave();
            }
        });

        // Network status monitoring
        window.addEventListener('online', () => this.handleOnlineStatusChange(true));
        window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!this.state.isAdmin) return;

            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (this.state.hasUnsavedChanges) {
                    this.saveChanges();
                }
            }

            // Ctrl/Cmd + E to toggle edit mode
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.toggleEditMode();
            }

            // Escape to exit edit mode
            if (e.key === 'Escape' && this.state.isEditMode) {
                this.exitEditMode();
            }
        });
    }

    // =================
    // EDIT MODE FUNCTIONALITY
    // =================

    setupEditableElements() {
        if (!this.state.isAdmin) return;

        const selectors = [
            '.hero-content h1', '.hero-tagline', '.section-title', '.section-subtitle',
            '.product-title', '.product-description', '.product-price', '.sale-banner',
            '.faq-question', '.faq-answer', '.footer-section p', '.review-text'
        ];

        let elementCount = 0;

        selectors.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach((element, index) => {
                    const elementId = this.generateElementId(selector, index);
                    element.setAttribute('data-admin-id', elementId);
                    element.setAttribute('data-original-selector', selector);
                    
                    this.data.editableElements.set(elementId, element);
                    this.data.originalContent.set(elementId, element.innerHTML);
                    
                    elementCount++;
                });
            } catch (error) {
                this.log(`Error setting up elements for selector: ${selector}`, 'error');
            }
        });

        this.updateEditableCount(elementCount);
        this.log(`Setup ${elementCount} editable elements`, 'success');
    }

    toggleEditMode() {
        if (!this.state.isAdmin || this.state.isLoading) return;

        this.state.isEditMode = !this.state.isEditMode;
        
        if (this.state.isEditMode) {
            this.enableEditMode();
        } else {
            this.exitEditMode();
        }
    }

    enableEditMode() {
        document.body.classList.add('admin-edit-mode');
        document.getElementById('edit-overlay').style.display = 'block';
        
        // Update button states
        const toggleBtn = document.getElementById('toggle-edit-mode');
        if (toggleBtn) {
            toggleBtn.textContent = '📝 Disable Edit Mode';
            toggleBtn.classList.add('active');
        }

        // Make elements editable
        this.data.editableElements.forEach((element, id) => {
            element.classList.add('admin-editable');
            element.addEventListener('click', () => this.editElement(id), { once: false });
            element.setAttribute('data-edit-tooltip', 'Click to edit');
        });

        this.log('Edit mode enabled', 'success');
    }

    exitEditMode() {
        this.state.isEditMode = false;
        document.body.classList.remove('admin-edit-mode');
        document.getElementById('edit-overlay').style.display = 'none';

        // Update button states
        const toggleBtn = document.getElementById('toggle-edit-mode');
        if (toggleBtn) {
            toggleBtn.textContent = '📝 Enable Edit Mode';
            toggleBtn.classList.remove('active');
        }

        // Remove edit styling
        this.data.editableElements.forEach((element) => {
            element.classList.remove('admin-editable');
            element.removeAttribute('data-edit-tooltip');
        });

        this.log('Edit mode disabled', 'info');
    }

    editElement(elementId) {
        if (!this.state.isAdmin || !this.state.isEditMode) return;

        const element = this.data.editableElements.get(elementId);
        if (!element) return;

        const originalContent = element.innerHTML;
        const textContent = element.textContent;

        // Create edit dialog
        const newContent = this.createEditDialog(textContent, element);
        
        if (newContent !== null && newContent !== textContent) {
            const sanitizedContent = this.sanitizeContent(newContent);
            element.innerHTML = sanitizedContent;
            
            this.data.contentChanges.set(elementId, sanitizedContent);
            this.markAsChanged();
            
            // Visual feedback
            element.classList.add('admin-modified');
            setTimeout(() => element.classList.remove('admin-modified'), 1000);
            
            this.log(`Modified element: ${elementId}`, 'info');
        }
    }

    createEditDialog(currentText, element) {
        const isMultiline = currentText.length > 100 || currentText.includes('\n');
        
        if (isMultiline) {
            return this.createTextareaDialog(currentText, element);
        } else {
            return prompt('Edit content:', currentText);
        }
    }

    createTextareaDialog(currentText, element) {
        // Create modal for larger text editing
        const dialog = document.createElement('div');
        dialog.className = 'admin-edit-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Edit Content</h3>
                <textarea id="edit-textarea" rows="8">${this.escapeHtml(currentText)}</textarea>
                <div class="dialog-actions">
                    <button id="save-edit" class="dialog-btn primary">Save</button>
                    <button id="cancel-edit" class="dialog-btn secondary">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        return new Promise((resolve) => {
            const textarea = dialog.querySelector('#edit-textarea');
            const saveBtn = dialog.querySelector('#save-edit');
            const cancelBtn = dialog.querySelector('#cancel-edit');

            textarea.focus();
            textarea.setSelectionRange(0, textarea.value.length);

            const cleanup = () => {
                document.body.removeChild(dialog);
            };

            saveBtn.addEventListener('click', () => {
                const value = textarea.value;
                cleanup();
                resolve(value);
            });

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(null);
            });

            // Close on Escape
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    resolve(null);
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }

    // =================
    // SAVE/LOAD OPERATIONS
    // =================

    async saveChanges() {
        if (!this.state.isAdmin || this.state.isLoading) {
            this.log('Save cancelled - not admin or currently loading', 'warning');
            return;
        }

        if (this.data.contentChanges.size === 0) {
            this.showNotification('No changes to save', 'info');
            return;
        }

        this.state.isLoading = true;
        this.showLoadingState('Saving changes...');

        try {
            const changes = this.prepareChangesForSave();
            const success = await this.performSave(changes);
            
            if (success) {
                this.handleSaveSuccess();
            } else {
                throw new Error('Save operation failed');
            }
        } catch (error) {
            this.handleError('Save failed', error);
            await this.fallbackSave();
        } finally {
            this.state.isLoading = false;
            this.hideLoadingState();
        }
    }

    prepareChangesForSave() {
        const changes = {};
        
        // Add content changes
        this.data.contentChanges.forEach((content, elementId) => {
            changes[elementId] = content;
        });

        // Add all current element content
        this.data.editableElements.forEach((element, elementId) => {
            if (!changes[elementId]) {
                changes[elementId] = element.innerHTML;
            }
        });

        // Add metadata
        changes.lastModified = new Date().toISOString();
        changes.modifiedBy = this.state.currentUserIP;

        return changes;
    }

    async performSave(changes) {
        const pageName = this.getPageIdentifier();

        if (this.state.isOnline && this.config.apiBaseUrl) {
            try {
                const response = await Promise.race([
                    fetch(`${this.config.apiBaseUrl}/api/content`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            page: pageName,
                            changes,
                            timestamp: new Date().toISOString()
                        })
                    }),
                    this.createTimeoutPromise(this.config.timeout)
                ]);

                if (response && response.ok) {
                    this.log('Saved to server successfully', 'success');
                    return true;
                }
            } catch (error) {
                this.log('Server save failed, falling back to localStorage', 'warning');
            }
        }

        // Fallback to localStorage
        return this.fallbackSave(changes, pageName);
    }

    fallbackSave(changes = null, pageName = null) {
        try {
            const saveData = changes || this.prepareChangesForSave();
            const page = pageName || this.getPageIdentifier();
            
            localStorage.setItem(`admin_content_${page}`, JSON.stringify(saveData));
            this.log('Saved to localStorage', 'success');
            return true;
        } catch (error) {
            this.log('localStorage save failed', 'error');
            return false;
        }
    }

    handleSaveSuccess() {
        this.state.hasUnsavedChanges = false;
        this.state.lastSave = new Date().toISOString();
        this.data.contentChanges.clear();

        // Update UI
        this.updateSaveButton(false);
        this.updateChangesCounter(0);
        this.updateLastSaveDisplay();

        // Remove modified indicators
        this.data.editableElements.forEach(element => {
            element.classList.remove('admin-modified');
        });

        this.showNotification('Changes saved successfully!', 'success');
    }

    // =================
    // UTILITY METHODS
    // =================

    createTimeoutPromise(ms) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Operation timed out')), ms);
        });
    }

    sanitizeContent(content) {
        // Basic XSS prevention
        const div = document.createElement('div');
        div.textContent = content;
        let sanitized = div.innerHTML;

        // Allow basic HTML tags but remove dangerous attributes
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
        
        return sanitized.substring(0, this.config.maxContentLength);
    }

    generateElementId(selector, index) {
        return `${selector.replace(/[^a-zA-Z0-9]/g, '_')}_${index}`;
    }

    getPageIdentifier() {
        const path = window.location.pathname;
        let page = path.split('/').pop() || 'index.html';
        if (!page.includes('.')) page += '.html';
        return page.replace('.html', '');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =================
    // UI UPDATES
    // =================

    updateEditableCount(count) {
        const countElement = document.getElementById('editable-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    updateSaveButton(enabled) {
        const saveBtn = document.getElementById('save-changes');
        const saveAllBtn = document.getElementById('save-all-btn');
        
        [saveBtn, saveAllBtn].forEach(btn => {
            if (btn) {
                btn.disabled = !enabled;
                btn.classList.toggle('pulse', enabled);
            }
        });
    }

    updateChangesCounter(count) {
        const counter = document.getElementById('changes-counter');
        const countDisplay = document.getElementById('changes-count');
        
        if (counter && countDisplay) {
            if (count > 0) {
                counter.style.display = 'inline';
                countDisplay.textContent = count;
            } else {
                counter.style.display = 'none';
            }
        }
    }

    markAsChanged() {
        this.state.hasUnsavedChanges = true;
        this.updateSaveButton(true);
        this.updateChangesCounter(this.data.contentChanges.size);
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.admin-notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `admin-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // =================
    // ERROR HANDLING & LOGGING
    // =================

    handleError(context, error) {
        this.log(`${context}: ${error.message}`, 'error');
        this.showNotification(`${context}: ${error.message}`, 'error');
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[Admin Panel] ${timestamp}: ${message}`;
        
        switch (level) {
            case 'error':
                console.error(logMessage);
                break;
            case 'warning':
                console.warn(logMessage);
                break;
            case 'success':
                console.log(`✅ ${logMessage}`);
                break;
            default:
                console.log(logMessage);
        }
    }

    // =================
    // NETWORK & PERFORMANCE
    // =================

    setupNetworkListeners() {
        window.addEventListener('online', () => this.handleOnlineStatusChange(true));
        window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
    }

    handleOnlineStatusChange(isOnline) {
        this.state.isOnline = isOnline;
        this.updateStatusDisplay();
        
        if (isOnline && this.state.hasUnsavedChanges) {
            this.showNotification('Connection restored. Syncing changes...', 'info');
            this.autoSave();
        }
    }

    setupPerformanceMonitoring() {
        // Monitor performance and adjust accordingly
        if ('requestIdleCallback' in window) {
            this.scheduleIdleTasks();
        }
    }

    scheduleIdleTasks() {
        requestIdleCallback(() => {
            // Perform maintenance tasks during idle time
            this.cleanupOldLocalStorage();
            this.optimizeMemoryUsage();
        });
    }

    // =================
    // ADVANCED FEATURES
    // =================

    exportContent() {
        try {
            const content = this.prepareChangesForSave();
            const dataStr = JSON.stringify(content, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `${this.getPageIdentifier()}-content-${Date.now()}.json`;
            link.click();
            
            this.showNotification('Content exported successfully!', 'success');
        } catch (error) {
            this.handleError('Export failed', error);
        }
    }

    importContent() {
        document.getElementById('import-file-input').click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = JSON.parse(e.target.result);
                this.applyContentToPage(content);
                this.showNotification('Content imported successfully!', 'success');
            } catch (error) {
                this.handleError('Import failed', error);
            }
        };
        reader.readAsText(file);
    }

    clearCache() {
        if (confirm('Clear all cached content? This cannot be undone.')) {
            try {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('admin_content_')) {
                        localStorage.removeItem(key);
                    }
                });
                this.showNotification('Cache cleared successfully!', 'success');
            } catch (error) {
                this.handleError('Cache clear failed', error);
            }
        }
    }

    // =================
    // STYLES
    // =================

    addAdminStyles() {
        if (document.getElementById('admin-panel-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'admin-panel-styles';
        styles.textContent = `
            /* Admin Panel Styles */
            .admin-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 360px;
                background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
                color: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                z-index: 10000;
                font-family: 'Inter', sans-serif;
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.1);
                transition: all 0.3s ease;
            }

            .admin-panel.minimized .admin-content {
                display: none;
            }

            .admin-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                background: linear-gradient(135deg, #8B7355 0%, #6d5a42 100%);
                border-radius: 16px 16px 0 0;
                cursor: move;
                user-select: none;
            }

            .admin-title {
                font-weight: 700;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
                letter-spacing: 0.5px;
            }

            .admin-icon {
                font-size: 16px;
                animation: pulse 2s infinite;
            }

            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-left: 8px;
            }

            .status-indicator.online {
                background: #10b981;
                box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
            }

            .status-indicator.offline {
                background: #ef4444;
                box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
            }

            .admin-actions {
                display: flex;
                gap: 8px;
            }

            .admin-btn {
                width: 28px;
                height: 28px;
                border: none;
                background: rgba(255,255,255,0.2);
                color: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .admin-btn:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.05);
            }

            .admin-content {
                padding: 20px;
                max-height: 70vh;
                overflow-y: auto;
                scrollbar-width: thin;
            }

            .admin-content::-webkit-scrollbar {
                width: 4px;
            }

            .admin-content::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.1);
            }

            .admin-content::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.3);
                border-radius: 2px;
            }

            .admin-section {
                margin-bottom: 24px;
                padding-bottom: 20px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }

            .admin-section:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }

            .admin-section h3 {
                font-size: 14px;
                margin: 0 0 16px 0;
                color: #8B7355;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .section-icon {
                font-size: 16px;
            }

            .admin-button-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .admin-action-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 10px 16px;
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 8px;
                color: white;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                background: rgba(255,255,255,0.1);
            }

            .admin-action-btn:hover:not(:disabled) {
                background: rgba(255,255,255,0.2);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }

            .admin-action-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }

            .admin-action-btn.primary {
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                border-color: #2563eb;
            }

            .admin-action-btn.success {
                background: linear-gradient(135deg, #10b981, #059669);
                border-color: #059669;
            }

            .admin-action-btn.danger {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                border-color: #dc2626;
            }

            .admin-action-btn.secondary {
                background: rgba(255,255,255,0.1);
                border-color: rgba(255,255,255,0.2);
            }

            .admin-action-btn.active {
                background: linear-gradient(135deg, #8B7355, #6d5a42);
                border-color: #8B7355;
            }

            .admin-action-btn.pulse {
                animation: pulse 1.5s infinite;
            }

            .btn-icon {
                font-size: 14px;
            }

            .admin-info {
                font-size: 12px;
                line-height: 1.6;
            }

            .info-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                padding: 6px 8px;
                background: rgba(255,255,255,0.05);
                border-radius: 6px;
            }

            .info-row:last-child {
                margin-bottom: 0;
            }

            .label {
                font-weight: 500;
                color: rgba(255,255,255,0.7);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-size: 10px;
            }

            .value {
                font-weight: 600;
                color: white;
            }

            .value.online {
                color: #10b981;
            }

            .value.offline {
                color: #ef4444;
            }

            .admin-toggle {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #8B7355, #6d5a42);
                border: none;
                border-radius: 12px;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
                box-shadow: 0 8px 25px rgba(139, 115, 85, 0.4);
                font-family: 'Inter', sans-serif;
            }

            .admin-toggle:hover {
                transform: scale(1.05) translateY(-2px);
                box-shadow: 0 12px 30px rgba(139, 115, 85, 0.5);
            }

            .toggle-icon {
                font-size: 18px;
                animation: pulse 2s infinite;
            }

            .toggle-text {
                font-size: 9px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .edit-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(139,115,85,0.1);
                z-index: 9998;
                pointer-events: none;
            }

            .edit-toolbar {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #8B7355, #6d5a42);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                z-index: 9999;
                pointer-events: all;
                box-shadow: 0 8px 25px rgba(0,0,0,0.2);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1);
                min-width: 400px;
            }

            .toolbar-info {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 14px;
                font-weight: 500;
            }

            .edit-indicator {
                width: 8px;
                height: 8px;
                background: #10b981;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }

            .changes-counter {
                background: rgba(255,255,255,0.2);
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
            }

            .toolbar-actions {
                display: flex;
                gap: 8px;
            }

            .toolbar-btn {
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .toolbar-btn:hover:not(:disabled) {
                background: rgba(255,255,255,0.3);
                transform: translateY(-1px);
            }

            .toolbar-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .toolbar-btn.success {
                background: linear-gradient(135deg, #10b981, #059669);
                border-color: #059669;
            }

            .admin-editable {
                position: relative;
                cursor: pointer !important;
                outline: 2px dashed #8B7355 !important;
                background: rgba(139,115,85,0.1) !important;
                transition: all 0.3s ease;
            }

            .admin-editable:hover {
                outline-color: #6d5a42 !important;
                background: rgba(139,115,85,0.2) !important;
            }

            .admin-editable::after {
                content: attr(data-edit-tooltip);
                position: absolute;
                top: -30px;
                left: 0;
                background: #8B7355;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                white-space: nowrap;
                pointer-events: none;
                z-index: 2;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .admin-editable:hover::after {
                opacity: 1;
            }

            .admin-modified {
                animation: modifiedFlash 0.6s ease;
            }

            .admin-edit-dialog {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .dialog-content {
                background: white;
                border-radius: 12px;
                padding: 24px;
                min-width: 400px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
            }

            .dialog-content h3 {
                margin: 0 0 16px 0;
                color: #2c2c2c;
                font-size: 18px;
            }

            .dialog-content textarea {
                width: 100%;
                min-height: 120px;
                padding: 12px;
                border: 2px solid #e5e5e5;
                border-radius: 8px;
                font-family: inherit;
                font-size: 14px;
                resize: vertical;
                margin-bottom: 16px;
            }

            .dialog-content textarea:focus {
                outline: none;
                border-color: #8B7355;
            }

            .dialog-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }

            .dialog-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s ease;
            }

            .dialog-btn.primary {
                background: #8B7355;
                color: white;
            }

            .dialog-btn.primary:hover {
                background: #6d5a42;
            }

            .dialog-btn.secondary {
                background: #e5e5e5;
                color: #2c2c2c;
            }

            .dialog-btn.secondary:hover {
                background: #d1d1d1;
            }

            .admin-notification {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(-100px);
                background: #2c2c2c;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                z-index: 10002;
                transition: all 0.3s ease;
                box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            }

            .admin-notification.show {
                transform: translateX(-50%) translateY(0);
            }

            .admin-notification.success {
                background: #10b981;
            }

            .admin-notification.error {
                background: #ef4444;
            }

            .admin-notification.info {
                background: #3b82f6;
            }

            .admin-panel.hidden {
                display: none;
            }

            /* Animations */
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            @keyframes modifiedFlash {
                0% { background: rgba(139,115,85,0.1); }
                50% { background: rgba(139,115,85,0.3); }
                100% { background: rgba(139,115,85,0.1); }
            }

            /* Loading state */
            .admin-loading {
                position: relative;
            }

            .admin-loading::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                transform: translate(-50%, -50%);
            }

            @keyframes spin {
                0% { transform: translate(-50%, -50%) rotate(0deg); }
                100% { transform: translate(-50%, -50%) rotate(360deg); }
            }

            /* Responsive design */
            @media (max-width: 768px) {
                .admin-panel {
                    width: calc(100vw - 40px);
                    right: 20px;
                    left: 20px;
                }

                .edit-toolbar {
                    left: 20px;
                    right: 20px;
                    transform: none;
                    min-width: auto;
                    flex-direction: column;
                    gap: 12px;
                }

                .toolbar-info {
                    flex-direction: column;
                    gap: 8px;
                    text-align: center;
                }

                .admin-toggle {
                    width: 50px;
                    height: 50px;
                }

                .toggle-text {
                    font-size: 8px;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    // =================
    // HELPER METHODS
    // =================

    addEventListeners(listeners) {
        listeners.forEach(([id, event, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            }
        });
    }

    togglePanel(show) {
        const panel = document.getElementById('admin-panel');
        if (panel) {
            if (show) {
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
            }
        }
    }

    minimizePanel() {
        const panel = document.getElementById('admin-panel');
        if (panel) {
            panel.classList.toggle('minimized');
        }
    }

    makeAdminPanelDraggable() {
        const panel = document.getElementById('admin-panel');
        const header = document.getElementById('admin-header');
        
        if (!panel || !header) return;

        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === header) {
                isDragging = true;
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, panel);
            }
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }

        function dragEnd() {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }
    }

    showLoadingState(message) {
        // Implementation for loading state
    }

    hideLoadingState() {
        // Implementation for hiding loading state
    }

    updateStatusDisplay() {
        // Implementation for status updates
    }

    updateLastSaveDisplay() {
        const element = document.getElementById('last-save-time');
        const container = document.getElementById('last-save-info');
        
        if (element && container && this.state.lastSave) {
            const saveTime = new Date(this.state.lastSave);
            element.textContent = saveTime.toLocaleTimeString();
            container.style.display = 'block';
        }
    }

    setupAutoSave() {
        // Auto-save every 5 minutes if there are changes
        setInterval(() => {
            if (this.state.hasUnsavedChanges && this.state.isOnline) {
                this.autoSave();
            }
        }, 300000); // 5 minutes
    }

    async autoSave() {
        if (this.state.hasUnsavedChanges && !this.state.isLoading) {
            this.log('Auto-saving changes...', 'info');
            await this.saveChanges();
        }
    }

    resetContent() {
        if (!this.state.isAdmin) return;

        if (!confirm('Reset all content to original? This cannot be undone.')) return;

        this.data.originalContent.forEach((content, id) => {
            const element = this.data.editableElements.get(id);
            if (element) {
                element.innerHTML = content;
            }
        });

        this.data.contentChanges.clear();
        this.state.hasUnsavedChanges = false;
        this.updateSaveButton(false);
        this.updateChangesCounter(0);

        // Clear localStorage
        const pageName = this.getPageIdentifier();
        localStorage.removeItem(`admin_content_${pageName}`);

        this.showNotification('Content reset to original', 'success');
        this.log('Content reset completed', 'info');
    }

    cleanupOldLocalStorage() {
        try {
            const now = Date.now();
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('admin_content_')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        if (data.lastModified) {
                            const age = now - new Date(data.lastModified).getTime();
                            if (age > maxAge) {
                                localStorage.removeItem(key);
                                this.log(`Cleaned up old content: ${key}`, 'info');
                            }
                        }
                    } catch (error) {
                        // Remove corrupted entries
                        localStorage.removeItem(key);
                    }
                }
            });
        } catch (error) {
            this.log('Cleanup failed', 'error');
        }
    }

    optimizeMemoryUsage() {
        // Clear unused references
        if (this.data.contentChanges.size === 0) {
            // Garbage collection hint
            if (window.gc) {
                window.gc();
            }
        }
    }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    // Delay initialization to ensure all page elements are loaded
    setTimeout(() => {
        window.adminPanel = new AdminPanel();
    }, 1000);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminPanel;
}