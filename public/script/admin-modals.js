// Production-Ready Admin Modals
// File: public/script/admin-modals.js

class AdminModals {
    constructor(adminPanel) {
        this.adminPanel = adminPanel;
        this.modals = new Map();
        this.currentModal = null;
        
        // Configuration
        this.config = {
            maxFileSize: 5 * 1024 * 1024, // 5MB
            allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            animationDuration: 300,
            maxProducts: 1000,
            autoCloseDelay: 3000
        };

        // State
        this.state = {
            isModalOpen: false,
            currentForm: null,
            uploadedImages: [],
            formData: new Map()
        };

        this.init();
    }

    // =================
    // INITIALIZATION
    // =================

    init() {
        this.setupModalStyles();
        this.setupGlobalEventListeners();
        this.setupFormValidation();
        this.loadSavedSettings();
    }

    setupModalStyles() {
        if (document.getElementById('admin-modal-styles')) return;

        const modalStyles = document.createElement('style');
        modalStyles.id = 'admin-modal-styles';
        modalStyles.textContent = this.getModalCSS();
        document.head.appendChild(modalStyles);
    }

    setupGlobalEventListeners() {
        // Close modal on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isModalOpen) {
                this.closeCurrentModal();
            }
        });

        // Handle form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.closest('.admin-modal')) {
                e.preventDefault();
                this.handleFormSubmit(e.target);
            }
        });

        // File drop support
        document.addEventListener('dragover', (e) => {
            if (this.state.isModalOpen) {
                e.preventDefault();
            }
        });

        document.addEventListener('drop', (e) => {
            if (this.state.isModalOpen && e.target.closest('.image-upload-area')) {
                e.preventDefault();
                this.handleFileDrop(e);
            }
        });
    }

    setupFormValidation() {
        this.validators = {
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            url: (value) => {
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            },
            price: (value) => !isNaN(parseFloat(value)) && parseFloat(value) >= 0,
            required: (value) => value && value.trim().length > 0,
            maxLength: (value, length) => value.length <= length,
            minLength: (value, length) => value.length >= length
        };
    }

    // =================
    // MODAL MANAGEMENT
    // =================

    async createModal(id, config) {
        if (this.modals.has(id)) {
            this.showModal(id);
            return this.modals.get(id);
        }

        const modal = this.buildModalElement(id, config);
        this.modals.set(id, modal);
        
        document.body.appendChild(modal);
        
        // Setup modal-specific event listeners
        this.setupModalEventListeners(modal, id);
        
        return modal;
    }

    buildModalElement(id, config) {
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.id = id;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', `${id}-title`);
        modal.setAttribute('aria-modal', 'true');

        const closeBtn = config.showCloseButton !== false ? 
            `<button class="admin-modal-close" aria-label="Close modal">×</button>` : '';

        modal.innerHTML = `
            <div class="admin-modal-backdrop" aria-hidden="true"></div>
            <div class="admin-modal-content">
                <div class="admin-modal-header">
                    <h2 class="admin-modal-title" id="${id}-title">
                        ${config.icon ? `<span class="modal-icon">${config.icon}</span>` : ''}
                        ${config.title}
                    </h2>
                    ${closeBtn}
                </div>
                <div class="admin-modal-body">
                    ${config.content}
                </div>
                <div class="admin-modal-footer">
                    ${this.buildModalFooter(config.actions || [])}
                </div>
            </div>
        `;

        return modal;
    }

    buildModalFooter(actions) {
        if (actions.length === 0) {
            return '<div class="btn-group"><button class="admin-btn-secondary modal-close">Cancel</button></div>';
        }

        const buttonsHTML = actions.map(action => 
            `<button class="${action.class}" data-action="${action.action}" ${action.disabled ? 'disabled' : ''}>
                ${action.icon ? `<span class="btn-icon">${action.icon}</span>` : ''}
                ${action.text}
            </button>`
        ).join('');

        return `<div class="btn-group">${buttonsHTML}</div>`;
    }

    setupModalEventListeners(modal, id) {
        // Close button
        const closeBtn = modal.querySelector('.admin-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal(id));
        }

        // Backdrop click
        const backdrop = modal.querySelector('.admin-modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeModal(id));
        }

        // Action buttons
        modal.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]').dataset.action;
                this.handleModalAction(id, action, e);
            });
        });

        // Cancel/close buttons
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal(id));
        });

        // Form inputs with live validation
        modal.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('input', () => this.validateField(input));
            input.addEventListener('blur', () => this.validateField(input, true));
        });

        // File inputs
        modal.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', (e) => this.handleFileSelection(e));
        });

        // Image upload areas
        modal.querySelectorAll('.image-upload-area').forEach(area => {
            area.addEventListener('click', () => {
                const fileInput = area.parentNode.querySelector('input[type="file"]');
                if (fileInput) fileInput.click();
            });
        });

        // Color pickers
        modal.querySelectorAll('input[type="color"]').forEach(picker => {
            picker.addEventListener('change', (e) => this.handleColorChange(e));
        });
    }

    async showModal(id) {
        if (!this.modals.has(id)) {
            throw new Error(`Modal ${id} not found`);
        }

        // Close any existing modal
        if (this.currentModal) {
            await this.closeModal(this.currentModal);
        }

        const modal = this.modals.get(id);
        this.currentModal = id;
        this.state.isModalOpen = true;

        // Show modal with animation
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus management
        this.setFocusToModal(modal);

        // Animation
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        // Auto-populate form if data exists
        this.populateForm(modal);

        return modal;
    }

    async closeModal(id) {
        const modal = this.modals.get(id);
        if (!modal) return;

        // Check for unsaved changes
        if (this.hasUnsavedChanges(modal)) {
            const shouldClose = await this.confirmClose();
            if (!shouldClose) return false;
        }

        // Animation
        modal.classList.remove('active');

        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            
            if (this.currentModal === id) {
                this.currentModal = null;
                this.state.isModalOpen = false;
            }
        }, this.config.animationDuration);

        return true;
    }

    closeCurrentModal() {
        if (this.currentModal) {
            this.closeModal(this.currentModal);
        }
    }

    // =================
    // FORM HANDLING
    // =================

    validateField(field, showError = false) {
        const value = field.value;
        const rules = this.getValidationRules(field);
        const errors = [];

        // Check each validation rule
        for (const [rule, param] of Object.entries(rules)) {
            if (this.validators[rule]) {
                const isValid = param !== undefined ? 
                    this.validators[rule](value, param) : 
                    this.validators[rule](value);

                if (!isValid) {
                    errors.push(this.getErrorMessage(rule, param));
                }
            }
        }

        // Update UI
        this.updateFieldValidation(field, errors, showError);
        
        return errors.length === 0;
    }

    getValidationRules(field) {
        const rules = {};
        
        // Required fields
        if (field.required) rules.required = true;
        
        // Type-based validation
        switch (field.type) {
            case 'email':
                rules.email = true;
                break;
            case 'url':
                rules.url = true;
                break;
            case 'number':
                rules.price = true;
                break;
        }

        // Length validation
        if (field.maxLength) rules.maxLength = field.maxLength;
        if (field.minLength) rules.minLength = field.minLength;

        // Custom validation from data attributes
        Object.keys(field.dataset).forEach(key => {
            if (key.startsWith('validate')) {
                const rule = key.replace('validate', '').toLowerCase();
                rules[rule] = field.dataset[key];
            }
        });

        return rules;
    }

    getErrorMessage(rule, param) {
        const messages = {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            url: 'Please enter a valid URL',
            price: 'Please enter a valid price',
            maxLength: `Maximum ${param} characters allowed`,
            minLength: `Minimum ${param} characters required`
        };

        return messages[rule] || 'Invalid input';
    }

    updateFieldValidation(field, errors, showError) {
        const container = field.closest('.form-group');
        if (!container) return;

        // Remove existing error display
        const existingError = container.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Update field styling
        field.classList.remove('field-valid', 'field-invalid');
        
        if (errors.length > 0) {
            field.classList.add('field-invalid');
            
            if (showError) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'field-error';
                errorDiv.textContent = errors[0];
                container.appendChild(errorDiv);
            }
        } else if (field.value) {
            field.classList.add('field-valid');
        }
    }

    validateForm(form) {
        const fields = form.querySelectorAll('input, textarea, select');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field, true)) {
                isValid = false;
            }
        });

        return isValid;
    }

    collectFormData(form) {
        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (checkboxes, etc.)
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }

        return data;
    }

    populateForm(modal) {
        const savedData = this.state.formData.get(modal.id);
        if (!savedData) return;

        Object.entries(savedData).forEach(([key, value]) => {
            const field = modal.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox' || field.type === 'radio') {
                    field.checked = field.value === value;
                } else {
                    field.value = value;
                }
            }
        });
    }

    saveFormData(modal) {
        const form = modal.querySelector('form');
        if (!form) return;

        const data = this.collectFormData(form);
        this.state.formData.set(modal.id, data);
    }

    hasUnsavedChanges(modal) {
        const form = modal.querySelector('form');
        if (!form) return false;

        const currentData = this.collectFormData(form);
        const savedData = this.state.formData.get(modal.id) || {};

        return JSON.stringify(currentData) !== JSON.stringify(savedData);
    }

    // =================
    // FILE HANDLING
    // =================

    handleFileSelection(event) {
        const files = Array.from(event.target.files);
        this.processFiles(files, event.target);
    }

    handleFileDrop(event) {
        const files = Array.from(event.dataTransfer.files);
        const uploadArea = event.target.closest('.image-upload-area');
        const fileInput = uploadArea.parentNode.querySelector('input[type="file"]');
        
        if (fileInput) {
            this.processFiles(files, fileInput);
        }
    }

    async processFiles(files, input) {
        const validFiles = [];
        const errors = [];

        for (const file of files) {
            const validation = this.validateFile(file);
            
            if (validation.isValid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        }

        if (errors.length > 0) {
            this.showNotification(errors.join('\n'), 'error');
        }

        if (validFiles.length > 0) {
            await this.uploadFiles(validFiles, input);
        }
    }

    validateFile(file) {
        // Size check
        if (file.size > this.config.maxFileSize) {
            return {
                isValid: false,
                error: `File too large. Maximum size is ${this.formatFileSize(this.config.maxFileSize)}`
            };
        }

        // Type check for images
        if (file.type.startsWith('image/') && !this.config.allowedImageTypes.includes(file.type)) {
            return {
                isValid: false,
                error: 'Unsupported image format'
            };
        }

        return { isValid: true };
    }

    async uploadFiles(files, input) {
        const uploadArea = input.closest('.form-group').querySelector('.image-upload-area');
        const preview = input.closest('.form-group').querySelector('.file-preview');
        
        // Show loading state
        if (uploadArea) {
            uploadArea.classList.add('uploading');
        }

        try {
            for (const file of files) {
                const result = await this.uploadSingleFile(file);
                this.state.uploadedImages.push(result);
                
                if (preview) {
                    this.addFilePreview(preview, result);
                }
            }

            this.showNotification(`${files.length} file(s) uploaded successfully`, 'success');
        } catch (error) {
            this.showNotification(`Upload failed: ${error.message}`, 'error');
        } finally {
            if (uploadArea) {
                uploadArea.classList.remove('uploading');
            }
        }
    }

    async uploadSingleFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    dataUrl: e.target.result,
                    uploadDate: new Date().toISOString()
                });
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    addFilePreview(container, fileData) {
        const preview = document.createElement('div');
        preview.className = 'file-preview-item';
        preview.innerHTML = `
            <div class="preview-image">
                ${fileData.type.startsWith('image/') ? 
                    `<img src="${fileData.dataUrl}" alt="${fileData.name}">` :
                    `<div class="file-icon">📄</div>`
                }
            </div>
            <div class="preview-info">
                <div class="preview-name">${fileData.name}</div>
                <div class="preview-size">${this.formatFileSize(fileData.size)}</div>
            </div>
            <button class="preview-remove" onclick="this.parentNode.remove()">×</button>
        `;

        container.appendChild(preview);
    }

    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    // =================
    // MODAL ACTIONS
    // =================

    async handleModalAction(modalId, action, event) {
        const modal = this.modals.get(modalId);
        const button = event.target.closest('[data-action]');
        
        // Show loading state
        if (button) {
            button.classList.add('loading');
            button.disabled = true;
        }

        try {
            switch (action) {
                case 'save':
                    await this.handleSave(modal);
                    break;
                case 'delete':
                    await this.handleDelete(modal);
                    break;
                case 'export':
                    await this.handleExport(modal);
                    break;
                case 'import':
                    await this.handleImport(modal);
                    break;
                default:
                    await this.handleCustomAction(modalId, action, modal);
            }
        } catch (error) {
            this.showNotification(`Action failed: ${error.message}`, 'error');
        } finally {
            if (button) {
                button.classList.remove('loading');
                button.disabled = false;
            }
        }
    }

    async handleSave(modal) {
        const form = modal.querySelector('form');
        if (!form || !this.validateForm(form)) {
            throw new Error('Please fix the form errors before saving');
        }

        const data = this.collectFormData(form);
        
        // Simulate API call
        await this.delay(1000);
        
        this.saveFormData(modal);
        this.showNotification('Saved successfully!', 'success');
        
        setTimeout(() => this.closeModal(modal.id), 1000);
    }

    async handleDelete(modal) {
        const confirmed = await this.confirmAction('Delete', 'This action cannot be undone');
        if (!confirmed) return;

        // Simulate API call
        await this.delay(800);
        
        this.showNotification('Deleted successfully!', 'success');
        setTimeout(() => this.closeModal(modal.id), 1000);
    }

    async handleExport(modal) {
        const data = this.collectFormData(modal.querySelector('form'));
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Export completed!', 'success');
    }

    async handleImport(modal) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                this.state.formData.set(modal.id, data);
                this.populateForm(modal);
                
                this.showNotification('Import completed!', 'success');
            } catch (error) {
                this.showNotification('Import failed: Invalid file format', 'error');
            }
        };

        fileInput.click();
    }

    async handleCustomAction(modalId, action, modal) {
        // Override this method in specific implementations
        console.log(`Custom action: ${action} for modal: ${modalId}`);
    }

    // =================
    // SPECIFIC MODALS
    // =================

    async showAddProductModal() {
        const modal = await this.createModal('add-product-modal', {
            title: 'Add New Product',
            icon: '➕',
            content: `
                <form id="add-product-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="product-name">Product Name *</label>
                            <input type="text" id="product-name" name="name" required maxlength="100">
                        </div>
                        <div class="form-group">
                            <label for="product-price">Price *</label>
                            <input type="number" id="product-price" name="price" required step="0.01" min="0">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="product-description">Description</label>
                        <textarea id="product-description" name="description" rows="4" maxlength="500"></textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="product-category">Category *</label>
                            <select id="product-category" name="category" required>
                                <option value="">Select Category</option>
                                <option value="candles">Candles</option>
                                <option value="wax-melts">Wax Melts</option>
                                <option value="room-sprays">Room Sprays</option>
                                <option value="diffusers">Diffusers</option>
                                <option value="jewelry">Jewelry</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="product-emoji">Icon/Emoji</label>
                            <input type="text" id="product-emoji" name="emoji" maxlength="4" placeholder="🕯️">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Product Images</label>
                        <div class="image-upload-area">
                            <div class="upload-icon">📷</div>
                            <div class="upload-text">Click to upload images</div>
                            <div class="upload-subtext">JPG, PNG, GIF up to 5MB</div>
                        </div>
                        <input type="file" id="product-images" name="images" accept="image/*" multiple style="display: none;">
                        <div class="file-preview"></div>
                    </div>

                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="featured"> Featured Product
                        </label>
                    </div>
                </form>
            `,
            actions: [
                { text: 'Add Product', class: 'admin-btn-primary', action: 'save', icon: '➕' },
                { text: 'Cancel', class: 'admin-btn-secondary', action: 'cancel' }
            ]
        });

        this.showModal('add-product-modal');
    }

    async showEditProductsModal() {
        const products = await this.loadProducts();
        
        const modal = await this.createModal('edit-products-modal', {
            title: 'Edit Products',
            icon: '📝',
            content: `
                <div class="products-search">
                    <input type="text" placeholder="Search products..." id="product-search">
                </div>
                
                <div class="products-grid" id="products-list">
                    ${this.renderProductsList(products)}
                </div>

                <div id="edit-form" style="display: none;">
                    <h4>Edit Selected Product</h4>
                    <form id="edit-product-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit-name">Product Name</label>
                                <input type="text" id="edit-name" name="name">
                            </div>
                            <div class="form-group">
                                <label for="edit-price">Price</label>
                                <input type="number" id="edit-price" name="price" step="0.01">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="edit-description">Description</label>
                            <textarea id="edit-description" name="description" rows="3"></textarea>
                        </div>
                    </form>
                </div>
            `,
            actions: [
                { text: 'Save Changes', class: 'admin-btn-primary', action: 'save' },
                { text: 'Delete Product', class: 'admin-btn-danger', action: 'delete' }
            ]
        });

        // Setup product search
        const searchInput = modal.querySelector('#product-search');
        searchInput.addEventListener('input', (e) => {
            this.filterProducts(e.target.value, products);
        });

        this.showModal('edit-products-modal');
    }

    async showImageManagerModal() {
        const modal = await this.createModal('image-manager-modal', {
            title: 'Image Manager',
            icon: '🖼️',
            content: `
                <div class="image-manager">
                    <div class="upload-section">
                        <div class="image-upload-area">
                            <div class="upload-icon">📸</div>
                            <div class="upload-text">Upload Images</div>
                            <div class="upload-subtext">Drag & drop or click to select</div>
                        </div>
                        <input type="file" id="bulk-images" accept="image/*" multiple style="display: none;">
                    </div>

                    <div class="image-settings">
                        <h4>Settings</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="image-quality">Quality</label>
                                <select id="image-quality">
                                    <option value="high">High Quality</option>
                                    <option value="medium" selected>Medium Quality</option>
                                    <option value="low">Low Quality</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="auto-resize" checked> Auto-resize large images
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="image-gallery">
                        <h4>Uploaded Images</h4>
                        <div class="gallery-grid" id="image-gallery">
                            ${this.renderImageGallery()}
                        </div>
                    </div>
                </div>
            `,
            actions: [
                { text: 'Optimize All', class: 'admin-btn-primary', action: 'optimize' },
                { text: 'Clear All', class: 'admin-btn-danger', action: 'clear' }
            ]
        });

        this.showModal('image-manager-modal');
    }

    async showSEOSettingsModal() {
        const currentSettings = await this.loadSEOSettings();
        
        const modal = await this.createModal('seo-settings-modal', {
            title: 'SEO Settings',
            icon: '🔍',
            content: `
                <form id="seo-form">
                    <div class="settings-section">
                        <h4>Page Meta Data</h4>
                        
                        <div class="form-group">
                            <label for="page-title">Page Title</label>
                            <input type="text" id="page-title" name="title" value="${currentSettings.title || document.title}" maxlength="60">
                            <div class="help-text">Recommended: 50-60 characters</div>
                        </div>

                        <div class="form-group">
                            <label for="meta-description">Meta Description</label>
                            <textarea id="meta-description" name="description" maxlength="160" rows="3">${currentSettings.description || ''}</textarea>
                            <div class="help-text">Recommended: 150-160 characters</div>
                        </div>

                        <div class="form-group">
                            <label for="meta-keywords">Keywords</label>
                            <input type="text" id="meta-keywords" name="keywords" value="${currentSettings.keywords || ''}">
                        </div>
                    </div>

                    <div class="settings-section">
                        <h4>Social Media</h4>
                        
                        <div class="form-group">
                            <label for="og-title">Open Graph Title</label>
                            <input type="text" id="og-title" name="ogTitle" value="${currentSettings.ogTitle || ''}">
                        </div>

                        <div class="form-group">
                            <label for="og-description">Open Graph Description</label>
                            <textarea id="og-description" name="ogDescription" rows="2">${currentSettings.ogDescription || ''}</textarea>
                        </div>

                        <div class="form-group">
                            <label for="og-image">Open Graph Image URL</label>
                            <input type="url" id="og-image" name="ogImage" value="${currentSettings.ogImage || ''}">
                        </div>
                    </div>

                    <div class="settings-section">
                        <h4>Analytics</h4>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="ga-id">Google Analytics ID</label>
                                <input type="text" id="ga-id" name="gaId" value="${currentSettings.gaId || ''}" placeholder="G-XXXXXXXXXX">
                            </div>
                            <div class="form-group">
                                <label for="gtm-id">Google Tag Manager</label>
                                <input type="text" id="gtm-id" name="gtmId" value="${currentSettings.gtmId || ''}" placeholder="GTM-XXXXXXX">
                            </div>
                        </div>
                    </div>

                    <div class="preview-section">
                        <h4>Preview</h4>
                        <div class="seo-preview" id="seo-preview">
                            <div class="preview-title" id="preview-title">${currentSettings.title || document.title}</div>
                            <div class="preview-url">${window.location.href}</div>
                            <div class="preview-description" id="preview-description">${currentSettings.description || 'Add a description to see preview'}</div>
                        </div>
                    </div>
                </form>
            `,
            actions: [
                { text: 'Save Settings', class: 'admin-btn-primary', action: 'save-seo' },
                { text: 'Export', class: 'admin-btn-secondary', action: 'export' }
            ]
        });

        // Setup live preview
        const titleInput = modal.querySelector('#page-title');
        const descInput = modal.querySelector('#meta-description');
        const previewTitle = modal.querySelector('#preview-title');
        const previewDesc = modal.querySelector('#preview-description');

        titleInput.addEventListener('input', () => {
            previewTitle.textContent = titleInput.value || 'Untitled Page';
        });

        descInput.addEventListener('input', () => {
            previewDesc.textContent = descInput.value || 'Add a description to see preview';
        });

        this.showModal('seo-settings-modal');
    }

    // =================
    // DATA MANAGEMENT
    // =================

    async loadProducts() {
        // Simulate API call or load from localStorage
        const savedProducts = localStorage.getItem('admin_products');
        if (savedProducts) {
            return JSON.parse(savedProducts);
        }

        // Default products
        return [
            { id: 1, name: 'Vanilla Bean Candle', price: 15.00, category: 'candles', emoji: '🕯️' },
            { id: 2, name: 'Apple Ginger Wax Melt', price: 5.00, category: 'wax-melts', emoji: '🍎' },
            { id: 3, name: 'Clean Cotton Spray', price: 9.00, category: 'room-sprays', emoji: '☁️' },
            { id: 4, name: 'Alpine Balsam Diffuser', price: 16.00, category: 'diffusers', emoji: '🌲' },
            { id: 5, name: 'Rose Quartz Bracelet', price: 20.00, category: 'jewelry', emoji: '💖' }
        ];
    }

    async loadSEOSettings() {
        const saved = localStorage.getItem('admin_seo_settings');
        return saved ? JSON.parse(saved) : {};
    }

    renderProductsList(products) {
        return products.map(product => `
            <div class="product-item" data-id="${product.id}">
                <div class="product-emoji">${product.emoji || '📦'}</div>
                <div class="product-name">${this.escapeHtml(product.name)}</div>
                <div class="product-price">${product.price.toFixed(2)}</div>
                <div class="product-category">${product.category}</div>
            </div>
        `).join('');
    }

    renderImageGallery() {
        return this.state.uploadedImages.map(image => `
            <div class="gallery-item">
                <img src="${image.dataUrl}" alt="${image.name}">
                <div class="image-info">
                    <div class="image-name">${this.truncate(image.name, 20)}</div>
                    <div class="image-size">${this.formatFileSize(image.size)}</div>
                </div>
                <button class="image-remove" onclick="this.closest('.gallery-item').remove()">×</button>
            </div>
        `).join('') || '<div class="empty-gallery">No images uploaded yet</div>';
    }

    filterProducts(query, products) {
        const filtered = products.filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase())
        );

        const container = document.getElementById('products-list');
        if (container) {
            container.innerHTML = this.renderProductsList(filtered);
        }
    }

    // =================
    // UTILITY METHODS
    // =================

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async confirmClose() {
        return new Promise((resolve) => {
            const result = confirm('You have unsaved changes. Are you sure you want to close?');
            resolve(result);
        });
    }

    async confirmAction(action, message) {
        return new Promise((resolve) => {
            const result = confirm(`${action}: ${message}. Continue?`);
            resolve(result);
        });
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.modal-notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `modal-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, this.config.autoCloseDelay);
    }

    setFocusToModal(modal) {
        const focusable = modal.querySelector('input, textarea, select, button');
        if (focusable) {
            focusable.focus();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncate(text, length) {
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    handleColorChange(event) {
        // Handle color picker changes
        const color = event.target.value;
        const property = event.target.dataset.property;
        
        if (property) {
            document.documentElement.style.setProperty(`--${property}`, color);
        }
    }

    loadSavedSettings() {
        // Load any saved modal settings from localStorage
        const saved = localStorage.getItem('admin_modal_settings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                Object.assign(this.config, settings);
            } catch (error) {
                console.warn('Failed to load modal settings:', error);
            }
        }
    }

    saveSettings() {
        // Save current settings
        localStorage.setItem('admin_modal_settings', JSON.stringify(this.config));
    }

    // =================
    // MODAL CSS
    // =================

    getModalCSS() {
        return `
            /* Admin Modals Styles */
            .admin-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(8px);
                z-index: 10001;
                display: none;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: all ${this.config.animationDuration}ms ease;
                font-family: 'Inter', sans-serif;
            }

            .admin-modal.active {
                opacity: 1;
            }

            .admin-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                cursor: pointer;
            }

            .admin-modal-content {
                background: linear-gradient(135deg, #ffffff 0%, #f8f6f3 100%);
                border-radius: 20px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                max-width: 90vw;
                max-height: 90vh;
                overflow: hidden;
                position: relative;
                transform: translateY(50px) scale(0.95);
                transition: transform ${this.config.animationDuration}ms ease;
                display: flex;
                flex-direction: column;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .admin-modal.active .admin-modal-content {
                transform: translateY(0) scale(1);
            }

            .admin-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24px 30px;
                background: linear-gradient(135deg, #8B7355 0%, #6d5a42 100%);
                color: white;
                position: relative;
            }

            .admin-modal-header::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
            }

            .admin-modal-title {
                font-size: 20px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 0;
                letter-spacing: 0.5px;
            }

            .modal-icon {
                font-size: 24px;
                opacity: 0.9;
            }

            .admin-modal-close {
                background: rgba(255, 255, 255, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 20px;
                font-weight: bold;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .admin-modal-close:hover {
                background: rgba(255, 255, 255, 0.25);
                transform: scale(1.05);
            }

            .admin-modal-body {
                padding: 30px;
                overflow-y: auto;
                flex: 1;
                scrollbar-width: thin;
                scrollbar-color: rgba(139, 115, 85, 0.3) transparent;
            }

            .admin-modal-body::-webkit-scrollbar {
                width: 6px;
            }

            .admin-modal-body::-webkit-scrollbar-track {
                background: transparent;
            }

            .admin-modal-body::-webkit-scrollbar-thumb {
                background: rgba(139, 115, 85, 0.3);
                border-radius: 3px;
            }

            .admin-modal-footer {
                padding: 24px 30px;
                background: rgba(248, 246, 243, 0.5);
                border-top: 1px solid rgba(139, 115, 85, 0.1);
            }

            /* Form Styles */
            .form-group {
                margin-bottom: 24px;
            }

            .form-group label {
                display: block;
                font-weight: 600;
                color: #2c2c2c;
                margin-bottom: 8px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .form-group input,
            .form-group textarea,
            .form-group select {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e8e8e8;
                border-radius: 10px;
                font-size: 14px;
                transition: all 0.3s ease;
                font-family: 'Inter', sans-serif;
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(5px);
            }

            .form-group input:focus,
            .form-group textarea:focus,
            .form-group select:focus {
                outline: none;
                border-color: #8B7355;
                box-shadow: 0 0 0 4px rgba(139, 115, 85, 0.1);
                background: white;
            }

            .form-group input.field-valid {
                border-color: #10b981;
            }

            .form-group input.field-invalid {
                border-color: #ef4444;
            }

            .form-group textarea {
                min-height: 80px;
                resize: vertical;
            }

            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }

            .field-error {
                color: #ef4444;
                font-size: 12px;
                margin-top: 4px;
                font-weight: 500;
            }

            .help-text {
                color: #666;
                font-size: 12px;
                margin-top: 4px;
                font-style: italic;
            }

            /* Button Styles */
            .btn-group {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                flex-wrap: wrap;
            }

            .admin-btn-primary,
            .admin-btn-secondary,
            .admin-btn-danger {
                padding: 12px 24px;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                border: none;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                gap: 8px;
                position: relative;
                overflow: hidden;
            }

            .admin-btn-primary {
                background: linear-gradient(135deg, #8B7355, #6d5a42);
                color: white;
                box-shadow: 0 4px 15px rgba(139, 115, 85, 0.3);
            }

            .admin-btn-primary:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(139, 115, 85, 0.4);
            }

            .admin-btn-secondary {
                background: rgba(44, 44, 44, 0.1);
                color: #2c2c2c;
                border: 2px solid #e8e8e8;
            }

            .admin-btn-secondary:hover:not(:disabled) {
                background: #f8f6f3;
                border-color: #8B7355;
                color: #8B7355;
            }

            .admin-btn-danger {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
                box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
            }

            .admin-btn-danger:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
            }

            .admin-btn-primary:disabled,
            .admin-btn-secondary:disabled,
            .admin-btn-danger:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }

            .admin-btn-primary.loading,
            .admin-btn-secondary.loading,
            .admin-btn-danger.loading {
                pointer-events: none;
            }

            .admin-btn-primary.loading::after,
            .admin-btn-secondary.loading::after,
            .admin-btn-danger.loading::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 18px;
                height: 18px;
                border: 2px solid transparent;
                border-top: 2px solid currentColor;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                transform: translate(-50%, -50%);
            }

            .btn-icon {
                font-size: 16px;
            }

            /* Upload Areas */
            .image-upload-area {
                border: 2px dashed #8B7355;
                border-radius: 12px;
                padding: 40px 20px;
                text-align: center;
                background: rgba(139, 115, 85, 0.05);
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
            }

            .image-upload-area:hover {
                background: rgba(139, 115, 85, 0.1);
                border-color: #6d5a42;
                transform: translateY(-2px);
            }

            .image-upload-area.uploading {
                pointer-events: none;
                opacity: 0.7;
            }

            .image-upload-area.uploading::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 24px;
                height: 24px;
                border: 3px solid rgba(139, 115, 85, 0.3);
                border-top: 3px solid #8B7355;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                transform: translate(-50%, -50%);
            }

            .upload-icon {
                font-size: 48px;
                color: #8B7355;
                margin-bottom: 16px;
            }

            .upload-text {
                font-size: 16px;
                color: #8B7355;
                font-weight: 500;
                margin-bottom: 4px;
            }

            .upload-subtext {
                font-size: 12px;
                color: #999;
            }

            /* File Preview */
            .file-preview {
                margin-top: 16px;
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 12px;
            }

            .file-preview-item {
                background: white;
                border: 1px solid #e8e8e8;
                border-radius: 8px;
                padding: 8px;
                position: relative;
            }

            .preview-image {
                width: 100%;
                height: 80px;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
                background: #f8f8f8;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .preview-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .file-icon {
                font-size: 32px;
                color: #8B7355;
            }

            .preview-info {
                text-align: center;
            }

            .preview-name {
                font-size: 12px;
                font-weight: 500;
                color: #2c2c2c;
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .preview-size {
                font-size: 10px;
                color: #666;
            }

            .preview-remove {
                position: absolute;
                top: -6px;
                right: -6px;
                width: 20px;
                height: 20px;
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                font-size: 12px;
                line-height: 1;
            }

            /* Product Grid */
            .products-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 16px;
                margin: 20px 0;
                max-height: 300px;
                overflow-y: auto;
                padding: 8px;
                border: 1px solid #e8e8e8;
                border-radius: 8px;
                background: #fafafa;
            }

            .product-item {
                background: white;
                border: 2px solid #e8e8e8;
                border-radius: 12px;
                padding: 16px;
                text-align: center;
                transition: all 0.3s ease;
                cursor: pointer;
            }

            .product-item:hover {
                border-color: #8B7355;
                transform: translateY(-4px);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
            }

            .product-item.selected {
                border-color: #8B7355;
                background: rgba(139, 115, 85, 0.05);
            }

            .product-emoji {
                font-size: 40px;
                margin-bottom: 8px;
            }

            .product-name {
                font-weight: 600;
                color: #2c2c2c;
                margin-bottom: 4px;
                font-size: 14px;
            }

            .product-price {
                color: #8B7355;
                font-weight: 500;
                font-size: 13px;
                margin-bottom: 4px;
            }

            .product-category {
                color: #666;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .products-search {
                margin-bottom: 16px;
            }

            .products-search input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e8e8e8;
                border-radius: 8px;
                font-size: 14px;
            }

            /* Settings Sections */
            .settings-section {
                background: rgba(255, 255, 255, 0.8);
                border: 1px solid rgba(139, 115, 85, 0.1);
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                backdrop-filter: blur(5px);
            }

            .settings-section h4 {
                margin: 0 0 16px 0;
                color: #8B7355;
                font-size: 16px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .settings-section h4::before {
                content: '';
                width: 3px;
                height: 20px;
                background: linear-gradient(135deg, #8B7355, #6d5a42);
                border-radius: 2px;
            }

            /* SEO Preview */
            .seo-preview {
                border: 1px solid #e8e8e8;
                border-radius: 8px;
                padding: 16px;
                background: white;
                max-width: 600px;
            }

            .preview-title {
                color: #1a0dab;
                font-size: 18px;
                font-weight: 400;
                line-height: 1.2;
                margin-bottom: 4px;
                cursor: pointer;
            }

            .preview-title:hover {
                text-decoration: underline;
            }

            .preview-url {
                color: #006621;
                font-size: 14px;
                margin-bottom: 8px;
            }

            .preview-description {
                color: #545454;
                font-size: 13px;
                line-height: 1.4;
            }

            /* Image Gallery */
            .image-gallery {
                margin-top: 20px;
            }

            .gallery-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 16px;
                margin-top: 16px;
                max-height: 300px;
                overflow-y: auto;
                padding: 8px;
                border: 1px solid #e8e8e8;
                border-radius: 8px;
                background: #fafafa;
            }

            .gallery-item {
                background: white;
                border-radius: 8px;
                overflow: hidden;
                position: relative;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                transition: transform 0.3s ease;
            }

            .gallery-item:hover {
                transform: scale(1.02);
            }

            .gallery-item img {
                width: 100%;
                height: 120px;
                object-fit: cover;
            }

            .image-info {
                padding: 8px;
                text-align: center;
            }

            .image-name {
                font-size: 12px;
                font-weight: 500;
                color: #2c2c2c;
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .image-size {
                font-size: 10px;
                color: #666;
            }

            .image-remove {
                position: absolute;
                top: 4px;
                right: 4px;
                width: 24px;
                height: 24px;
                background: rgba(239, 68, 68, 0.9);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .gallery-item:hover .image-remove {
                opacity: 1;
            }

            .empty-gallery {
                grid-column: 1 / -1;
                text-align: center;
                color: #666;
                font-style: italic;
                padding: 40px;
            }

            /* Notifications */
            .modal-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #2c2c2c;
                color: white;
                padding: 16px 20px;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 500;
                z-index: 10003;
                transform: translateX(400px);
                transition: all 0.3s ease;
                box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                max-width: 320px;
                line-height: 1.4;
            }

            .modal-notification.show {
                transform: translateX(0);
            }

            .modal-notification.success {
                background: linear-gradient(135deg, #10b981, #059669);
            }

            .modal-notification.error {
                background: linear-gradient(135deg, #ef4444, #dc2626);
            }

            .modal-notification.info {
                background: linear-gradient(135deg, #3b82f6, #2563eb);
            }

            /* Animations */
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .admin-modal-content {
                    margin: 20px;
                    max-width: calc(100vw - 40px);
                    max-height: calc(100vh - 40px);
                }

                .admin-modal-body {
                    padding: 20px;
                }

                .admin-modal-footer {
                    padding: 20px;
                }

                .form-row {
                    grid-template-columns: 1fr;
                    gap: 16px;
                }

                .btn-group {
                    flex-direction: column;
                }

                .products-grid {
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                }

                .gallery-grid {
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                }

                .file-preview {
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                }

                .upload-icon {
                    font-size: 36px;
                }

                .upload-text {
                    font-size: 14px;
                }

                .modal-notification {
                    top: auto;
                    bottom: 20px;
                    left: 20px;
                    right: 20px;
                    transform: translateY(400px);
                    max-width: none;
                }

                .modal-notification.show {
                    transform: translateY(0);
                }
            }

            @media (max-width: 480px) {
                .admin-modal-header {
                    padding: 16px 20px;
                }

                .admin-modal-title {
                    font-size: 18px;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .btn-group {
                    gap: 8px;
                }

                .admin-btn-primary,
                .admin-btn-secondary,
                .admin-btn-danger {
                    padding: 10px 16px;
                    font-size: 13px;
                }
            }
        `;
    }
}

// Initialize admin modals when admin panel is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.adminPanel && window.adminPanel.state.isAdmin) {
            window.adminModals = new AdminModals(window.adminPanel);

            // Override the admin panel's modal methods
            window.adminPanel.showAddProductModal = () => window.adminModals.showAddProductModal();
            window.adminPanel.showEditProductsModal = () => window.adminModals.showEditProductsModal();
            window.adminPanel.showImageManagerModal = () => window.adminModals.showImageManagerModal();
            window.adminPanel.showSEOSettings = () => window.adminModals.showSEOSettingsModal();
        }
    }, 1500);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminModals;
}