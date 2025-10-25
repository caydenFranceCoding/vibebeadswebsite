// Candles Page JavaScript - Admin Products Only
// File: public/pages/javascript/candles.js

// State management
let currentFilter = 'all';
let currentProduct = null;
let selectedSize = '8oz';
let selectedSizePrice = 0;
let quantity = 1;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        setupEventListeners();
        setupModalEvents();
        setupFilterButtons();
    }, 100);
});

// Close modals
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// Setup event listeners
function setupEventListeners() {
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.parentElement.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            selectedSize = this.dataset.size;
            selectedSizePrice = parseInt(this.dataset.price) || parseInt(this.dataset.extra) || 0;

            if (this.closest('#product-modal')) {
                updateTotalPrice();
            } else if (this.closest('#custom-scent-modal')) {
                updateCustomPrice();
            }
        });
    });

    document.querySelectorAll('input[name="scent"]').forEach(input => {
        input.addEventListener('change', updateCustomPrice);
    });

    window.changeQuantity = function(change) {
        const quantityInput = document.getElementById('quantity');
        const newQuantity = Math.max(1, Math.min(10, quantity + change));
        quantity = newQuantity;
        quantityInput.value = quantity;
        updateTotalPrice();
    };

    document.getElementById('quantity').addEventListener('change', function() {
        quantity = Math.max(1, Math.min(10, parseInt(this.value) || 1));
        this.value = quantity;
        updateTotalPrice();
    });
}

// Setup modal events
function setupModalEvents() {
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModal);
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Setup filter buttons
function setupFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.category;
        });
    });
}

// Update total price in product modal
function updateTotalPrice() {
    if (!currentProduct) return;
    const basePrice = currentProduct.price;
    const total = (basePrice + selectedSizePrice) * quantity;
    document.getElementById('total-price').textContent = total.toFixed(2);
}

// Update custom scent price
function updateCustomPrice() {
    const selectedScent = document.querySelector('input[name="scent"]:checked');
    const addButton = document.querySelector('#custom-scent-modal .add-to-cart-btn');
    const priceSpan = document.getElementById('custom-total-price');

    if (selectedScent) {
        const basePrice = 15;
        const total = basePrice + selectedSizePrice;
        priceSpan.textContent = total.toFixed(2);
        addButton.disabled = false;
    } else {
        priceSpan.textContent = '15.00';
        addButton.disabled = true;
    }
}

// Open custom scent modal
function openCustomScentModal() {
    const modal = document.getElementById('custom-scent-modal');

    document.querySelectorAll('input[name="scent"]').forEach(input => {
        input.checked = false;
        input.dataset.price = '15';
    });

    document.querySelectorAll('#custom-scent-modal .size-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.size === '8oz') {
            btn.classList.add('active');
        }
    });

    updateCustomPrice();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Add custom to cart
window.addCustomToCart = function() {
    const selectedScent = document.querySelector('input[name="scent"]:checked');
    if (!selectedScent) return;

    const basePrice = 15;
    const finalPrice = basePrice + selectedSizePrice;

    const cartItem = {
        id: `custom-${Date.now()}`,
        name: `${selectedScent.value} (${selectedSize})`,
        price: finalPrice,
        quantity: 1,
        size: selectedSize,
        scent: selectedScent.value,
        image: '✨',
        isCustom: true
    };

    if (window.cartManager) {
        window.cartManager.addItem(cartItem);
    } else {
        alert(`Added custom candle to cart!\nScent: ${selectedScent.value} (${selectedSize})\nTotal: $${finalPrice.toFixed(2)}`);
    }

    closeModal();
};

// Initialize fade-in animations
document.addEventListener('DOMContentLoaded', function() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
});