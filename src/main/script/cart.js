// Cart state management using localStorage
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
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    // Add item to cart
    addItem(product) {
        const existingItemIndex = this.cart.findIndex(item =>
            item.id === product.id &&
            item.size === product.size &&
            item.scent === product.scent
        );

        if (existingItemIndex > -1) {
            // Update quantity if item already exists
            this.cart[existingItemIndex].quantity += product.quantity;
        } else {
            // Add new item
            this.cart.push({
                id: product.id || `custom-${Date.now()}`,
                name: product.name,
                price: product.price,
                quantity: product.quantity,
                size: product.size || '8oz',
                scent: product.scent || null,
                image: product.image || product.emoji || '🕯️',
                isCustom: product.isCustom || false
            });
        }

        this.saveCart();
        this.showAddToCartNotification(product);
    }

    // Remove item from cart
    removeItem(itemId, size, scent) {
        this.cart = this.cart.filter(item => !(
            item.id === itemId &&
            item.size === size &&
            item.scent === scent
        ));
        this.saveCart();
    }

    // Update item quantity
    updateQuantity(itemId, size, scent, newQuantity) {
        const item = this.cart.find(item =>
            item.id === itemId &&
            item.size === size &&
            item.scent === scent
        );

        if (item) {
            if (newQuantity <= 0) {
                this.removeItem(itemId, size, scent);
            } else {
                item.quantity = newQuantity;
                this.saveCart();
            }
        }
    }

    // Clear entire cart
    clearCart() {
        this.cart = [];
        this.saveCart();
    }

    // Get cart items
    getItems() {
        return this.cart;
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
    }

    // Show notification when item is added
    showAddToCartNotification(product) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✓</span>
                <span class="notification-text">Added ${product.name} to cart!</span>
                <button class="view-cart-btn" onclick="window.location.href='./src/checkout/checkout.html'">View Cart</button>
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
}

// Initialize cart manager
let cartManager;

document.addEventListener('DOMContentLoaded', function() {
    cartManager = new CartManager();
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
    }
    
    .notification-text {
        flex: 1;
        font-size: 0.9rem;
        font-weight: 500;
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
    }
    
    .view-cart-btn:hover {
        background: rgba(255,255,255,0.3);
    }
`;

document.head.appendChild(notificationStyles);