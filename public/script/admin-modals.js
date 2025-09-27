class AdminModals {
    constructor(adminPanel) {
        this.adminPanel = adminPanel;
        this.currentModal = null;
        this.selectedProductId = null;
        
        this.modalCache = new Map();
        this.eventListeners = new Map();
        this.debounceTimers = new Map();
        
        this.setupModalStyles();
        console.log('Admin Modals initialized with performance optimizations');
    }

    setupModalStyles() {
        if (document.getElementById('admin-modal-styles')) return;

        const modalStyles = `
            <style id="admin-modal-styles">
                .admin-modal {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px);
                    z-index: 10001; display: flex; align-items: center; justify-content: center;
                    opacity: 0; visibility: hidden; 
                    transition: opacity 0.2s ease, visibility 0.2s ease;
                    transform: translateZ(0);
                }
                .admin-modal.active { opacity: 1; visibility: visible; }
                .admin-modal-content {
                    background: linear-gradient(135deg, #ffffff 0%, #f8f6f3 100%);
                    border-radius: 16px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                    max-width: 90vw; max-height: 90vh; overflow-y: auto; position: relative;
                    transform: translateY(30px) translateZ(0); 
                    transition: transform 0.2s ease;
                    will-change: transform;
                }
                .admin-modal.active .admin-modal-content { transform: translateY(0) translateZ(0); }
                .admin-modal-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 20px 24px; background: linear-gradient(135deg, #8B7355 0%, #6d5a42 100%);
                    border-radius: 16px 16px 0 0; color: white;
                }
                .admin-modal-title {
                    font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px;
                }
                .admin-modal-close {
                    background: rgba(255, 255, 255, 0.2); border: none; color: white;
                    width: 28px; height: 28px; border-radius: 6px; cursor: pointer;
                    font-size: 16px; transition: background 0.15s ease;
                }
                .admin-modal-close:hover { background: rgba(255, 255, 255, 0.3); }
                .admin-modal-body { padding: 24px; }
                
                .form-section { 
                    background: #f8f6f3; border-radius: 8px; padding: 18px; margin-bottom: 18px;
                    border: 1px solid #e8e8e8; transform: translateZ(0);
                }
                .form-section-title {
                    font-size: 14px; font-weight: 600; color: #8B7355; margin-bottom: 12px;
                    text-transform: uppercase; letter-spacing: 0.5px;
                }
                .form-group { margin-bottom: 16px; }
                .form-group label {
                    display: block; font-weight: 600; color: #2c2c2c; margin-bottom: 6px;
                    font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;
                }
                .form-group input, .form-group textarea, .form-group select {
                    width: 100%; padding: 10px 14px; border: 2px solid #e8e8e8;
                    border-radius: 6px; font-size: 14px; transition: border-color 0.2s ease;
                    font-family: 'Inter', sans-serif; box-sizing: border-box;
                }
                .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
                    outline: none; border-color: #8B7355; box-shadow: 0 0 0 2px rgba(139, 115, 85, 0.1);
                }
                .form-group textarea { min-height: 70px; resize: vertical; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
                .form-row-three { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
                .checkbox-group {
                    display: flex; align-items: center; gap: 8px; margin-top: 8px;
                }
                .checkbox-group input[type="checkbox"] { width: auto; margin: 0; }
                
                .dynamic-list {
                    border: 1px solid #e8e8e8; border-radius: 6px; padding: 12px;
                    background: white; margin-top: 8px; transform: translateZ(0);
                }
                .dynamic-list-item {
                    display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
                    padding: 6px; background: #fafafa; border-radius: 4px;
                }
                .dynamic-list-item:last-child { margin-bottom: 0; }
                .dynamic-list-item input {
                    flex: 1; margin: 0; padding: 5px 8px; font-size: 13px;
                }
                .dynamic-list-item button {
                    background: #ff4444; color: white; border: none; padding: 5px 8px;
                    border-radius: 3px; cursor: pointer; font-size: 11px;
                }
                .dynamic-list-item button:hover { background: #cc3333; }
                .add-item-btn {
                    background: #8B7355; color: white; border: none; padding: 6px 12px;
                    border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 8px;
                }
                .add-item-btn:hover { background: #6d5a42; }
                
                .btn-group {
                    display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px;
                    padding-top: 16px; border-top: 1px solid #e8e8e8;
                }
                .admin-btn-primary, .admin-btn-secondary, .admin-btn-danger {
                    padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 500;
                    cursor: pointer; transition: all 0.2s ease; border: none;
                    text-transform: uppercase; letter-spacing: 0.5px;
                }
                .admin-btn-primary {
                    background: linear-gradient(135deg, #8B7355 0%, #6d5a42 100%); color: white;
                }
                .admin-btn-primary:hover {
                    transform: translateY(-1px); box-shadow: 0 6px 16px rgba(139, 115, 85, 0.3);
                }
                .admin-btn-secondary {
                    background: transparent; color: #666; border: 2px solid #e8e8e8;
                }
                .admin-btn-secondary:hover {
                    background: #f8f6f3; border-color: #8B7355; color: #8B7355;
                }
                .admin-btn-danger {
                    background: #dc3545; color: white;
                }
                .admin-btn-danger:hover {
                    background: #c82333; transform: translateY(-1px);
                }
                
                .product-preview {
                    background: white; border: 1px solid #e8e8e8; border-radius: 10px;
                    padding: 16px; margin: 16px 0; text-align: center; transform: translateZ(0);
                }
                .preview-card {
                    max-width: 200px; margin: 0 auto; background: white;
                    border-radius: 6px; overflow: hidden; box-shadow: 0 3px 12px rgba(0,0,0,0.1);
                }
                .preview-image {
                    width: 100%; height: 120px; background: linear-gradient(45deg, #f8f6f3, #e8e6e0);
                    display: flex; align-items: center; justify-content: center; font-size: 2.5rem;
                }
                .preview-info { padding: 12px; }
                .preview-title { font-weight: 600; margin-bottom: 4px; color: #2c2c2c; font-size: 14px; }
                .preview-price { color: #8B7355; font-weight: 500; font-size: 16px; }
                .preview-options {
                    font-size: 11px; color: #666; margin-top: 6px; line-height: 1.3;
                }
                
                .product-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                    gap: 12px; margin: 16px 0;
                }
                .product-item {
                    background: white; border: 2px solid #e8e8e8; border-radius: 6px;
                    padding: 12px; cursor: pointer; transition: all 0.2s ease; text-align: center;
                    transform: translateZ(0);
                }
                .product-item:hover, .product-item.selected {
                    border-color: #8B7355; box-shadow: 0 3px 12px rgba(139, 115, 85, 0.2);
                    transform: translateY(-1px) translateZ(0);
                }
                .product-item.selected {
                    background: rgba(139, 115, 85, 0.05);
                }
                .product-item .product-emoji { font-size: 1.8rem; margin-bottom: 6px; }
                .product-item .product-name { font-weight: 600; margin-bottom: 4px; font-size: 13px; }
                .product-item .product-price { color: #8B7355; font-weight: 500; font-size: 14px; }
                .product-item .product-options {
                    font-size: 10px; color: #666; margin-top: 4px; line-height: 1.2;
                }
                
                .success-message, .error-message, .info-message {
                    padding: 10px 16px; border-radius: 6px; margin: 12px 0;
                    display: flex; align-items: center; gap: 8px; font-size: 13px;
                }
                .success-message {
                    background: #d1fae5; border: 1px solid #a7f3d0; color: #065f46;
                }
                .error-message {
                    background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
                }
                .info-message {
                    background: #dbeafe; border: 1px solid #bfdbfe; color: #1d4ed8;
                }
                
                @media (max-width: 768px) {
                    .admin-modal-content { margin: 16px; max-width: calc(100vw - 32px); }
                    .admin-modal-body { padding: 16px; }
                    .form-row, .form-row-three { grid-template-columns: 1fr; }
                    .btn-group { flex-direction: column; }
                    .product-grid { grid-template-columns: 1fr; }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', modalStyles);
    }

    createModal(id, title, content, actions = []) {
        const cacheKey = `${id}-${title}`;
        if (this.modalCache.has(cacheKey)) {
            const modal = this.modalCache.get(cacheKey);
            modal.querySelector('.admin-modal-body').innerHTML = content + this.createActionsHTML(actions);
            return modal;
        }

        const existingModal = document.getElementById(id);
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.id = id;

        const actionsHTML = this.createActionsHTML(actions);

        modal.innerHTML = `
            <div class="admin-modal-content">
                <div class="admin-modal-header">
                    <div class="admin-modal-title">${title}</div>
                    <button class="admin-modal-close" data-close="${id}">×</button>
                </div>
                <div class="admin-modal-body">
                    ${content}
                    <div class="btn-group">
                        ${actionsHTML}
                        <button class="admin-btn-secondary" data-close="${id}">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        this.modalCache.set(cacheKey, modal);

        document.body.appendChild(modal);
        return modal;
    }

    createActionsHTML(actions) {
        return actions.map(action =>
            `<button class="${action.class}" onclick="${action.onclick}" ${action.disabled ? 'disabled' : ''}>${action.text}</button>`
        ).join('');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            this.currentModal = modalId;
            
            requestAnimationFrame(() => {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                setTimeout(() => {
                    const firstInput = modal.querySelector('input, textarea, select');
                    if (firstInput) firstInput.focus();
                }, 50);
            });
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(() => {
                modal.remove();
            }, 200);
        }
        this.currentModal = null;
        this.selectedProductId = null;
    }

    showAddProductModal() {
        const content = `
            <h3>Add New Product</h3>
            <p>Create a comprehensive product with all e-commerce features.</p>
            
            <div class="form-section">
                <div class="form-section-title">Basic Information</div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Product Name *</label>
                        <input type="text" id="product-name" placeholder="Enter product name" required>
                    </div>
                    <div class="form-group">
                        <label>Price *</label>
                        <input type="number" id="product-price" placeholder="0.00" step="0.01" min="0" required>
                    </div>
                </div>

                <div class="form-group">
                    <label>Description</label>
                    <textarea id="product-description" placeholder="Enter detailed product description" rows="3"></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Category</label>
                        <select id="product-category">
                            <option value="candles">Candles</option>
                            <option value="wax-melts">Wax Melts</option>
                            <option value="room-sprays">Room Sprays</option>
                            <option value="diffusers">Diffusers</option>
                            <option value="jewelry">Jewelry</option>
                            <option value="accessories">Accessories</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Emoji/Icon</label>
                        <input type="text" id="product-emoji" placeholder="🕯️" maxlength="4" value="🕯️">
                    </div>
                </div>
            </div>

            <div class="form-section">
                <div class="form-section-title">Product Options</div>
                
                <div class="form-group">
                    <label>Available Sizes</label>
                    <div class="dynamic-list" id="sizes-list">
                        <div class="dynamic-list-item">
                            <input type="text" value="Standard" placeholder="Size name">
                            <button onclick="this.parentNode.remove()">Remove</button>
                        </div>
                    </div>
                    <button class="add-item-btn" onclick="adminModals.addListItem('sizes-list', 'Size name')">+ Add Size</button>
                </div>

                <div class="form-group">
                    <label>Available Scents (optional)</label>
                    <div class="dynamic-list" id="scents-list"></div>
                    <button class="add-item-btn" onclick="adminModals.addListItem('scents-list', 'Scent name')">+ Add Scent</button>
                </div>

                <div class="form-group">
                    <label>Available Colors (optional)</label>
                    <div class="dynamic-list" id="colors-list"></div>
                    <button class="add-item-btn" onclick="adminModals.addListItem('colors-list', 'Color name')">+ Add Color</button>
                </div>
            </div>

            <div class="form-section">
                <div class="form-section-title">Product Settings</div>
                <div class="form-group">
                    <div class="checkbox-group">
                        <input type="checkbox" id="product-featured">
                        <label for="product-featured">Featured Product</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="product-in-stock" checked>
                        <label for="product-in-stock">In Stock</label>
                    </div>
                </div>
            </div>

            <div class="product-preview" id="product-preview">
                <h4>Live Preview</h4>
                <div class="preview-card">
                    <div class="preview-image" id="preview-image">🕯️</div>
                    <div class="preview-info">
                        <div class="preview-title" id="preview-title">Product Name</div>
                        <div class="preview-price" id="preview-price">$0.00</div>
                        <div class="preview-options" id="preview-options">Options will appear here</div>
                    </div>
                </div>
            </div>

            <div id="add-product-message"></div>
        `;

        const actions = [
            {
                text: 'Add Product',
                class: 'admin-btn-primary',
                onclick: 'adminModals.handleAddProduct()'
            }
        ];

        this.createModal('add-product-modal', '➕ Add New Product', content, actions);
        this.showModal('add-product-modal');
        
        this.setupProductPreview();
    }

    addListItem(listId, placeholder) {
        const list = document.getElementById(listId);
        if (!list) return;

        const item = document.createElement('div');
        item.className = 'dynamic-list-item';
        item.innerHTML = `
            <input type="text" value="" placeholder="${placeholder}">
            <button onclick="this.parentNode.remove(); adminModals.updatePreview()">Remove</button>
        `;
        
        list.appendChild(item);
        
        const input = item.querySelector('input');
        input.addEventListener('input', () => this.updatePreview());
        input.focus();
        
        this.updatePreview();
    }

    getListValues(listId) {
        const list = document.getElementById(listId);
        if (!list) return [];
        
        return Array.from(list.querySelectorAll('input'))
            .map(input => input.value.trim())
            .filter(value => value.length > 0);
    }

    setupProductPreview() {
        const inputs = ['product-name', 'product-price', 'product-emoji'];
        
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => this.updatePreview());
                input.addEventListener('change', () => this.updatePreview());
            }
        });

        ['sizes-list', 'scents-list', 'colors-list'].forEach(listId => {
            const list = document.getElementById(listId);
            if (list) {
                list.addEventListener('input', () => this.updatePreview());
            }
        });

        this.updatePreview();
    }

    updatePreview() {
        const name = document.getElementById('product-name')?.value.trim() || 'Product Name';
        const price = parseFloat(document.getElementById('product-price')?.value) || 0;
        const emoji = document.getElementById('product-emoji')?.value.trim() || '🕯️';

        const sizes = this.getListValues('sizes-list');
        const scents = this.getListValues('scents-list');
        const colors = this.getListValues('colors-list');

        const previewTitle = document.getElementById('preview-title');
        const previewPrice = document.getElementById('preview-price');
        const previewImage = document.getElementById('preview-image');
        const previewOptions = document.getElementById('preview-options');

        if (previewTitle) previewTitle.textContent = name;
        if (previewPrice) previewPrice.textContent = `${price.toFixed(2)}`;
        if (previewImage) previewImage.textContent = emoji;
        
        if (previewOptions) {
            let optionsText = '';
            if (sizes.length > 0) optionsText += `Sizes: ${sizes.join(', ')}\n`;
            if (scents.length > 0) optionsText += `Scents: ${scents.join(', ')}\n`;
            if (colors.length > 0) optionsText += `Colors: ${colors.join(', ')}`;
            previewOptions.textContent = optionsText || 'Standard options';
        }
    }

    async handleAddProduct() {
        const nameInput = document.getElementById('product-name');
        const priceInput = document.getElementById('product-price');
        const descriptionInput = document.getElementById('product-description');
        const categoryInput = document.getElementById('product-category');
        const emojiInput = document.getElementById('product-emoji');
        const featuredInput = document.getElementById('product-featured');
        const inStockInput = document.getElementById('product-in-stock');
        const messageDiv = document.getElementById('add-product-message');

        if (!nameInput || !priceInput || !messageDiv) {
            console.error('Required form elements not found');
            return;
        }

        const name = nameInput.value.trim();
        const price = parseFloat(priceInput.value);
        const description = descriptionInput?.value.trim() || '';
        const category = categoryInput?.value || 'candles';
        const emoji = emojiInput?.value.trim() || '🕯️';
        const featured = featuredInput?.checked || false;
        const inStock = inStockInput?.checked ?? true;

        const sizes = this.getListValues('sizes-list');
        const scents = this.getListValues('scents-list');
        const colors = this.getListValues('colors-list');

        if (!name) {
            this.showMessage(messageDiv, 'Please enter a product name', 'error');
            nameInput.focus();
            return;
        }

        if (!price || price <= 0) {
            this.showMessage(messageDiv, 'Please enter a valid price greater than $0.00', 'error');
            priceInput.focus();
            return;
        }

        if (sizes.length === 0) {
            sizes.push('Standard');
        }

        const productData = {
            id: this.generateProductId(name),
            name: name,
            price: price,
            description: description || `Premium ${category.replace('-', ' ')} with excellent quality and options.`,
            category: category,
            emoji: emoji,
            featured: featured,
            inStock: inStock,
            sizes: sizes,
            scents: scents,
            colors: colors,
            createdAt: new Date().toISOString(),
            createdBy: 'admin',
            imageUrl: null
        };

        try {
            this.showMessage(messageDiv, 'Adding product...', 'info');
            
            const addButton = document.querySelector('.admin-btn-primary');
            if (addButton) addButton.disabled = true;
            
            const success = await this.adminPanel.addProduct(productData);
            
            if (success) {
                this.showMessage(messageDiv, '✅ Product added successfully! Customers can now select sizes, scents, and colors.', 'success');
                this.clearAddProductForm();
                
                setTimeout(() => {
                    this.closeModal('add-product-modal');
                }, 2000);
                
            } else {
                this.showMessage(messageDiv, '❌ Failed to add product. Please try again.', 'error');
                if (addButton) addButton.disabled = false;
            }

        } catch (error) {
            console.error('Error adding product:', error);
            this.showMessage(messageDiv, '❌ An error occurred while adding the product. Please try again.', 'error');
            if (addButton) addButton.disabled = false;
        }
    }

    clearAddProductForm() {
        const inputs = ['product-name', 'product-price', 'product-description', 'product-emoji'];
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
        
        const checkboxes = ['product-featured', 'product-in-stock'];
        checkboxes.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.checked = id === 'product-in-stock';
            }
        });

        const categorySelect = document.getElementById('product-category');
        if (categorySelect) categorySelect.value = 'candles';

        const emojiInput = document.getElementById('product-emoji');
        if (emojiInput) emojiInput.value = '🕯️';

        ['sizes-list', 'scents-list', 'colors-list'].forEach(listId => {
            const list = document.getElementById(listId);
            if (list) {
                if (listId === 'sizes-list') {
                    list.innerHTML = `
                        <div class="dynamic-list-item">
                            <input type="text" value="Standard" placeholder="Size name">
                            <button onclick="this.parentNode.remove()">Remove</button>
                        </div>
                    `;
                } else {
                    list.innerHTML = '';
                }
            }
        });

        setTimeout(() => this.updatePreview(), 100);
    }

    showEditProductsModal() {
        const localProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
        
        if (localProducts.length === 0) {
            alert('No products found. Add some products first!');
            return;
        }

        const productsHTML = localProducts.map(product => `
            <div class="product-item" data-product-id="${product.id}">
                <div class="product-emoji">${product.emoji || '🕯️'}</div>
                <div class="product-name">${this.escapeHtml(product.name)}</div>
                <div class="product-price">${(product.price || 0).toFixed(2)}</div>
                <div class="product-category" style="font-size: 12px; color: #666; margin-top: 4px;">
                    ${this.formatCategory(product.category)}
                </div>
                <div class="product-options">
                    ${this.formatProductOptions(product)}
                </div>
            </div>
        `).join('');

        const content = `
            <h3>Manage Products</h3>
            <p>Click on a product to edit its details, options, and settings:</p>
            
            <div class="product-grid" id="product-selection-grid">
                ${productsHTML}
            </div>

            <div id="edit-form" style="display: none;">
                <h4>Edit Selected Product</h4>
                
                <div class="form-section">
                    <div class="form-section-title">Basic Information</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Product Name</label>
                            <input type="text" id="edit-product-name" required>
                        </div>
                        <div class="form-group">
                            <label>Price</label>
                            <input type="number" id="edit-product-price" step="0.01" min="0" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Description</label>
                        <textarea id="edit-product-description" rows="3"></textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Category</label>
                            <select id="edit-product-category">
                                <option value="candles">Candles</option>
                                <option value="wax-melts">Wax Melts</option>
                                <option value="room-sprays">Room Sprays</option>
                                <option value="diffusers">Diffusers</option>
                                <option value="jewelry">Jewelry</option>
                                <option value="accessories">Accessories</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Emoji/Icon</label>
                            <input type="text" id="edit-product-emoji" maxlength="4">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <div class="form-section-title">Product Options</div>
                    
                    <div class="form-group">
                        <label>Available Sizes</label>
                        <div class="dynamic-list" id="edit-sizes-list"></div>
                        <button class="add-item-btn" onclick="adminModals.addListItem('edit-sizes-list', 'Size name')">+ Add Size</button>
                    </div>

                    <div class="form-group">
                        <label>Available Scents</label>
                        <div class="dynamic-list" id="edit-scents-list"></div>
                        <button class="add-item-btn" onclick="adminModals.addListItem('edit-scents-list', 'Scent name')">+ Add Scent</button>
                    </div>

                    <div class="form-group">
                        <label>Available Colors</label>
                        <div class="dynamic-list" id="edit-colors-list"></div>
                        <button class="add-item-btn" onclick="adminModals.addListItem('edit-colors-list', 'Color name')">+ Add Color</button>
                    </div>
                </div>

                <div class="form-section">
                    <div class="form-section-title">Product Settings</div>
                    <div class="form-group">
                        <div class="checkbox-group">
                            <input type="checkbox" id="edit-product-featured">
                            <label for="edit-product-featured">Featured Product</label>
                        </div>
                        <div class="checkbox-group">
                            <input type="checkbox" id="edit-product-in-stock">
                            <label for="edit-product-in-stock">In Stock</label>
                        </div>
                    </div>
                </div>

                <div id="edit-product-message"></div>
            </div>
        `;

        const actions = [
            {
                text: 'Save Changes',
                class: 'admin-btn-primary',
                onclick: 'adminModals.handleSaveProduct()'
            },
            {
                text: 'Delete Product',
                class: 'admin-btn-danger',
                onclick: 'adminModals.handleDeleteProduct()'
            }
        ];

        this.createModal('edit-products-modal', '📝 Manage Products', content, actions);
        this.showModal('edit-products-modal');

        setTimeout(() => {
            document.querySelectorAll('.product-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.selectProduct(item.getAttribute('data-product-id'));
                });
            });
        }, 100);
    }

    formatProductOptions(product) {
        let options = [];
        if (product.sizes && product.sizes.length > 0) {
            options.push(`Sizes: ${product.sizes.length}`);
        }
        if (product.scents && product.scents.length > 0) {
            options.push(`Scents: ${product.scents.length}`);
        }
        if (product.colors && product.colors.length > 0) {
            options.push(`Colors: ${product.colors.length}`);
        }
        return options.join(', ') || 'Standard options';
    }

    populateList(listId, items) {
        const list = document.getElementById(listId);
        if (!list) return;

        list.innerHTML = '';
        
        if (items && items.length > 0) {
            items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'dynamic-list-item';
                div.innerHTML = `
                    <input type="text" value="${this.escapeHtml(item)}" placeholder="Item name">
                    <button onclick="this.parentNode.remove()">Remove</button>
                `;
                list.appendChild(div);
                
                const input = div.querySelector('input');
                input.addEventListener('input', () => this.updatePreview());
            });
        }
    }

    selectProduct(productId) {
        document.querySelectorAll('.product-item').forEach(item => {
            item.classList.remove('selected');
        });

        const selectedItem = document.querySelector(`[data-product-id="${productId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        const products = JSON.parse(localStorage.getItem('admin_products') || '[]');
        const product = products.find(p => p.id === productId);
        
        if (product) {
            document.getElementById('edit-product-name').value = product.name || '';
            document.getElementById('edit-product-price').value = product.price || '';
            document.getElementById('edit-product-description').value = product.description || '';
            document.getElementById('edit-product-category').value = product.category || 'candles';
            document.getElementById('edit-product-emoji').value = product.emoji || '🕯️';
            document.getElementById('edit-product-featured').checked = product.featured || false;
            document.getElementById('edit-product-in-stock').checked = product.inStock !== false;
            
            this.populateList('edit-sizes-list', product.sizes || ['Standard']);
            this.populateList('edit-scents-list', product.scents || []);
            this.populateList('edit-colors-list', product.colors || []);
        }

        const editForm = document.getElementById('edit-form');
        if (editForm) {
            editForm.style.display = 'block';
            editForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        this.selectedProductId = productId;
    }

    async handleSaveProduct() {
        if (!this.selectedProductId) {
            alert('Please select a product first');
            return;
        }

        const name = document.getElementById('edit-product-name').value.trim();
        const price = parseFloat(document.getElementById('edit-product-price').value);
        const description = document.getElementById('edit-product-description').value.trim();
        const category = document.getElementById('edit-product-category').value;
        const emoji = document.getElementById('edit-product-emoji').value.trim();
        const featured = document.getElementById('edit-product-featured').checked;
        const inStock = document.getElementById('edit-product-in-stock').checked;
        const messageDiv = document.getElementById('edit-product-message');

        const sizes = this.getListValues('edit-sizes-list');
        const scents = this.getListValues('edit-scents-list');
        const colors = this.getListValues('edit-colors-list');

        if (!name) {
            this.showMessage(messageDiv, 'Please enter a product name', 'error');
            return;
        }

        if (!price || price <= 0) {
            this.showMessage(messageDiv, 'Please enter a valid price', 'error');
            return;
        }

        if (sizes.length === 0) {
            sizes.push('Standard');
        }

        this.showMessage(messageDiv, 'Saving changes...', 'info');

        try {
            const updatedProduct = {
                name: name,
                price: price,
                description: description,
                category: category,
                emoji: emoji,
                featured: featured,
                inStock: inStock,
                sizes: sizes,
                scents: scents,
                colors: colors,
                updatedAt: new Date().toISOString()
            };

            const success = await this.adminPanel.updateProduct(this.selectedProductId, updatedProduct);

            if (success) {
                this.showMessage(messageDiv, '✅ Product updated successfully! All options are now available to customers.', 'success');

                setTimeout(() => {
                    this.closeModal('edit-products-modal');
                }, 2000);
            } else {
                this.showMessage(messageDiv, '❌ Failed to update product. Please try again.', 'error');
            }

        } catch (error) {
            console.error('Error updating product:', error);
            this.showMessage(messageDiv, '❌ Failed to update product. Please try again.', 'error');
        }
    }

    async handleDeleteProduct() {
        if (!this.selectedProductId) {
            alert('Please select a product first');
            return;
        }

        const products = JSON.parse(localStorage.getItem('admin_products') || '[]');
        const product = products.find(p => p.id === this.selectedProductId);
        
        if (!product) {
            alert('Product not found');
            return;
        }

        if (!confirm(`Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone.`)) {
            return;
        }

        const messageDiv = document.getElementById('edit-product-message');
        this.showMessage(messageDiv, 'Deleting product...', 'info');

        try {
            const success = await this.adminPanel.deleteProduct(this.selectedProductId);

            if (success) {
                this.showMessage(messageDiv, '✅ Product deleted successfully!', 'success');

                setTimeout(() => {
                    this.closeModal('edit-products-modal');
                }, 1500);
            } else {
                this.showMessage(messageDiv, '❌ Failed to delete product. Please try again.', 'error');
            }

        } catch (error) {
            console.error('Error deleting product:', error);
            this.showMessage(messageDiv, '❌ Failed to delete product. Please try again.', 'error');
        }
    }

    generateProductId(name) {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substr(2, 5);
        const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').substr(0, 10);
        return `${nameSlug}-${timestamp}-${randomStr}`;
    }

    formatCategory(category) {
        if (!category) return 'General';
        return category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(container, message, type) {
        if (!container) return;

        const className = type === 'error' ? 'error-message' : 
                         type === 'success' ? 'success-message' : 'info-message';
        
        const icon = type === 'error' ? '❌' : 
                    type === 'success' ? '✅' : 'ℹ️';
        
        container.innerHTML = `<div class="${className}">${icon} ${message}</div>`;
        
        if (type !== 'success') {
            setTimeout(() => {
                if (container.innerHTML.includes(message)) {
                    container.innerHTML = '';
                }
            }, 5000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const initializeModals = () => {
        if (window.adminPanel && window.adminPanel.isAdmin) {
            console.log('Initializing admin modals...');
            window.adminModals = new AdminModals(window.adminPanel);
            console.log('Admin modals initialized successfully');
            return true;
        }
        return false;
    };

    const maxAttempts = 8;
    let attempts = 0;

    const tryInit = () => {
        attempts++;
        
        try {
            if (initializeModals()) {
                return;
            }
        } catch (error) {
            console.error(`Admin modal initialization attempt ${attempts} failed:`, error);
        }
        
        if (attempts < maxAttempts) {
            const delay = Math.min(200 * Math.pow(1.3, attempts - 1), 3000);
            setTimeout(tryInit, delay);
        } else {
            console.warn('Admin modals failed to initialize after all attempts');
        }
    };

    tryInit();
});

window.addEventListener('load', () => {
    setTimeout(() => {
        if (!window.adminModals && window.adminPanel && window.adminPanel.isAdmin) {
            console.log('Trying admin modals initialization on window load...');
            try {
                window.adminModals = new AdminModals(window.adminPanel);
                console.log('Admin modals initialized on window load');
            } catch (error) {
                console.error('Window load initialization failed:', error);
            }
        }
    }, 1000);
});

window.initAdminModals = function() {
    if (window.adminPanel && window.adminPanel.isAdmin) {
        window.adminModals = new AdminModals(window.adminPanel);
        console.log('Admin modals manually initialized');
        return true;
    }
    console.log('Cannot initialize - admin panel not ready or not admin');
    return false;
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.adminModals && window.adminModals.currentModal) {
        window.adminModals.closeModal(window.adminModals.currentModal);
    }
});

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('admin-modal') && window.adminModals) {
        window.adminModals.closeModal(window.adminModals.currentModal);
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminModals;
}