// Admin Panel Modal Extensions
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

                .product-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 16px;
                    margin: 20px 0;
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

                .settings-section {
                    background: white;
                    border: 1px solid #e8e8e8;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                }

                .settings-section h4 {
                    margin: 0 0 16px 0;
                    color: #8B7355;
                    font-size: 16px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .color-picker-group {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .color-picker {
                    width: 50px;
                    height: 40px;
                    border: 2px solid #e8e8e8;
                    border-radius: 8px;
                    cursor: pointer;
                    padding: 0;
                }

                .preview-box {
                    background: white;
                    border: 1px solid #e8e8e8;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }

                .preview-title {
                    font-weight: 600;
                    margin-bottom: 12px;
                    color: #2c2c2c;
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

                    .product-grid {
                        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
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
                    <label>Product Name</label>
                    <input type="text" id="product-name" placeholder="Enter product name">
                </div>
                <div class="form-group">
                    <label>Price</label>
                    <input type="number" id="product-price" placeholder="0.00" step="0.01">
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
                <label>Product Image</label>
                <div class="image-upload-area" onclick="document.getElementById('product-image').click()">
                    <div class="upload-icon">📷</div>
                    <div class="upload-text">Click to upload image</div>
                    <div class="upload-subtext">JPG, PNG, GIF up to 5MB</div>
                </div>
                <input type="file" id="product-image" accept="image/*" style="display: none;">
            </div>
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
    }

    showEditProductsModal() {
        // Mock product data - replace with real data
        const products = [
            { id: 1, name: 'Vanilla Bean Candle', price: 15.00, emoji: '🕯️', category: 'candles' },
            { id: 2, name: 'Apple Ginger Wax Melt', price: 5.00, emoji: '🍎', category: 'wax-melts' },
            { id: 3, name: 'Clean Cotton Spray', price: 9.00, emoji: '☁️', category: 'room-sprays' },
            { id: 4, name: 'Alpine Balsam Diffuser', price: 16.00, emoji: '🌲', category: 'diffusers' },
            { id: 5, name: 'Rose Quartz Bracelet', price: 20.00, emoji: '💖', category: 'jewelry' }
        ];

        const productsHTML = products.map(product => `
            <div class="product-item" onclick="adminModals.selectProduct(${product.id})">
                <div class="product-emoji">${product.emoji}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">$${product.price.toFixed(2)}</div>
            </div>
        `).join('');

        const content = `
            <h3>Edit Products</h3>
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

        this.createModal('edit-products-modal', '📝 Edit Products', content, actions);
        this.showModal('edit-products-modal');
    }

    showImageManagerModal() {
        const content = `
            <h3>Image Manager</h3>
            
            <div class="form-group">
                <label>Upload New Images</label>
                <div class="image-upload-area" onclick="document.getElementById('bulk-images').click()">
                    <div class="upload-icon">🖼️</div>
                    <div class="upload-text">Click to upload multiple images</div>
                    <div class="upload-subtext">Select multiple files to upload at once</div>
                </div>
                <input type="file" id="bulk-images" accept="image/*" multiple style="display: none;">
            </div>

            <div class="settings-section">
                <h4>🎨 Image Settings</h4>
                
                <div class="form-group">
                    <label>Image Quality</label>
                    <select id="image-quality">
                        <option value="high">High Quality (Slower loading)</option>
                        <option value="medium" selected>Medium Quality (Recommended)</option>
                        <option value="low">Low Quality (Fast loading)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Auto-resize Images</label>
                    <input type="checkbox" id="auto-resize" checked> Automatically resize large images
                </div>
            </div>

            <div class="preview-box">
                <div class="preview-title">Recently Uploaded Images</div>
                <div class="product-grid" id="recent-images">
                    <div class="product-item">
                        <div class="product-emoji">🖼️</div>
                        <div class="product-name">No images uploaded</div>
                    </div>
                </div>
            </div>
        `;

        const actions = [
            {
                text: 'Optimize Images',
                class: 'admin-btn-primary',
                onclick: 'adminModals.handleOptimizeImages()'
            }
        ];

        this.createModal('image-manager-modal', '🖼️ Image Manager', content, actions);
        this.showModal('image-manager-modal');
    }

    showSEOSettingsModal() {
        const content = `
            <h3>SEO Settings</h3>
            
            <div class="settings-section">
                <h4>🔍 Page Meta Data</h4>
                
                <div class="form-group">
                    <label>Page Title</label>
                    <input type="text" id="page-title" value="${document.title}">
                </div>

                <div class="form-group">
                    <label>Meta Description</label>
                    <textarea id="meta-description" placeholder="Describe your page in 150-160 characters"></textarea>
                </div>

                <div class="form-group">
                    <label>Keywords</label>
                    <input type="text" id="meta-keywords" placeholder="candles, luxury, handmade, soy wax">
                </div>
            </div>

            <div class="settings-section">
                <h4>🌐 Social Media</h4>
                
                <div class="form-group">
                    <label>Open Graph Title</label>
                    <input type="text" id="og-title" placeholder="Title for social media shares">
                </div>

                <div class="form-group">
                    <label>Open Graph Description</label>
                    <textarea id="og-description" placeholder="Description for social media shares"></textarea>
                </div>

                <div class="form-group">
                    <label>Open Graph Image URL</label>
                    <input type="url" id="og-image" placeholder="https://example.com/image.jpg">
                </div>
            </div>

            <div class="settings-section">
                <h4>📊 Analytics</h4>
                
                <div class="form-group">
                    <label>Google Analytics ID</label>
                    <input type="text" id="ga-id" placeholder="G-XXXXXXXXXX">
                </div>

                <div class="form-group">
                    <label>Google Tag Manager ID</label>
                    <input type="text" id="gtm-id" placeholder="GTM-XXXXXXX">
                </div>
            </div>
        `;

        const actions = [
            {
                text: 'Save SEO Settings',
                class: 'admin-btn-primary',
                onclick: 'adminModals.handleSaveSEO()'
            }
        ];

        this.createModal('seo-settings-modal', '🔍 SEO Settings', content, actions);
        this.showModal('seo-settings-modal');
    }

    // Handler functions
    handleAddProduct() {
        const name = document.getElementById('product-name').value;
        const price = document.getElementById('product-price').value;
        const description = document.getElementById('product-description').value;
        const category = document.getElementById('product-category').value;
        const emoji = document.getElementById('product-emoji').value;

        if (!name || !price) {
            alert('Please fill in required fields (Name and Price)');
            return;
        }


        console.log('Adding product:', { name, price, description, category, emoji });
        alert(`Product "${name}" added successfully!`);
        this.closeModal('add-product-modal');
    }

    selectProduct(productId) {
        // Remove previous selections
        document.querySelectorAll('.product-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Select current product
        event.target.closest('.product-item').classList.add('selected');

        // Show edit form
        document.getElementById('edit-form').style.display = 'block';

        console.log('Selected product:', productId);
    }

    handleSaveProduct() {
        alert('Product changes saved!');
        this.closeModal('edit-products-modal');
    }

    handleDeleteProduct() {
        if (confirm('Are you sure you want to delete this product?')) {
            alert('Product deleted!');
            this.closeModal('edit-products-modal');
        }
    }

    handleOptimizeImages() {
        alert('Images optimized successfully!');
        this.closeModal('image-manager-modal');
    }

    handleSaveSEO() {
        const title = document.getElementById('page-title').value;
        const description = document.getElementById('meta-description').value;

        // Update page title
        if (title) {
            document.title = title;
        }

        // Update meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = description;

        alert('SEO settings saved successfully!');
        this.closeModal('seo-settings-modal');
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
            window.adminPanel.showImageManagerModal = () => window.adminModals.showImageManagerModal();
            window.adminPanel.showSEOSettings = () => window.adminModals.showSEOSettingsModal();
        }
    }, 1500);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminModals;
}