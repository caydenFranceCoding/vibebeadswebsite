// Diffusers Page JavaScript - Admin Products Only
// File: public/pages/javascript/diffusers.js

// State management
let currentFilter = 'all';
let currentProduct = null;
let selectedSize = '5.2oz';
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

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

function setupEventListeners() {
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.parentElement.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            selectedSize = this.dataset.size;
            selectedSizePrice = parseInt(this.dataset.price) || parseInt(this.dataset.extra) || 0;

            if (this.closest('#product-modal')) {
                updateTotalPrice();
            } else if (this.closest('#refill-modal')) {
                updateRefillPrice();
            }
        });
    });

    document.querySelectorAll('input[name="refill"]').forEach(input => {
        input.addEventListener('change', updateRefillPrice);
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

function setupFilterButtons() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.category;
        });
    });
}

function updateTotalPrice() {
    if (!currentProduct) return;
    const basePrice = currentProduct.price;
    const total = (basePrice + selectedSizePrice) * quantity;
    document.getElementById('total-price').textContent = total.toFixed(2);
}

function updateRefillPrice() {
    const selectedRefill = document.querySelector('input[name="refill"]:checked');
    const addButton = document.querySelector('#refill-modal .add-to-cart-btn');
    const priceSpan = document.getElementById('refill-total-price');

    if (selectedRefill) {
        const basePrice = 5;
        const total = basePrice + selectedSizePrice;
        priceSpan.textContent = total.toFixed(2);
        addButton.disabled = false;
    } else {
        priceSpan.textContent = '5.00';
        addButton.disabled = true;
    }
}

function openRefillModal() {
    const modal = document.getElementById('refill-modal');

    document.querySelectorAll('input[name="refill"]').forEach(input => {
        input.checked = false;
    });

    document.querySelectorAll('#refill-modal .size-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.size === '5.2oz') {
            btn.classList.add('active');
        }
    });

    updateRefillPrice();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

window.addToCart = function() {
    if (!currentProduct) return;

    const finalPrice = currentProduct.price + selectedSizePrice;

    const cartItem = {
        id: currentProduct.id,
        name: `${currentProduct.name} Diffuser (${selectedSize})`,
        price: finalPrice,
        quantity: quantity,
        size: selectedSize,
        scent: null,
        image: currentProduct.emoji,
        isCustom: false
    };

    if (window.cartManager) {
        window.cartManager.addItem(cartItem);
    } else {
        alert(`Added ${cartItem.name} to cart!\nQuantity: ${quantity}\nTotal: $${(finalPrice * quantity).toFixed(2)}`);
    }

    closeModal();
};

window.addRefillToCart = function() {
    const selectedRefill = document.querySelector('input[name="refill"]:checked');
    if (!selectedRefill) return;

    const basePrice = 5;
    const finalPrice = basePrice + selectedSizePrice;

    const cartItem = {
        id: `refill-${Date.now()}`,
        name: `${selectedRefill.value} Refill Oil (${selectedSize})`,
        price: finalPrice,
        quantity: 1,
        size: selectedSize,
        scent: selectedRefill.value,
        image: '🧴',
        isCustom: false
    };

    if (window.cartManager) {
        window.cartManager.addItem(cartItem);
    } else {
        alert(`Added refill oil to cart!\nScent: ${selectedRefill.value} (${selectedSize})\nTotal: $${finalPrice.toFixed(2)}`);
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