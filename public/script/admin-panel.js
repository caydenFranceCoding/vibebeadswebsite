class AdminPanel {
    constructor() {
        this.allowedIPs = [
            '104.28.33.73', 
            '172.59.196.158', 
            '104.28.33.73', 
            '172.58.183.6', 
            '172.59.195.98',
            '192.168.12.160',  
            '192.168.12.230',
            '172.58.183.208',
            '172.20.10.2',
            '146.75.164.253',
            '172.225.18.249'

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
            await this.loadProductsForAllUsers();
            await this.loadContentForAllUsers();
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

        try {
            const localProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
            if (localProducts.length > 0) {
                products = [...localProducts];
                this.allProducts = products;
                this.clearExistingAdminProducts(containers);
                this.renderProductsToContainers(products, containers);
                console.log('Local products displayed immediately:', localProducts.length);
            }
        } catch (error) {
            console.warn('Error loading local products:', error);
        }

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
                    const categoryFilter = container.getAttribute('data-category');
                    
                    let filteredProducts = products;
                    if (categoryFilter) {
                        filteredProducts = products.filter(product => 
                            product.category === categoryFilter || 
                            this.mapCategoryName(product.category) === categoryFilter
                        );
                    }
                    
                    if (filteredProducts.length === 0) {
                        return;
                    }

                    const containerFragment = document.createDocumentFragment();
                    
                    filteredProducts.forEach((product, productIndex) => {
                        const productElement = this.createProductElement(product, `admin-${containerIndex}-${productIndex}`);
                        productElement.setAttribute('data-admin-product', 'true');
                        containerFragment.appendChild(productElement);
                    });
                    
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

    mapCategoryName(category) {
        const categoryMap = {
            'room-sprays': 'room-sprays',
            'roomsprays': 'room-sprays',
            'candles': 'candles',
            'diffusers': 'diffusers',
            'jewelry': 'jewelry',
            'accessories': 'accessories',
            'seasonal': 'seasonal',
            'incense': 'incense',
            'hand-soaps': 'hand-soaps',
            'handsoaps': 'hand-soaps',
            'soaps': 'hand-soaps'
        };
        
        return categoryMap[category] || category;
    }

    createProductElement(product, uniqueId) {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.setAttribute('data-product-id', product.id);
        div.setAttribute('data-unique-id', uniqueId);
        
        const isShopAllPage = window.location.pathname.includes('shop-all') || 
                            window.location.pathname.includes('shop_all') ||
                            document.title.toLowerCase().includes('shop all') ||
                            document.querySelector('body').classList.contains('shop-all-page');
        
        if (isShopAllPage) {
            div.onclick = () => window.productManager?.quickAddToCart(product.id);
        } else {
            div.onclick = () => this.openProductModal(product);
        }
        
        div.innerHTML = this.createProductHTML(product, uniqueId);
        div.style.opacity = '1';
        
        return div;
    }

    createProductHTML(product, uniqueId) {
        const cacheKey = `${product.id}-${product.lastModified || 'static'}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const productId = this.escapeHtml(product.id);
        const productName = this.escapeHtml(product.name);
        const productDescription = this.escapeHtml(product.description || '');
        
        const basePrice = product.sizeOptions && product.sizeOptions.length > 0 
            ? product.sizeOptions[0].price 
            : product.price || 0;

        let imageContent;
        if (product.imageUrl && product.imageUrl.trim()) {
            imageContent = `<img src="${product.imageUrl}" alt="${productName}" loading="lazy">`;
        } else {
            imageContent = product.emoji || '🕯️';
        }

        const isShopAllPage = window.location.pathname.includes('shop-all') || 
                            window.location.pathname.includes('shop_all') ||
                            document.title.toLowerCase().includes('shop all') ||
                            document.querySelector('body').classList.contains('shop-all-page');

        const buttonOnClick = isShopAllPage 
            ? `event.stopPropagation(); window.productManager?.quickAddToCart('${productId}')`
            : `event.stopPropagation(); window.productManager?.quickAddToCart('${productId}')`;

        const html = `
            <div class="product-image">
                ${imageContent}
            </div>
            <div class="product-info">
                <h3 class="product-title">${productName}</h3>
                <p class="product-price">From $${basePrice.toFixed(2)} USD</p>
                <p class="product-description">${productDescription}</p>
                <button class="add-to-cart-btn" onclick="${buttonOnClick}">Add to Cart</button>
            </div>
            ${!product.inStock ? '<div class="out-of-stock">Out of Stock</div>' : ''}
        `;

        this.cache.set(cacheKey, html);
        
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        return html;
    }

    openProductModal(product) {
        const modal = document.getElementById('product-modal');
        if (!modal) {
            console.error('Product modal not found');
            return;
        }

        // Set basic product info
        const modalImage = document.getElementById('modal-product-image');
        const modalTitle = document.getElementById('modal-product-title');
        const modalDescription = document.getElementById('modal-product-description');

        if (modalImage) modalImage.src = product.imageUrl || '';
        if (modalTitle) modalTitle.textContent = product.name;
        if (modalDescription) modalDescription.textContent = product.description || '';

        // Dynamically populate size options for all products
        const sizeButtons = modal.querySelector('.size-buttons');
        
        if (sizeButtons && product.sizeOptions && product.sizeOptions.length > 0) {
            sizeButtons.innerHTML = '';
            product.sizeOptions.forEach((size, index) => {
                const button = document.createElement('button');
                button.className = `size-btn ${index === 0 ? 'active' : ''}`;
                button.setAttribute('data-size', size.name);
                button.setAttribute('data-price', size.price);
                button.textContent = `${size.name} - $${size.price.toFixed(2)}`;
                button.onclick = () => this.selectSize(button, size.price);
                sizeButtons.appendChild(button);
            });
            
            const modalPrice = document.getElementById('modal-product-price');
            const totalPrice = document.getElementById('total-price');
            if (modalPrice) modalPrice.textContent = `$${product.sizeOptions[0].price.toFixed(2)}`;
            if (totalPrice) totalPrice.textContent = product.sizeOptions[0].price.toFixed(2);
        } else {
            // Fallback for products without size options
            const defaultPrice = product.price || 15.00;
            if (sizeButtons) {
                sizeButtons.innerHTML = `
                    <button class="size-btn active" data-size="standard" data-price="${defaultPrice}">Standard - $${defaultPrice.toFixed(2)}</button>
                `;
            }
            const modalPrice = document.getElementById('modal-product-price');
            const totalPrice = document.getElementById('total-price');
            if (modalPrice) modalPrice.textContent = `$${defaultPrice.toFixed(2)}`;
            if (totalPrice) totalPrice.textContent = defaultPrice.toFixed(2);
        }

        // Reset quantity to 1
        const quantityInput = document.getElementById('quantity');
        if (quantityInput) quantityInput.value = 1;

        // Show the modal
        modal.style.display = 'block';
        modal.setAttribute('data-current-product', product.id);

        // Set up the add to cart button
        const addToCartBtn = modal.querySelector('.add-to-cart-btn, #add-to-cart-btn, [data-action="add-to-cart"]');
        if (addToCartBtn) {
            addToCartBtn.replaceWith(addToCartBtn.cloneNode(true));
            const newAddToCartBtn = modal.querySelector('.add-to-cart-btn, #add-to-cart-btn, [data-action="add-to-cart"]');
            newAddToCartBtn.onclick = () => this.addModalProductToCart(product);
        }
    }

    addModalProductToCart(product) {
        const modal = document.getElementById('product-modal');
        if (!modal) return;

        const quantity = parseInt(document.getElementById('quantity')?.value) || 1;
        const activeSize = modal.querySelector('.size-btn.active');
        
        if (!activeSize) {
            alert('Please select a size option');
            return;
        }

        const sizeName = activeSize.getAttribute('data-size');
        const sizePrice = parseFloat(activeSize.getAttribute('data-price'));

        if (!product.inStock) {
            alert('Sorry, this product is out of stock.');
            return;
        }

        const cartItem = {
            id: product.id,
            name: product.name,
            price: sizePrice,
            quantity: quantity,
            size: sizeName,
            image: product.imageUrl || '',
            isCustom: false
        };

        if (window.productManager) {
            window.productManager.addToCartHandler(cartItem);
            window.productManager.showAddToCartConfirmation(product.name, quantity);
        } else {
            this.addToFallbackCart(cartItem);
            this.showAddToCartConfirmation(product.name, quantity);
        }

        modal.style.display = 'none';
    }

    addToFallbackCart(item) {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingIndex = cart.findIndex(cartItem => 
            cartItem.id === item.id && 
            cartItem.size === item.size
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

    selectSize(button, price) {
        const modal = document.getElementById('product-modal');
        if (!modal) return;
        
        modal.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const quantity = parseInt(document.getElementById('quantity')?.value) || 1;
        const total = (price * quantity).toFixed(2);
        const totalPriceElement = document.getElementById('total-price');
        if (totalPriceElement) {
            totalPriceElement.textContent = total;
        }
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
            sizeOptions: [
                { name: '8oz Candle', price: price },
                { name: '10oz Candle', price: price + 1 },
                { name: '16oz Candle', price: price + 7 }
            ],
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

        this.adminPanel.openProductModal(product);
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

        const defaultSize = product.sizeOptions && product.sizeOptions.length > 0 
            ? product.sizeOptions[0] 
            : { name: 'Standard', price: product.price || 15.00 };

        const cartItem = {
            id: product.id,
            name: product.name,
            price: defaultSize.price,
            quantity: 1,
            size: defaultSize.name,
            image: product.imageUrl || '', 
            isCustom: false
        };

        console.log('Adding to cart:', cartItem);

        this.addToCartHandler(cartItem);
        this.showAddToCartConfirmation(product.name, 1);
    }

    validateProduct(product) {
        if (!product || typeof product !== 'object') {
            console.error('Invalid product object');
            return false;
        }
        
        if (!product.name || typeof product.name !== 'string' || product.name.trim() === '') {
            console.error('Invalid product name:', product.name);
            return false;
        }
        
        if (!product.id || typeof product.id !== 'string' || product.id.trim() === '') {
            console.error('Invalid product ID:', product.id);
            return false;
        }
        
        return true;
    }

    findProduct(productId) {
        return this.adminPanel.allProducts.find(p => p.id === productId);
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
            cartItem.size === item.size
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