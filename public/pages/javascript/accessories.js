// Accessories Page JavaScript - Admin Products Only
// File: public/pages/javascript/accessories.js

// State management
let currentProduct = null;
let selectedSize = 'Standard';
let selectedSizePrice = 0;
let quantity = 1;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        setupEventListeners();
        setupModalEvents();
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
            selectedSizePrice = parseFloat(this.dataset.price) || 0;

            if (this.closest('#product-modal')) {
                updateTotalPrice();
            }
        });
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

// Update total price in product modal
function updateTotalPrice() {
    if (!currentProduct) return;
    const basePrice = currentProduct.price;
    const total = (basePrice + selectedSizePrice) * quantity;
    document.getElementById('total-price').textContent = total.toFixed(2);
}

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