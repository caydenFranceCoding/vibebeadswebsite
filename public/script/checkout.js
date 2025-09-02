// Enhanced Checkout Manager with Transaction Limit Handling
// File: public/script/checkout.js - Replace your existing checkout.js with this

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
    this.transactionLimitReached = false;
    this.demoMode = false; // Track if we're in demo mode
  }

  getApiBaseUrl() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    } else {
      return 'https://squareupapi.onrender.com';
    }
  }

  generateSessionId() {
    return `s_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
  }

  generateIdempotencyKey() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 8);
    return `${timestamp}_${random}`;
  }

  truncateField(value, maxLength = 45, suffix = '...') {
    if (!value || typeof value !== 'string') return value;
    if (value.length <= maxLength) return value;
    const truncateLength = maxLength - suffix.length;
    return value.substring(0, truncateLength) + suffix;
  }

  sanitizeFormDataForSquare(formData) {
    const sanitized = { ...formData };
    const fieldLimits = {
      firstName: 45,
      lastName: 45,
      address: 60,
      city: 45,
      state: 45,
      zipCode: 20,
      email: 254,
      country: 2
    };

    Object.keys(fieldLimits).forEach(field => {
      if (sanitized[field]) {
        const limit = fieldLimits[field];
        if (field === 'email') {
          if (sanitized[field].length > limit) {
            throw new Error('Email address is too long');
          }
        } else if (field === 'country') {
          sanitized[field] = sanitized[field].substring(0, 2).toUpperCase();
        } else if (field === 'address') {
          sanitized[field] = this.truncateField(sanitized[field], limit, '...');
        } else {
          sanitized[field] = this.truncateField(sanitized[field], limit, '...');
        }
      }
    });

    return sanitized;
  }

  createOrderDescription() {
    if (this.cartItems.length === 0) return 'Empty order';
    const maxLength = 45;

    if (this.cartItems.length === 1) {
      return this.truncateField(this.cartItems[0].name, maxLength);
    }

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
      this.enableDemoMode();
    }
  }

  // NEW: Enable demo mode when Square API fails
  enableDemoMode() {
    this.demoMode = true;
    this.isSquareInitialized = false;
    this.showFallbackPaymentMethod();
    this.updateStatus('Demo mode enabled - Square API transaction limit reached', 'warning');

    // Update button text to indicate demo mode
    const buttonText = document.getElementById('button-text');
    if (buttonText && buttonText.textContent.includes('Complete Order')) {
      const total = this.updateTotals().total;
      buttonText.textContent = `Demo Order - $${total.toFixed(2)} (No charge)`;
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
    console.log('Demo mode:', this.demoMode);

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
      const formData = this.sanitizeFormDataForSquare(rawFormData);
      console.log('Sanitized form data:', formData);

      const validation = this.validateForm(formData);
      if (!validation.valid) {
        this.showError(validation.message);
        return;
      }

      this.setProcessingState(true);
      const totals = this.updateTotals();

      // ENHANCED: Check if we're in demo mode or if Square has transaction limits
      if (this.demoMode || this.transactionLimitReached) {
        console.log('Processing with demo payment...');
        const result = await this.processDemoPayment(totals.total, formData);
        if (result.success) {
          this.showSuccessPage(result.paymentId, true); // true = demo mode
          this.clearCart();
        }
      } else if (this.isSquareInitialized && this.card) {
        console.log('Processing with Square...');
        try {
          const token = await this.tokenizePayment();
          await this.processPayment(token, totals.total, formData);
        } catch (squareError) {
          // If Square fails due to transaction limits, fall back to demo
          if (this.isTransactionLimitError(squareError)) {
            console.log('Transaction limit reached, switching to demo mode');
            this.transactionLimitReached = true;
            this.enableDemoMode();

            const result = await this.processDemoPayment(totals.total, formData);
            if (result.success) {
              this.showSuccessPage(result.paymentId, true);
              this.clearCart();
            }
          } else {
            throw squareError;
          }
        }
      } else {
        console.log('Processing demo payment (Square not initialized)...');
        const result = await this.processDemoPayment(totals.total, formData);
        if (result.success) {
          this.showSuccessPage(result.paymentId, true);
          this.clearCart();
        }
      }

    } catch (error) {
      this.handleError('Payment processing failed', error);
    } finally {
      this.setProcessingState(false);
    }
  }

  // NEW: Check if error is related to transaction limits
  isTransactionLimitError(error) {
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('transaction_limit') ||
      errorMessage.includes('authorization error') ||
      errorMessage.includes('limit exceeded') ||
      errorMessage.includes('daily limit') ||
      errorMessage.includes('monthly limit') ||
      errorMessage.includes('quota exceeded')
    );
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

    return {
      countryCode: 'US',
      currencyCode: 'USD',
      total: {
        amount: totals.total.toFixed(2),
        label: this.createOrderDescription()
      },
      requestBillingContact: false,
      requestShippingContact: false
    };
  }

  async handleDigitalWalletPayment(walletType) {
    if (this.isProcessing || this.cartItems.length === 0) return;

    // Check if we should use demo mode
    if (this.demoMode || this.transactionLimitReached) {
      this.showError(`${walletType} is not available in demo mode. Please use the regular checkout form.`);
      return;
    }

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
      // Check if this is a transaction limit error
      if (this.isTransactionLimitError(error)) {
        this.transactionLimitReached = true;
        this.enableDemoMode();
        this.showError(`Transaction limit reached. Please use the demo checkout form below.`);
      } else {
        this.handleError(`${walletType} payment failed`, error);
      }
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

  async processPayment(sourceId, total, formData = null) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const paymentData = {
        sourceId: sourceId,
        amount: Math.round(total * 100),
        currency: 'USD',
        idempotencyKey: this.generateIdempotencyKey(),
        locationId: this.squareConfig.locationId,
        orderDescription: this.createOrderDescription(),
      };

      if (formData?.email) {
        paymentData.buyerEmail = formData.email;
      }

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

        // ENHANCED: Check for transaction limit errors in the response
        if (this.isTransactionLimitError(new Error(errorMessage))) {
          throw new Error('TRANSACTION_LIMIT: ' + errorMessage);
        }

        throw new Error(errorMessage);
      }

      if (result.success) {
        this.showSuccessPage(result.paymentId, false); // false = real payment
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
    const message = error.message.toLowerCase();
    return (message.includes('network') ||
           message.includes('timeout') ||
           message.includes('fetch')) &&
           !this.isTransactionLimitError(error);
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

  // ENHANCED: Demo payment with customer info
  processDemoPayment(total, formData = null) {
    this.updateStatus('Processing demo payment...', 'info');

    return new Promise(resolve => {
      setTimeout(() => {
        const customerInfo = formData ? {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          address: formData.address
        } : {};

        resolve({
          success: true,
          paymentId: `DEMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: total,
          customer: customerInfo
        });
      }, 2000);
    });
  }

  showFallbackPaymentMethod() {
    const cardContainer = document.getElementById('card-container');
    const digitalWalletButtons = document.querySelectorAll('#apple-pay-button, #google-pay-button');

    digitalWalletButtons.forEach(button => {
      button.style.display = 'none';
    });

    if (cardContainer) {
      cardContainer.innerHTML = `
        <div class="demo-notice" role="alert" style="
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          text-align: center;
        ">
          <h4 style="color: #92400e; margin-bottom: 1rem; font-size: 1.1rem;">
            🚫 Square Transaction Limit Reached
          </h4>
          <p style="color: #92400e; margin-bottom: 1rem; line-height: 1.5;">
            <strong>Demo Mode Active:</strong> The Square API has reached its daily transaction limit. 
            Your order will be processed as a demo transaction - no actual payment will be charged.
          </p>
          <p style="color: #92400e; font-size: 0.9rem;">
            This is normal for sandbox/demo accounts. In production, this limit would be much higher.
          </p>
        </div>
        <div class="demo-form" style="
          background: #f9fafb;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 1.5rem;
          text-align: center;
        ">
          <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 1rem;">
            Demo card form (not functional)
          </p>
          <div class="form-group" style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #6b7280;">Card Number</label>
            <input type="text" placeholder="4111 1111 1111 1111" disabled style="
              width: 100%;
              padding: 0.75rem;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              background: #f9fafb;
              color: #6b7280;
            ">
          </div>
          <div class="form-row" style="display: flex; gap: 1rem;">
            <div class="form-group" style="flex: 1;">
              <label style="display: block; margin-bottom: 0.5rem; color: #6b7280;">Expiry</label>
              <input type="text" placeholder="12/25" disabled style="
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                background: #f9fafb;
                color: #6b7280;
              ">
            </div>
            <div class="form-group" style="flex: 1;">
              <label style="display: block; margin-bottom: 0.5rem; color: #6b7280;">CVV</label>
              <input type="text" placeholder="123" disabled style="
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                background: #f9fafb;
                color: #6b7280;
              ">
            </div>
          </div>
        </div>
      `;
    }

    this.updateStatus('Demo mode active - Square transaction limit reached', 'warning');
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
      if (this.demoMode || this.transactionLimitReached) {
        elements.buttonText.textContent = `Demo Order - $${total.toFixed(2)} (No Charge)`;
      } else {
        elements.buttonText.textContent = `Complete Order - $${total.toFixed(2)}`;
      }
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

  // ENHANCED: Success page with demo mode indication
  showSuccessPage(paymentId, isDemoMode = false) {
    const checkoutContent = document.getElementById('checkout-content');
    const successMessage = document.getElementById('success-message');
    const paymentIdText = document.getElementById('payment-id-text');

    if (checkoutContent) checkoutContent.style.display = 'none';
    if (successMessage) {
      successMessage.style.display = 'block';

      // Update success message for demo mode
      if (isDemoMode) {
        const successCard = successMessage.querySelector('.success-card');
        const title = successCard.querySelector('h2');
        const description = successCard.querySelector('p');

        if (title) {
          title.textContent = 'Demo Order Processed!';
        }
        if (description) {
          description.innerHTML = `
            <strong>This was a demo transaction - no actual payment was charged.</strong><br><br>
            Thank you for testing our checkout system! In a real scenario, your payment would have been processed successfully.
          `;
        }

        // Add demo styling
        if (successCard) {
          successCard.style.background = 'linear-gradient(135deg, #fef3c7, #fde68a)';
          successCard.style.borderColor = '#f59e0b';
        }
      }
    }
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