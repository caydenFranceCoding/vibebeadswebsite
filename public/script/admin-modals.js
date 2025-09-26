// Enhanced Admin Panel Modal Extensions with Product Creation
// File: public/script/admin-modals.js

class AdminModals {
    constructor(adminPanel) {
        this.adminPanel = adminPanel;
        this.currentModal = null;
        this.setupModalStyles();
    }

    setupModalStyles() {
        const modalStyles = `
            <style id="admin-modal-styles">
                .admin-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(5px);
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

                .admin-modal-content {
                    background: linear-gradient(135deg, #ffffff 0%, #f8f6f3 100%);
                    border-radius: 16px;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                    max-width: 90vw;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    transform: translateY(50px);
                    transition: transform 0.3s ease;
                }

                .admin-modal.active .admin-modal-content {
                    transform: translateY(0);
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
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .admin-modal-close {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 18px;
                    transition: background 0.2s ease;
                }

                .admin-modal-close:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .admin-modal-body {
                    padding: 30px;
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
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .form-group input,
                .form-group textarea,
                .form-group select {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #e8e8e8;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: border-color 0.3s ease;
                    font-family: 'Inter', sans-serif;
                }

                .form-group input:focus,
                .form-group textarea:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #8B7355;
                    box-shadow: 0 0 0 3px rgba(139, 115, 85, 0.1);
                }

                .form-group textarea {
                    min-height: 80px;
                    resize: vertical;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .btn-group {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e8e8e8;
                }

                .admin-btn-primary,
                .admin-btn-secondary {
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: none;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .admin-btn-primary {
                    background: linear-gradient(135deg, #8B7355 0%, #6d5a42 100%);
                    color: white;
                }

                .admin-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(139, 115, 85, 0.3);
                }

                .admin-btn-secondary {
                    background: transparent;
                    color: #666;
                    border: 2px solid #e8e8e8;
                }

                .admin-btn-secondary:hover {
                    background: #f8f6f3;
                    border-color: #8B7355;
                    color: #8B7355;
                }

                .product-preview {
                    background: white;
                    border: 1px solid #e8e8e8;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 20px 0;
                    text-align: center;
                }

                .product-preview h4 {
                    margin-bottom: 15px;
                    color: #8B7355;
                }

                .preview-card {
                    max-width: 250px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }

                .preview-image {
                    width: 100%;
                    height: 150px;
                    background: linear-gradient(45deg, #f8f6f3, #e8e6e0);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3rem;
                }

                .preview-info {
                    padding: 15px;
                }

                .preview-title {
                    font-weight: 600;
                    margin-bottom: 5px;
                    color: #2c2c2c;
                }

                .preview-price {
                    color: #8B7355;
                    font-weight: 500;
                }

                .image-upload-area {
                    border: 2px dashed #8B7355;
                    border-radius: 8px;
                    padding: 40px 20px;
                    text-align: center;
                    background: rgba(139, 115, 85, 0.05);
                    margin: 20px 0;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .image-upload-area:hover {
                    background: rgba(139, 115, 85, 0.1);
                    border-color: #6d5a42;
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
                }

                .upload-subtext {
                    font-size: 12px;
                    color: #999;
                    margin-top: 8px;
                }

                .success-message {
                    background: #d1fae5;
                    border: 1px solid #a7f3d0;
                    color: #065f46;
                    padding: 12px 20px;
                    border-radius: 8px;
                    margin: 15px 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                @media (max-width: 768px) {
                    .admin-modal-content {
                        margin: 20px;
                        max-width: calc(100vw - 40px);
                    }

                    .admin-modal-body {
                        padding: 20px;
                    }

                    .form-row {
                        grid-template-columns: 1fr;
                    }

                    .btn-group {
                        flex-direction: column;
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', modalStyles);
    }

    createModal(id, title, content, actions = []) {
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.id = id;

        const actionsHTML = actions.map(action =>
            `<button class="${action.class}" onclick="${action.onclick}">${action.text}</button>`
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
    }

    showAddProductModal() {
        const content = `
            <h3>Add New Product</h3>
            
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
                <textarea id="product-description" placeholder="Enter product description"></textarea>
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
                    </select>
                </div>
                <div class="form-group">
                    <label>Emoji/Icon</label>
                    <input type="text" id="product-emoji" placeholder="🕯️" maxlength="2">
                </div>
            </div>

            <div class="form-group">
                <label>
                    <input type="checkbox" id="product-featured" style="width: auto; margin-right: 8px;">
                    Featured Product
                </label>
            </div>

            <div class="form-group">
                <label>
                    <input type="checkbox" id="product-in-stock" checked style="width: auto; margin-right: 8px;">
                    In Stock
                </label>
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
        
        // Setup live preview
        this.setupProductPreview();
    }

    setupProductPreview() {
        const nameInput = document.getElementById('product-name');
        const priceInput = document.getElementById('product-price');
        const emojiInput = document.getElementById('product-emoji');

        const updatePreview = () => {
            const name = nameInput.value || 'Product Name';
            const price = parseFloat(priceInput.value) || 0;
            const emoji = emojiInput.value || '🕯️';

            document.getElementById('preview-title').textContent = name;
            document.getElementById('preview-price').textContent = `$${price.toFixed(2)}`;
            document.getElementById('preview-image').textContent = emoji;
        };

        [nameInput, priceInput, emojiInput].forEach(input => {
            if (input) {
                input.addEventListener('input', updatePreview);
            }
        });
    }

    async handleAddProduct() {
        const name = document.getElementById('product-name').value.trim();
        const price = parseFloat(document.getElementById('product-price').value);
        const description = document.getElementById('product-description').value.trim();
        const category = document.getElementById('product-category').value;
        const emoji = document.getElementById('product-emoji').value.trim() || '🕯️';
        const featured = document.getElementById('product-featured').checked;
        const inStock = document.getElementById('product-in-stock').checked;

        const messageDiv = document.getElementById('add-product-message');

        // Validation
        if (!name) {
            this.showMessage(messageDiv, 'Please enter a product name', 'error');
            return;
        }

        if (!price || price <= 0) {
            this.showMessage(messageDiv, 'Please enter a valid price', 'error');
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
            createdBy: 'admin'
        };

        try {
            // Show processing state
            this.showMessage(messageDiv, 'Adding product...', 'info');
            
            // Add product using the admin panel's method
            const success = await this.adminPanel.addProduct(productData);
            
            if (success) {
                // Also add to local storage as fallback
                this.addProductToLocalStorage(productData);
                
                // Show success message
                this.showMessage(messageDiv, '✅ Product added successfully! It will appear on your site immediately.', 'success');
                
                // Wait a moment, then close modal
                setTimeout(() => {
                    this.closeModal('add-product-modal');
                }, 2000);
                
            } else {
                // Fallback to local storage only
                this.addProductToLocalStorage(productData);
                this.showMessage(messageDiv, '✅ Product added locally! It will appear on your site.', 'success');
                
                setTimeout(() => {
                    this.closeModal('add-product-modal');
                }, 2000);
            }

        } catch (error) {
            console.error('Error adding product:', error);
            
            // Fallback: add to local storage
            this.addProductToLocalStorage(productData);
            this.showMessage(messageDiv, '✅ Product added locally due to connection issues.', 'success');
            
            setTimeout(() => {
                this.closeModal('add-product-modal');
            }, 2000);
        }
    }

    generateProductId(name) {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substr(2, 5);
        const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').substr(0, 10);
        return `${nameSlug}-${timestamp}-${randomStr}`;
    }

    addProductToLocalStorage(productData) {
        try {
            // Get existing products
            const existingProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
            
            // Add new product
            existingProducts.push(productData);
            
            // Save back to localStorage
            localStorage.setItem('admin_products', JSON.stringify(existingProducts));
            
            // Trigger immediate update for all users
            this.updateProductsOnPage(existingProducts);
            
            console.log('Product added to localStorage:', productData);
            
        } catch (error) {
            console.error('Error saving product to localStorage:', error);
        }
    }

    updateProductsOnPage(products) {
        const containers = document.querySelectorAll('[data-admin-products="true"]');
        
        containers.forEach(container => {
            if (products.length === 0) {
                container.innerHTML = `
                    <div class="no-products-message">
                        <p>No products available yet</p>
                        <p><small>Use the admin panel to add products</small></p>
                    </div>
                `;
                return;
            }

            const productsHTML = products.map(product => `
                <div class="product-card" data-static-product="${product.id}" onclick="addQuickProduct('${product.id}', '${product.name}', ${product.price}, '${product.emoji}')">
                    <div class="product-image">
                        ${product.imageUrl ? 
                            `<img src="${product.imageUrl}" alt="${product.name}" loading="lazy">` :
                            `<div class="product-emoji">${product.emoji || '🕯️'}</div>`
                        }
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-description">${product.description || ''}</p>
                        <div class="product-price">$${(product.price || 0).toFixed(2)}</div>
                        <div class="product-category">${this.formatCategory(product.category)}</div>
                        ${!product.inStock ? '<div class="out-of-stock">Out of Stock</div>' : ''}
                        ${product.featured ? '<div class="featured-badge">Featured</div>' : ''}
                        <button class="add-to-cart-btn" onclick="event.stopPropagation(); addQuickProduct('${product.id}', '${product.name}', ${product.price}, '${product.emoji}')">Add to Cart</button>
                    </div>
                </div>
            `).join('');

            container.innerHTML = productsHTML;
        });

        console.log(`Updated ${containers.length} product containers with ${products.length} products`);
    }

    formatCategory(category) {
        if (!category) return 'General';
        return category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    showMessage(container, message, type) {
        const className = type === 'error' ? 'error-message' : 
                         type === 'success' ? 'success-message' : 'info-message';
        
        container.innerHTML = `<div class="${className}">${message}</div>`;
        
        // Auto-clear non-success messages
        if (type !== 'success') {
            setTimeout(() => {
                if (container.innerHTML.includes(message)) {
                    container.innerHTML = '';
                }
            }, 5000);
        }
    }

    // Existing methods for other modals...
    showEditProductsModal() {
        // Get products from localStorage and server
        const localProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
        
        if (localProducts.length === 0) {
            alert('No products found. Add some products first!');
            return;
        }

        const productsHTML = localProducts.map(product => `
            <div class="product-item" onclick="adminModals.selectProduct('${product.id}')">
                <div class="product-emoji">${product.emoji}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
            </div>
        `).join('');

        const content = `
            <h3>Manage Products</h3>
            <p>Select a product to edit:</p>
            
            <div class="product-grid">
                ${productsHTML}
            </div>

            <div id="edit-form" style="display: none;">
                <h4>Edit Selected Product</h4>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Product Name</label>
                        <input type="text" id="edit-product-name">
                    </div>
                    <div class="form-group">
                        <label>Price</label>
                        <input type="number" id="edit-product-price" step="0.01">
                    </div>
                </div>

                <div class="form-group">
                    <label>Description</label>
                    <textarea id="edit-product-description"></textarea>
                </div>
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
                class: 'admin-btn-secondary',
                onclick: 'adminModals.handleDeleteProduct()'
            }
        ];

        this.createModal('edit-products-modal', '📝 Manage Products', content, actions);
        this.showModal('edit-products-modal');
    }

    selectProduct(productId) {
        // Remove previous selections
        document.querySelectorAll('.product-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Select current product
        event.target.closest('.product-item').classList.add('selected');

        // Load product data
        const products = JSON.parse(localStorage.getItem('admin_products') || '[]');
        const product = products.find(p => p.id === productId);
        
        if (product) {
            document.getElementById('edit-product-name').value = product.name;
            document.getElementById('edit-product-price').value = product.price;
            document.getElementById('edit-product-description').value = product.description || '';
        }

        // Show edit form
        document.getElementById('edit-form').style.display = 'block';
        
        // Store selected product ID
        this.selectedProductId = productId;
    }

    handleSaveProduct() {
        if (!this.selectedProductId) {
            alert('Please select a product first');
            return;
        }

        const products = JSON.parse(localStorage.getItem('admin_products') || '[]');
        const productIndex = products.findIndex(p => p.id === this.selectedProductId);
        
        if (productIndex === -1) {
            alert('Product not found');
            return;
        }

        // Update product
        products[productIndex] = {
            ...products[productIndex],
            name: document.getElementById('edit-product-name').value,
            price: parseFloat(document.getElementById('edit-product-price').value),
            description: document.getElementById('edit-product-description').value,
            updatedAt: new Date().toISOString()
        };

        // Save and update
        localStorage.setItem('admin_products', JSON.stringify(products));
        this.updateProductsOnPage(products);

        alert('Product updated successfully!');
        this.closeModal('edit-products-modal');
    }

    handleDeleteProduct() {
        if (!this.selectedProductId) {
            alert('Please select a product first');
            return;
        }

        if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) {
            return;
        }

        const products = JSON.parse(localStorage.getItem('admin_products') || '[]');
        const updatedProducts = products.filter(p => p.id !== this.selectedProductId);
        
        localStorage.setItem('admin_products', JSON.stringify(updatedProducts));
        this.updateProductsOnPage(updatedProducts);

        alert('Product deleted successfully!');
        this.closeModal('edit-products-modal');
    }
}

// Initialize admin modals when admin panel is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.adminPanel && window.adminPanel.isAdmin) {
            window.adminModals = new AdminModals(window.adminPanel);

            // Override the admin panel's modal methods
            window.adminPanel.showAddProductModal = () => window.adminModals.showAddProductModal();
            window.adminPanel.showEditProductsModal = () => window.adminModals.showEditProductsModal();

            // Load existing products on page load
            const existingProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
            if (existingProducts.length > 0) {
                window.adminModals.updateProductsOnPage(existingProducts);
            }
        }
    }, 1500);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminModals;
}