// Optimized Admin Panel Modal Extensions
// File: public/script/admin-modals.js

class AdminModals {
    constructor(adminPanel) {
        this.adminPanel = adminPanel;
        this.currentModal = null;
        this.selectedProductId = null;
        this.setupModalStyles();
        console.log('Admin Modals initialized');
    }

    setupModalStyles() {
        // Prevent duplicate styles
        if (document.getElementById('admin-modal-styles')) return;

        const modalStyles = `
            <style id="admin-modal-styles">
                .admin-modal {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px);
                    z-index: 10001; display: flex; align-items: center; justify-content: center;
                    opacity: 0; visibility: hidden; transition: all 0.3s ease;
                }
                .admin-modal.active { opacity: 1; visibility: visible; }
                .admin-modal-content {
                    background: linear-gradient(135deg, #ffffff 0%, #f8f6f3 100%);
                    border-radius: 16px; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                    max-width: 90vw; max-height: 90vh; overflow-y: auto; position: relative;
                    transform: translateY(50px); transition: transform 0.3s ease;
                }
                .admin-modal.active .admin-modal-content { transform: translateY(0); }
                .admin-modal-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 24px 30px; background: linear-gradient(135deg, #8B7355 0%, #6d5a42 100%);
                    border-radius: 16px 16px 0 0; color: white;
                }
                .admin-modal-title {
                    font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 10px;
                }
                .admin-modal-close {
                    background: rgba(255, 255, 255, 0.2); border: none; color: white;
                    width: 32px; height: 32px; border-radius: 8px; cursor: pointer;
                    font-size: 18px; transition: background 0.2s ease;
                }
                .admin-modal-close:hover { background: rgba(255, 255, 255, 0.3); }
                .admin-modal-body { padding: 30px; }
                .form-group { margin-bottom: 20px; }
                .form-group label {
                    display: block; font-weight: 600; color: #2c2c2c; margin-bottom: 8px;
                    font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;
                }
                .form-group input, .form-group textarea, .form-group select {
                    width: 100%; padding: 12px 16px; border: 2px solid #e8e8e8;
                    border-radius: 8px; font-size: 14px; transition: border-color 0.3s ease;
                    font-family: 'Inter', sans-serif; box-sizing: border-box;
                }
                .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
                    outline: none; border-color: #8B7355; box-shadow: 0 0 0 3px rgba(139, 115, 85, 0.1);
                }
                .form-group textarea { min-height: 80px; resize: vertical; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .checkbox-group {
                    display: flex; align-items: center; gap: 8px; margin-top: 8px;
                }
                .checkbox-group input[type="checkbox"] { width: auto; margin: 0; }
                .btn-group {
                    display: flex; gap: 12px; justify-content: flex-end; margin-top: 30px;
                    padding-top: 20px; border-top: 1px solid #e8e8e8;
                }
                .admin-btn-primary, .admin-btn-secondary, .admin-btn-danger {
                    padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;
                    cursor: pointer; transition: all 0.3s ease; border: none;
                    text-transform: uppercase; letter-spacing: 0.5px;
                }
                .admin-btn-primary {
                    background: linear-gradient(135deg, #8B7355 0%, #6d5a42 100%); color: white;
                }
                .admin-btn-primary:hover {
                    transform: translateY(-2px); box-shadow: 0 8px 20px rgba(139, 115, 85, 0.3);
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
                    background: #c82333; transform: translateY(-2px);
                }
                .product-preview {
                    background: white; border: 1px solid #e8e8e8; border-radius: 12px;
                    padding: 20px; margin: 20px 0; text-align: center;
                }
                .product-preview h4 { margin-bottom: 15px; color: #8B7355; }
                .preview-card {
                    max-width: 250px; margin: 0 auto; background: white;
                    border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
                .preview-image {
                    width: 100%; height: 150px; background: linear-gradient(45deg, #f8f6f3, #e8e6e0);
                    display: flex; align-items: center; justify-content: center; font-size: 3rem;
                }
                .preview-info { padding: 15px; }
                .preview-title { font-weight: 600; margin-bottom: 5px; color: #2c2c2c; }
                .preview-price { color: #8B7355; font-weight: 500; }
                .success-message, .error-message, .info-message {
                    padding: 12px 20px; border-radius: 8px; margin: 15px 0;
                    display: flex; align-items: center; gap: 10px;
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
                .product-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 15px; margin: 20px 0;
                }
                .product-item {
                    background: white; border: 2px solid #e8e8e8; border-radius: 8px;
                    padding: 15px; cursor: pointer; transition: all 0.3s ease; text-align: center;
                }
                .product-item:hover, .product-item.selected {
                    border-color: #8B7355; box-shadow: 0 4px 15px rgba(139, 115, 85, 0.2);
                    transform: translateY(-2px);
                }
                .product-item.selected {
                    background: rgba(139, 115, 85, 0.05);
                }
                .product-item .product-emoji { font-size: 2rem; margin-bottom: 8px; }
                .product-item .product-name { font-weight: 600; margin-bottom: 5px; }
                .product-item .product-price { color: #8B7355; font-weight: 500; }
                #edit-form { 
                    background: #f8f6f3; border-radius: 8px; padding: 20px; margin-top: 20px; 
                }
                #edit-form h4 { margin-top: 0; color: #8B7355; }
                @media (max-width: 768px) {
                    .admin-modal-content { margin: 20px; max-width: calc(100vw - 40px); }
                    .admin-modal-body { padding: 20px; }
                    .form-row { grid-template-columns: 1fr; }
                    .btn-group { flex-direction: column; }
                    .product-grid { grid-template-columns: 1fr; }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', modalStyles);
    }

    createModal(id, title, content, actions = []) {
        // Remove existing modal with same ID
        const existingModal = document.getElementById(id);
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.id = id;

        const actionsHTML = actions.map(action =>
            `<button class="${action.class}" onclick="${action.onclick}" ${action.disabled ? 'disabled' : ''}>${action.text}</button>`
        ).join('');

        modal.innerHTML = `
            <div class="admin-modal-content">
                <div class="admin-modal-header">
                    <div class="admin-modal-title">${title}</div>
                    <button class="admin-modal-close" onclick="adminModals.closeModal('${id}')">×</button>
                </div>
                <div class="admin-modal-body">
                    ${content}
                    <div class="btn-group">
                        ${actionsHTML}
                        <button class="admin-btn-secondary" onclick="adminModals.closeModal('${id}')">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        return modal;
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            this.currentModal = modalId;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus first input if available
            setTimeout(() => {
                const firstInput = modal.querySelector('input, textarea, select');
                if (firstInput) firstInput.focus();
            }, 100);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
        this.currentModal = null;
        this.selectedProductId = null;
    }

    showAddProductModal() {
        const content = `
            <h3>Add New Product</h3>
            <p>Fill out the form below to add a new product to your store.</p>
            
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
                <textarea id="product-description" placeholder="Enter product description" rows="3"></textarea>
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

            <div class="product-preview" id="product-preview">
                <h4>Live Preview</h4>
                <div class="preview-card">
                    <div class="preview-image" id="preview-image">🕯️</div>
                    <div class="preview-info">
                        <div class="preview-title" id="preview-title">Product Name</div>
                        <div class="preview-price" id="preview-price">$0.00</div>
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
        
        // Setup live preview and validation
        this.setupProductPreview();
    }

    setupProductPreview() {
        const nameInput = document.getElementById('product-name');
        const priceInput = document.getElementById('product-price');
        const emojiInput = document.getElementById('product-emoji');

        if (!nameInput || !priceInput || !emojiInput) return;

        const updatePreview = () => {
            const name = nameInput.value.trim() || 'Product Name';
            const price = parseFloat(priceInput.value) || 0;
            const emoji = emojiInput.value.trim() || '🕯️';

            const previewTitle = document.getElementById('preview-title');
            const previewPrice = document.getElementById('preview-price');
            const previewImage = document.getElementById('preview-image');

            if (previewTitle) previewTitle.textContent = name;
            if (previewPrice) previewPrice.textContent = `$${price.toFixed(2)}`;
            if (previewImage) previewImage.textContent = emoji;
        };

        // Add event listeners with error handling
        [nameInput, priceInput, emojiInput].forEach(input => {
            if (input) {
                input.addEventListener('input', updatePreview);
                input.addEventListener('change', updatePreview);
            }
        });

        // Initial preview update
        updatePreview();
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

        // Validation
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

        // Create product object
        const productData = {
            id: this.generateProductId(name),
            name: name,
            price: price,
            description: description || `Premium ${category.replace('-', ' ')} with excellent quality and fragrance.`,
            category: category,
            emoji: emoji,
            featured: featured,
            inStock: inStock,
            createdAt: new Date().toISOString(),
            createdBy: 'admin',
            imageUrl: null // Can be enhanced later for image uploads
        };

        try {
            // Show processing state
            this.showMessage(messageDiv, 'Adding product...', 'info');
            
            // Disable the add button to prevent double-clicks
            const addButton = document.querySelector('.admin-btn-primary');
            if (addButton) addButton.disabled = true;
            
            // Add product using the admin panel's method
            const success = await this.adminPanel.addProduct(productData);
            
            if (success) {
                this.showMessage(messageDiv, '✅ Product added successfully! It will appear on your site immediately.', 'success');
                
                // Clear form
                this.clearAddProductForm();
                
                // Close modal after success
                setTimeout(() => {
                    this.closeModal('add-product-modal');
                }, 1500);
                
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
                element.checked = id === 'product-in-stock'; // Default in-stock to true
            }
        });

        const categorySelect = document.getElementById('product-category');
        if (categorySelect) categorySelect.value = 'candles';

        // Reset emoji to default
        const emojiInput = document.getElementById('product-emoji');
        if (emojiInput) emojiInput.value = '🕯️';

        // Update preview
        setTimeout(() => {
            const previewTitle = document.getElementById('preview-title');
            const previewPrice = document.getElementById('preview-price');
            const previewImage = document.getElementById('preview-image');

            if (previewTitle) previewTitle.textContent = 'Product Name';
            if (previewPrice) previewPrice.textContent = '$0.00';
            if (previewImage) previewImage.textContent = '🕯️';
        }, 100);
    }

    showEditProductsModal() {
        // Get all products from localStorage
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
            </div>
        `).join('');

        const content = `
            <h3>Manage Products</h3>
            <p>Click on a product to edit or delete it:</p>
            
            <div class="product-grid" id="product-selection-grid">
                ${productsHTML}
            </div>

            <div id="edit-form" style="display: none;">
                <h4>Edit Selected Product</h4>
                
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

        // Add click handlers to product items
        setTimeout(() => {
            document.querySelectorAll('.product-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.selectProduct(item.getAttribute('data-product-id'));
                });
            });
        }, 100);
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
        }

        // Show edit form
        const editForm = document.getElementById('edit-form');
        if (editForm) {
            editForm.style.display = 'block';
            // Scroll to form
            editForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        // Store selected product ID
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

        // Validation
        if (!name) {
            this.showMessage(messageDiv, 'Please enter a product name', 'error');
            return;
        }

        if (!price || price <= 0) {
            this.showMessage(messageDiv, 'Please enter a valid price', 'error');
            return;
        }

        const products = JSON.parse(localStorage.getItem('admin_products') || '[]');
        const productIndex = products.findIndex(p => p.id === this.selectedProductId);
        
        if (productIndex === -1) {
            this.showMessage(messageDiv, 'Product not found', 'error');
            return;
        }

        // Show processing state
        this.showMessage(messageDiv, 'Saving changes...', 'info');

        try {
            // Update product
            products[productIndex] = {
                ...products[productIndex],
                name: name,
                price: price,
                description: description,
                category: category,
                emoji: emoji,
                featured: featured,
                inStock: inStock,
                updatedAt: new Date().toISOString()
            };

            // Save to localStorage
            localStorage.setItem('admin_products', JSON.stringify(products));

            // Try to save to server if available
            if (this.adminPanel.apiBaseUrl) {
                try {
                    await fetch(`${this.adminPanel.apiBaseUrl}/api/products/${this.selectedProductId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(products[productIndex])
                    });
                    console.log('Product also updated on server');
                } catch (serverError) {
                    console.warn('Server update failed, but local update succeeded');
                }
            }

            // Reload products on page
            await this.adminPanel.loadProductsForAllUsers();

            // Update admin panel counters
            this.adminPanel.updateAdminPanelInfo();

            this.showMessage(messageDiv, '✅ Product updated successfully!', 'success');

            setTimeout(() => {
                this.closeModal('edit-products-modal');
            }, 1500);

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
            // Remove from localStorage
            const updatedProducts = products.filter(p => p.id !== this.selectedProductId);
            localStorage.setItem('admin_products', JSON.stringify(updatedProducts));

            // Try to delete from server if available
            if (this.adminPanel.apiBaseUrl) {
                try {
                    await fetch(`${this.adminPanel.apiBaseUrl}/api/products/${this.selectedProductId}`, {
                        method: 'DELETE'
                    });
                    console.log('Product also deleted from server');
                } catch (serverError) {
                    console.warn('Server delete failed, but local delete succeeded');
                }
            }

            // Reload products on page
            await this.adminPanel.loadProductsForAllUsers();

            // Update admin panel counters
            this.adminPanel.updateAdminPanelInfo();

            this.showMessage(messageDiv, '✅ Product deleted successfully!', 'success');

            setTimeout(() => {
                this.closeModal('edit-products-modal');
            }, 1500);

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
        
        // Auto-clear non-success messages after 5 seconds
        if (type !== 'success') {
            setTimeout(() => {
                if (container.innerHTML.includes(message)) {
                    container.innerHTML = '';
                }
            }, 5000);
        }
    }
}

// Initialize admin modals when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for admin panel to be ready
    const initializeModals = () => {
        if (window.adminPanel && window.adminPanel.isAdmin) {
            console.log('Initializing admin modals...');
            window.adminModals = new AdminModals(window.adminPanel);

            // Override admin panel modal methods
            window.adminPanel.showAddProductModal = () => window.adminModals.showAddProductModal();
            window.adminPanel.showEditProductsModal = () => window.adminModals.showEditProductsModal();

            console.log('Admin modals initialized successfully');
            return true;
        }
        return false;
    };

    // Try multiple times with increasing delays
    const maxAttempts = 5;
    let attempts = 0;

    const tryInit = () => {
        attempts++;
        if (initializeModals()) {
            return; // Success
        }
        
        if (attempts < maxAttempts) {
            setTimeout(tryInit, attempts * 1000); // 1s, 2s, 3s, 4s delays
        } else {
            console.warn('Admin modals failed to initialize - admin panel may not be ready');
        }
    };

    // Start initialization attempts
    setTimeout(tryInit, 500); // Initial delay to let admin panel load
});

// Handle modal closing on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.adminModals && window.adminModals.currentModal) {
        window.adminModals.closeModal(window.adminModals.currentModal);
    }
});

// Handle modal closing on backdrop click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('admin-modal') && window.adminModals) {
        window.adminModals.closeModal(window.adminModals.currentModal);
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminModals;
}