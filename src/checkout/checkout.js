// Updated Checkout JavaScript with Cart Integration
// File: src/checkout/checkout.js

// State
let isProcessing = false;
let squareConfig = null;
let cartItems = [];

// Initialize checkout page
document.addEventListener('DOMContentLoaded', function() {
    loadSquareConfig();
    loadCartItems();
    renderCartItems();
    updateTotals();
    setupEventListeners();
});

// Load cart items from localStorage
function loadCartItems() {
    try {
        const savedCart = localStorage.getItem('vibeBeadsCart');
        cartItems = savedCart ? JSON.parse(savedCart) : [];

        // Add demo items if cart is empty (for testing)
        if (cartItems.length === 0) {
            cartItems = [
                {
                    id: 'demo-1',
                    name: 'Vanilla Bean Candle (8oz)',
                    price: 45.00,
                    quantity: 1,
                    size: '8oz',
                    image: '🕯️',
                    isCustom: false
                },
                {
                    id: 'demo-2',
                    name: 'Sweet Tobacco Candle (8oz)',
                    price: 38.00,
                    quantity: 1,
                    size: '8oz',
                    image: '🌿',
                    isCustom: false
                }
            ];
        }
    } catch (error) {
        console.error('Error loading cart items:', error);
        cartItems = [];
    }
}

// Save cart items to localStorage
function saveCartItems() {
    try {
        localStorage.setItem('vibeBeadsCart', JSON.stringify(cartItems));
    } catch (error) {
        console.error('Error saving cart items:', error);
    }
}

// Load Square configuration
async function loadSquareConfig() {
    try {
        const response = await fetch('https://squareupapi.onrender.com/api/config');
        squareConfig = await response.json();
        console.log('Square Config loaded:', squareConfig);

        const statusElement = document.getElementById('square-status');
        if (statusElement && squareConfig) {
            statusElement.textContent = `Connected to Square ${squareConfig.environment} environment`;
        }
    } catch (error) {
        console.error('Failed to load Square configuration:', error);
        const statusElement = document.getElementById('square-status');
        if (statusElement) {
            statusElement.textContent = 'Failed to connect to Square API';
            statusElement.style.color = '#ef4444';
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    const completeOrderBtn = document.getElementById('complete-order-btn');
    if (completeOrderBtn) {
        completeOrderBtn.addEventListener('click', handleSubmit);
    }

    // Back to shopping link
    const backToShoppingBtn = document.querySelector('.back-to-shopping');
    if (backToShoppingBtn) {
        backToShoppingBtn.addEventListener('click', function() {
            window.location.href = '../../index.html';
        });
    }
}

// Render cart items
function renderCartItems() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;

    if (cartItems.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p>Your cart is empty</p>
                <button class="back-to-shopping" onclick="window.location.href='../../index.html'">Continue Shopping</button>
            </div>
        `;
        return;
    }

    cartContainer.innerHTML = cartItems.map((item, index) => `
        <div class="cart-item" data-index="${index}">
            <div class="item-image">
                ${typeof item.image === 'string' && item.image.length === 1 ? item.image : '🕯️'}
            </div>
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-price">$${item.price.toFixed(2)} each</div>
                ${item.isCustom ? '<div class="item-custom">Custom Scent</div>' : ''}
                ${item.scent ? `<div class="item-scent">Scent: ${item.scent}</div>` : ''}
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                    <span class="remove-btn" onclick="removeItem(${index})">Remove</span>
                </div>
            </div>
            <div class="item-total">$${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');
}

// Update item quantity
function updateQuantity(index, change) {
    if (index < 0 || index >= cartItems.length) return;

    const newQuantity = Math.max(0, cartItems[index].quantity + change);

    if (newQuantity === 0) {
        removeItem(index);
    } else {
        cartItems[index].quantity = newQuantity;
        saveCartItems();
        renderCartItems();
        updateTotals();
    }
}

// Remove item from cart
function removeItem(index) {
    if (index < 0 || index >= cartItems.length) return;

    cartItems.splice(index, 1);
    saveCartItems();
    renderCartItems();
    updateTotals();

    // Update cart manager if available
    if (window.cartManager) {
        window.cartManager.cart = cartItems;
        window.cartManager.updateCartUI();
    }
}

// Update totals
function updateTotals() {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = cartItems.length > 0 ? 8.99 : 0;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    // Update display
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    const buttonText = document.getElementById('button-text');

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = `$${shipping.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    if (buttonText) buttonText.textContent = `Complete Order - $${total.toFixed(2)}`;

    // Disable button if cart is empty
    const completeBtn = document.getElementById('complete-order-btn');
    if (completeBtn) {
        completeBtn.disabled = cartItems.length === 0 || isProcessing;
    }

    return { subtotal, shipping, tax, total };
}

// Get form data
function getFormData() {
    const formData = {};
    const inputs = document.querySelectorAll('input, select');

    inputs.forEach(input => {
        if (input.name) {
            formData[input.name] = input.value;
        }
    });

    return formData;
}

// Validate form
function validateForm(formData) {
    const requiredFields = ['email', 'firstName', 'lastName', 'address', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim() === '');

    if (missingFields.length > 0) {
        return {
            valid: false,
            message: `Please fill in all required fields: ${missingFields.join(', ')}`
        };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        return {
            valid: false,
            message: 'Please enter a valid email address'
        };
    }

    return { valid: true };
}

// Show error message
function showError(message) {
    const errorElement = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    if (errorElement && errorText) {
        errorText.textContent = message;
        errorElement.style.display = 'block';

        // Scroll to error message
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Hide error message
function hideError() {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Process payment
async function processPayment(sourceId, total) {
    try {
        const response = await fetch('https://squareupapi.onrender.com/api/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sourceId: sourceId,
                amount: total,
                currency: 'USD'
            })
        });

        const result = await response.json();

        if (result.success) {
            // Show success page
            showSuccessPage(result.paymentId);
            // Clear cart
            cartItems = [];
            saveCartItems();
            // Update cart manager if available
            if (window.cartManager) {
                window.cartManager.clearCart();
            }
        } else {
            showError(result.error || 'Payment failed. Please try again.');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showError('Network error. Please check your connection and try again.');
    }
}

// Show success page
function showSuccessPage(paymentId) {
    const checkoutContent = document.getElementById('checkout-content');
    const successMessage = document.getElementById('success-message');
    const paymentIdText = document.getElementById('payment-id-text');
    
    if (checkoutContent) checkoutContent.style.display = 'none';
    if (successMessage) successMessage.style.display = 'block';
    if (paymentIdText) paymentIdText.textContent = paymentId;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Handle form submission
async function handleSubmit(event) {
    event.preventDefault();
    
    if (isProcessing || cartItems.length === 0) return;
    
    hideError();
    
    const formData = getFormData();
    const validation = validateForm(formData);
    
    if (!validation.valid) {
        showError(validation.message);
        return;
    }
    
    // Set processing state
    isProcessing = true;
    const buttonText = document.getElementById('button-text');
    const buttonSpinner = document.getElementById('button-spinner');
    const completeBtn = document.getElementById('complete-order-btn');
    
    if (buttonText) buttonText.style.display = 'none';
    if (buttonSpinner) buttonSpinner.style.display = 'flex';
    if (completeBtn) completeBtn.disabled = true;
    
    try {
        const totals = updateTotals();
        
        // For demo purposes, create a test source ID
        const testSourceId = 'test-card-' + Date.now();
        
        await processPayment(testSourceId, totals.total);
        
    } catch (error) {
        console.error('Checkout error:', error);
        showError('An error occurred during checkout. Please try again.');
    } finally {
        // Reset processing state
        isProcessing = false;
        if (buttonText) buttonText.style.display = 'block';
        if (buttonSpinner) buttonSpinner.style.display = 'none';
        if (completeBtn) completeBtn.disabled = cartItems.length === 0;
    }
}

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}