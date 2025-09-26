// Production-Ready Admin Panel
// File: public/script/admin-panel.js

class AdminPanel {
    constructor() {
        // Production configuration
        this.config = {
            allowedIPs: [
                '104.28.33.73', '172.59.196.158', '104.179.159.180'
            ],
            apiBaseUrl: 'https://adminbackend-4ils.onrender.com',
            ipCheckEndpoints: [
                'https://api.ipify.org?format=json',
                'https://ipapi.co/json/',
                'https://ipinfo.io/json'
            ],
            updateInterval: 60000, // 1 minute
            maxRetries: 3,
            retryDelay: 1000
        };

        // State management
        this.state = {
            currentUserIP: null,
            isAdmin: false,
            isEditMode: false,
            serverConnected: false,
            editableElements: new Map(),
            originalContent: new Map(),
            allProducts: [],
            lastContentUpdate: null,
            lastProductUpdate: null
        };

        // Cached elements
        this.elements = {};
        
        // Intervals and timeouts
        this.updateCheckInterval = null;
        this.retryTimeouts = [];

        this.init();
    }

    // =========== INITIALIZATION ===========
    async init() {
        try {
            console.log('Initializing Admin Panel...');
            
            // Load existing content and products for all users first
            await Promise.allSettled([
                this.loadContentForAllUsers(),
                this.loadProductsForAllUsers()
            ]);
            
            // Check admin privileges
            await this.checkAdminStatus();
            
            if (this.state.isAdmin) {
                await this.initializeAdminFeatures();
            }
            
            // Start update monitoring for all users
            this.startUpdateMonitoring();
            
            console.log(`Admin Panel initialized - Admin: ${this.state.isAdmin}`);
            
        } catch (error) {
            console.error('Admin Panel initialization failed:', error);
            // Graceful fallback for regular users
            if (!this.state.isAdmin) {
                this.loadFallbackData();
            }
        }
    }

    async checkAdminStatus() {
        try {
            // Get user IP
            await this.detectUserIP();
            
            // Check localhost first
            const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
            
            if (isLocalhost) {
                this.state.isAdmin = true;
                console.log('Admin access granted - localhost');
                return;
            }

            // Check against allowed IPs
            if (this.config.allowedIPs.includes(this.state.currentUserIP)) {
                // Verify with backend if available
                if (await this.verifyAdminWithBackend()) {
                    this.state.isAdmin = true;
                    console.log('Admin access granted - IP verified');
                } else {
                    console.warn('IP allowed but backend verification failed');
                }
            }
            
        } catch (error) {
            console.error('Admin status check failed:', error);
            this.state.isAdmin = false;
        }
    }

    async detectUserIP() {
        for (const endpoint of this.config.ipCheckEndpoints) {
            try {
                const response = await this.fetchWithTimeout(endpoint, 5000);
                const data = await response.json();
                this.state.currentUserIP = data.ip || data.query;
                
                if (this.state.currentUserIP) {
                    console.log('IP detected:', this.state.currentUserIP);
                    return;
                }
            } catch (error) {
                console.warn(`IP detection failed for ${endpoint}:`, error);
                continue;
            }
        }
        throw new Error('Failed to detect IP address');
    }

    async verifyAdminWithBackend() {
        try {
            const response = await this.fetchWithTimeout(`${this.config.apiBaseUrl}/api/admin/verify`, 5000, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip: this.state.currentUserIP })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.state.serverConnected = true;
                return result.authorized === true;
            }
        } catch (error) {
            console.warn('Backend admin verification failed:', error);
            this.state.serverConnected = false;
        }
        return false;
    }

    // =========== CONTENT MANAGEMENT ===========
    async loadContentForAllUsers() {
        const pageName = this.getPageIdentifier();
        
        try {
            // Try server first
            const response = await this.fetchWithTimeout(`${this.config.apiBaseUrl}/api/content/${pageName}`, 5000);
            
            if (response.ok) {
                const serverContent = await response.json();
                this.applyContentToPage(serverContent);
                console.log('Content loaded from server');
                return;
            }
        } catch (error) {
            console.log('Server content unavailable, using local fallback');
        }

        // Fallback to localStorage
        try {
            const savedContent = localStorage.getItem(`admin_content_${pageName}`);
            if (savedContent) {
                this.applyContentToPage(JSON.parse(savedContent));
                console.log('Content loaded from localStorage');
            }
        } catch (error) {
            console.error('Failed to load local content:', error);
        }
    }

    // =========== PRODUCT MANAGEMENT ===========
    async loadProductsForAllUsers() {
        console.log('Loading products...');
        
        // Find all product containers
        const productContainers = this.findProductContainers();
        
        if (productContainers.length === 0) {
            console.log('No product containers found on this page');
            return;
        }

        let products = [];

        // Load from multiple sources
        const loadPromises = [
            this.loadServerProducts(),
            this.loadLocalProducts(),
            this.loadCachedProducts()
        ];

        const results = await Promise.allSettled(loadPromises);
        
        // Combine results
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                products = [...products, ...result.value];
                console.log(`Source ${index} loaded ${result.value.length} products`);
            }
        });

        // Deduplicate by ID
        products = this.deduplicateProducts(products);
        
        // Cache and render
        this.state.allProducts = products;
        if (products.length > 0) {
            localStorage.setItem('cached_all_products', JSON.stringify(products));
            this.renderProductsToContainers(products, productContainers);
            console.log(`Rendered ${products.length} products to ${productContainers.length} containers`);
        } else {
            this.renderEmptyProductState(productContainers);
        }
    }

    findProductContainers() {
        const selectors = [
            '[data-admin-products="true"]',
            '.products-grid',
            '.product-grid', 
            '.featured-products',
            '.shop-grid',
            '[data-products]'
        ];
        
        const containers = [];
        selectors.forEach(selector => {
            containers.push(...document.querySelectorAll(selector));
        });
        
        // Remove duplicates
        return [...new Set(containers)];
    }

    async loadServerProducts() {
        try {
            const response = await this.fetchWithTimeout(`${this.config.apiBaseUrl}/api/products/list`, 8000);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Server products unavailable');
        }
        return [];
    }

    async loadLocalProducts() {
        try {
            return JSON.parse(localStorage.getItem('admin_products') || '[]');
        } catch (error) {
            console.error('Failed to load local products:', error);
            return [];
        }
    }

    async loadCachedProducts() {
        try {
            return JSON.parse(localStorage.getItem('cached_all_products') || '[]');
        } catch (error) {
            return [];
        }
    }

    deduplicateProducts(products) {
        const seen = new Set();
        return products.filter(product => {
            if (!product.id || seen.has(product.id)) {
                return false;
            }
            seen.add(product.id);
            return true;
        });
    }

    renderProductsToContainers(products, containers) {
        containers.forEach(container => {
            if (!container) return;
            
            try {
                const productsHTML = products
                    .filter(product => this.shouldShowProduct(product, container))
                    .map(product => this.createProductHTML(product))
                    .join('');
                
                if (productsHTML) {
                    container.innerHTML = productsHTML;
                    this.addProductEventListeners(container);
                } else {
                    this.renderEmptyProductState([container]);
                }
            } catch (error) {
                console.error('Failed to render products to container:', error);
                this.renderErrorState([container]);
            }
        });
    }

    shouldShowProduct(product, container) {
        // Check if product should be shown in this container
        if (!product || !product.name) return false;
        
        // Check container-specific filters
        const containerType = container.getAttribute('data-product-type');
        if (containerType && product.category !== containerType) return false;
        
        // Check featured products
        if (container.classList.contains('featured-products') && !product.featured) return false;
        
        // Check stock status
        if (container.getAttribute('data-hide-out-of-stock') === 'true' && !product.inStock) return false;
        
        return true;
    }

    createProductHTML(product) {
        const safeProduct = this.sanitizeProduct(product);
        
        return `
            <div class="product-card" 
                 data-product-id="${safeProduct.id}" 
                 onclick="window.productManager?.openProductDetail('${safeProduct.id}')"
                 role="button" 
                 tabindex="0"
                 aria-label="View ${safeProduct.name} details">
                
                <div class="product-image">
                    ${safeProduct.imageUrl ? 
                        `<img src="${safeProduct.imageUrl}" 
                             alt="${safeProduct.name}" 
                             loading="lazy" 
                             onerror="this.parentNode.innerHTML='<div class=\\"product-emoji\\">${safeProduct.emoji}</div>'">` :
                        `<div class="product-emoji" aria-hidden="true">${safeProduct.emoji}</div>`
                    }
                    ${safeProduct.featured ? '<div class="featured-badge">Featured</div>' : ''}
                    ${!safeProduct.inStock ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
                </div>
                
                <div class="product-info">
                    <h3 class="product-title">${safeProduct.name}</h3>
                    ${safeProduct.description ? `<p class="product-description">${safeProduct.description}</p>` : ''}
                    
                    <div class="product-price-container">
                        <span class="product-price">$${safeProduct.price}</span>
                        ${safeProduct.category ? `<span class="product-category">${this.formatCategory(safeProduct.category)}</span>` : ''}
                    </div>
                    
                    <div class="product-actions">
                        <button class="btn-add-to-cart" 
                                onclick="event.stopPropagation(); window.productManager?.addToCart('${safeProduct.id}', 1)"
                                ${!safeProduct.inStock ? 'disabled' : ''}
                                aria-label="Add ${safeProduct.name} to cart">
                            ${safeProduct.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                        
                        <button class="btn-view-details" 
                                onclick="event.stopPropagation(); window.productManager?.openProductDetail('${safeProduct.id}')"
                                aria-label="View ${safeProduct.name} details">
                            Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    sanitizeProduct(product) {
        return {
            id: this.escapeHtml(product.id || ''),
            name: this.escapeHtml(product.name || 'Unnamed Product'),
            description: this.escapeHtml(product.description || ''),
            price: (parseFloat(product.price) || 0).toFixed(2),
            emoji: this.escapeHtml(product.emoji || '🛍️'),
            category: this.escapeHtml(product.category || ''),
            imageUrl: product.imageUrl && this.isValidUrl(product.imageUrl) ? product.imageUrl : null,
            inStock: Boolean(product.inStock !== false),
            featured: Boolean(product.featured)
        };
    }

    addProductEventListeners(container) {
        // Add keyboard navigation support
        container.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });
    }

    renderEmptyProductState(containers) {
        const emptyHTML = `
            <div class="no-products-state">
                <div class="no-products-icon">🛍️</div>
                <h3>No Products Available</h3>
                <p>Products will appear here when added.</p>
                ${this.state.isAdmin ? '<p><small>Use the admin panel to add products</small></p>' : ''}
            </div>
        `;
        
        containers.forEach(container => {
            if (container) container.innerHTML = emptyHTML;
        });
    }

    renderErrorState(containers) {
        const errorHTML = `
            <div class="products-error-state">
                <div class="error-icon">⚠️</div>
                <h3>Unable to Load Products</h3>
                <p>Please refresh the page to try again.</p>
                <button onclick="window.location.reload()" class="retry-btn">Refresh Page</button>
            </div>
        `;
        
        containers.forEach(container => {
            if (container) container.innerHTML = errorHTML;
        });
    }

    // =========== ADMIN FEATURES ===========
    async initializeAdminFeatures() {
        try {
            console.log('Initializing admin features...');
            
            this.createAdminPanel();
            this.setupEditableElements();
            this.setupAdminEventListeners();
            this.addAdminStyles();
            
            // Wait for modals to load
            this.waitForAdminModals();
            
            console.log('Admin features initialized');
        } catch (error) {
            console.error('Failed to initialize admin features:', error);
        }
    }

    createAdminPanel() {
        // Remove existing panel
        const existingPanel = document.getElementById('admin-panel');
        if (existingPanel) existingPanel.remove();

        const productCount = this.state.allProducts.length;
        const editableCount = this.state.editableElements.size;

        const adminHTML = `
            <div id="admin-panel" class="admin-panel">
                <div class="admin-header" id="admin-header">
                    <div class="admin-title">
                        <span class="admin-icon">⚙️</span>
                        ADMIN PANEL
                    </div>
                    <button id="admin-close-btn" class="admin-close-btn" aria-label="Close admin panel">×</button>
                </div>
                
                <div class="admin-content">
                    <div class="admin-section">
                        <h3>Content Editor</h3>
                        <div class="admin-buttons">
                            <button id="toggle-edit-mode" class="admin-btn admin-btn-primary">
                                <span class="btn-icon">✏️</span>
                                Enable Edit Mode
                            </button>
                            <button id="save-changes" class="admin-btn admin-btn-success" disabled>
                                <span class="btn-icon">💾</span>
                                Save Changes
                            </button>
                            <button id="reset-content" class="admin-btn admin-btn-danger">
                                <span class="btn-icon">🔄</span>
                                Reset Content
                            </button>
                        </div>
                    </div>

                    <div class="admin-section">
                        <h3>Product Management</h3>
                        <div class="admin-stats">
                            <span class="stat-item">
                                <span class="stat-number">${productCount}</span>
                                <span class="stat-label">Products</span>
                            </span>
                        </div>
                        <div class="admin-buttons">
                            <button id="add-product" class="admin-btn admin-btn-primary">
                                <span class="btn-icon">➕</span>
                                Add Product
                            </button>
                            <button id="manage-products" class="admin-btn admin-btn-secondary" ${productCount === 0 ? 'disabled' : ''}>
                                <span class="btn-icon">📝</span>
                                Manage Products
                            </button>
                            <button id="refresh-products" class="admin-btn admin-btn-secondary">
                                <span class="btn-icon">🔄</span>
                                Refresh
                            </button>
                        </div>
                    </div>

                    <div class="admin-section">
                        <h3>System Status</h3>
                        <div class="admin-status">
                            <div class="status-item">
                                <span class="status-label">Connection:</span>
                                <span class="status-value ${this.state.serverConnected ? 'status-success' : 'status-warning'}">
                                    ${this.state.serverConnected ? 'Connected' : 'Local Only'}
                                </span>
                            </div>
                            <div class="status-item">
                                <span class="status-label">Page:</span>
                                <span class="status-value">${this.getPageIdentifier()}</span>
                            </div>
                            <div class="status-item">
                                <span class="status-label">Editable:</span>
                                <span class="status-value">${editableCount} elements</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button id="admin-toggle" class="admin-toggle" aria-label="Open admin panel">
                <span class="toggle-icon">⚙️</span>
                <span class="toggle-text">Admin</span>
            </button>
            
            <div id="edit-overlay" class="edit-overlay" style="display: none;">
                <div class="edit-toolbar">
                    <span class="toolbar-text">
                        <span class="toolbar-icon">✏️</span>
                        Edit Mode Active - Click elements to edit
                    </span>
                    <button id="exit-edit-mode" class="toolbar-btn">Exit Edit Mode</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', adminHTML);
        
        // Make panel draggable
        this.makeDraggable();
    }

    setupAdminEventListeners() {
        // Cache elements
        this.elements = {
            adminPanel: document.getElementById('admin-panel'),
            adminToggle: document.getElementById('admin-toggle'),
            closeBtn: document.getElementById('admin-close-btn'),
            toggleEditMode: document.getElementById('toggle-edit-mode'),
            saveChanges: document.getElementById('save-changes'),
            resetContent: document.getElementById('reset-content'),
            addProduct: document.getElementById('add-product'),
            manageProducts: document.getElementById('manage-products'),
            refreshProducts: document.getElementById('refresh-products'),
            editOverlay: document.getElementById('edit-overlay'),
            exitEditMode: document.getElementById('exit-edit-mode')
        };

        // Add event listeners with error handling
        this.safeAddEventListener(this.elements.closeBtn, 'click', () => this.hideAdminPanel());
        this.safeAddEventListener(this.elements.adminToggle, 'click', () => this.showAdminPanel());
        this.safeAddEventListener(this.elements.toggleEditMode, 'click', () => this.toggleEditMode());
        this.safeAddEventListener(this.elements.exitEditMode, 'click', () => this.exitEditMode());
        this.safeAddEventListener(this.elements.saveChanges, 'click', () => this.saveChanges());
        this.safeAddEventListener(this.elements.resetContent, 'click', () => this.resetContent());
        this.safeAddEventListener(this.elements.addProduct, 'click', () => this.showAddProductModal());
        this.safeAddEventListener(this.elements.manageProducts, 'click', () => this.showManageProductsModal());
        this.safeAddEventListener(this.elements.refreshProducts, 'click', () => this.loadProductsForAllUsers());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'a' && this.state.isAdmin) {
                e.preventDefault();
                this.toggleAdminPanel();
            }
            
            if (e.key === 'Escape') {
                if (this.state.isEditMode) {
                    this.exitEditMode();
                }
            }
        });
    }

    safeAddEventListener(element, event, handler) {
        if (element && typeof handler === 'function') {
            element.addEventListener(event, handler);
        }
    }

    setupEditableElements() {
        const selectors = [
            '.hero-content h1',
            '.hero-tagline', 
            '.section-title',
            '.section-subtitle',
            '.faq-question',
            '.faq-answer',
            '.footer-section p',
            '.review-text',
            '[data-editable="true"]'
        ];

        this.state.editableElements.clear();
        this.state.originalContent.clear();

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach((element, index) => {
                // Skip elements inside product cards or admin panel
                if (element.closest('.product-card, .admin-panel')) return;
                
                const elementId = `${selector.replace(/[^a-zA-Z0-9]/g, '_')}_${index}`;
                element.setAttribute('data-admin-id', elementId);
                element.setAttribute('data-admin-editable', 'true');
                
                this.state.editableElements.set(elementId, element);
                this.state.originalContent.set(elementId, element.innerHTML);
            });
        });

        console.log(`Found ${this.state.editableElements.size} editable elements`);
    }

    // =========== ADMIN ACTIONS ===========
    toggleAdminPanel() {
        if (this.elements.adminPanel.style.display === 'none') {
            this.showAdminPanel();
        } else {
            this.hideAdminPanel();
        }
    }

    showAdminPanel() {
        if (this.elements.adminPanel) {
            this.elements.adminPanel.style.display = 'block';
            this.elements.adminPanel.classList.remove('hidden');
        }
    }

    hideAdminPanel() {
        if (this.elements.adminPanel) {
            this.elements.adminPanel.style.display = 'none';
            this.elements.adminPanel.classList.add('hidden');
        }
    }

    toggleEditMode() {
        this.state.isEditMode = !this.state.isEditMode;
        
        if (this.state.isEditMode) {
            this.enterEditMode();
        } else {
            this.exitEditMode();
        }
    }

    enterEditMode() {
        this.state.isEditMode = true;
        document.body.classList.add('admin-edit-mode');
        
        if (this.elements.toggleEditMode) {
            this.elements.toggleEditMode.innerHTML = '<span class="btn-icon">👁️</span>Disable Edit Mode';
        }
        
        if (this.elements.saveChanges) {
            this.elements.saveChanges.disabled = false;
        }
        
        if (this.elements.editOverlay) {
            this.elements.editOverlay.style.display = 'block';
        }

        // Add edit functionality to elements
        this.state.editableElements.forEach((element, id) => {
            element.classList.add('admin-editable-active');
            element.addEventListener('click', () => this.editElement(id));
            element.title = 'Click to edit';
        });
    }

    exitEditMode() {
        this.state.isEditMode = false;
        document.body.classList.remove('admin-edit-mode');
        
        if (this.elements.toggleEditMode) {
            this.elements.toggleEditMode.innerHTML = '<span class="btn-icon">✏️</span>Enable Edit Mode';
        }
        
        if (this.elements.editOverlay) {
            this.elements.editOverlay.style.display = 'none';
        }

        // Remove edit functionality
        this.state.editableElements.forEach((element) => {
            element.classList.remove('admin-editable-active');
            element.removeAttribute('title');
        });
    }

    editElement(elementId) {
        const element = this.state.editableElements.get(elementId);
        if (!element) return;

        const currentText = element.textContent || element.innerText;
        const newContent = prompt(`Edit content for: ${element.tagName}`, currentText);
        
        if (newContent !== null && newContent !== currentText) {
            element.textContent = newContent;
            
            if (this.elements.saveChanges) {
                this.elements.saveChanges.disabled = false;
                this.elements.saveChanges.classList.add('admin-btn-pulse');
            }
        }
    }

    async saveChanges() {
        const changes = {};
        let hasChanges = false;

        this.state.editableElements.forEach((element, id) => {
            const originalContent = this.state.originalContent.get(id);
            if (element.innerHTML !== originalContent) {
                changes[id] = element.innerHTML;
                hasChanges = true;
            }
        });

        if (!hasChanges) {
            this.showNotification('No changes to save', 'info');
            return;
        }

        const pageName = this.getPageIdentifier();
        
        try {
            // Show saving state
            if (this.elements.saveChanges) {
                this.elements.saveChanges.innerHTML = '<span class="btn-icon">⏳</span>Saving...';
                this.elements.saveChanges.disabled = true;
            }

            // Save to server
            let serverSuccess = false;
            if (this.state.serverConnected) {
                try {
                    const response = await this.fetchWithTimeout(`${this.config.apiBaseUrl}/api/content`, 10000, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            page: pageName,
                            changes,
                            timestamp: new Date().toISOString(),
                            ip: this.state.currentUserIP
                        })
                    });

                    serverSuccess = response.ok;
                } catch (error) {
                    console.error('Server save failed:', error);
                }
            }

            // Always save locally as backup
            localStorage.setItem(`admin_content_${pageName}`, JSON.stringify(changes));
            
            // Update original content cache
            Object.keys(changes).forEach(id => {
                this.state.originalContent.set(id, changes[id]);
            });

            // Show success
            this.showNotification(
                serverSuccess ? 'Changes saved successfully!' : 'Changes saved locally',
                serverSuccess ? 'success' : 'warning'
            );

        } catch (error) {
            console.error('Save failed:', error);
            this.showNotification('Failed to save changes', 'error');
        } finally {
            // Reset save button
            if (this.elements.saveChanges) {
                this.elements.saveChanges.innerHTML = '<span class="btn-icon">💾</span>Save Changes';
                this.elements.saveChanges.disabled = true;
                this.elements.saveChanges.classList.remove('admin-btn-pulse');
            }
        }
    }

    async resetContent() {
        if (!confirm('Reset all content to original? This cannot be undone.')) {
            return;
        }

        try {
            // Reset elements to original content
            this.state.originalContent.forEach((content, id) => {
                const element = this.state.editableElements.get(id);
                if (element) {
                    element.innerHTML = content;
                }
            });

            const pageName = this.getPageIdentifier();

            // Clear server content if connected
            if (this.state.serverConnected) {
                try {
                    await this.fetchWithTimeout(`${this.config.apiBaseUrl}/api/content/reset`, 10000, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            page: pageName,
                            ip: this.state.currentUserIP 
                        })
                    });
                } catch (error) {
                    console.error('Server reset failed:', error);
                }
            }

            // Clear local storage
            localStorage.removeItem(`admin_content_${pageName}`);
            
            if (this.elements.saveChanges) {
                this.elements.saveChanges.disabled = true;
            }

            this.showNotification('Content reset successfully', 'success');

        } catch (error) {
            console.error('Reset failed:', error);
            this.showNotification('Failed to reset content', 'error');
        }
    }

    // =========== PRODUCT MODAL HANDLERS ===========
    showAddProductModal() {
        if (window.adminModals && window.adminModals.showAddProductModal) {
            window.adminModals.showAddProductModal();
        } else {
            this.showFallbackAddProduct();
        }
    }

    showManageProductsModal() {
        if (window.adminModals && window.adminModals.showEditProductsModal) {
            window.adminModals.showEditProductsModal();
        } else {
            this.showNotification('Product management modal loading...', 'info');
            setTimeout(() => this.showManageProductsModal(), 1000);
        }
    }

    showFallbackAddProduct() {
        // Simple fallback for adding products
        const name = prompt('Product Name:');
        if (!name) return;

        const priceStr = prompt('Product Price (e.g., 25.00):');
        const price = parseFloat(priceStr);
        if (!price || price <= 0) {
            alert('Please enter a valid price');
            return;
        }

        const description = prompt('Product Description (optional):') || `Premium ${name}`;
        const category = prompt('Category (candles/wax-melts/room-sprays/etc):', 'candles') || 'candles';

        const productData = {
            id: this.generateProductId(name),
            name: name,
            price: price,
            description: description,
            category: category,
            emoji: '🕯️',
            featured: false,
            inStock: true,
            createdAt: new Date().toISOString(),
            createdBy: 'admin-fallback'
        };

        this.addProduct(productData);
    }

    async addProduct(productData) {
        if (!this.state.isAdmin) return false;

        try {
            // Add to local storage first
            const existingProducts = JSON.parse(localStorage.getItem('admin_products') || '[]');
            existingProducts.push(productData);
            localStorage.setItem('admin_products', JSON.stringify(existingProducts));
            
            // Try server save
            if (this.state.serverConnected) {
                try {
                    const response = await this.fetchWithTimeout(`${this.config.apiBaseUrl}/api/products`, 10000, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(productData)
                    });
                    
                    if (response.ok) {
                        console.log('Product saved to server');
                    }
                } catch (error) {
                    console.warn('Server product save failed:', error);
                }
            }
            
            // Reload products immediately
            await this.loadProductsForAllUsers();
            this.updateAdminPanelStats();
            
            this.showNotification(`Product "${productData.name}" added successfully!`, 'success');
            return true;

        } catch (error) {
            console.error('Failed to add product:', error);
            this.showNotification('Failed to add product', 'error');
            return false;
        }
    }

    updateAdminPanelStats() {
        const productCount = this.state.allProducts.length;
        const statNumber = document.querySelector('.stat-number');
        if (statNumber) {
            statNumber.textContent = productCount;
        }
        
        const manageBtn = document.getElementById('manage-products');
        if (manageBtn) {
            manageBtn.disabled = productCount === 0;
        }
    }

    // =========== UPDATE MONITORING ===========
    startUpdateMonitoring() {
        if (this.updateCheckInterval) {
            clearInterval(this.updateCheckInterval);
        }

        // Check for updates periodically
        this.updateCheckInterval = setInterval(() => {
            this.checkForUpdates();
        }, this.config.updateInterval);

        // Initial check
        setTimeout(() => this.checkForUpdates(), 5000);
    }

    async checkForUpdates() {
        if (!this.state.serverConnected) return;

        try {
            const response = await this.fetchWithTimeout(`${this.config.apiBaseUrl}/api/timestamps`, 5000);
            if (!response.ok) return;

            const timestamps = await response.json();
            
            // Check for content updates
            if (timestamps.content && timestamps.content !== this.state.lastContentUpdate) {
                this.state.lastContentUpdate = timestamps.content;
                await this.loadContentForAllUsers();
                
                if (!this.state.isAdmin) {
                    this.showNotification('Content updated!', 'info');
                }
            }

            // Check for product updates  
            if (timestamps.products && timestamps.products !== this.state.lastProductUpdate) {
                this.state.lastProductUpdate = timestamps.products;
                await this.loadProductsForAllUsers();
                
                if (!this.state.isAdmin) {
                    this.showNotification('Products updated!', 'info');
                }
            }

        } catch (error) {
            // Silently fail for update checks
            if (error.name !== 'AbortError') {
                console.warn('Update check failed:', error);
            }
        }
    }

    // =========== UTILITY METHODS ===========
    async fetchWithTimeout(url, timeout = 5000, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    getPageIdentifier() {
        const path = window.location.pathname;
        let page = path.split('/').pop() || 'index.html';
        if (!page.includes('.')) page += '.html';
        return page.replace('.html', '');
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
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    applyContentToPage(changes) {
        if (!changes || typeof changes !== 'object') return;

        Object.keys(changes).forEach(elementId => {
            if (elementId === 'lastModified' || elementId === 'modifiedBy') return;
            
            const element = document.querySelector(`[data-admin-id="${elementId}"]`);
            if (element && changes[elementId]) {
                element.innerHTML = changes[elementId];
            }
        });
    }

    loadFallbackData() {
        // Load cached data for regular users when server fails
        const pageName = this.getPageIdentifier();
        
        try {
            const savedContent = localStorage.getItem(`admin_content_${pageName}`);
            if (savedContent) {
                this.applyContentToPage(JSON.parse(savedContent));
            }
            
            const cachedProducts = localStorage.getItem('cached_all_products');
            if (cachedProducts) {
                this.state.allProducts = JSON.parse(cachedProducts);
                const containers = this.findProductContainers();
                if (containers.length > 0) {
                    this.renderProductsToContainers(this.state.allProducts, containers);
                }
            }
        } catch (error) {
            console.error('Fallback data load failed:', error);
        }
    }

    waitForAdminModals() {
        let attempts = 0;
        const maxAttempts = 20;
        
        const checkModals = () => {
            attempts++;
            
            if (window.adminModals) {
                console.log('Admin modals loaded');
                return;
            }
            
            if (attempts < maxAttempts) {
                setTimeout(checkModals, 500);
            } else {
                console.warn('Admin modals failed to load');
            }
        };
        
        checkModals();
    }

    makeDraggable() {
        const header = document.getElementById('admin-header');
        const panel = document.getElementById('admin-panel');
        
        if (!header || !panel) return;

        let isDragging = false;
        let currentX = 0;
        let currentY = 0;
        let initialX = 0;
        let initialY = 0;

        header.addEventListener('mousedown', (e) => {
            initialX = e.clientX - currentX;
            initialY = e.clientY - currentY;
            isDragging = true;
            header.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                
                panel.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'grab';
            }
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `admin-notification admin-notification-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${this.escapeHtml(message)}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, type === 'error' ? 5000 : 3000);
    }

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
                width: 350px;
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                color: white;
                border-radius: 16px;
                box-shadow: 0 25px 50px rgba(0,0,0,0.4);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255,255,255,0.1);
                transition: all 0.3s ease;
            }

            .admin-panel.hidden {
                display: none;
            }

            .admin-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                background: linear-gradient(135deg, #8B7355 0%, #6d5a42 100%);
                border-radius: 16px 16px 0 0;
                cursor: grab;
                user-select: none;
            }

            .admin-header:active {
                cursor: grabbing;
            }

            .admin-title {
                font-weight: 700;
                font-size: 14px;
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .admin-close-btn {
                width: 28px;
                height: 28px;
                border: none;
                background: rgba(255,255,255,0.2);
                color: white;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                transition: background 0.2s ease;
            }

            .admin-close-btn:hover {
                background: rgba(255,255,255,0.3);
            }

            .admin-content {
                padding: 20px;
                max-height: 70vh;
                overflow-y: auto;
            }

            .admin-section {
                margin-bottom: 24px;
            }

            .admin-section h3 {
                font-size: 13px;
                margin: 0 0 12px 0;
                color: #8B7355;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                font-weight: 600;
            }

            .admin-buttons {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .admin-btn {
                padding: 10px 16px;
                border: none;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                justify-content: center;
                background: #333;
                color: white;
                border: 1px solid #555;
            }

            .admin-btn:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }

            .admin-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }

            .admin-btn-primary {
                background: linear-gradient(135deg, #8B7355 0%, #6d5a42 100%);
                border-color: #8B7355;
            }

            .admin-btn-success {
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
                border-color: #059669;
            }

            .admin-btn-danger {
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                border-color: #dc2626;
            }

            .admin-btn-secondary {
                background: #444;
                border-color: #666;
            }

            .admin-btn-pulse {
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            .admin-stats {
                display: flex;
                gap: 16px;
                margin-bottom: 16px;
                padding: 12px;
                background: rgba(139, 115, 85, 0.1);
                border-radius: 8px;
            }

            .stat-item {
                text-align: center;
                flex: 1;
            }

            .stat-number {
                display: block;
                font-size: 24px;
                font-weight: 700;
                color: #8B7355;
            }

            .stat-label {
                font-size: 11px;
                color: #999;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .admin-status {
                font-size: 12px;
                line-height: 1.6;
            }

            .status-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 6px;
            }

            .status-label {
                color: #999;
            }

            .status-value {
                font-weight: 500;
            }

            .status-success {
                color: #10b981;
            }

            .status-warning {
                color: #f59e0b;
            }

            .admin-toggle {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #8B7355 0%, #6d5a42 100%);
                border-radius: 12px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                cursor: pointer;
                z-index: 9999;
                transition: all 0.3s ease;
                box-shadow: 0 8px 25px rgba(139,115,85,0.4);
                color: white;
                font-weight: 600;
                border: none;
            }

            .admin-toggle:hover {
                transform: scale(1.1) translateY(-2px);
                box-shadow: 0 12px 35px rgba(139,115,85,0.5);
            }

            .toggle-icon {
                font-size: 20px;
                margin-bottom: 2px;
            }

            .toggle-text {
                font-size: 10px;
                letter-spacing: 0.3px;
            }

            /* Edit Mode Styles */
            .edit-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(139,115,85,0.05);
                z-index: 9998;
                pointer-events: none;
                backdrop-filter: blur(1px);
            }

            .edit-toolbar {
                position: fixed;
                top: 20px;
                left: 20px;
                background: linear-gradient(135deg, #8B7355 0%, #6d5a42 100%);
                color: white;
                padding: 12px 20px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                gap: 16px;
                z-index: 9999;
                pointer-events: all;
                box-shadow: 0 8px 25px rgba(0,0,0,0.2);
                font-size: 14px;
                font-weight: 500;
            }

            .toolbar-text {
                display: flex;
                align-items: center;
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
                transition: background 0.2s ease;
            }

            .toolbar-btn:hover {
                background: rgba(255,255,255,0.3);
            }

            /* Editable Elements */
            .admin-editable-active {
                position: relative;
                cursor: pointer !important;
                outline: 2px dashed #8B7355 !important;
                background: rgba(139,115,85,0.1) !important;
                transition: all 0.2s ease;
            }

            .admin-editable-active:hover {
                background: rgba(139,115,85,0.2) !important;
                outline-color: #6d5a42 !important;
            }

            .admin-editable-active::before {
                content: '✏️';
                position: absolute;
                top: -8px;
                right: -8px;
                background: #8B7355;
                color: white;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                z-index: 1000;
            }

            /* Product Grid Styles */
            .product-card {
                background: white;
                border: 1px solid #e5e5e5;
                border-radius: 12px;
                padding: 16px;
                text-align: center;
                transition: all 0.3s ease;
                cursor: pointer;
                position: relative;
                overflow: hidden;
            }

            .product-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 30px rgba(0,0,0,0.15);
                border-color: #8B7355;
            }

            .product-image {
                position: relative;
                margin-bottom: 12px;
            }

            .product-emoji {
                font-size: 48px;
                display: block;
                margin-bottom: 8px;
            }

            .product-image img {
                width: 100%;
                height: 200px;
                object-fit: cover;
                border-radius: 8px;
            }

            .featured-badge, .out-of-stock-badge {
                position: absolute;
                top: 8px;
                right: 8px;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .featured-badge {
                background: #8B7355;
                color: white;
            }

            .out-of-stock-badge {
                background: #dc2626;
                color: white;
            }

            .product-title {
                font-size: 18px;
                font-weight: 600;
                margin: 0 0 8px 0;
                color: #1a1a1a;
            }

            .product-description {
                font-size: 14px;
                color: #666;
                margin: 0 0 12px 0;
                line-height: 1.4;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .product-price-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }

            .product-price {
                font-size: 20px;
                font-weight: 700;
                color: #8B7355;
            }

            .product-category {
                font-size: 12px;
                color: #999;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .product-actions {
                display: flex;
                gap: 8px;
            }

            .btn-add-to-cart, .btn-view-details {
                flex: 1;
                padding: 10px 12px;
                border: none;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .btn-add-to-cart {
                background: #8B7355;
                color: white;
            }

            .btn-add-to-cart:hover:not(:disabled) {
                background: #6d5a42;
                transform: translateY(-1px);
            }

            .btn-add-to-cart:disabled {
                background: #ccc;
                cursor: not-allowed;
                transform: none;
            }

            .btn-view-details {
                background: transparent;
                color: #8B7355;
                border: 2px solid #8B7355;
            }

            .btn-view-details:hover {
                background: #8B7355;
                color: white;
            }

            /* Empty States */
            .no-products-state, .products-error-state {
                text-align: center;
                padding: 60px 20px;
                color: #666;
            }

            .no-products-icon, .error-icon {
                font-size: 48px;
                margin-bottom: 16px;
                display: block;
            }

            .no-products-state h3, .products-error-state h3 {
                margin: 0 0 12px 0;
                color: #333;
            }

            .no-products-state p, .products-error-state p {
                margin: 0 0 16px 0;
                font-size: 14px;
                line-height: 1.5;
            }

            .retry-btn {
                background: #8B7355;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                transition: background 0.2s ease;
            }

            .retry-btn:hover {
                background: #6d5a42;
            }

            /* Notifications */
            .admin-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 20px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                z-index: 10001;
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 250px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s ease;
            }

            .admin-notification.show {
                transform: translateX(0);
                opacity: 1;
            }

            .admin-notification-success {
                background: #059669;
                color: white;
            }

            .admin-notification-error {
                background: #dc2626;
                color: white;
            }

            .admin-notification-warning {
                background: #f59e0b;
                color: white;
            }

            .admin-notification-info {
                background: #3b82f6;
                color: white;
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .admin-panel {
                    width: calc(100vw - 40px);
                    max-width: 350px;
                    right: 20px;
                }

                .admin-toggle {
                    width: 50px;
                    height: 50px;
                    bottom: 16px;
                    right: 16px;
                }

                .edit-toolbar {
                    left: 16px;
                    right: 16px;
                    flex-direction: column;
                    gap: 12px;
                    text-align: center;
                }

                .toolbar-text {
                    justify-content: center;
                }

                .product-actions {
                    flex-direction: column;
                }

                .admin-notification {
                    right: 16px;
                    left: 16px;
                    min-width: auto;
                }
            }

            @media (max-width: 480px) {
                .admin-content {
                    padding: 16px;
                    max-height: 60vh;
                }

                .admin-btn {
                    padding: 12px 16px;
                    font-size: 14px;
                }

                .product-card {
                    padding: 12px;
                }

                .product-emoji {
                    font-size: 36px;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    // =========== CLEANUP ===========
    destroy() {
        // Clear intervals
        if (this.updateCheckInterval) {
            clearInterval(this.updateCheckInterval);
        }

        // Clear timeouts
        this.retryTimeouts.forEach(timeout => clearTimeout(timeout));

        // Remove event listeners
        document.removeEventListener('keydown', this.keydownHandler);

        // Remove admin elements
        const elementsToRemove = [
            'admin-panel',
            'admin-toggle', 
            'edit-overlay',
            'admin-panel-styles'
        ];
        
        elementsToRemove.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });

        console.log('Admin Panel destroyed');
    }
}

// Product Manager Class
class ProductManager {
    constructor(adminPanel) {
        this.adminPanel = adminPanel;
        this.currentModal = null;
    }

    openProductDetail(productId) {
        const product = this.findProduct(productId);
        if (!product) {
            console.error('Product not found:', productId);
            return;
        }

        this.showProductModal(product);
    }

    findProduct(productId) {
        return this.adminPanel.state.allProducts.find(p => p.id === productId);
    }

    showProductModal(product) {
        this.closeCurrentModal();

        const modal = document.createElement('div');
        modal.className = 'product-modal';
        modal.id = 'product-detail-modal';
        this.currentModal = modal;

        const safeProduct = this.adminPanel.sanitizeProduct(product);

        modal.innerHTML = `
            <div class="product-modal-backdrop" onclick="window.productManager.closeCurrentModal()"></div>
            <div class="product-modal-content">
                <div class="product-modal-header">
                    <h2>${safeProduct.name}</h2>
                    <button class="product-modal-close" onclick="window.productManager.closeCurrentModal()" aria-label="Close">×</button>
                </div>
                <div class="product-modal-body">
                    <div class="product-detail-image">
                        ${safeProduct.imageUrl ? 
                            `<img src="${safeProduct.imageUrl}" alt="${safeProduct.name}" loading="lazy">` :
                            `<div class="product-detail-emoji">${safeProduct.emoji}</div>`
                        }
                    </div>
                    <div class="product-detail-info">
                        <div class="product-detail-price">$${safeProduct.price}</div>
                        ${safeProduct.category ? `<div class="product-detail-category">${this.adminPanel.formatCategory(safeProduct.category)}</div>` : ''}
                        ${safeProduct.description ? `<div class="product-detail-description">${safeProduct.description}</div>` : ''}
                        
                        ${!safeProduct.inStock ? '<div class="out-of-stock-notice">This product is currently out of stock</div>' : ''}
                        
                        <div class="product-detail-actions">
                            <div class="quantity-controls">
                                <label for="product-quantity-${safeProduct.id}">Quantity:</label>
                                <select id="product-quantity-${safeProduct.id}" ${!safeProduct.inStock ? 'disabled' : ''}>
                                    ${[1,2,3,4,5,6,7,8,9,10].map(i => `<option value="${i}">${i}</option>`).join('')}
                                </select>
                            </div>
                            <button class="add-to-cart-large" 
                                    onclick="window.productManager.addToCart('${safeProduct.id}', document.getElementById('product-quantity-${safeProduct.id}').value)"
                                    ${!safeProduct.inStock ? 'disabled' : ''}
                                    aria-label="Add ${safeProduct.name} to cart">
                                ${safeProduct.inStock ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal styles if not present
        this.ensureModalStyles();
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Focus management
        const closeBtn = modal.querySelector('.product-modal-close');
        if (closeBtn) closeBtn.focus();
    }

    addToCart(productId, quantity = 1) {
        const product = this.findProduct(productId);
        if (!product) {
            console.error('Product not found for cart:', productId);
            this.adminPanel.showNotification('Product not found', 'error');
            return;
        }

        if (!product.inStock) {
            this.adminPanel.showNotification('Sorry, this product is out of stock', 'warning');
            return;
        }

        const cartItem = {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: parseInt(quantity) || 1,
            emoji: product.emoji || '🛍️',
            image: product.imageUrl,
            timestamp: Date.now()
        };

        try {
            // Try to use existing cart system
            if (window.cartManager && typeof window.cartManager.addItem === 'function') {
                window.cartManager.addItem(cartItem);
            } else if (window.addToCart && typeof window.addToCart === 'function') {
                window.addToCart(cartItem);
            } else {
                // Fallback cart handling
                this.addToFallbackCart(cartItem);
            }

            // Close modal and show confirmation
            this.closeCurrentModal();
            this.showAddToCartConfirmation(product.name, quantity);

            console.log('Added to cart:', cartItem);

        } catch (error) {
            console.error('Add to cart failed:', error);
            this.adminPanel.showNotification('Failed to add item to cart', 'error');
        }
    }

    addToFallbackCart(item) {
        try {
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const existingIndex = cart.findIndex(cartItem => cartItem.id === item.id);
            
            if (existingIndex >= 0) {
                cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + (item.quantity || 1);
            } else {
                cart.push(item);
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Trigger cart update event if available
            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
            }
            
        } catch (error) {
            console.error('Fallback cart save failed:', error);
        }
    }

    showAddToCartConfirmation(productName, quantity) {
        this.adminPanel.showNotification(
            `Added ${quantity}x ${productName} to cart!`, 
            'success'
        );
    }

    closeCurrentModal() {
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
            document.body.style.overflow = '';
        }
    }

    ensureModalStyles() {
        if (document.getElementById('product-modal-styles')) return;

        const modalStyles = document.createElement('style');
        modalStyles.id = 'product-modal-styles';
        modalStyles.textContent = `
            .product-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10002;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .product-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                backdrop-filter: blur(5px);
            }

            .product-modal-content {
                position: relative;
                background: white;
                border-radius: 16px;
                max-width: 700px;
                width: 90%;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 0 25px 50px rgba(0,0,0,0.3);
                z-index: 1;
            }

            .product-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 30px;
                border-bottom: 1px solid #eee;
                background: #8B7355;
                color: white;
                border-radius: 16px 16px 0 0;
            }

            .product-modal-header h2 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }

            .product-modal-close {
                background: rgba(255,255,255,0.2);
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

            .product-modal-close:hover {
                background: rgba(255,255,255,0.3);
            }

            .product-modal-body {
                padding: 30px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                align-items: start;
            }

            .product-detail-image {
                text-align: center;
            }

            .product-detail-image img {
                width: 100%;
                max-width: 350px;
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            }

            .product-detail-emoji {
                font-size: 120px;
                margin: 20px 0;
            }

            .product-detail-info {
                padding: 10px 0;
            }

            .product-detail-price {
                font-size: 32px;
                font-weight: 700;
                color: #8B7355;
                margin-bottom: 12px;
            }

            .product-detail-category {
                font-size: 14px;
                color: #999;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                margin-bottom: 20px;
            }

            .product-detail-description {
                font-size: 16px;
                line-height: 1.6;
                color: #555;
                margin-bottom: 30px;
            }

            .out-of-stock-notice {
                background: #fee2e2;
                border: 1px solid #fecaca;
                color: #b91c1c;
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 20px;
                font-weight: 500;
            }

            .product-detail-actions {
                border-top: 1px solid #eee;
                padding-top: 25px;
            }

            .quantity-controls {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 20px;
            }

            .quantity-controls label {
                font-weight: 600;
                color: #333;
            }

            .quantity-controls select {
                padding: 10px 14px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
                background: white;
                min-width: 80px;
            }

            .quantity-controls select:focus {
                outline: none;
                border-color: #8B7355;
                box-shadow: 0 0 0 3px rgba(139, 115, 85, 0.1);
            }

            .add-to-cart-large {
                width: 100%;
                padding: 16px 24px;
                background: linear-gradient(135deg, #8B7355 0%, #6d5a42 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .add-to-cart-large:hover:not(:disabled) {
                background: linear-gradient(135deg, #6d5a42 0%, #5a4735 100%);
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(139, 115, 85, 0.3);
            }

            .add-to-cart-large:disabled {
                background: #ccc;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            @media (max-width: 768px) {
                .product-modal-content {
                    width: 95%;
                    margin: 20px;
                }

                .product-modal-body {
                    grid-template-columns: 1fr;
                    gap: 20px;
                    padding: 20px;
                }

                .product-modal-header {
                    padding: 16px 20px;
                }

                .product-modal-header h2 {
                    font-size: 20px;
                }

                .product-detail-price {
                    font-size: 28px;
                }
            }
        `;

        document.head.appendChild(modalStyles);
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure all page resources are loaded
    setTimeout(() => {
        try {
            console.log('Initializing Admin Panel System...');
            
            // Initialize admin panel
            window.adminPanel = new AdminPanel();
            
            // Initialize product manager
            window.productManager = new ProductManager(window.adminPanel);
            
            // Cleanup on page unload
            window.addEventListener('beforeunload', () => {
                if (window.adminPanel) {
                    window.adminPanel.destroy();
                }
            });
            
            console.log('Admin Panel System initialized successfully');
            
        } catch (error) {
            console.error('Admin Panel System initialization failed:', error);
        }
    }, 500);
});

// Legacy support functions
window.addQuickProduct = function(id, name, price, emoji) {
    if (window.productManager) {
        window.productManager.addToCart(id, 1);
    } else {
        console.log('Added product (legacy):', { id, name, price, emoji });
        alert(`Added ${name} to cart! (${price})`);
    }
};

// Export classes for external use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminPanel, ProductManager };
}