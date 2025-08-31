// Enhanced Checkout JavaScript with Apple Pay & Google Pay
// File: public/script/checkout.js (fixed version)

// State
let isProcessing = false;
let squareConfig = null;
let cartItems = [];
let payments = null;
let card = null;
let applePay = null;
let googlePay = null;
let isSquareInitialized = false;

// Initialize checkout page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Checkout page loaded, initializing...');
    loadCartItems();
    renderCartItems();
    updateTotals();
    setupEventListeners();

    // Initialize Square payments with proper error handling
    initializeSquarePayments().catch(error => {
        console.error('Failed to initialize Square payments:', error);
        showFallbackPaymentMethod();
    });

    // Listen for cart updates from other pages
    window.addEventListener('cartUpdated', function(event) {
        loadCartItems();
        renderCartItems();
        updateTotals();
    });
});

// Enhanced Square payments initialization with digital wallets
async function initializeSquarePayments() {
    try {
        console.log('Starting Square payments initialization...');

        // Wait for config to load
        if (!squareConfig) {
            await loadSquareConfig();
        }

        // Load the correct Square SDK based on environment
        await loadSquareSDK(squareConfig.environment);

        if (!window.Square) {
            throw new Error('Square Web Payments SDK not available');
        }

        console.log('Initializing Square payments with:', {
            environment: squareConfig.environment,
            applicationId: squareConfig.applicationId,
            locationId: squareConfig.locationId
        });

        // Initialize payments object
        payments = window.Square.payments(squareConfig.applicationId, squareConfig.locationId);

        // Initialize payment methods
        await Promise.all([
            initializeCard(),
            initializeApplePay(),
            initializeGooglePay()
        ]);

        console.log('Square payments initialized successfully');
        isSquareInitialized = true;

        // Update status
        const statusElement = document.getElementById('square-status');
        if (statusElement) {
            statusElement.textContent = `Square ${squareConfig.environment} environment ready with digital wallets`;
            statusElement.style.color = '#059669';
        }

    } catch (error) {
        console.error('Error initializing Square payments:', error);
        const statusElement = document.getElementById('square-status');
        if (statusElement) {
            statusElement.textContent = `Error: ${error.message}`;
            statusElement.style.color = '#dc2626';
        }
        isSquareInitialized = false;
        throw error;
    }
}

// Initialize card payment method
async function initializeCard() {
    try {
        console.log('Creating Square card form...');
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

        console.log('Attaching Square card form to DOM...');
        await card.attach('#card-container');
        console.log('Square card form attached successfully');
    } catch (error) {
        console.error('Failed to initialize card form:', error);
        throw error;
    }
}

// Initialize Apple Pay
async function initializeApplePay() {
    try {
        // Create payment request using Square's method
        const paymentRequest = await payments.paymentRequest(buildPaymentRequestOptions());
        applePay = await payments.applePay(paymentRequest);

        const applePayButton = document.getElementById('apple-pay-button');
        if (applePayButton && applePay) {
            applePayButton.style.display = 'block';
            applePayButton.addEventListener('click', async () => {
                await handleDigitalWalletPayment('applePay');
            });
            console.log('Apple Pay initialized and button shown');
        }
    } catch (error) {
        console.log('Apple Pay not available:', error.message);
        const applePayButton = document.getElementById('apple-pay-button');
        if (applePayButton) {
            applePayButton.style.display = 'none';
        }
    }
}

// Initialize Google Pay
async function initializeGooglePay() {
    try {
        // Create payment request using Square's method
        const paymentRequest = await payments.paymentRequest(buildPaymentRequestOptions());
        googlePay = await payments.googlePay(paymentRequest);

        const googlePayButton = document.getElementById('google-pay-button');
        if (googlePayButton && googlePay) {
            googlePayButton.style.display = 'block';
            googlePayButton.addEventListener('click', async () => {
                await handleDigitalWalletPayment('googlePay');
            });
            console.log('Google Pay initialized and button shown');
        }
    } catch (error) {
        console.log('Google Pay not available:', error.message);
        const googlePayButton = document.getElementById('google-pay-button');
        if (googlePayButton) {
            googlePayButton.style.display = 'none';
        }
    }
}

function buildPaymentRequestOptions() {
    const totals = updateTotals();
    console.log('Totals for payment request:', totals);

    return {
        countryCode: 'US',
        currencyCode: 'USD',
        total: {
            amount: totals.total.toFixed(2),
            label: 'Total'
        },
        requestBillingContact: false,
        requestShippingContact: false
    };
}

// Handle digital wallet payments
async function handleDigitalWalletPayment(walletType) {
    if (isProcessing || cartItems.length === 0) return;

    hideError();
    setProcessingState(true);

    try {
        let paymentMethod;
        if (walletType === 'applePay' && applePay) {
            paymentMethod = applePay;
        } else if (walletType === 'googlePay' && googlePay) {
            paymentMethod = googlePay;
        } else {
            throw new Error(`${walletType} not available`);
        }

        console.log(`Processing ${walletType} payment...`);
        const result = await paymentMethod.tokenize();

        if (result.status === 'OK') {
            const totals = updateTotals();

            // For digital wallets, we use the contact info from the wallet
            const orderData = {
                items: cartItems,
                shipping: result.details?.billing || result.details?.shipping || {},
                totals: totals,
                paymentMethod: walletType
            };

            await processPayment(result.token, totals.total, orderData);
        } else {
            let errorMessage = `${walletType} payment failed`;
            if (result.errors) {
                errorMessage = result.errors.map(error => error.message).join(', ');
            }
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error(`${walletType} payment error:`, error);
        showError(error.message || `${walletType} payment failed. Please try another payment method.`);
    } finally {
        setProcessingState(false);
    }
}

// Tokenize regular card payment
async function tokenizePayment() {
    if (!isSquareInitialized || !card) {
        throw new Error('Square payment form is not ready. Please try again or contact support.');
    }

    try {
        console.log('Tokenizing card payment...');
        const result = await card.tokenize();

        if (result.status === 'OK') {
            console.log('Card payment tokenized successfully');
            return result.token;
        } else {
            let errorMessage = 'Card information is invalid';
            if (result.errors) {
                errorMessage = result.errors.map(error => error.message).join(', ');
            }
            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('Card tokenization error:', error);
        throw error;
    }
}

// Set processing state
function setProcessingState(processing) {
    isProcessing = processing;
    const buttonText = document.getElementById('button-text');
    const buttonSpinner = document.getElementById('button-spinner');
    const completeBtn = document.getElementById('complete-order-btn');
    const applePayButton = document.getElementById('apple-pay-button');
    const googlePayButton = document.getElementById('google-pay-button');

    if (buttonText) buttonText.style.display = processing ? 'none' : 'block';
    if (buttonSpinner) buttonSpinner.style.display = processing ? 'flex' : 'none';
    if (completeBtn) completeBtn.disabled = processing || cartItems.length === 0;
    if (applePayButton) applePayButton.disabled = processing;
    if (googlePayButton) googlePayButton.disabled = processing;
}

// Enhanced form submission handler
async function handleSubmit(event) {
    event.preventDefault();

    if (isProcessing || cartItems.length === 0) return;

    hideError();

    // For card payments, validate form data
    const formData = getFormData();
    const validation = validateForm(formData);

    if (!validation.valid) {
        showError(validation.message);
        return;
    }

    setProcessingState(true);

    try {
        const totals = updateTotals();

        if (isSquareInitialized && card) {
            // Process with Square card payment
            console.log('Processing with Square card payment...');
            const token = await tokenizePayment();
            await processPayment(token, totals.total, {
                items: cartItems,
                shipping: formData,
                totals: totals,
                paymentMethod: 'card'
            });
        } else {
            // Process with demo mode
            console.log('Processing with demo mode...');
            const result = await processDemoPayment(totals.total, {
                items: cartItems,
                shipping: formData,
                totals: totals
            });

            if (result.success) {
                showSuccessPage(result.paymentId);
                // Clear cart
                cartItems = [];
                saveCartItems();
                if (window.cartManager) {
                    window.cartManager.clearCart();
                }
            }
        }

    } catch (error) {
        console.error('Checkout error:', error);
        showError(error.message || 'An error occurred during checkout. Please try again.');
    } finally {
        setProcessingState(false);
    }
}

// Load Square configuration and initialize Web Payments SDK
async function loadSquareConfig() {
    try {
        console.log('Loading Square configuration...');
        const response = await fetch('https://squareupapi.onrender.com/api/config');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        squareConfig = await response.json();

        // Add the location ID
        if (!squareConfig.locationId) {
            squareConfig.locationId = 'L65X9J5C940J8';
        }

        console.log('Square Config loaded:', {
            environment: squareConfig.environment,
            applicationId: squareConfig.applicationId ? 'present' : 'missing'
        });

        return squareConfig;
    } catch (error) {
        console.error('Failed to load Square configuration:', error);
        throw error;
    }
}

// Load Square Web Payments SDK dynamically based on environment
async function loadSquareSDK(environment) {
    return new Promise((resolve, reject) => {
        if (window.Square) {
            console.log('Square SDK already loaded');
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

        setTimeout(() => {
            if (!window.Square) {
                reject(new Error(`Square SDK loading timeout`));
            }
        }, 10000);

        document.head.appendChild(script);
    });
}

// Process payment with Square
async function processPayment(sourceId, total, orderData) {
    try {
        console.log('Processing payment...', { total, paymentMethod: orderData.paymentMethod });

        const response = await fetch('https://squareupapi.onrender.com/api/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sourceId: sourceId,
                amount: total,
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
            showSuccessPage(result.paymentId);
            // Clear cart
            cartItems = [];
            saveCartItems();

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

// Show fallback payment method when Square fails to initialize
function showFallbackPaymentMethod() {
    const cardContainer = document.getElementById('card-container');
    const statusElement = document.getElementById('square-status');
    const digitalWalletButtons = document.querySelectorAll('#apple-pay-button, #google-pay-button');

    // Hide digital wallet buttons
    digitalWalletButtons.forEach(button => {
        button.style.display = 'none';
    });

    if (cardContainer) {
        cardContainer.innerHTML = `
            <div class="demo-notice">
                <strong>Demo Mode:</strong> Square payment form could not be loaded. 
                In production, this would show the actual payment form.
                <br><br>
                For testing purposes, you can still complete the order.
            </div>
            <div style="padding: 1rem; border: 1px solid #d1d5db; border-radius: 8px; background: #f9fafb;">
                <div style="margin-bottom: 0.5rem; font-weight: 500;">Card Number</div>
                <input type="text" placeholder="**** **** **** ****" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; margin-bottom: 1rem;" disabled>
                
                <div style="display: flex; gap: 1rem;">
                    <div style="flex: 1;">
                        <div style="margin-bottom: 0.5rem; font-weight: 500;">Expiry</div>
                        <input type="text" placeholder="MM/YY" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;" disabled>
                    </div>
                    <div style="flex: 1;">
                        <div style="margin-bottom: 0.5rem; font-weight: 500;">CVV</div>
                        <input type="text" placeholder="***" style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;" disabled>
                    </div>
                </div>
            </div>
        `;
    }

    if (statusElement) {
        statusElement.textContent = 'Demo Mode - Payment processing simulation enabled';
        statusElement.style.color = '#f59e0b';
    }
}

function loadCartItems() {
    try {
        if (window.cartManager) {
            cartItems = window.cartManager.getItems();
        } else {
            const savedCart = localStorage.getItem('vibeBeadsCart');
            cartItems = savedCart ? JSON.parse(savedCart) : [];
        }
        console.log('Loaded cart items:', cartItems);
    } catch (error) {
        console.error('Error loading cart items:', error);
        cartItems = [];
    }
}

function saveCartItems() {
    try {
        localStorage.setItem('vibeBeadsCart', JSON.stringify(cartItems));
        if (window.cartManager) {
            window.cartManager.cart = cartItems;
            window.cartManager.updateCartUI();
        }
    } catch (error) {
        console.error('Error saving cart items:', error);
    }
}

function setupEventListeners() {
    const completeOrderBtn = document.getElementById('complete-order-btn');
    if (completeOrderBtn) {
        completeOrderBtn.addEventListener('click', handleSubmit);
    }
}

function renderCartItems() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;

    if (cartItems.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <p>Your cart is empty</p>
                <button onclick="window.location.href='../index.html'">Continue Shopping</button>
            </div>
        `;
        return;
    }

    cartContainer.innerHTML = cartItems.map((item, index) => `
        <div class="cart-item" data-index="${index}">
            <div class="item-image">${item.image || '🕯️'}</div>
            <div class="item-details">
                <div class="item-name">${item.name || 'Unknown Item'}</div>
                <div class="item-price">$${(item.price || 0).toFixed(2)} each</div>
                <div class="quantity-controls">
                    <button onclick="updateQuantity(${index}, -1)">-</button>
                    <span>${item.quantity || 1}</span>
                    <button onclick="updateQuantity(${index}, 1)">+</button>
                    <span onclick="removeItem(${index})">Remove</span>
                </div>
            </div>
            <div class="item-total">$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</div>
        </div>
    `).join('');
}

function updateTotals() {
    const subtotal = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    const shipping = cartItems.length > 0 ? 8.99 : 0;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const taxElement = document.getElementById('tax');
    const totalElement = document.getElementById('total');

    if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingElement) shippingElement.textContent = `$${shipping.toFixed(2)}`;
    if (taxElement) taxElement.textContent = `$${tax.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;

    const buttonText = document.getElementById('button-text');
    if (buttonText) buttonText.textContent = `Complete Order - $${total.toFixed(2)}`;

    return { subtotal, shipping, tax, total };
}

function getFormData() {
    const formData = {};
    document.querySelectorAll('input, select').forEach(input => {
        if (input.name) formData[input.name] = input.value;
    });
    return formData;
}

function validateForm(formData) {
    const requiredFields = ['email', 'firstName', 'lastName', 'address', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(field => !formData[field]?.trim());

    if (missingFields.length > 0) {
        return {
            valid: false,
            message: `Please fill in: ${missingFields.join(', ')}`
        };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        return { valid: false, message: 'Please enter a valid email address' };
    }

    return { valid: true };
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    if (errorElement && errorText) {
        errorText.textContent = message;
        errorElement.style.display = 'block';
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function hideError() {
    const errorElement = document.getElementById('error-message');
    if (errorElement) errorElement.style.display = 'none';
}

function showSuccessPage(paymentId) {
    const checkoutContent = document.getElementById('checkout-content');
    if (checkoutContent) checkoutContent.style.display = 'none';

    const successMessage = document.getElementById('success-message');
    if (successMessage) successMessage.style.display = 'block';

    const paymentIdText = document.getElementById('payment-id-text');
    if (paymentIdText) paymentIdText.textContent = paymentId;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function processDemoPayment(total, orderData) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({ success: true, paymentId: 'DEMO_' + Date.now() });
        }, 2000);
    });
}

function generateIdempotencyKey() {
    return Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
}

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

function removeItem(index) {
    if (index < 0 || index >= cartItems.length) return;
    cartItems.splice(index, 1);
    saveCartItems();
    renderCartItems();
    updateTotals();
    if (window.cartManager) {
        window.cartManager.cart = cartItems;
        window.cartManager.updateCartUI();
    }
}

// Make functions globally available
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;