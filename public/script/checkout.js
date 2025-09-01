// Fixed Checkout Manager - Field Length Validation for Square
// File: public/script/checkout.js

class CheckoutManager {
  constructor() {
    this.isProcessing = false;
    this.squareConfig = null;
    this.cartItems = [];
    this.payments = null;
    this.card = null;
    this.applePay = null;
    this.googlePay = null;
    this.isSquareInitialized = false;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.requestTimeout = 15000;
    this.csrfToken = null;
    this.sessionId = this.generateSessionId();
    this.apiBaseUrl = this.getApiBaseUrl();
  }

  getApiBaseUrl() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    } else {
      return 'https://squareupapi.onrender.com';
    }
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateIdempotencyKey() {
    return `${this.sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // FIXED: Helper method to truncate fields for Square API requirements
  truncateField(value, maxLength = 45, suffix = '...') {
    if (!value || typeof value !== 'string') return value;
    if (value.length <= maxLength) return value;

    const truncateLength = maxLength - suffix.length;
    return value.substring(0, truncateLength) + suffix;
  }

  // FIXED: Helper method to sanitize all form data for Square
  sanitizeFormDataForSquare(formData) {
    const sanitized = { ...formData };

    // Square field length limits
    const fieldLimits = {
      firstName: 45,
      lastName: 45,
      address: 60,  // Address line can be up to 60
      city: 45,
      state: 45,
      zipCode: 20,
      email: 254,   // Email can be longer
      country: 2    // Country code should be 2 chars
    };

    // Sanitize each field according to Square's requirements
    Object.keys(fieldLimits).forEach(field => {
      if (sanitized[field]) {
        const limit = fieldLimits[field];
        if (field === 'email') {
          // For email, just validate format but don't truncate
          if (sanitized[field].length > limit) {
            throw new Error('Email address is too long');
          }
        } else if (field === 'country') {
          // Country should be 2-letter code
          sanitized[field] = sanitized[field].substring(0, 2).toUpperCase();
        } else if (field === 'address') {
          // Address can be longer, but still limit it
          sanitized[field] = this.truncateField(sanitized[field], limit, '...');
        } else {
          // Standard fields with 45 char limit
          sanitized[field] = this.truncateField(sanitized[field], limit, '...');
        }
      }
    });

    return sanitized;
  }

  // FIXED: Helper method to create order description that fits Square limits
  createOrderDescription() {
    if (this.cartItems.length === 0) return 'Empty order';

    const maxLength = 45;

    if (this.cartItems.length === 1) {
      return this.truncateField(this.cartItems[0].name, maxLength);
    }

    // Multiple items - create a summary
    const itemCount = this.cartItems.length;
    const suffix = ` and ${itemCount - 1} more`;
    const availableLength = maxLength - suffix.length;

    const firstItem = this.truncateField(this.cartItems[0].name, availableLength, '');
    return `${firstItem}${suffix}`;
  }

  async init() {
    try {
      this.loadCartItems();
      this.renderCartItems();
      this.updateTotals();
      this.setupEventListeners();
      this.setupSecurityMeasures();

      this.updateStatus('Initializing payment system...', 'info');
      await this.initializeSquarePayments();

      window.addEventListener('cartUpdated', (event) => {
        this.loadCartItems();
        this.renderCartItems();
        this.updateTotals();
      });

      window.addEventListener('beforeunload', (event) => {
        if (this.isProcessing) {
          event.preventDefault();
          event.returnValue = 'Payment is being processed. Are you sure you want to leave?';
        }
      });

    } catch (error) {
      console.error('Initialization error:', error);
      this.handleError('Initialization failed', error);
      this.showFallbackPaymentMethod();
    }
  }

  setupEventListeners() {
    const completeOrderBtn = document.getElementById('complete-order-btn');
    if (completeOrderBtn) {
      completeOrderBtn.replaceWith(completeOrderBtn.cloneNode(true));
      const newBtn = document.getElementById('complete-order-btn');

      newBtn.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Complete order button clicked!');
        this.handleSubmit(event);
      });

      console.log('Complete order button event listener added');
    } else {
      console.error('Complete order button not found!');
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && event.target.form && !this.isProcessing) {
        event.preventDefault();
        this.handleSubmit(event);
      }
    });

    const applePayBtn = document.getElementById('apple-pay-button');
    const googlePayBtn = document.getElementById('google-pay-button');

    if (applePayBtn) {
      applePayBtn.addEventListener('click', () => this.handleDigitalWalletPayment('applePay'));
    }

    if (googlePayBtn) {
      googlePayBtn.addEventListener('click', () => this.handleDigitalWalletPayment('googlePay'));
    }
  }

  setupSecurityMeasures() {
    this.originalFormData = this.getFormData();

    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) {
      this.csrfToken = csrfMeta.getAttribute('content');
    }
  }

  async handleSubmit(event) {
    event.preventDefault();

    console.log('handleSubmit called, isProcessing:', this.isProcessing);
    console.log('Cart items length:', this.cartItems.length);

    if (this.isProcessing) {
      console.log('Already processing, returning');
      return;
    }

    if (this.cartItems.length === 0) {
      this.showError('Your cart is empty. Please add items before checking out.');
      return;
    }

    this.hideError();

    try {
      this.validateFormIntegrity();

      const rawFormData = this.getFormData();

      // FIXED: Sanitize form data for Square API requirements
      const formData = this.sanitizeFormDataForSquare(rawFormData);
      console.log('Sanitized form data:', formData);

      const validation = this.validateForm(formData);

      if (!validation.valid) {
        this.showError(validation.message);
        return;
      }

      this.setProcessingState(true);
      const totals = this.updateTotals();

      if (this.isSquareInitialized && this.card) {
        console.log('Processing with Square...');
        const token = await this.tokenizePayment();
        await this.processPayment(token, totals.total, formData);
      } else {
        console.log('Processing demo payment...');
        const result = await this.processDemoPayment(totals.total);
        if (result.success) {
          this.showSuccessPage(result.paymentId);
          this.clearCart();
        }
      }

    } catch (error) {
      this.handleError('Payment processing failed', error);
    } finally {
      this.setProcessingState(false);
    }
  }

  setProcessingState(processing) {
    console.log('Setting processing state:', processing);
    this.isProcessing = processing;

    const elements = {
      buttonText: document.getElementById('button-text'),
      buttonSpinner: document.getElementById('button-spinner'),
      completeBtn: document.getElementById('complete-order-btn'),
      applePayButton: document.getElementById('apple-pay-button'),
      googlePayButton: document.getElementById('google-pay-button')
    };

    if (elements.buttonText) {
      elements.buttonText.style.display = processing ? 'none' : 'block';
    }
    if (elements.buttonSpinner) {
      elements.buttonSpinner.style.display = processing ? 'flex' : 'none';
    }
    if (elements.completeBtn) {
      elements.completeBtn.disabled = processing || this.cartItems.length === 0;
      elements.completeBtn.setAttribute('aria-busy', processing.toString());
      elements.completeBtn.style.opacity = processing ? '0.7' : '1';
      elements.completeBtn.style.cursor = processing ? 'not-allowed' : 'pointer';
    }
    if (elements.applePayButton) {
      elements.applePayButton.disabled = processing;
    }
    if (elements.googlePayButton) {
      elements.googlePayButton.disabled = processing;
    }

    document.querySelectorAll('input, select').forEach(input => {
      if (processing) {
        input.setAttribute('readonly', 'true');
        input.style.opacity = '0.7';
      } else {
        input.removeAttribute('readonly');
        input.style.opacity = '1';
      }
    });
  }

  async initializeSquarePayments() {
    try {
      if (!this.squareConfig) {
        this.updateStatus('Loading payment configuration...', 'info');
        await this.loadSquareConfig();
      }

      this.updateStatus('Loading Square SDK...', 'info');
      await this.loadSquareSDK(this.squareConfig.environment);

      if (!window.Square) {
        throw new Error('Square Web Payments SDK not available');
      }

      this.updateStatus('Initializing Square payments...', 'info');
      this.payments = window.Square.payments(
        this.squareConfig.applicationId,
        this.squareConfig.locationId
      );

      await Promise.allSettled([
        this.initializeCard(),
        this.initializeApplePay(),
        this.initializeGooglePay()
      ]);

      this.isSquareInitialized = true;
      this.updateStatus('Payment system ready', 'success');

    } catch (error) {
      this.updateStatus(`Square initialization failed: ${error.message}`, 'error');
      this.isSquareInitialized = false;
      throw error;
    }
  }

  async initializeCard() {
    try {
      this.card = await this.payments.card({
        style: {
          input: {
            fontSize: '16px',
            color: '#333333'
          },
          '.input-container': {
            borderColor: '#cccccc',
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

      await this.card.attach('#card-container');
      this.updateStatus('Card payment ready', 'success');
    } catch (error) {
      console.warn('Card initialization failed:', error.message);
      throw error;
    }
  }

  async initializeApplePay() {
    try {
      const paymentRequest = this.payments.paymentRequest(this.buildPaymentRequestOptions());
      this.applePay = await this.payments.applePay(paymentRequest);

      const button = document.getElementById('apple-pay-button');
      if (button && this.applePay) {
        button.style.display = 'block';
      }
    } catch (error) {
      const button = document.getElementById('apple-pay-button');
      if (button) button.style.display = 'none';
    }
  }

  async initializeGooglePay() {
    try {
      const paymentRequest = this.payments.paymentRequest(this.buildPaymentRequestOptions());
      this.googlePay = await this.payments.googlePay(paymentRequest);

      const button = document.getElementById('google-pay-button');
      if (button && this.googlePay) {
        button.style.display = 'block';
      }
    } catch (error) {
      const button = document.getElementById('google-pay-button');
      if (button) button.style.display = 'none';
    }
  }

  buildPaymentRequestOptions() {
    const totals = this.updateTotals();

    // FIXED: Create proper payment request with field length validation
    return {
      countryCode: 'US',
      currencyCode: 'USD',
      total: {
        amount: totals.total.toFixed(2),
        label: this.createOrderDescription() // Use sanitized description
      },
      requestBillingContact: false,
      requestShippingContact: false
    };
  }

  async handleDigitalWalletPayment(walletType) {
    if (this.isProcessing || this.cartItems.length === 0) return;

    this.hideError();
    this.setProcessingState(true);

    try {
      let paymentMethod;
      if (walletType === 'applePay' && this.applePay) {
        paymentMethod = this.applePay;
      } else if (walletType === 'googlePay' && this.googlePay) {
        paymentMethod = this.googlePay;
      } else {
        throw new Error(`${walletType} not available`);
      }

      const result = await paymentMethod.tokenize();

      if (result.status === 'OK') {
        const totals = this.updateTotals();
        await this.processPayment(result.token, totals.total);
      } else {
        const errorMessage = result.errors?.map(e => e.message).join(', ') ||
                           `${walletType} payment failed`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      this.handleError(`${walletType} payment failed`, error);
    } finally {
      this.setProcessingState(false);
    }
  }

  async tokenizePayment() {
    if (!this.isSquareInitialized || !this.card) {
      throw new Error('Payment form not ready. Please refresh and try again.');
    }

    const result = await this.card.tokenize();

    if (result.status === 'OK') {
      return result.token;
    } else {
      const errorMessage = result.errors?.map(e => e.message).join(', ') ||
                         'Card information is invalid';
      throw new Error(errorMessage);
    }
  }

  async loadSquareConfig() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      this.updateStatus('Connecting to payment server...', 'info');

      const response = await fetch(`${this.apiBaseUrl}/api/config`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Configuration request failed: ${response.status} ${response.statusText}`);
      }

      this.squareConfig = await response.json();

      if (!this.squareConfig.applicationId || !this.squareConfig.locationId) {
        throw new Error('Invalid configuration received');
      }

      this.updateStatus('Configuration loaded successfully', 'success');
      return this.squareConfig;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(`Configuration request timed out. Please check if ${this.apiBaseUrl} is accessible.`);
      }

      if (error.message.includes('fetch')) {
        throw new Error(`Cannot connect to payment server at ${this.apiBaseUrl}. Please check your internet connection.`);
      }

      throw error;
    }
  }

  async loadSquareSDK(environment) {
    return new Promise((resolve, reject) => {
      if (window.Square) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.type = 'application/javascript';
      script.async = true;
      script.crossOrigin = 'anonymous';

      const sdkUrl = environment === 'sandbox'
        ? 'https://sandbox.web.squarecdn.com/v1/square.js'
        : 'https://web.squarecdn.com/v1/square.js';

      script.src = sdkUrl;

      const timeout = setTimeout(() => {
        script.remove();
        reject(new Error('Square SDK loading timeout'));
      }, 15000);

      script.onload = () => {
        clearTimeout(timeout);
        resolve();
      };

      script.onerror = () => {
        clearTimeout(timeout);
        script.remove();
        reject(new Error(`Failed to load Square SDK from ${sdkUrl}`));
      };

      document.head.appendChild(script);
    });
  }

  // FIXED: Enhanced processPayment with proper field validation
  async processPayment(sourceId, total, formData = null) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      // FIXED: Create payment data with properly formatted fields for Square
      const paymentData = {
        sourceId: sourceId,
        amount: Math.round(total * 100), // Square expects amount in cents
        currency: 'USD',
        idempotencyKey: this.generateIdempotencyKey(),
        locationId: this.squareConfig.locationId,
        // Add order details with proper field lengths
        orderDescription: this.createOrderDescription(),
      };

      // FIXED: Add buyer information if available (with field validation)
      if (formData?.email) {
        paymentData.buyerEmail = formData.email;
      }

      // FIXED: Add billing address if available (with field validation)
      if (formData) {
        paymentData.billingAddress = {
          firstName: formData.firstName || '',
          lastName: formData.lastName || '',
          addressLine1: formData.address || '',
          locality: formData.city || '',
          administrativeDistrictLevel1: formData.state || '',
          postalCode: formData.zipCode || '',
          country: formData.country || 'US'
        };
      }

      console.log('Sending payment data to Square:', paymentData);

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      };

      if (this.csrfToken) {
        headers['X-CSRF-Token'] = this.csrfToken;
      }

      const response = await fetch(`${this.apiBaseUrl}/api/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let result;

      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Invalid response from payment server');
      }

      if (!response.ok) {
        const errorMessage = this.extractErrorMessage(result);
        throw new Error(errorMessage);
      }

      if (result.success) {
        this.showSuccessPage(result.paymentId);
        this.clearCart();
      } else {
        throw new Error(result.error || 'Payment failed');
      }

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Payment request timed out. Please try again.');
      }

      if (this.shouldRetry(error) && this.retryCount < this.maxRetries) {
        this.retryCount++;
        this.updateStatus(`Retrying payment... (${this.retryCount}/${this.maxRetries})`, 'info');
        await this.delay(1000 * this.retryCount);
        return this.processPayment(sourceId, total, formData);
      }

      throw error;
    }
  }

  shouldRetry(error) {
    return error.message.includes('network') ||
           error.message.includes('timeout') ||
           error.message.includes('fetch');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  extractErrorMessage(errorResponse) {
    if (errorResponse.details && Array.isArray(errorResponse.details)) {
      return errorResponse.details.map(d => d.message || d.detail || d.code).join(', ');
    }
    return errorResponse.error || errorResponse.message || 'Payment failed';
  }

  processDemoPayment(total) {
    this.updateStatus('Processing demo payment...', 'info');

    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          paymentId: `DEMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
      }, 2000);
    });
  }

  showFallbackPaymentMethod() {
    const cardContainer = document.getElementById('card-container');
    const digitalWalletButtons = document.querySelectorAll('#apple-pay-button, #google-pay-button');

    digitalWalletButtons.forEach(button => button.style.display = 'none');

    if (cardContainer) {
      cardContainer.innerHTML = `
        <div class="demo-notice" role="alert">
          <strong>Demo Mode:</strong> Payment processing is currently in demo mode.
          Your order will be simulated but no actual payment will be processed.
          <br><br>
          <small>If you're seeing this, there may be an issue connecting to the payment server.</small>
        </div>
        <div class="demo-form">
          <div class="form-group">
            <label>Card Number</label>
            <input type="text" placeholder="Demo mode - any number" disabled>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Expiry</label>
              <input type="text" placeholder="MM/YY" disabled>
            </div>
            <div class="form-group">
              <label>CVV</label>
              <input type="text" placeholder="***" disabled>
            </div>
          </div>
        </div>
      `;
    }

    this.updateStatus('Demo mode active - no real payments will be processed', 'warning');
  }

  updateStatus(message, type = 'info') {
    console.log(`Status (${type}):`, message);

    const statusElement = document.getElementById('square-status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `square-status status-${type}`;

      if (type === 'success') {
        setTimeout(() => {
          if (statusElement.textContent === message) {
            statusElement.textContent = '';
            statusElement.className = 'square-status';
          }
        }, 10000);
      }
    }
  }

  loadCartItems() {
    try {
      if (window.cartManager) {
        this.cartItems = window.cartManager.getItems();
      } else {
        const savedCart = localStorage.getItem('vibeBeadsCart');
        this.cartItems = savedCart ? JSON.parse(savedCart) : [];
      }
    } catch (error) {
      console.warn('Failed to load cart items:', error);
      this.cartItems = [];
    }
  }

  saveCartItems() {
    try {
      localStorage.setItem('vibeBeadsCart', JSON.stringify(this.cartItems));
      if (window.cartManager) {
        window.cartManager.cart = this.cartItems;
        window.cartManager.updateCartUI();
      }
    } catch (error) {
      console.warn('Failed to save cart items:', error);
    }
  }

  clearCart() {
    this.cartItems = [];
    this.saveCartItems();
    if (window.cartManager) {
      window.cartManager.clearCart();
    }
  }

  renderCartItems() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;

    if (this.cartItems.length === 0) {
      cartContainer.innerHTML = `
        <div class="empty-cart" role="status">
          <p>Your cart is empty</p>
          <button onclick="window.location.href='../index.html'" class="continue-shopping-btn">
            Continue Shopping
          </button>
        </div>
      `;
      return;
    }

    const itemsHtml = this.cartItems.map((item, index) => this.renderCartItem(item, index)).join('');
    cartContainer.innerHTML = itemsHtml;
  }

  renderCartItem(item, index) {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 1;
    const total = price * quantity;

    return `
      <div class="cart-item" data-index="${index}" role="listitem">
        <div class="item-image" aria-hidden="true">${this.escapeHtml(item.image || '🕯️')}</div>
        <div class="item-details">
          <div class="item-name">${this.escapeHtml(item.name || 'Unknown Item')}</div>
          <div class="item-price">$${price.toFixed(2)} each</div>
          <div class="quantity-controls">
            <button onclick="checkoutManager.updateQuantity(${index}, -1)" 
                    aria-label="Decrease quantity">-</button>
            <span aria-label="Quantity">${quantity}</span>
            <button onclick="checkoutManager.updateQuantity(${index}, 1)" 
                    aria-label="Increase quantity">+</button>
            <button onclick="checkoutManager.removeItem(${index})" 
                    class="remove-btn" aria-label="Remove item">Remove</button>
          </div>
        </div>
        <div class="item-total">$${total.toFixed(2)}</div>
      </div>
    `;
  }

  updateTotals() {
    const subtotal = this.cartItems.reduce((sum, item) => {
      return sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1));
    }, 0);

    const shipping = this.cartItems.length > 0 ? 8.99 : 0;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    this.updateTotalElements(subtotal, shipping, tax, total);

    return { subtotal, shipping, tax, total };
  }

  updateTotalElements(subtotal, shipping, tax, total) {
    const elements = {
      subtotal: document.getElementById('subtotal'),
      shipping: document.getElementById('shipping'),
      tax: document.getElementById('tax'),
      total: document.getElementById('total'),
      buttonText: document.getElementById('button-text')
    };

    if (elements.subtotal) elements.subtotal.textContent = `$${subtotal.toFixed(2)}`;
    if (elements.shipping) elements.shipping.textContent = `$${shipping.toFixed(2)}`;
    if (elements.tax) elements.tax.textContent = `$${tax.toFixed(2)}`;
    if (elements.total) elements.total.textContent = `$${total.toFixed(2)}`;
    if (elements.buttonText && !this.isProcessing) {
      elements.buttonText.textContent = `Complete Order - $${total.toFixed(2)}`;
    }
  }

  getFormData() {
    const formData = {};
    document.querySelectorAll('input, select, textarea').forEach(input => {
      if (input.name) {
        formData[input.name] = input.value.trim();
      }
    });
    return formData;
  }

  // FIXED: Enhanced form validation with field length warnings
  validateForm(formData) {
    const requiredFields = ['email', 'firstName', 'lastName', 'address', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      return {
        valid: false,
        message: `Please fill in required fields: ${missingFields.join(', ')}`
      };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return { valid: false, message: 'Please enter a valid email address' };
    }

    if (formData.zipCode && !/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      return { valid: false, message: 'Please enter a valid ZIP code' };
    }

    // FIXED: Check for field lengths that might cause Square API issues
    const fieldLengthWarnings = [];
    if (formData.firstName && formData.firstName.length > 45) {
      fieldLengthWarnings.push('First name is too long (max 45 characters)');
    }
    if (formData.lastName && formData.lastName.length > 45) {
      fieldLengthWarnings.push('Last name is too long (max 45 characters)');
    }
    if (formData.address && formData.address.length > 60) {
      fieldLengthWarnings.push('Address is too long (max 60 characters)');
    }
    if (formData.city && formData.city.length > 45) {
      fieldLengthWarnings.push('City is too long (max 45 characters)');
    }

    if (fieldLengthWarnings.length > 0) {
      return {
        valid: false,
        message: `Please shorten these fields: ${fieldLengthWarnings.join(', ')}`
      };
    }

    return { valid: true };
  }

  validateFormIntegrity() {
    const currentFormData = this.getFormData();
    const suspiciousChanges = Object.keys(currentFormData).filter(key =>
      key.startsWith('amount') || key.startsWith('price') || key.startsWith('total')
    );

    if (suspiciousChanges.length > 0) {
      throw new Error('Form tampering detected');
    }
  }

  showError(message) {
    const errorElement = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    if (errorElement && errorText) {
      errorText.textContent = this.escapeHtml(message);
      errorElement.style.display = 'block';
      errorElement.setAttribute('role', 'alert');
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      setTimeout(() => this.hideError(), 15000);
    }
  }

  hideError() {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.style.display = 'none';
      errorElement.removeAttribute('role');
    }
  }

  showSuccessPage(paymentId) {
    const checkoutContent = document.getElementById('checkout-content');
    const successMessage = document.getElementById('success-message');
    const paymentIdText = document.getElementById('payment-id-text');

    if (checkoutContent) checkoutContent.style.display = 'none';
    if (successMessage) successMessage.style.display = 'block';
    if (paymentIdText) paymentIdText.textContent = this.escapeHtml(paymentId);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleError(context, error) {
    console.error(`${context}:`, error);
    const message = error.message || 'An unexpected error occurred. Please try again.';
    this.showError(message);
    this.updateStatus(`Error: ${message}`, 'error');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  updateQuantity(index, change) {
    if (index < 0 || index >= this.cartItems.length) return;

    const newQuantity = Math.max(0, (parseInt(this.cartItems[index].quantity) || 1) + change);

    if (newQuantity === 0) {
      this.removeItem(index);
    } else {
      this.cartItems[index].quantity = newQuantity;
      this.saveCartItems();
      this.renderCartItems();
      this.updateTotals();
    }
  }

  removeItem(index) {
    if (index < 0 || index >= this.cartItems.length) return;

    this.cartItems.splice(index, 1);
    this.saveCartItems();
    this.renderCartItems();
    this.updateTotals();

    if (window.cartManager) {
      window.cartManager.cart = this.cartItems;
      window.cartManager.updateCartUI();
    }
  }
}

// Initialize checkout manager
const checkoutManager = new CheckoutManager();

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing checkout manager...');
  checkoutManager.init().then(() => {
    console.log('Checkout manager initialized successfully');
  }).catch(error => {
    console.error('Failed to initialize checkout manager:', error);
  });
});

// Make methods globally available for onclick handlers
window.checkoutManager = checkoutManager;