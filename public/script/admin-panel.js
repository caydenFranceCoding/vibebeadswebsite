class AdminPanel {
    constructor() {
        this.allowedIPs = [
            '104.28.33.73', '172.59.196.158', '104.179.159.180', '172.58.183.6', '172.59.195.98'
        ];

        this.apiBaseUrl = 'https://adminbackend-4ils.onrender.com';
        this.currentUserIP = null;
        this.isAdmin = false;
        this.editableElements = new Map();
        this.originalContent = new Map();
        this.lastContentUpdate = null;
        this.lastProductUpdate = null;
        this.updateCheckInterval = null;
        this.allProducts = [];
        this.modals = null;
        
        this.renderQueue = [];
        this.isRendering = false;
        this.cache = new Map();
        this.debounceTimers = new Map();
        
        this.initializeAsync();
    }

    async initializeAsync() {
        try {
            // Load products first for all users (including non-admins)
            await this.loadProductsForAllUsers();
            
            // Load content for all users
            await this.loadContentForAllUsers();
            
            // Check IP address for admin features
            await this.checkIPAddress();
            
            if (this.isAdmin) {
                const adminPromises = [
                    this.checkServerConnection(),
                    this.createAdminPanel(),
                    this.setupEditableElements(),
                    this.setupEventListeners(),
                    this.setupModalIntegration()
                ];
                
                Promise.all(adminPromises).then(() => {
                    console.log('Admin panel initialized for IP:', this.currentUserIP);
                });
            }
            
            this.startUpdateChecking();
            
        } catch (error) {
            console.error('Initialization failed:', error);
        }
    }

    getProductContainers() {
        // Get all containers that should display products
        const containers = document.querySelectorAll('[data-admin-products="true"], .products-grid, .product-grid');
        return Array.from(containers);
    }

    async loadContentForAllUsers() {
        const pageName = this.getPageIdentifier();
        
        try {
            const serverPromise = fetch(`${this.apiBaseUrl}/api/content`, { 
                timeout: 3000 
            }).then(response => {
                if (response.ok) return response.json();
                throw new Error('Server unavailable');
            });

            const savedContent = localStorage.getItem(`admin_content_${pageName}`);
            if (savedContent) {
                this.applyContentToPage(JSON.parse(savedContent));
                console.log('Content loaded from localStorage');
            }

            try {
                const serverContent = await serverPromise;
                if (serverContent[pageName]) {
                    this.applyContentToPage(serverContent[pageName]);
                    localStorage.setItem(`admin_content_${pageName}`, JSON.stringify(serverContent[pageName]));
                    console.log('Content updated from server');
                }
            } catch (error) {
                console.log('Using local content only');
            }
        } catch (error) {
            console.warn('Content loading error:', error);
        }
    }

    async loadProductsForAllUsers() {
        console.log('Loading products for all users...');
        
        const containers = this.getProductContainers();
        
        if (containers.length === 0) {
            console.log('No product containers found');
            return;
        }

        let products = [];

        // Load from localStorage first
        try {
            const localProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
            if (localProducts.length > 0) {
                products = [...localProducts];
                this.allProducts = products;
                this.renderProductsToContainers(products, containers);
                console.log('Local products displayed immediately:', localProducts.length);
            }
        } catch (error) {
            console.warn('Error loading local products:', error);
        }

        // Then try to get from server
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/products/list`, {
                timeout: 5000
            });
            
            if (response.ok) {
                const serverProducts = await response.json();
                if (serverProducts && serverProducts.length > 0) {
                    const mergedProducts = this.mergeProducts(products, serverProducts);
                    
                    if (JSON.stringify(mergedProducts) !== JSON.stringify(products)) {
                        this.allProducts = mergedProducts;
                        // Clear existing admin products before re-rendering
                        this.clearExistingAdminProducts(containers);
                        this.renderProductsToContainers(mergedProducts, containers);
                        localStorage.setItem('admin_products', JSON.stringify(mergedProducts));
                        console.log('Products updated from server:', serverProducts.length);
                    }
                }
            }
        } catch (error) {
            console.log('Server products unavailable, using local only:', error.message);
        }
    }

    clearExistingAdminProducts(containers) {
        containers.forEach(container => {
            const adminProducts = container.querySelectorAll('[data-admin-product="true"]');
            adminProducts.forEach(product => product.remove());
        });
    }

    mergeProducts(localProducts, serverProducts) {
        const merged = [...serverProducts];
        
        localProducts.forEach(localProduct => {
            if (!serverProducts.find(sp => sp.id === localProduct.id)) {
                merged.push(localProduct);
            }
        });

        return merged.filter((product, index, self) => 
            index === self.findIndex(p => p.id === product.id)
        );
    }

    renderProductsToContainers(products, containers, isCached = false) {
        if (this.isRendering && !isCached) {
            this.renderQueue.push({ products, containers });
            return;
        }

        this.isRendering = true;
        
        requestAnimationFrame(() => {
            try {
                containers.forEach((container, containerIndex) => {
                    // Get category filter for this container
                    const categoryFilter = container.getAttribute('data-category');
                    
                    // Filter products by category if specified
                    let filteredProducts = products;
                    if (categoryFilter) {
                        filteredProducts = products.filter(product => 
                            product.category === categoryFilter || 
                            this.mapCategoryName(product.category) === categoryFilter
                        );
                    }
                    
                    if (filteredProducts.length === 0) {
                        return; // Don't show "no products" message if there are static products
                    }

                    // Always append admin products to containers
                    const containerFragment = document.createDocumentFragment();
                    
                    filteredProducts.forEach((product, productIndex) => {
                        const productElement = this.createProductElement(product, `admin-${containerIndex}-${productIndex}`);
                        productElement.setAttribute('data-admin-product', 'true');
                        containerFragment.appendChild(productElement);
                    });
                    
                    // Append admin products to the container
                    container.appendChild(containerFragment);
                });

                console.log(`Rendered admin products to ${containers.length} containers`);
                
                this.isRendering = false;
                if (this.renderQueue.length > 0) {
                    const next = this.renderQueue.shift();
                    this.renderProductsToContainers(next.products, next.containers);
                }
            } catch (error) {
                console.error('Rendering error:', error);
                this.isRendering = false;
            }
        });
    }

    // Map category names between different formats
    mapCategoryName(category) {
        const categoryMap = {
            'wax-melts': 'wax-melts',
            'waxmelts': 'wax-melts',
            'room-sprays': 'room-sprays',
            'roomsprays': 'room-sprays',
            'candles': 'candles',
            'diffusers': 'diffusers',
            'jewelry': 'jewelry',
            'accessories': 'jewelry'
        };
        
        return categoryMap[category] || category;
    }

    createProductElement(product, uniqueId) {
        const div = document.createElement('div');
        div.className = 'product-card fade-in';
        div.setAttribute('data-product-id', product.id);
        div.setAttribute('data-unique-id', uniqueId);
        div.onclick = () => window.productManager?.openProductDetail(product.id);
        
        div.innerHTML = this.createProductHTML(product, uniqueId);
        return div;
    }

    createProductHTML(product, uniqueId) {
        const cacheKey = `${product.id}-${product.lastModified || 'static'}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const productId = this.escapeHtml(product.id);
        const productName = this.escapeHtml(product.name);
        const productPrice = (product.price || 0).toFixed(2);
        const productEmoji = this.escapeHtml(product.emoji || '🕯️');
        const productDescription = this.escapeHtml(product.description || '');

        // Match the exact structure of your static products
        const html = `
            <div class="product-image">
                ${product.imageUrl ? 
                    `<img src="${product.imageUrl}" alt="${productName}" loading="lazy" onerror="this.parentNode.innerHTML='<div class=\\"product-emoji\\">${productEmoji}</div>'">` :
                    productEmoji
                }
            </div>
            <div class="product-info">
                <h3 class="product-title">${productName}</h3>
                <p class="product-price">From ${productPrice} USD</p>
                <p class="product-description">${productDescription}</p>
                <button class="add-to-cart-btn" onclick="event.stopPropagation(); window.productManager?.quickAddToCart('${productId}')">Add to Cart</button>
            </div>
            ${!product.inStock ? '<div class="out-of-stock">Out of Stock</div>' : ''}
            ${product.featured ? '<div class="featured-badge">Featured</div>' : ''}
        `;

        this.cache.set(cacheKey, html);
        
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        return html;
    }

    async checkIPAddress() {
        try {
            const ipSources = [
                'https://api.ipify.org?format=json',
                'https://ipapi.co/json/',
                'https://ipinfo.io/json'
            ];

            const promises = ipSources.map(async (source) => {
                try {
                    const response = await fetch(source, { timeout: 2000 });
                    const data = await response.json();
                    return data.ip || data.query;
                } catch {
                    return null;
                }
            });

            const results = await Promise.allSettled(promises);
            for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                    this.currentUserIP = result.value;
                    break;
                }
            }

            if (!this.currentUserIP) {
                console.error('Failed to detect IP address');
                this.isAdmin = false;
                return;
            }

            const isLocalhost = window.location.hostname === 'localhost' ||
                               window.location.hostname === '127.0.0.1';

            this.isAdmin = this.allowedIPs.includes(this.currentUserIP) || isLocalhost;

            if (this.apiBaseUrl && this.currentUserIP) {
                try {
                    const response = await fetch(`${this.apiBaseUrl}/api/admin/status`, {
                        timeout: 3000
                    });
                    const result = await response.json();
                    this.isAdmin = response.ok && result.authorized;
                } catch (error) {
                    console.warn('Backend admin verification failed, using local check');
                }
            }

            console.log(`IP: ${this.currentUserIP}, Is Admin: ${this.isAdmin}`);
        } catch (error) {
            console.error('IP check failed:', error);
            this.isAdmin = false;
        }
    }

    debounce(func, wait, key) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        
        const timer = setTimeout(() => {
            this.debounceTimers.delete(key);
            func();
        }, wait);
        
        this.debounceTimers.set(key, timer);
    }

    async startUpdateChecking() {
        let interval = 30000;
        const maxInterval = 300000;
        
        const checkUpdates = async () => {
            try {
                const success = await this.checkForUpdates();
                if (success) {
                    interval = 30000;
                } else {
                    interval = Math.min(interval * 1.5, maxInterval);
                }
            } catch (error) {
                interval = Math.min(interval * 2, maxInterval);
                console.warn('Update check failed, increasing interval to:', interval);
            }
            
            this.updateCheckInterval = setTimeout(checkUpdates, interval);
        };

        checkUpdates();
    }

    async checkForUpdates() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/timestamps`, {
                timeout: 5000
            });
            
            if (!response.ok) return false;

            const timestamps = await response.json();
            
            if (timestamps.content && timestamps.content !== this.lastContentUpdate) {
                this.lastContentUpdate = timestamps.content;
                this.debounce(() => this.loadContentForAllUsers(), 1000, 'content');
                
                if (!this.isAdmin) {
                    this.showUpdateNotification('Content updated!');
                }
            }

            if (timestamps.products && timestamps.products !== this.lastProductUpdate) {
                this.lastProductUpdate = timestamps.products;
                this.debounce(() => this.loadProductsForAllUsers(), 1000, 'products');
                
                if (!this.isAdmin) {
                    this.showUpdateNotification('Products updated!');
                }
            }

            return true;
        } catch (error) {
            console.error('Update check failed:', error);
            return false;
        }
    }

    getPageIdentifier() {
        const path = window.location.pathname;
        let page = path.split('/').pop() || 'index.html';
        if (!page.includes('.')) page += '.html';
        return page.replace('.html', '');
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

    createAdminPanel() {
        if (!this.isAdmin) return;

        const productContainers = document.querySelectorAll('[data-admin-products="true"], .products-grid, .product-grid');
        const localProductCount = this.allProducts.length;

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
                        <h3>Products (${localProductCount} total)</h3>
                        <button id="add-product" class="admin-action-btn">
                            ➕ Add Product
                        </button>
                        <button id="edit-products" class="admin-action-btn" ${localProductCount === 0 ? 'disabled' : ''}>
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
                            <div>Product Containers: ${productContainers.length}</div>
                            <div>Total Products: ${localProductCount}</div>
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
        if (document.getElementById('admin-panel-styles')) return;
        
        const styles = `
            <style id="admin-panel-styles">
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
                    color: white; font-weight: 600;
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
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    setupEventListeners() {
        if (!this.isAdmin) return;

        document.getElementById('close-btn')?.addEventListener('click', () => {
            document.getElementById('admin-panel').classList.add('hidden');
        });

        document.getElementById('admin-toggle')?.addEventListener('click', () => {
            document.getElementById('admin-panel').classList.remove('hidden');
        });

        document.getElementById('toggle-edit-mode')?.addEventListener('click', () => {
            this.toggleEditMode();
        });

        document.getElementById('exit-edit-mode')?.addEventListener('click', () => {
            this.exitEditMode();
        });

        document.getElementById('save-changes')?.addEventListener('click', () => {
            this.saveChanges();
        });

        document.getElementById('reset-content')?.addEventListener('click', () => {
            this.resetContent();
        });

        document.getElementById('add-product')?.addEventListener('click', () => {
            this.showAddProductModal();
        });

        document.getElementById('edit-products')?.addEventListener('click', () => {
            this.showEditProductsModal();
        });

        document.getElementById('refresh-products')?.addEventListener('click', () => {
            this.loadProductsForAllUsers();
        });
    }

    setupEditableElements() {
        if (!this.isAdmin) return;

        const selectors = [
            '.hero-content h1', '.hero-tagline', '.section-title', '.section-subtitle',
            '.faq-question', '.faq-answer', '.footer-section p', '.review-text'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach((element, index) => {
                if (element.closest('.product-card')) return;
                
                const elementId = `${selector.replace(/[^a-zA-Z0-9]/g, '_')}_${index}`;
                element.setAttribute('data-admin-id', elementId);
                this.editableElements.set(elementId, element);
                this.originalContent.set(elementId, element.innerHTML);
            });
        });

        const editableCountElement = document.getElementById('editable-count');
        if (editableCountElement) {
            editableCountElement.textContent = this.editableElements.size;
        }
    }

    setupModalIntegration() {
        const checkModals = () => {
            if (window.AdminModals) {
                this.modals = new window.AdminModals(this);
                console.log('Modal integration complete');
                return true;
            }
            if (window.adminModals) {
                this.modals = window.adminModals;
                console.log('Modal integration complete - using existing instance');
                return true;
            }
            return false;
        };

        if (!checkModals()) {
            let attempts = 0;
            const maxAttempts = 10;
            
            const retryCheck = () => {
                attempts++;
                if (checkModals() || attempts >= maxAttempts) {
                    if (attempts >= maxAttempts) {
                        console.warn('Modal integration failed - using fallbacks');
                        console.log('Available on window:', Object.keys(window).filter(k => k.includes('dmin')));
                    }
                    return;
                }
                setTimeout(retryCheck, 200 * attempts);
            };
            
            setTimeout(retryCheck, 500);
        }
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
        if (!this.isAdmin) return;

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

    showAddProductModal() {
        if (!this.isAdmin) return;
        
        if (this.modals) {
            this.modals.showAddProductModal();
        } else {
            this.createProductWithPrompts();
        }
    }

    showEditProductsModal() {
        if (!this.isAdmin) return;
        
        if (this.modals) {
            this.modals.showEditProductsModal();
        } else {
            alert('Product management modal not available. Please refresh the page.');
        }
    }

    async addProduct(productData) {
        if (!this.isAdmin) return false;

        try {
            const existingProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
            existingProducts.push(productData);
            localStorage.setItem('admin_products', JSON.stringify(existingProducts));
            
            if (this.apiBaseUrl) {
                try {
                    const response = await fetch(`${this.apiBaseUrl}/api/products`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            productId: productData.id,
                            productData
                        })
                    });

                    const result = await response.json();
                    
                    if (!response.ok) {
                        console.error('Server save failed:', result.error);
                    } else {
                        console.log('Product saved to server successfully');
                    }
                } catch (serverError) {
                    console.warn('Server save failed, but local save succeeded:', serverError);
                }
            }
            
            await this.loadProductsForAllUsers();
            this.updateAdminPanelInfo();
            
            return true;

        } catch (error) {
            console.error('Failed to add product:', error);
            return false;
        }
    }

    async updateProduct(productId, productData) {
        if (!this.isAdmin) return false;

        try {
            const existingProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
            const productIndex = existingProducts.findIndex(p => p.id === productId);
            
            if (productIndex === -1) {
                throw new Error('Product not found in localStorage');
            }
            
            existingProducts[productIndex] = {
                ...productData,
                id: productId,
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('admin_products', JSON.stringify(existingProducts));
            
            if (this.apiBaseUrl) {
                try {
                    const response = await fetch(`${this.apiBaseUrl}/api/products/${productId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(productData)
                    });

                    const result = await response.json();
                    
                    if (!response.ok) {
                        console.error('Server update failed:', result.error);
                    } else {
                        console.log('Product updated on server successfully');
                    }
                } catch (serverError) {
                    console.warn('Server update failed, but local update succeeded:', serverError);
                }
            }
            
            await this.loadProductsForAllUsers();
            this.updateAdminPanelInfo();
            
            return true;

        } catch (error) {
            console.error('Failed to update product:', error);
            return false;
        }
    }

    async deleteProduct(productId) {
        if (!this.isAdmin) return false;

        try {
            const existingProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
            const filteredProducts = existingProducts.filter(p => p.id !== productId);
            localStorage.setItem('admin_products', JSON.stringify(filteredProducts));
            
            if (this.apiBaseUrl) {
                try {
                    const response = await fetch(`${this.apiBaseUrl}/api/products/${productId}`, {
                        method: 'DELETE'
                    });

                    const result = await response.json();
                    
                    if (!response.ok) {
                        console.error('Server delete failed:', result.error);
                    } else {
                        console.log('Product deleted from server successfully');
                    }
                } catch (serverError) {
                    console.warn('Server delete failed, but local delete succeeded:', serverError);
                }
            }
            
            await this.loadProductsForAllUsers();
            this.updateAdminPanelInfo();
            
            return true;

        } catch (error) {
            console.error('Failed to delete product:', error);
            return false;
        }
    }

    updateAdminPanelInfo() {
        const localProductCount = this.allProducts.length;
        const productCountElements = document.querySelectorAll('.admin-section h3');
        if (productCountElements[1]) {
            productCountElements[1].textContent = `Products (${localProductCount} total)`;
        }
        
        const editBtn = document.getElementById('edit-products');
        if (editBtn) {
            editBtn.disabled = localProductCount === 0;
        }
    }

    createProductWithPrompts() {
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
            sizes: ['Standard'],
            scents: [],
            colors: [],
            createdAt: new Date().toISOString(),
            createdBy: 'admin-fallback'
        };

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

    applyContentToPage(changes) {
        const selectors = [
            '.hero-content h1', '.hero-tagline', '.section-title', '.section-subtitle',
            '.faq-question', '.faq-answer', '.footer-section p', '.review-text'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach((element, index) => {
                if (element.closest('.product-card')) return;
                
                const elementId = `${selector.replace(/[^a-zA-Z0-9]/g, '_')}_${index}`;
                if (changes[elementId] && changes[elementId] !== 'lastModified' && changes[elementId] !== 'modifiedBy') {
                    element.innerHTML = changes[elementId];
                }
            });
        });
    }

    showUpdateNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: #8B7355;
            color: white; padding: 12px 20px; border-radius: 8px; font-size: 14px;
            z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatCategory(category) {
        if (!category) return 'General';
        return category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    destroy() {
        if (this.updateCheckInterval) {
            clearTimeout(this.updateCheckInterval);
        }
        
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        
        this.cache.clear();
    }
}

class ProductManager {
    constructor(adminPanel) {
        this.adminPanel = adminPanel;
    }

    openProductDetail(productId) {
        const product = this.findProduct(productId);
        if (!product) {
            console.error('Product not found:', productId);
            return;
        }

        this.showProductModal(product);
    }

    quickAddToCart(productId) {
        const product = this.findProduct(productId);
        if (!product) {
            console.error('Product not found for quick add:', productId);
            return;
        }

        if (!product.inStock) {
            alert('Sorry, this product is out of stock.');
            return;
        }

        const cartItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            size: product.sizes?.[0] || 'Standard',
            scent: product.scents?.[0] || null,
            color: product.colors?.[0] || null,
            image: product.emoji || '🕯️',
            isCustom: false
        };

        this.addToCartHandler(cartItem);
        this.showAddToCartConfirmation(product.name, 1);
    }

    findProduct(productId) {
        return this.adminPanel.allProducts.find(p => p.id === productId);
    }

    showProductModal(product) {
        const existingModal = document.getElementById('product-detail-modal');
        if (existingModal) existingModal.remove();

        const sizesHTML = product.sizes && product.sizes.length > 1 ? `
            <div class="product-option">
                <label>Size:</label>
                <select id="product-size">
                    ${product.sizes.map(size => `<option value="${size}">${size}</option>`).join('')}
                </select>
            </div>
        ` : '';

        const scentsHTML = product.scents && product.scents.length > 0 ? `
            <div class="product-option">
                <label>Scent:</label>
                <select id="product-scent">
                    <option value="">Select Scent</option>
                    ${product.scents.map(scent => `<option value="${scent}">${scent}</option>`).join('')}
                </select>
            </div>
        ` : '';

        const colorsHTML = product.colors && product.colors.length > 0 ? `
            <div class="product-option">
                <label>Color:</label>
                <select id="product-color">
                    <option value="">Select Color</option>
                    ${product.colors.map(color => `<option value="${color}">${color}</option>`).join('')}
                </select>
            </div>
        ` : '';

        const modal = document.createElement('div');
        modal.id = 'product-detail-modal';
        modal.className = 'product-modal';
        modal.innerHTML = `
            <div class="product-modal-content">
                <div class="product-modal-header">
                    <h2>${this.escapeHtml(product.name)}</h2>
                    <button class="close-modal" onclick="this.closest('.product-modal').remove()">×</button>
                </div>
                <div class="product-modal-body">
                    <div class="product-detail-image">
                        ${product.imageUrl ? 
                            `<img src="${product.imageUrl}" alt="${this.escapeHtml(product.name)}">` :
                            `<div class="product-detail-emoji">${product.emoji || '🕯️'}</div>`
                        }
                    </div>
                    <div class="product-detail-info">
                        <div class="product-detail-price">${(product.price || 0).toFixed(2)}</div>
                        <div class="product-detail-category">${this.adminPanel.formatCategory(product.category)}</div>
                        <div class="product-detail-description">
                            ${product.description || 'No description available.'}
                        </div>
                        ${!product.inStock ? '<div class="out-of-stock-large">Out of Stock</div>' : ''}
                        
                        <div class="product-options">
                            ${sizesHTML}
                            ${scentsHTML}
                            ${colorsHTML}
                            <div class="product-option">
                                <label>Quantity:</label>
                                <select id="product-quantity">
                                    ${[1,2,3,4,5,6,7,8,9,10].map(i => `<option value="${i}">${i}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="product-actions">
                            <button class="add-to-cart-large" onclick="productManager.addToCartFromModal('${product.id}')" ${!product.inStock ? 'disabled' : ''}>
                                ${product.inStock ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (!document.getElementById('product-modal-styles')) {
            const modalStyles = document.createElement('style');
            modalStyles.id = 'product-modal-styles';
            modalStyles.textContent = `
                .product-modal {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.8); z-index: 10002; display: flex;
                    align-items: center; justify-content: center; backdrop-filter: blur(5px);
                }
                .product-modal-content {
                    background: white; border-radius: 16px; max-width: 700px; width: 90%;
                    max-height: 85vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.3);
                }
                .product-modal-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 20px 30px; border-bottom: 1px solid #eee; background: #8B7355;
                    color: white; border-radius: 16px 16px 0 0;
                }
                .product-modal-header h2 { margin: 0; font-size: 24px; }
                .close-modal {
                    background: rgba(255,255,255,0.2); border: none; color: white;
                    width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 20px;
                }
                .product-modal-body { padding: 30px; display: flex; gap: 30px; }
                .product-detail-image { flex: 1; text-align: center; }
                .product-detail-image img { width: 100%; max-width: 300px; border-radius: 12px; }
                .product-detail-emoji { font-size: 120px; }
                .product-detail-info { flex: 1; }
                .product-detail-price { 
                    font-size: 28px; font-weight: 700; color: #8B7355; margin-bottom: 10px; 
                }
                .product-detail-category {
                    font-size: 14px; color: #999; text-transform: uppercase;
                    letter-spacing: 0.5px; margin-bottom: 20px;
                }
                .product-detail-description {
                    font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 25px;
                }
                .product-options { 
                    border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 25px;
                    background: #fafafa;
                }
                .product-option { 
                    margin-bottom: 15px; display: flex; align-items: center; gap: 15px;
                }
                .product-option:last-child { margin-bottom: 0; }
                .product-option label { font-weight: 600; min-width: 80px; }
                .product-option select {
                    flex: 1; padding: 8px 12px; border: 2px solid #ddd; border-radius: 6px;
                    font-size: 14px;
                }
                .product-option select:focus { outline: none; border-color: #8B7355; }
                .add-to-cart-large {
                    width: 100%; padding: 15px; background: #8B7355; color: white;
                    border: none; border-radius: 8px; font-size: 16px; font-weight: 600;
                    cursor: pointer; transition: background 0.2s;
                }
                .add-to-cart-large:hover:not(:disabled) { background: #6d5a42; }
                .add-to-cart-large:disabled { background: #ccc; cursor: not-allowed; }
                .out-of-stock-large {
                    background: #ff4444; color: white; padding: 10px 20px; border-radius: 6px;
                    text-align: center; font-weight: 600; margin-bottom: 20px;
                }
                @media (max-width: 768px) {
                    .product-modal-body { flex-direction: column; padding: 20px; }
                    .product-option { flex-direction: column; align-items: flex-start; gap: 8px; }
                    .product-option label { min-width: auto; }
                    .product-option select { width: 100%; }
                }
            `;
            document.head.appendChild(modalStyles);
        }

        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    addToCartFromModal(productId) {
        const product = this.findProduct(productId);
        if (!product) {
            console.error('Product not found for cart:', productId);
            return;
        }

        if (!product.inStock) {
            alert('Sorry, this product is out of stock.');
            return;
        }

        const quantity = parseInt(document.getElementById('product-quantity')?.value || '1');
        const size = document.getElementById('product-size')?.value || product.sizes?.[0] || 'Standard';
        const scent = document.getElementById('product-scent')?.value || null;
        const color = document.getElementById('product-color')?.value || null;

        const cartItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            size: size,
            scent: scent,
            color: color,
            image: product.emoji || '🕯️',
            isCustom: false
        };

        this.addToCartHandler(cartItem);

        const modal = document.getElementById('product-detail-modal');
        if (modal) modal.remove();

        this.showAddToCartConfirmation(product.name, quantity);
    }

    addToCartHandler(item) {
        if (window.cartManager) {
            window.cartManager.addItem(item);
            console.log('Added to cart via cartManager:', item);
        } else {
            this.addToFallbackCart(item);
        }
    }

    addToFallbackCart(item) {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingIndex = cart.findIndex(cartItem => 
            cartItem.id === item.id && 
            cartItem.size === item.size && 
            cartItem.scent === item.scent && 
            cartItem.color === item.color
        );
        
        if (existingIndex >= 0) {
            cart[existingIndex].quantity += item.quantity;
        } else {
            cart.push(item);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        console.log('Added to fallback cart:', item);
        
        if (window.updateCartUI) {
            window.updateCartUI();
        }
    }

    showAddToCartConfirmation(productName, quantity) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: #4CAF50;
            color: white; padding: 15px 20px; border-radius: 8px; font-size: 14px;
            z-index: 10003; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = `
            <strong>✅ Added to Cart!</strong><br>
            ${quantity}x ${this.escapeHtml(productName)}
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize for everyone (admins and non-admins)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.adminPanel = new AdminPanel();
            window.productManager = new ProductManager(window.adminPanel);
        }, 100);
    });
} else {
    setTimeout(() => {
        window.adminPanel = new AdminPanel();
        window.productManager = new ProductManager(window.adminPanel);
    }, 100);
}