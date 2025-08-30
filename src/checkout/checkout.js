// Updated Checkout JavaScript with proper Square Web Payments SDK integration
// File: src/checkout/checkout.js

// State
let isProcessing = false;
let squareConfig = null;
let cartItems = [];
let payments = null;
let card = null;

// Initialize checkout page
document.addEventListener('DOMContentLoaded', function() {
    loadSquareConfig();
    loadCartItems();
    renderCartItems();
    updateTotals();
    setupEventListeners();
    initializeSquarePayments();

    // Listen for cart updates from other pages
    window.addEventListener('cartUpdated', function(event) {
        loadCartItems();
        renderCartItems();
        updateTotals();
    });
});

// Load Square configuration and initialize Web Payments SDK
async function loadSquareConfig() {
    try {
        const response = await fetch('https://squareupapi.onrender.com/api/config');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        squareConfig = await response.json();
        console.log('Square Config loaded:', {
            environment: squareConfig.environment,
            applicationId: squareConfig.applicationId ? 'present' : 'missing',
            locationId: squareConfig.locationId ? 'present' : 'missing'
        });

        const statusElement = document.getElementById('square-status');
        if (statusElement && squareConfig) {
            statusElement.textContent = `Loading Square ${squareConfig.environment} environment...`;
            statusElement.style.color = '#6b7280';
        }

        return squareConfig;
    } catch (error) {
        console.error('Failed to load Square configuration:', error);
        const statusElement = document.getElementById('square-status');
        if (statusElement) {
            statusElement.textContent = 'Error loading Square configuration - using demo mode';
            statusElement.style.color = '#dc2626';
        }
        throw error;
    }
}

// Load Square Web Payments SDK dynamically based on environment
async function loadSquareSDK(environment) {
    return new Promise((resolve, reject) => {
        if (window.Square) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.type = 'application/javascript';

        // Use the correct SDK URL based on environment
        if (environment === 'sandbox') {
            script.src = 'https://sandbox.web.squarecdn.com/v1/square.js';
        } else {
            script.src = 'https://web.squarecdn.com/v1/square.js';
        }

        script.onload = () => {
            console.log(`Square ${environment} SDK loaded successfully`);
            resolve();
        };

        script.onerror = () => {
            reject(new Error(`Failed to load Square ${environment} SDK`));
        };

        document.head.appendChild(script);
    });
}

// Initialize Square Web Payments SDK
async function initializeSquarePayments() {
    try {
        // Wait for config to load
        if (!squareConfig) {
            await loadSquareConfig();
        }

        // Load the correct Square SDK based on environment
        await loadSquareSDK(squareConfig.environment);

        if (!window.Square) {
            console.error('Square Web Payments SDK not loaded');
            return;
        }

        console.log('Initializing Square payments with:', {
            environment: squareConfig.environment,
            applicationId: squareConfig.applicationId,
            locationId: squareConfig.locationId
        });

        // Initialize payments object
        payments = window.Square.payments(squareConfig.applicationId, squareConfig.locationId);

        // Initialize card payment method
        try {
            card = await payments.card({
                style: {
                    input: {
                        fontSize: '16px',
                        fontFamily: 'Arial, sans-serif',
                        color: '#2c2c2c'
                    },
                    'input::placeholder': {
                        color: '#999999'
                    },
                    '.input-container': {
                        borderColor: '#d1d5db',
                        borderRadius: '8px'
                    },
                    '.input-container.is-focus': {
                        borderColor: '#8B7355'
                    },
                    '.input-container.is-error': {
                        borderColor: '#dc2626'
                    }
                }
            });
            await card.attach('#card-container');
            console.log('Square card form attached successfully');

            // Update status
            const statusElement = document.getElementById('square-status');
            if (statusElement) {
                statusElement.textContent = `Square ${squareConfig.environment} environment ready`;
                statusElement.style.color = '#059669';
            }
        } catch (e) {
            console.error('Failed to initialize Square card form:', e);
            const statusElement = document.getElementById('square-status');
            if (statusElement) {
                statusElement.textContent = `Error: ${e.message}`;
                statusElement.style.color = '#dc2626';
            }
        }

    } catch (error) {
        console.error('Error initializing Square payments:', error);
        const statusElement = document.getElementById('square-status');
        if (statusElement) {
            statusElement.textContent = `Error: ${error.message}`;
            statusElement.style.color = '#dc2626';
        }
    }
}

// Load cart items from localStorage or cart manager
function loadCartItems() {
    try {
        // First try to get from global cart manager
        if (window.cartManager) {
            cartItems = window.cartManager.getItems();
        } else {
            // Fallback to direct localStorage access
            const savedCart = localStorage.getItem('vibeBeadsCart');
            cartItems = savedCart ? JSON.parse(savedCart) : [];
        }

        console.log('Loaded cart items:', cartItems);

        // If cart is still empty, add demo items for testing purposes
        if (cartItems.length === 0) {
            console.log('Cart is empty, adding demo items for testing');
            // Don't add demo items automatically - let users add real items
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

        // Update cart manager if available
        if (window.cartManager) {
            window.cartManager.cart = cartItems;
            window.cartManager.updateCartUI();
        }
    } catch (error) {
        console.error('Error saving cart items:', error);
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
            window.location.href = '../../public/index.html';
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
                <button class="back-to-shopping" onclick="window.location.href='../../public/index.html'" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #8B7355; color: white; border: none; border-radius: 6px; cursor: pointer;">Continue Shopping</button>
            </div>
        `;
        return;
    }

    cartContainer.innerHTML = cartItems.map((item, index) => `
        <div class="cart-item" data-index="${index}">
            <div class="item-image">
                ${typeof item.image === 'string' && item.image.length <= 2 ? item.image : '🕯️'}
            </div>
            <div class="item-details">
                <div class="item-name">${item.name || 'Unknown Item'}</div>
                <div class="item-price">$${(item.price || 0).toFixed(2)} each</div>
                ${item.isCustom ? '<div class="item-custom" style="font-size: 0.8rem; color: #8B7355; font-weight: 500;">Custom Scent</div>' : ''}
                ${item.scent ? `<div class="item-scent" style="font-size: 0.8rem; color: #666;">Scent: ${item.scent}</div>` : ''}
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <span class="quantity">${item.quantity || 1}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                    <span class="remove-btn" onclick="removeItem(${index})">Remove</span>
                </div>
            </div>
            <div class="item-total">$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</div>
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
    const subtotal = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
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

// Tokenize payment method with Square
async function tokenizePayment() {
    if (!card) {
        throw new Error('Card form not initialized');
    }

    const result = await card.tokenize();

    if (result.status === 'OK') {
        return result.token;
    } else {
        let errorMessage = 'Payment information is invalid';
        if (result.errors) {
            errorMessage = result.errors.map(error => error.message).join(', ');
        }
        throw new Error(errorMessage);
    }
}

// Process payment with Square
async function processPayment(sourceId, total, orderData) {
    try {
        const response = await fetch('https://squareupapi.onrender.com/api/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sourceId: sourceId,
                amount: total, // Send amount in dollars (your backend will convert to cents)
                currency: 'USD',
                orderData: orderData,
                idempotencyKey: generateIdempotencyKey()
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Payment failed');
        }

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
            throw new Error(result.error || 'Payment failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        throw error;
    }
}

// Generate idempotency key for Square API
function generateIdempotencyKey() {
    return Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
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

        // Tokenize the payment method
        const token = await tokenizePayment();
        console.log('Payment tokenized successfully');

        // Process the payment
        await processPayment(token, totals.total, {
            items: cartItems,
            shipping: formData,
            totals: totals
        });

    } catch (error) {
        console.error('Checkout error:', error);
        showError(error.message || 'An error occurred during checkout. Please try again.');
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

// Make functions globally available for onclick handlers
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;