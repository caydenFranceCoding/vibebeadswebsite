// Enhanced Cart Manager with FIXED PATHS
// File: public/script/cart.js

class CartManager {
    constructor() {
        this.storageKey = 'vibeBeadsCart';
        this.cart = this.loadCart();
        this.updateCartUI();
    }

    // Load cart from localStorage
    loadCart() {
        try {
            const savedCart = localStorage.getItem(this.storageKey);
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            return [];
        }
    }

    // Save cart to localStorage
    saveCart() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
            this.updateCartUI();
            console.log('Cart saved:', this.cart);
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    // Add item to cart
    addItem(product) {
        // Create unique identifier for cart item comparison
        const itemId = this.createItemId(product);

        const existingItemIndex = this.cart.findIndex(item =>
            this.createItemId(item) === itemId
        );

        if (existingItemIndex > -1) {
            // Update quantity if item already exists
            this.cart[existingItemIndex].quantity += product.quantity || 1;
        } else {
            // Add new item
            const newItem = {
                id: product.id || `custom-${Date.now()}`,
                name: product.name,
                price: parseFloat(product.price),
                quantity: product.quantity || 1,
                size: product.size || '8oz',
                scent: product.scent || null,
                image: product.image || product.emoji || '🕯️',
                isCustom: product.isCustom || false
            };

            this.cart.push(newItem);
        }

        this.saveCart();
        this.showAddToCartNotification(product);

        // Trigger custom event for other parts of the app to listen to
        window.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: {
                cart: this.cart,
                action: 'add',
                item: product
            }
        }));
    }

    // Create unique identifier for cart items
    createItemId(item) {
        return `${item.id}-${item.size || '8oz'}-${item.scent || 'none'}`;
    }

    // Remove item from cart
    removeItem(itemId, size, scent) {
        const targetId = this.createItemId({ id: itemId, size, scent });
        const initialLength = this.cart.length;

        this.cart = this.cart.filter(item => this.createItemId(item) !== targetId);

        if (this.cart.length < initialLength) {
            this.saveCart();
            window.dispatchEvent(new CustomEvent('cartUpdated', {
                detail: {
                    cart: this.cart,
                    action: 'remove'
                }
            }));
        }
    }

    // Update item quantity
    updateQuantity(itemId, size, scent, newQuantity) {
        const targetId = this.createItemId({ id: itemId, size, scent });
        const item = this.cart.find(item => this.createItemId(item) === targetId);

        if (item) {
            if (newQuantity <= 0) {
                this.removeItem(itemId, size, scent);
            } else {
                item.quantity = parseInt(newQuantity);
                this.saveCart();
                window.dispatchEvent(new CustomEvent('cartUpdated', {
                    detail: {
                        cart: this.cart,
                        action: 'update'
                    }
                }));
            }
        }
    }

    // Clear entire cart
    clearCart() {
        this.cart = [];
        this.saveCart();
        window.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: {
                cart: this.cart,
                action: 'clear'
            }
        }));
    }

    // Get cart items
    getItems() {
        return [...this.cart]; // Return copy to prevent direct mutation
    }

    // Get total items count
    getTotalItems() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    // Get cart subtotal
    getSubtotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Update cart UI elements
    updateCartUI() {
        const cartElements = document.querySelectorAll('.cart-text, .cart-count');
        const totalItems = this.getTotalItems();

        cartElements.forEach(element => {
            if (element.classList.contains('cart-text')) {
                element.textContent = `Cart (${totalItems})`;
            } else if (element.classList.contains('cart-count')) {
                element.textContent = totalItems;
            }
        });

        // Update cart badge if it exists
        const cartBadge = document.querySelector('.cart-badge');
        if (cartBadge) {
            cartBadge.textContent = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'block' : 'none';
        }

        // Update cart icon text
        const cartIcon = document.querySelector('.cart-icon .cart-text');
        if (cartIcon) {
            cartIcon.textContent = `Cart (${totalItems})`;
        }
    }

    // Show notification when item is added
    showAddToCartNotification(product) {
        // Remove any existing notifications
        const existingNotifications = document.querySelectorAll('.cart-notification');
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✓</span>
                <span class="notification-text">Added ${product.name} to cart!</span>
                <button class="view-cart-btn" onclick="window.location.href='${this.getCheckoutPath()}'">View Cart</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 320px;
        `;

        // Add to document
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // FIXED: Get correct checkout path based on current location
    getCheckoutPath() {
        const currentPath = window.location.pathname;
        const currentDir = window.location.href;

        console.log('Current path:', currentPath);
        console.log('Current dir:', currentDir);

        // Check if we're on a pages subdirectory (candles.html, diffusers.html, etc.)
        if (currentPath.includes('/pages/') || currentDir.includes('/pages/')) {
            return '../checkout/checkout.html';
        }
        // Check if we're on the main index page
        else if (currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/')) {
            return './checkout/checkout.html';
        }
        // Default fallback
        else {
            return './checkout/checkout.html';
        }
    }
}

// Initialize cart manager and make it globally available
let cartManager;

document.addEventListener('DOMContentLoaded', function() {
    cartManager = new CartManager();
    window.cartManager = cartManager; // Make globally accessible

    console.log('Cart Manager initialized with', cartManager.getTotalItems(), 'items');
});

// CSS for cart notification (add to head)
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .cart-notification {
        font-family: 'Inter', sans-serif;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .notification-icon {
        font-size: 1.2rem;
        font-weight: bold;
        color: white;
    }
    
    .notification-text {
        flex: 1;
        font-size: 0.9rem;
        font-weight: 500;
        color: white;
    }
    
    .view-cart-btn {
        background: rgba(255,255,255,0.2);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: background 0.2s ease;
        text-decoration: none;
        white-space: nowrap;
    }
    
    .view-cart-btn:hover {
        background: rgba(255,255,255,0.3);
    }
`;

document.head.appendChild(notificationStyles);