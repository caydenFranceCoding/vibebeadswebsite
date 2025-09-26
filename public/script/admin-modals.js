// Production-Ready Admin Modals
// File: public/script/admin-modals.js

class AdminModals {
    constructor(adminPanel) {
        if (!adminPanel) {
            throw new Error('AdminModals requires AdminPanel instance');
        }
        
        this.adminPanel = adminPanel;
        this.currentModal = null;
        this.selectedProductId = null;
        this.isInitialized = false;
        
        // Configuration
        this.config = {
            maxProductNameLength: 100,
            maxDescriptionLength: 500,
            maxRetries: 3,
            retryDelay: 1000,
            categories: [
                { value: 'candles', label: 'Candles', emoji: '🕯️' },
                { value: 'wax-melts', label: 'Wax Melts', emoji: '🧊' },
                { value: 'room-sprays', label: 'Room Sprays', emoji: '💨' },
                { value: 'diffusers', label: 'Diffusers', emoji: '🌿' },
                { value: 'jewelry', label: 'Jewelry', emoji: '💍' },
                { value: 'accessories', label: 'Accessories', emoji: '✨' }
            ],
            defaultEmojis: {
                'candles': '🕯️',
                'wax-melts': '🧊',
                'room-sprays': '💨',
                'diffusers': '🌿',
                'jewelry': '💍',
                'accessories': '✨'
            }
        };

        this.init();
    }

    init() {
        try {
            this.setupModalStyles();
            this.setupKeyboardShortcuts();
            this.isInitialized = true;
            console.log('Admin Modals initialized successfully');
        } catch (error) {
            console.error('Admin Modals initialization failed:', error);
        }
    }

    // =========== MODAL MANAGEMENT ===========
    createModal(id, title, content, actions = []) {
        // Remove existing modal
        this.closeModal(id);

        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.id = id;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', `${id}-title`);

        const actionsHTML = actions.map(action => 
            `<button class="${this.escapeHtml(action.class)}" 
                     onclick="${this.escapeHtml(action.onclick)}" 
                     ${action.disabled ? 'disabled' : ''}
                     ${action.ariaLabel ? `aria-label="${this.escapeHtml(action.ariaLabel)}"` : ''}>
                ${action.icon ? `<span class="btn-icon">${action.icon}</span>` : ''}
                ${this.escapeHtml(action.text)}
            </button>`
        ).join('');

        modal.innerHTML = `
            <div class="admin-modal-backdrop" onclick="adminModals.closeModal('${id}')"></div>
            <div class="admin-modal-content" role="document">
                <div class="admin-modal-header">
                    <h2 class="admin-modal-title" id="${id}-title">${title}</h2>
                    <button class="admin-modal-close" 
                            onclick="adminModals.closeModal('${id}')" 
                            aria-label="Close modal">×</button>
                </div>
                <div class="admin-modal-body">
                    ${content}
                    <div class="admin-modal-actions">
                        ${actionsHTML}
                        <button class="admin-btn-secondary" 
                                onclick="adminModals.closeModal('${id}')">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        return modal;
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error('Modal not found:', modalId);
            return;
        }

        this.currentModal = modalId;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus management
        setTimeout(() => {
            const firstFocusable = modal.querySelector('input, textarea, select, button:not([disabled])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }, 100);

        // Trap focus within modal
        this.trapFocus(modal);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            
            setTimeout(() => {
                modal.remove();
                this.currentModal = null;
                this.selectedProductId = null;
            }, 300);
        }
    }

    trapFocus(modal) {
        const focusableElements = modal.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        modal.addEventListener('keydown', handleTabKey);
    }

    // =========== ADD PRODUCT MODAL ===========
    showAddProductModal() {
        if (!this.isInitialized || !this.adminPanel.state.isAdmin) {
            console.error('Cannot show add product modal - not authorized');
            return;
        }

        const categoriesOptions = this.config.categories.map(cat => 
            `<option value="${cat.value}" data-emoji="${cat.emoji}">${cat.label}</option>`
        ).join('');

        const content = `
            <div class="modal-section">
                <h3>Product Information</h3>
                <p class="modal-description">Fill out the form below to add a new product to your store.</p>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="product-name">Product Name <span class="required">*</span></label>
                        <input type="text" 
                               id="product-name" 
                               class="form-input"
                               placeholder="Enter product name" 
                               maxlength="${this.config.maxProductNameLength}"
                               required
                               autocomplete="off">
                        <div class="field-help">Maximum ${this.config.maxProductNameLength} characters</div>
                    </div>
                    <div class="form-group">
                        <label for="product-price">Price <span class="required">*</span></label>
                        <input type="number" 
                               id="product-price" 
                               class="form-input"
                               placeholder="0.00" 
                               step="0.01" 
                               min="0.01"
                               max="9999.99"
                               required>
                        <div class="field-help">Enter price in USD</div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="product-description">Description</label>
                    <textarea id="product-description" 
                              class="form-input"
                              placeholder="Enter product description (optional)" 
                              rows="3"
                              maxlength="${this.config.maxDescriptionLength}"></textarea>
                    <div class="field-help">Maximum ${this.config.maxDescriptionLength} characters</div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="product-category">Category</label>
                        <select id="product-category" class="form-input">
                            ${categoriesOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="product-emoji">Emoji/Icon</label>
                        <input type="text" 
                               id="product-emoji" 
                               class="form-input"
                               placeholder="🕯️" 
                               maxlength="4" 
                               value="🕯️">
                        <div class="field-help">Used when no image is available</div>
                    </div>
                </div>

                <div class="form-options">
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="product-featured">
                            <span class="checkbox-custom"></span>
                            Featured Product
                        </label>
                        <div class="field-help">Featured products are highlighted on your site</div>
                    </div>
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="product-in-stock" checked>
                            <span class="checkbox-custom"></span>
                            In Stock
                        </label>
                        <div class="field-help">Uncheck if product is out of stock</div>
                    </div>
                </div>

                <div class="product-preview-section">
                    <h4>Live Preview</h4>
                    <div class="preview-card">
                        <div class="preview-image">
                            <div class="preview-emoji" id="preview-emoji">🕯️</div>
                        </div>
                        <div class="preview-info">
                            <div class="preview-title" id="preview-title">Product Name</div>
                            <div class="preview-price" id="preview-price">$0.00</div>
                            <div class="preview-category" id="preview-category">Candles</div>
                        </div>
                    </div>
                </div>

                <div id="add-product-message" class="message-container"></div>
            </div>
        `;

        const actions = [
            {
                text: 'Add Product',
                class: 'admin-btn-primary',
                onclick: 'adminModals.handleAddProduct()',
                icon: '➕',
                ariaLabel: 'Add new product'
            }
        ];

        this.createModal('add-product-modal', '➕ Add New Product', content, actions);
        this.showModal('add-product-modal');
        
        // Setup form functionality
        this.setupAddProductForm();
    }

    setupAddProductForm() {
        const elements = {
            name: document.getElementById('product-name'),
            price: document.getElementById('product-price'),
            description: document.getElementById('product-description'),
            category: document.getElementById('product-category'),
            emoji: document.getElementById('product-emoji'),
            featured: document.getElementById('product-featured'),
            inStock: document.getElementById('product-in-stock')
        };

        // Validate elements exist
        const missingElements = Object.keys(elements).filter(key => !elements[key]);
        if (missingElements.length > 0) {
            console.error('Missing form elements:', missingElements);
            return;
        }

        // Live preview updates
        const updatePreview = () => {
            try {
                const name = elements.name.value.trim() || 'Product Name';
                const price = parseFloat(elements.price.value) || 0;
                const emoji = elements.emoji.value.trim() || '🕯️';
                const category = elements.category.value;

                const previewElements = {
                    title: document.getElementById('preview-title'),
                    price: document.getElementById('preview-price'),
                    emoji: document.getElementById('preview-emoji'),
                    category: document.getElementById('preview-category')
                };

                if (previewElements.title) previewElements.title.textContent = name;
                if (previewElements.price) previewElements.price.textContent = `$${price.toFixed(2)}`;
                if (previewElements.emoji) previewElements.emoji.textContent = emoji;
                if (previewElements.category) previewElements.category.textContent = this.formatCategory(category);
            } catch (error) {
                console.error('Preview update failed:', error);
            }
        };

        // Category change handler
        elements.category.addEventListener('change', (e) => {
            const selectedOption = e.target.selectedOptions[0];
            const emoji = selectedOption?.getAttribute('data-emoji');
            if (emoji && elements.emoji) {
                elements.emoji.value = emoji;
            }
            updatePreview();
        });

        // Add event listeners for live preview
        Object.values(elements).forEach(element => {
            if (element && element.addEventListener) {
                ['input', 'change', 'keyup'].forEach(event => {
                    element.addEventListener(event, updatePreview);
                });
            }
        });

        // Character counters
        this.setupCharacterCounters();

        // Initial preview update
        updatePreview();
    }

    setupCharacterCounters() {
        const counters = [
            { id: 'product-name', max: this.config.maxProductNameLength },
            { id: 'product-description', max: this.config.maxDescriptionLength }
        ];

        counters.forEach(counter => {
            const element = document.getElementById(counter.id);
            if (!element) return;

            const updateCounter = () => {
                const length = element.value.length;
                const helpElement = element.nextElementSibling;
                if (helpElement && helpElement.classList.contains('field-help')) {
                    helpElement.textContent = `${length}/${counter.max} characters`;
                    helpElement.className = length > counter.max * 0.9 ? 'field-help warning' : 'field-help';
                }
            };

            element.addEventListener('input', updateCounter);
            element.addEventListener('keyup', updateCounter);
        });
    }

    async handleAddProduct() {
        if (!this.adminPanel.state.isAdmin) {
            console.error('Unauthorized add product attempt');
            return;
        }

        const elements = {
            name: document.getElementById('product-name'),
            price: document.getElementById('product-price'),
            description: document.getElementById('product-description'),
            category: document.getElementById('product-category'),
            emoji: document.getElementById('product-emoji'),
            featured: document.getElementById('product-featured'),
            inStock: document.getElementById('product-in-stock')
        };

        const messageDiv = document.getElementById('add-product-message');

        // Validate elements
        if (!elements.name || !elements.price || !messageDiv) {
            console.error('Required form elements not found');
            this.showMessage(messageDiv, 'Form error - please refresh and try again', 'error');
            return;
        }

        // Get and validate form data
        const formData = this.getFormData(elements);
        const validation = this.validateProductData(formData);
        
        if (!validation.valid) {
            this.showMessage(messageDiv, validation.message, 'error');
            if (validation.field) {
                elements[validation.field]?.focus();
            }
            return;
        }

        try {
            // Show processing state
            this.showMessage(messageDiv, 'Adding product...', 'info');
            this.setFormEnabled(false);

            // Create product data
            const productData = {
                id: this.generateProductId(formData.name),
                name: formData.name,
                price: formData.price,
                description: formData.description || this.generateDefaultDescription(formData.name, formData.category),
                category: formData.category,
                emoji: formData.emoji,
                featured: formData.featured,
                inStock: formData.inStock,
                createdAt: new Date().toISOString(),
                createdBy: 'admin',
                imageUrl: null
            };

            // Add product via admin panel
            const success = await this.adminPanel.addProduct(productData);
            
            if (success) {
                this.showMessage(messageDiv, '✅ Product added successfully!', 'success');
                this.clearAddProductForm();
                
                // Close modal after success
                setTimeout(() => {
                    this.closeModal('add-product-modal');
                }, 1500);
            } else {
                throw new Error('Product addition failed');
            }

        } catch (error) {
            console.error('Error adding product:', error);
            this.showMessage(messageDiv, '❌ Failed to add product. Please try again.', 'error');
        } finally {
            this.setFormEnabled(true);
        }
    }

    getFormData(elements) {
        return {
            name: elements.name.value.trim(),
            price: parseFloat(elements.price.value),
            description: elements.description.value.trim(),
            category: elements.category.value,
            emoji: elements.emoji.value.trim() || '🕯️',
            featured: elements.featured.checked,
            inStock: elements.inStock.checked
        };
    }

    validateProductData(data) {
        if (!data.name) {
            return { valid: false, message: 'Product name is required', field: 'name' };
        }

        if (data.name.length > this.config.maxProductNameLength) {
            return { valid: false, message: `Product name must be ${this.config.maxProductNameLength} characters or less`, field: 'name' };
        }

        if (!data.price || data.price <= 0) {
            return { valid: false, message: 'Please enter a valid price greater than $0.00', field: 'price' };
        }

        if (data.price > 9999.99) {
            return { valid: false, message: 'Price cannot exceed $9,999.99', field: 'price' };
        }

        if (data.description && data.description.length > this.config.maxDescriptionLength) {
            return { valid: false, message: `Description must be ${this.config.maxDescriptionLength} characters or less`, field: 'description' };
        }

        // Check for duplicate product names
        const existingProducts = this.adminPanel.state.allProducts || [];
        const isDuplicate = existingProducts.some(product => 
            product.name.toLowerCase() === data.name.toLowerCase()
        );

        if (isDuplicate) {
            return { valid: false, message: 'A product with this name already exists', field: 'name' };
        }

        return { valid: true };
    }

    generateDefaultDescription(name, category) {
        const categoryLabel = this.config.categories.find(c => c.value === category)?.label || 'product';
        return `Premium ${name} - High quality ${categoryLabel.toLowerCase()} with excellent craftsmanship and attention to detail.`;
    }

    clearAddProductForm() {
        const inputIds = ['product-name', 'product-price', 'product-description'];
        inputIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
        
        const checkboxIds = ['product-featured', 'product-in-stock'];
        checkboxIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.checked = id === 'product-in-stock';
            }
        });

        // Reset selects to default
        const categorySelect = document.getElementById('product-category');
        if (categorySelect) categorySelect.value = 'candles';

        const emojiInput = document.getElementById('product-emoji');
        if (emojiInput) emojiInput.value = '🕯️';

        // Reset preview
        setTimeout(() => {
            const previewElements = {
                title: document.getElementById('preview-title'),
                price: document.getElementById('preview-price'),
                emoji: document.getElementById('preview-emoji'),
                category: document.getElementById('preview-category')
            };

            if (previewElements.title) previewElements.title.textContent = 'Product Name';
            if (previewElements.price) previewElements.price.textContent = '$0.00';
            if (previewElements.emoji) previewElements.emoji.textContent = '🕯️';
            if (previewElements.category) previewElements.category.textContent = 'Candles';
        }, 100);
    }

    setFormEnabled(enabled) {
        const formElements = document.querySelectorAll('#add-product-modal input, #add-product-modal textarea, #add-product-modal select, #add-product-modal button');
        formElements.forEach(element => {
            element.disabled = !enabled;
        });
    }

    // =========== MANAGE PRODUCTS MODAL ===========
    showEditProductsModal() {
        if (!this.adminPanel.state.isAdmin) {
            console.error('Unauthorized manage products attempt');
            return;
        }

        const products = this.adminPanel.state.allProducts || [];
        
        if (products.length === 0) {
            this.adminPanel.showNotification('No products found. Add some products first!', 'info');
            return;
        }

        const productsHTML = products.map(product => `
            <div class="product-item ${product.id === this.selectedProductId ? 'selected' : ''}" 
                 data-product-id="${product.id}"
                 tabindex="0"
                 role="button"
                 aria-label="Select ${this.escapeHtml(product.name)} for editing">
                <div class="product-emoji">${this.escapeHtml(product.emoji || '🕯️')}</div>
                <div class="product-name">${this.escapeHtml(product.name)}</div>
                <div class="product-price">$${(product.price || 0).toFixed(2)}</div>
                <div class="product-category">${this.formatCategory(product.category)}</div>
                ${!product.inStock ? '<div class="product-out-of-stock">Out of Stock</div>' : ''}
                ${product.featured ? '<div class="product-featured">Featured</div>' : ''}
            </div>
        `).join('');

        const categoriesOptions = this.config.categories.map(cat => 
            `<option value="${cat.value}">${cat.label}</option>`
        ).join('');

        const content = `
            <div class="modal-section">
                <h3>Select Product to Edit</h3>
                <p class="modal-description">Click on a product below to edit or delete it:</p>
                
                <div class="products-grid" id="product-selection-grid">
                    ${productsHTML}
                </div>

                <div id="edit-form" class="edit-form-section" style="display: none;">
                    <h4>Edit Selected Product</h4>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-product-name">Product Name <span class="required">*</span></label>
                            <input type="text" 
                                   id="edit-product-name" 
                                   class="form-input"
                                   maxlength="${this.config.maxProductNameLength}"
                                   required>
                        </div>
                        <div class="form-group">
                            <label for="edit-product-price">Price <span class="required">*</span></label>
                            <input type="number" 
                                   id="edit-product-price" 
                                   class="form-input"
                                   step="0.01" 
                                   min="0.01"
                                   max="9999.99"
                                   required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="edit-product-description">Description</label>
                        <textarea id="edit-product-description" 
                                  class="form-input"
                                  rows="3"
                                  maxlength="${this.config.maxDescriptionLength}"></textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-product-category">Category</label>
                            <select id="edit-product-category" class="form-input">
                                ${categoriesOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-product-emoji">Emoji/Icon</label>
                            <input type="text" 
                                   id="edit-product-emoji" 
                                   class="form-input"
                                   maxlength="4">
                        </div>
                    </div>

                    <div class="form-options">
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="edit-product-featured">
                                <span class="checkbox-custom"></span>
                                Featured Product
                            </label>
                        </div>
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="edit-product-in-stock">
                                <span class="checkbox-custom"></span>
                                In Stock
                            </label>
                        </div>
                    </div>

                    <div id="edit-product-message" class="message-container"></div>
                </div>
            </div>
        `;

        const actions = [
            {
                text: 'Save Changes',
                class: 'admin-btn-primary',
                onclick: 'adminModals.handleSaveProduct()',
                icon: '💾',
                ariaLabel: 'Save product changes'
            },
            {
                text: 'Delete Product',
                class: 'admin-btn-danger',
                onclick: 'adminModals.handleDeleteProduct()',
                icon: '🗑️',
                ariaLabel: 'Delete selected product'
            }
        ];

        this.createModal('edit-products-modal', '📝 Manage Products', content, actions);
        this.showModal('edit-products-modal');

        // Setup product selection
        setTimeout(() => {
            this.setupProductSelection();
        }, 100);
    }

    setupProductSelection() {
        const productItems = document.querySelectorAll('.product-item');
        
        productItems.forEach(item => {
            const productId = item.getAttribute('data-product-id');
            
            // Click handler
            item.addEventListener('click', () => {
                this.selectProduct(productId);
            });

            // Keyboard handler
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectProduct(productId);
                }
            });
        });
    }

    selectProduct(productId) {
        // Remove previous selections
        document.querySelectorAll('.product-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Select current product
        const selectedItem = document.querySelector(`[data-product-id="${productId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        // Load product data
        const products = this.adminPanel.state.allProducts || [];
        const product = products.find(p => p.id === productId);
        
        if (product) {
            this.loadProductIntoEditForm(product);
        }

        // Show edit form
        const editForm = document.getElementById('edit-form');
        if (editForm) {
            editForm.style.display = 'block';
            editForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        this.selectedProductId = productId;
    }

    loadProductIntoEditForm(product) {
        const elements = {
            name: document.getElementById('edit-product-name'),
            price: document.getElementById('edit-product-price'),
            description: document.getElementById('edit-product-description'),
            category: document.getElementById('edit-product-category'),
            emoji: document.getElementById('edit-product-emoji'),
            featured: document.getElementById('edit-product-featured'),
            inStock: document.getElementById('edit-product-in-stock')
        };

        try {
            if (elements.name) elements.name.value = product.name || '';
            if (elements.price) elements.price.value = product.price || '';
            if (elements.description) elements.description.value = product.description || '';
            if (elements.category) elements.category.value = product.category || 'candles';
            if (elements.emoji) elements.emoji.value = product.emoji || '🕯️';
            if (elements.featured) elements.featured.checked = product.featured || false;
            if (elements.inStock) elements.inStock.checked = product.inStock !== false;
        } catch (error) {
            console.error('Error loading product into form:', error);
        }
    }

    async handleSaveProduct() {
        if (!this.selectedProductId || !this.adminPanel.state.isAdmin) {
            this.adminPanel.showNotification('Please select a product first', 'warning');
            return;
        }

        const elements = {
            name: document.getElementById('edit-product-name'),
            price: document.getElementById('edit-product-price'),
            description: document.getElementById('edit-product-description'),
            category: document.getElementById('edit-product-category'),
            emoji: document.getElementById('edit-product-emoji'),
            featured: document.getElementById('edit-product-featured'),
            inStock: document.getElementById('edit-product-in-stock')
        };

        const messageDiv = document.getElementById('edit-product-message');

        // Get and validate form data
        const formData = this.getFormData(elements);
        const validation = this.validateProductData(formData, this.selectedProductId);
        
        if (!validation.valid) {
            this.showMessage(messageDiv, validation.message, 'error');
            if (validation.field && elements[validation.field]) {
                elements[validation.field].focus();
            }
            return;
        }

        try {
            // Show processing state
            this.showMessage(messageDiv, 'Saving changes...', 'info');

            // Update product
            const success = await this.updateProduct(this.selectedProductId, formData);
            
            if (success) {
                this.showMessage(messageDiv, '✅ Product updated successfully!', 'success');
                
                setTimeout(() => {
                    this.closeModal('edit-products-modal');
                }, 1500);
            } else {
                throw new Error('Product update failed');
            }

        } catch (error) {
            console.error('Error updating product:', error);
            this.showMessage(messageDiv, '❌ Failed to update product. Please try again.', 'error');
        }
    }

    async updateProduct(productId, formData) {
        try {
            const products = JSON.parse(localStorage.getItem('admin_products') || '[]');
            const productIndex = products.findIndex(p => p.id === productId);
            
            if (productIndex === -1) {
                throw new Error('Product not found');
            }

            // Update product
            products[productIndex] = {
                ...products[productIndex],
                name: formData.name,
                price: formData.price,
                description: formData.description,
                category: formData.category,
                emoji: formData.emoji,
                featured: formData.featured,
                inStock: formData.inStock,
                updatedAt: new Date().toISOString()
            };

            // Save to localStorage
            localStorage.setItem('admin_products', JSON.stringify(products));

            // Try to save to server if available
            if (this.adminPanel.state.serverConnected) {
                try {
                    const response = await this.adminPanel.fetchWithTimeout(
                        `${this.adminPanel.config.apiBaseUrl}/api/products/${productId}`,
                        10000,
                        {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(products[productIndex])
                        }
                    );
                    
                    if (response.ok) {
                        console.log('Product also updated on server');
                    }
                } catch (serverError) {
                    console.warn('Server update failed, but local update succeeded');
                }
            }

            // Reload products
            await this.adminPanel.loadProductsForAllUsers();
            this.adminPanel.updateAdminPanelStats();

            return true;

        } catch (error) {
            console.error('Product update failed:', error);
            return false;
        }
    }

    async handleDeleteProduct() {
        if (!this.selectedProductId || !this.adminPanel.state.isAdmin) {
            this.adminPanel.showNotification('Please select a product first', 'warning');
            return;
        }

        const products = this.adminPanel.state.allProducts || [];
        const product = products.find(p => p.id === this.selectedProductId);
        
        if (!product) {
            this.adminPanel.showNotification('Product not found', 'error');
            return;
        }

        const confirmed = confirm(
            `Are you sure you want to delete "${product.name}"?\n\n` +
            `This action cannot be undone and will remove the product from your store immediately.`
        );

        if (!confirmed) return;

        const messageDiv = document.getElementById('edit-product-message');

        try {
            this.showMessage(messageDiv, 'Deleting product...', 'info');

            const success = await this.deleteProduct(this.selectedProductId);
            
            if (success) {
                this.showMessage(messageDiv, '✅ Product deleted successfully!', 'success');
                
                setTimeout(() => {
                    this.closeModal('edit-products-modal');
                }, 1500);
            } else {
                throw new Error('Product deletion failed');
            }

        } catch (error) {
            console.error('Error deleting product:', error);
            this.showMessage(messageDiv, '❌ Failed to delete product. Please try again.', 'error');
        }
    }

    async deleteProduct(productId) {
        try {
            // Remove from localStorage
            const products = JSON.parse(localStorage.getItem('admin_products') || '[]');
            const updatedProducts = products.filter(p => p.id !== productId);
            localStorage.setItem('admin_products', JSON.stringify(updatedProducts));

            // Try to delete from server if available
            if (this.adminPanel.state.serverConnected) {
                try {
                    const response = await this.adminPanel.fetchWithTimeout(
                        `${this.adminPanel.config.apiBaseUrl}/api/products/${productId}`,
                        10000,
                        { method: 'DELETE' }
                    );
                    
                    if (response.ok) {
                        console.log('Product also deleted from server');
                    }
                } catch (serverError) {
                    console.warn('Server delete failed, but local delete succeeded');
                }
            }

            // Reload products
            await this.adminPanel.loadProductsForAllUsers();
            this.adminPanel.updateAdminPanelStats();

            return true;

        } catch (error) {
            console.error('Product deletion failed:', error);
            return false;
        }
    }

    // =========== UTILITY METHODS ===========
    validateProductData(data, excludeId = null) {
        // Basic validation
        const basicValidation = this.validateProductData(data);
        if (!basicValidation.valid && !excludeId) {
            return basicValidation;
        }

        // Check for duplicate names (excluding current product)
        const existingProducts = this.adminPanel.state.allProducts || [];
        const isDuplicate = existingProducts.some(product => 
            product.id !== excludeId && 
            product.name.toLowerCase() === data.name.toLowerCase()
        );

        if (isDuplicate) {
            return { valid: false, message: 'A product with this name already exists', field: 'name' };
        }

        return { valid: true };
    }

    generateProductId(name) {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substr(2, 5);
        const nameSlug = name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substr(0, 20);
        return `${nameSlug}-${timestamp}-${randomStr}`;
    }

    formatCategory(category) {
        if (!category) return 'General';
        return category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(container, message, type = 'info') {
        if (!container) return;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const className = `message message-${type}`;
        const icon = icons[type] || icons.info;
        
        container.innerHTML = `
            <div class="${className}">
                <span class="message-icon">${icon}</span>
                <span class="message-text">${this.escapeHtml(message)}</span>
            </div>
        `;
        
        // Auto-clear non-success messages
        if (type !== 'success') {
            setTimeout(() => {
                if (container.innerHTML.includes(message)) {
                    container.innerHTML = '';
                }
            }, 5000);
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Close modal on Escape
            if (e.key === 'Escape' && this.currentModal) {
                e.preventDefault();
                this.closeModal(this.currentModal);
            }
        });
    }

    setupModalStyles() {
        // Prevent duplicate styles
        if (document.getElementById('admin-modal-styles')) return;

        const modalStyles = document.createElement('style');
        modalStyles.id = 'admin-modal-styles';
        modalStyles.textContent = `
            /* Admin Modal Styles */
            .admin-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(8px);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }

            .admin-modal.active {
                opacity: 1;
                visibility: visible;
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
                position: relative;
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                border-radius: 16px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
                max-width: 90vw;
                max-height: 85vh;
                overflow-y: auto;
                transform: translateY(50px) scale(0.95);
                transition: transform 0.3s ease;
                z-index: 1;
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
                border-radius: 16px 16px 0 0;
                color: white;
            }

            .admin-modal-title {
                font-size: 20px;
                font-weight: 600;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .admin-modal-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;
            }

            .admin-modal-close:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .admin-modal-body {
                padding: 30px;
            }

            .modal-section {
                margin-bottom: 30px;
            }

            .modal-section h3 {
                font-size: 18px;
                font-weight: 600;
                color: #2c2c2c;
                margin: 0 0 8px 0;
            }

            .modal-description {
                color: #666;
                font-size: 14px;
                margin: 0 0 24px 0;
                line-height: 1.5;
            }

            /* Form Styles */
            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-group label {
                display: block;
                font-weight: 600;
                color: #2c2c2c;
                margin-bottom: 8px;
                font-size: 14px;
            }

            .required {
                color: #dc2626;
            }

            .form-input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 14px;
                font-family: inherit;
                transition: all 0.2s ease;
                box-sizing: border-box;
            }

            .form-input:focus {
                outline: none;
                border-color: #8B7355;
                box-shadow: 0 0 0 3px rgba(139, 115, 85, 0.1);
            }

            .form-input:invalid {
                border-color: #dc2626;
            }

            .field-help {
                font-size: 12px;
                color: #666;
                margin-top: 4px;
            }

            .field-help.warning {
                color: #f59e0b;
            }

            /* Checkbox Styles */
            .form-options {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 24px 0;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
            }

            .checkbox-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .checkbox-label {
                display: flex;
                align-items: center;
                gap: 10px;
                cursor: pointer;
                font-weight: 500;
                color: #374151;
            }

            .checkbox-label input[type="checkbox"] {
                display: none;
            }

            .checkbox-custom {
                width: 20px;
                height: 20px;
                border: 2px solid #d1d5db;
                border-radius: 4px;
                background: white;
                transition: all 0.2s ease;
                position: relative;
                flex-shrink: 0;
            }

            .checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
                background: #8B7355;
                border-color: #8B7355;
            }

            .checkbox-label input[type="checkbox"]:checked + .checkbox-custom::after {
                content: '✓';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 12px;
                font-weight: bold;
            }

            /* Preview Styles */
            .product-preview-section {
                background: #f8f9fa;
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
                text-align: center;
            }

            .product-preview-section h4 {
                margin: 0 0 16px 0;
                color: #8B7355;
                font-size: 16px;
                font-weight: 600;
            }

            .preview-card {
                max-width: 250px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
                transition: transform 0.2s ease;
            }

            .preview-card:hover {
                transform: translateY(-2px);
            }

            .preview-image {
                height: 150px;
                background: linear-gradient(135deg, #f8f9fa, #e5e7eb);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }

            .preview-emoji {
                font-size: 48px;
            }

            .preview-info {
                padding: 16px;
                text-align: center;
            }

            .preview-title {
                font-weight: 600;
                margin-bottom: 8px;
                color: #2c2c2c;
                font-size: 16px;
            }

            .preview-price {
                color: #8B7355;
                font-weight: 700;
                font-size: 18px;
                margin-bottom: 4px;
            }

            .preview-category {
                color: #666;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            /* Product Selection Grid */
            .products-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 16px;
                margin: 20px 0;
                max-height: 400px;
                overflow-y: auto;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 16px;
            }

            .product-item {
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
                position: relative;
            }

            .product-item:hover {
                border-color: #8B7355;
                box-shadow: 0 4px 15px rgba(139, 115, 85, 0.15);
                transform: translateY(-2px);
            }

            .product-item.selected {
                border-color: #8B7355;
                background: rgba(139, 115, 85, 0.05);
                box-shadow: 0 4px 15px rgba(139, 115, 85, 0.2);
            }

            .product-item .product-emoji {
                font-size: 32px;
                margin-bottom: 8px;
                display: block;
            }

            .product-item .product-name {
                font-weight: 600;
                margin-bottom: 4px;
                font-size: 14px;
                line-height: 1.3;
            }

            .product-item .product-price {
                color: #8B7355;
                font-weight: 700;
                margin-bottom: 4px;
            }

            .product-item .product-category {
                font-size: 11px;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .product-out-of-stock, .product-featured {
                position: absolute;
                top: 6px;
                right: 6px;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 9px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .product-out-of-stock {
                background: #dc2626;
                color: white;
            }

            .product-featured {
                background: #8B7355;
                color: white;
            }

            /* Edit Form */
            .edit-form-section {
                background: #f8f9fa;
                border-radius: 12px;
                padding: 24px;
                margin-top: 24px;
                border: 1px solid #e5e7eb;
            }

            .edit-form-section h4 {
                margin: 0 0 20px 0;
                color: #8B7355;
                font-size: 18px;
                font-weight: 600;
            }

            /* Action Buttons */
            .admin-modal-actions {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
            }

            .admin-btn-primary,
            .admin-btn-secondary,
            .admin-btn-danger {
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
                display: flex;
                align-items: center;
                gap: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .admin-btn-primary {
                background: linear-gradient(135deg, #8B7355 0%, #6d5a42 100%);
                color: white;
            }

            .admin-btn-primary:hover:not(:disabled) {
                background: linear-gradient(135deg, #6d5a42 0%, #5a4735 100%);
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(139, 115, 85, 0.3);
            }

            .admin-btn-secondary {
                background: transparent;
                color: #666;
                border: 2px solid #e5e7eb;
            }

            .admin-btn-secondary:hover:not(:disabled) {
                background: #f8f9fa;
                border-color: #8B7355;
                color: #8B7355;
            }

            .admin-btn-danger {
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                color: white;
            }

            .admin-btn-danger:hover:not(:disabled) {
                background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(220, 38, 38, 0.3);
            }

            .admin-btn-primary:disabled,
            .admin-btn-secondary:disabled,
            .admin-btn-danger:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            .btn-icon {
                font-size: 16px;
            }

            /* Message Styles */
            .message-container {
                margin: 20px 0;
            }

            .message {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
            }

            .message-success {
                background: #d1fae5;
                border: 1px solid #a7f3d0;
                color: #065f46;
            }

            .message-error {
                background: #fee2e2;
                border: 1px solid #fecaca;
                color: #b91c1c;
            }

            .message-warning {
                background: #fef3c7;
                border: 1px solid #fde68a;
                color: #92400e;
            }

            .message-info {
                background: #dbeafe;
                border: 1px solid #bfdbfe;
                color: #1d4ed8;
            }

            .message-icon {
                font-size: 16px;
                flex-shrink: 0;
            }

            .message-text {
                flex: 1;
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

                .admin-modal-header {
                    padding: 16px 20px;
                }

                .admin-modal-title {
                    font-size: 18px;
                }

                .form-row {
                    grid-template-columns: 1fr;
                    gap: 0;
                }

                .form-options {
                    grid-template-columns: 1fr;
                }

                .admin-modal-actions {
                    flex-direction: column;
                }

                .admin-modal-actions button {
                    width: 100%;
                    justify-content: center;
                }

                .products-grid {
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 12px;
                    max-height: 300px;
                }

                .product-item {
                    padding: 12px;
                }

                .product-item .product-emoji {
                    font-size: 24px;
                }
            }

            @media (max-width: 480px) {
                .admin-modal-content {
                    margin: 10px;
                    max-width: calc(100vw - 20px);
                    max-height: calc(100vh - 20px);
                }

                .admin-modal-body {
                    padding: 16px;
                }

                .modal-section {
                    margin-bottom: 20px;
                }

                .form-group {
                    margin-bottom: 16px;
                }

                .product-preview-section {
                    padding: 16px;
                }

                .preview-card {
                    max-width: 200px;
                }

                .products-grid {
                    grid-template-columns: 1fr 1fr;
                    max-height: 250px;
                }

                .edit-form-section {
                    padding: 16px;
                }
            }

            /* Accessibility */
            .admin-modal[aria-hidden="true"] {
                display: none;
            }

            .admin-modal-content:focus {
                outline: 3px solid #8B7355;
                outline-offset: -3px;
            }

            .product-item:focus {
                outline: 3px solid #8B7355;
                outline-offset: -2px;
            }

            /* Animation for smooth interactions */
            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(50px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .admin-modal.active .admin-modal-content {
                animation: modalSlideIn 0.3s ease;
            }

            /* Loading states */
            .form-input:disabled {
                background: #f3f4f6;
                color: #9ca3af;
                cursor: not-allowed;
            }

            .admin-btn-primary:disabled {
                background: #9ca3af;
            }

            /* Focus visible for better accessibility */
            .form-input:focus-visible,
            .checkbox-custom:focus-visible,
            .admin-btn-primary:focus-visible,
            .admin-btn-secondary:focus-visible,
            .admin-btn-danger:focus-visible {
                outline: 3px solid #8B7355;
                outline-offset: 2px;
            }
        `;

        document.head.appendChild(modalStyles);
    }
}

// Initialize Admin Modals when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const initializeModals = () => {
        if (window.adminPanel && window.adminPanel.state && window.adminPanel.state.isAdmin) {
            console.log('Initializing Admin Modals...');
            
            try {
                window.adminModals = new AdminModals(window.adminPanel);

                // Override admin panel modal methods
                if (window.adminPanel.showAddProductModal) {
                    window.adminPanel.showAddProductModal = () => window.adminModals.showAddProductModal();
                }
                
                if (window.adminPanel.showManageProductsModal) {
                    window.adminPanel.showManageProductsModal = () => window.adminModals.showEditProductsModal();
                }

                console.log('Admin Modals initialized successfully');
                return true;
                
            } catch (error) {
                console.error('Admin Modals initialization failed:', error);
                return false;
            }
        }
        return false;
    };

    // Try initialization with retries
    let attempts = 0;
    const maxAttempts = 15;
    
    const tryInit = () => {
        attempts++;
        
        if (initializeModals()) {
            return; // Success
        }
        
        if (attempts < maxAttempts) {
            const delay = Math.min(500 * Math.pow(1.3, attempts - 1), 3000);
            setTimeout(tryInit, delay);
        } else {
            console.warn('Admin Modals initialization timed out after', maxAttempts, 'attempts');
        }
    };

    // Start initialization attempts
    setTimeout(tryInit, 100);
});

// Also try on window load as backup
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!window.adminModals && window.adminPanel && window.adminPanel.state && window.adminPanel.state.isAdmin) {
            console.log('Attempting Admin Modals initialization on window load...');
            try {
                window.adminModals = new AdminModals(window.adminPanel);
                
                // Override methods
                window.adminPanel.showAddProductModal = () => window.adminModals.showAddProductModal();
                window.adminPanel.showManageProductsModal = () => window.adminModals.showEditProductsModal();
                
                console.log('Admin Modals initialized on window load');
            } catch (error) {
                console.error('Window load initialization failed:', error);
            }
        }
    }, 1000);
});

// Global function for manual initialization (debugging)
window.initAdminModals = function() {
    if (window.adminPanel && window.adminPanel.state && window.adminPanel.state.isAdmin) {
        try {
            window.adminModals = new AdminModals(window.adminPanel);
            
            // Override methods
            window.adminPanel.showAddProductModal = () => window.adminModals.showAddProductModal();
            window.adminPanel.showManageProductsModal = () => window.adminModals.showEditProductsModal();
            
            console.log('Admin Modals manually initialized');
            return true;
        } catch (error) {
            console.error('Manual initialization failed:', error);
            return false;
        }
    }
    
    console.log('Cannot initialize - admin panel not ready or user not admin');
    return false;
};

// Global keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Close modals on Escape
    if (e.key === 'Escape' && window.adminModals && window.adminModals.currentModal) {
        e.preventDefault();
        window.adminModals.closeModal(window.adminModals.currentModal);
    }
});

// Handle modal closing on backdrop click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('admin-modal-backdrop') && window.adminModals) {
        const modal = e.target.closest('.admin-modal');
        if (modal && window.adminModals.currentModal) {
            window.adminModals.closeModal(window.adminModals.currentModal);
        }
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminModals;
}