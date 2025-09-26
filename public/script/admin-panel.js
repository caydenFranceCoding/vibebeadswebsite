// Enhanced Admin Panel with Full Product Support
// File: public/script/admin-panel.js

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
        this.lastContentUpdate = null;
        this.lastProductUpdate = null;
        this.updateCheckInterval = null;

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
            await this.loadProductsForAllUsers();
            await this.checkIPAddress();
            
            if (this.isAdmin) {
                await this.checkServerConnection();
                this.createAdminPanel();
                this.setupEditableElements();
                this.setupEventListeners();
                this.startUpdateChecking();
                console.log('Admin panel initialized for IP:', this.currentUserIP);
            } else {
                this.startUpdateChecking();
                console.log('Regular user - content loaded, checking for updates. IP:', this.currentUserIP);
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

    async loadProductsForAllUsers() {
        // Load both server and local products
        const dynamicContainers = document.querySelectorAll('[data-admin-products="true"]');
        if (dynamicContainers.length === 0) {
            console.log('No dynamic product containers found');
            return;
        }

        let products = [];

        try {
            // Try to load from server first
            const response = await fetch(`${this.apiBaseUrl}/api/products/list`);
            if (response.ok) {
                const serverProducts = await response.json();
                if (serverProducts && serverProducts.length > 0) {
                    products = [...products, ...serverProducts];
                    console.log('Products loaded from server:', serverProducts.length);
                }
            }
        } catch (error) {
            console.log('Server products unavailable, using local only');
        }

        // Always load local products (admin-added products)
        try {
            const localProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
            if (localProducts.length > 0) {
                products = [...products, ...localProducts];
                console.log('Products loaded from localStorage:', localProducts.length);
            }
        } catch (error) {
            console.log('Error loading local products:', error);
        }

        // Cache combined products
        if (products.length > 0) {
            localStorage.setItem('cached_all_products', JSON.stringify(products));
            this.renderProductsToContainers(products, dynamicContainers);
        } else {
            // Try to load cached products
            const cachedProducts = localStorage.getItem('cached_all_products');
            if (cachedProducts) {
                products = JSON.parse(cachedProducts);
                this.renderProductsToContainers(products, dynamicContainers);
            }
        }
    }

    renderProductsToContainers(products, containers) {
        containers.forEach(container => {
            if (products.length === 0) {
                container.innerHTML = `
                    <div class="no-products-message">
                        <p>No products available yet</p>
                        ${this.isAdmin ? '<p><small>Use the admin panel to add products</small></p>' : ''}
                    </div>
                `;
                return;
            }

            const productsHTML = products.map(product => this.createProductHTML(product)).join('');
            container.innerHTML = productsHTML;
        });

        console.log(`Rendered ${products.length} products in ${containers.length} containers`);
    }

    createProductHTML(product) {
        return `
            <div class="product-card fade-in" data-static-product="${product.id}" onclick="addQuickProduct('${this.escapeQuotes(product.id)}', '${this.escapeQuotes(product.name)}', ${product.price}, '${this.escapeQuotes(product.emoji || '🕯️')}')">
                <div class="product-image">
                    ${product.imageUrl ? 
                        `<img src="${product.imageUrl}" alt="${this.escapeHtml(product.name)}" loading="lazy">` :
                        `<div class="product-emoji">${product.emoji || '🕯️'}</div>`
                    }
                </div>
                <div class="product-info">
                    <h3 class="product-title">${this.escapeHtml(product.name)}</h3>
                    <p class="product-description">${this.escapeHtml(product.description || '')}</p>
                    <div class="product-price">$${(product.price || 0).toFixed(2)}</div>
                    <div class="product-category">${this.formatCategory(product.category)}</div>
                    ${!product.inStock ? '<div class="out-of-stock">Out of Stock</div>' : ''}
                    ${product.featured ? '<div class="featured-badge">Featured</div>' : ''}
                    <button class="add-to-cart-btn" onclick="event.stopPropagation(); addQuickProduct('${this.escapeQuotes(product.id)}', '${this.escapeQuotes(product.name)}', ${product.price}, '${this.escapeQuotes(product.emoji || '🕯️')}')">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeQuotes(text) {
        if (!text) return '';
        return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
    }

    formatCategory(category) {
        if (!category) return 'General';
        return category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    async startUpdateChecking() {
        // Check for updates every 30 seconds
        this.updateCheckInterval = setInterval(() => {
            this.checkForUpdates();
        }, 30000);

        // Also check immediately
        this.checkForUpdates();
    }

    async checkForUpdates() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/timestamps`);
            if (!response.ok) return;

            const timestamps = await response.json();
            
            // Check if content was updated
            if (timestamps.content && timestamps.content !== this.lastContentUpdate) {
                console.log('Content update detected, reloading...');
                this.lastContentUpdate = timestamps.content;
                await this.loadContentForAllUsers();
                
                if (!this.isAdmin) {
                    this.showUpdateNotification('Content updated!');
                }
            }

            // Check if products were updated
            if (timestamps.products && timestamps.products !== this.lastProductUpdate) {
                console.log('Product update detected, reloading...');
                this.lastProductUpdate = timestamps.products;
                await this.loadProductsForAllUsers();
                
                if (!this.isAdmin) {
                    this.showUpdateNotification('Products updated!');
                }
            }

        } catch (error) {
            console.error('Update check failed:', error);
        }
    }

    showUpdateNotification(message) {
        // Create a subtle notification for regular users
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #8B7355;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        const style = document.createElement('style');
        style.textContent = '@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }';
        document.head.appendChild(style);

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
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

        const dynamicContainers = document.querySelectorAll('[data-admin-products="true"]');
        const hasProductContainers = dynamicContainers.length > 0;
        const localProductCount = JSON.parse(localStorage.getItem('admin_products') || '[]').length;

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
                        <h3>Products ${hasProductContainers ? `(${localProductCount} local)` : '(No Containers)'}</h3>
                        <button id="add-product" class="admin-action-btn" ${!hasProductContainers ? 'disabled title="Add data-admin-products=\'true\' to a container"' : ''}>
                            ➕ Add Product
                        </button>
                        <button id="edit-products" class="admin-action-btn" ${!hasProductContainers ? 'disabled' : ''}>
                            📝 Manage Products
                        </button>
                        <button id="refresh-products" class="admin-action-btn">
                            🔄 Refresh Products
                        </button>
                    </div>

                    <div class="admin-section">
                        <h3>Status</h3>
                        <div class="admin-info">
                            <div>IP: ${this.currentUserIP}</div>
                            <div>Backend: ${this.apiBaseUrl ? 'Connected' : 'Local Only'}</div>
                            <div>Mode: Full Admin Access</div>
                            <div>Elements: <span id="editable-count">0</span></div>
                            <div>Page: ${this.getPageIdentifier()}</div>
                            <div>Product Containers: ${dynamicContainers.length}</div>
                            <div>Local Products: ${localProductCount}</div>
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
                    position: fixed; top: 20px; right: 20px; width: 320px;
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
                .product-card {
                    background: white; border: 1px solid #e8e8e8; border-radius: 12px;
                    padding: 16px; text-align: center; transition: all 0.3s ease;
                    position: relative; margin-bottom: 16px;
                }
                .product-card:hover {
                    transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                }
                .product-emoji {
                    font-size: 48px; margin-bottom: 12px;
                }
                .product-image img {
                    width: 100%; height: 200px; object-fit: cover; border-radius: 8px;
                }
                .out-of-stock {
                    background: #ff4444; color: white; padding: 4px 8px;
                    border-radius: 4px; font-size: 12px; margin-top: 8px;
                }
                .featured-badge {
                    position: absolute; top: 8px; right: 8px;
                    background: #8B7355; color: white; padding: 4px 8px;
                    border-radius: 4px; font-size: 10px; font-weight: 600;
                }
                .no-products-message {
                    text-align: center; padding: 40px 20px; color: #666;
                }
                .no-products-message p { margin: 8px 0; }
                .no-products-message small { color: #999; }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    setupEventListeners() {
        if (!this.isAdmin) return;

        const closeBtn = document.getElementById('close-btn');
        const toggleBtn = document.getElementById('admin-toggle');
        const editModeBtn = document.getElementById('toggle-edit-mode');
        const exitEditBtn = document.getElementById('exit-edit-mode');
        const saveBtn = document.getElementById('save-changes');
        const resetBtn = document.getElementById('reset-content');
        const addProductBtn = document.getElementById('add-product');
        const editProductsBtn = document.getElementById('edit-products');
        const refreshBtn = document.getElementById('refresh-products');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.getElementById('admin-panel').classList.add('hidden');
            });
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                document.getElementById('admin-panel').classList.remove('hidden');
            });
        }

        if (editModeBtn) {
            editModeBtn.addEventListener('click', () => {
                this.toggleEditMode();
            });
        }

        if (exitEditBtn) {
            exitEditBtn.addEventListener('click', () => {
                this.exitEditMode();
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveChanges();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetContent();
            });
        }

        if (addProductBtn) {
            addProductBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Add Product button clicked');
                
                if (window.adminModals) {
                    console.log('Using admin modals');
                    window.adminModals.showAddProductModal();
                } else {
                    console.log('Using fallback product creation');
                    this.createProductWithPrompts();
                }
            });
        }

        if (editProductsBtn) {
            editProductsBtn.addEventListener('click', () => {
                if (window.adminModals) {
                    window.adminModals.showEditProductsModal();
                } else {
                    alert('Product management modal not available. Please refresh the page.');
                }
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('Refreshing products...');
                this.loadProductsForAllUsers();
            });
        }

        console.log('Admin panel event listeners setup complete');
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
                // Skip elements inside static products
                if (element.closest('[data-static-product]')) return;
                
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

    // Enhanced method for admin modals to add products
    async addProduct(productData) {
        if (!this.isAdmin) {
            console.error('Unauthorized product addition attempt');
            return false;
        }

        try {
            // Try to save to server first
            if (this.apiBaseUrl) {
                const response = await fetch(`${this.apiBaseUrl}/api/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productId: productData.id,
                        productData
                    })
                });

                if (response.ok) {
                    console.log('Product added to server successfully');
                    // Trigger reload for all users
                    await this.loadProductsForAllUsers();
                    return true;
                }
            }

            // Fallback: save locally and reload
            console.log('Adding product locally as fallback');
            const existingProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
            existingProducts.push(productData);
            localStorage.setItem('admin_products', JSON.stringify(existingProducts));
            
            // Reload products immediately
            await this.loadProductsForAllUsers();
            return true;

        } catch (error) {
            console.error('Failed to add product:', error);
            return false;
        }
    }

    // Fallback product creation with prompts
    createProductWithPrompts() {
        console.log('Using fallback product creation method');
        
        const name = prompt('Product Name:');
        if (!name) return;

        const priceStr = prompt('Product Price (e.g., 15.00):');
        const price = parseFloat(priceStr);
        if (!price || price <= 0) {
            alert('Please enter a valid price');
            return;
        }

        const description = prompt('Product Description (optional):') || `Premium ${name} with excellent quality.`;
        
        const category = prompt('Category (candles/wax-melts/room-sprays/diffusers/jewelry):', 'candles') || 'candles';
        
        const emoji = prompt('Emoji/Icon (optional):', '🕯️') || '🕯️';

        const productData = {
            id: this.generateProductId(name),
            name: name,
            price: price,
            description: description,
            category: category,
            emoji: emoji,
            featured: false,
            inStock: true,
            createdAt: new Date().toISOString(),
            createdBy: 'admin-fallback'
        };

        // Add product using existing method
        this.addProduct(productData).then(success => {
            if (success) {
                alert(`✅ Product "${name}" added successfully!`);
            } else {
                alert('❌ Failed to add product. Please try again.');
            }
        });
    }

    generateProductId(name) {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substr(2, 5);
        const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').substr(0, 10);
        return `${nameSlug}-${timestamp}-${randomStr}`;
    }

    // Cleanup on page unload
    destroy() {
        if (this.updateCheckInterval) {
            clearInterval(this.updateCheckInterval);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.adminPanel = new AdminPanel();
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (window.adminPanel) {
                window.adminPanel.destroy();
            }
        });
    }, 1000);
});

// Make addQuickProduct globally available for product cards
window.addQuickProduct = function(id, name, price, emoji) {
    if (window.cartManager) {
        const product = {
            id: id,
            name: name,
            price: parseFloat(price) || 0,
            quantity: 1,
            size: 'Standard',
            scent: null,
            image: emoji,
            isCustom: false
        };

        window.cartManager.addItem(product);
        console.log('Added product to cart:', product);
    } else {
        // Fallback for when cart manager isn't available
        console.log('Added product (fallback):', { id, name, price, emoji });
        alert(`Added ${name} to cart! ($${price})`);
    }
};