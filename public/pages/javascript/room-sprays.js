// Room Sprays Page JavaScript - Admin Products Only
// File: public/pages/javascript/room-sprays.js

// State management
let currentFilter = 'all';
let currentProduct = null;
let selectedSize = '4oz';
let selectedSizePrice = 0;
let quantity = 1;

// Bundle builder state
let selectedBundleSize = 3;
let selectedBundlePrice = 24;
let selectedScents = [];
let maxScents = 3;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        setupEventListeners();
        setupModalEvents();
        setupFilterButtons();
        setupBundleBuilder();
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
            selectedSizePrice = parseInt(this.dataset.price) || 0;

            updateTotalPrice();
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

function openBundleModal() {
    const modal = document.getElementById('bundle-modal');

    selectedScents = [];
    selectedBundleSize = 3;
    selectedBundlePrice = 24;
    maxScents = 3;

    document.querySelectorAll('input[name="bundle-scents"]').forEach(input => {
        input.checked = false;
    });

    document.querySelectorAll('.bundle-size-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.size === '3') {
            btn.classList.add('active');
        }
    });

    updateBundleUI();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function setupBundleBuilder() {
    document.querySelectorAll('.bundle-size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.bundle-size-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            selectedBundleSize = parseInt(this.dataset.size);

            if (selectedBundleSize === 3) {
                selectedBundlePrice = 24;
            } else if (selectedBundleSize === 5) {
                selectedBundlePrice = 36;
            }

            maxScents = selectedBundleSize;

            if (selectedScents.length > maxScents) {
                selectedScents = selectedScents.slice(0, maxScents);
                document.querySelectorAll('input[name="bundle-scents"]').forEach(input => {
                    input.checked = selectedScents.includes(input.value);
                });
            }

            updateBundleUI();
        });
    });

    document.querySelectorAll('input[name="bundle-scents"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {
                if (selectedScents.length < maxScents) {
                    selectedScents.push(this.value);
                } else {
                    this.checked = false;
                    alert(`You can only select ${maxScents} scents for this bundle size.`);
                }
            } else {
                selectedScents = selectedScents.filter(scent => scent !== this.value);
            }
            updateBundleUI();
        });
    });
}

function updateBundleUI() {
    document.getElementById('selected-count').textContent = selectedScents.length;
    document.getElementById('max-count').textContent = maxScents;
    document.getElementById('bundle-total-price').textContent = selectedBundlePrice.toFixed(2);

    const addButton = document.querySelector('#bundle-modal .add-to-cart-btn');
    addButton.disabled = selectedScents.length !== maxScents;
}

function updateTotalPrice() {
    if (!currentProduct) return;

    const basePrice = currentProduct.price;
    const total = (basePrice + selectedSizePrice) * quantity;

    document.getElementById('total-price').textContent = total.toFixed(2);
}

window.addToCart = function() {
    if (!currentProduct) return;

    const finalPrice = currentProduct.price + selectedSizePrice;
    let sizeName = selectedSize === '4oz' ? '4oz' : '8oz';

    const cartItem = {
        id: currentProduct.id,
        name: `${currentProduct.name} Room Spray (${sizeName})`,
        price: finalPrice,
        quantity: quantity,
        size: sizeName,
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

window.addBundleToCart = function() {
    if (selectedScents.length !== maxScents) return;

    const cartItem = {
        id: `bundle-${Date.now()}`,
        name: `Room Spray ${selectedBundleSize}-Pack Bundle (${selectedScents.join(', ')})`,
        price: selectedBundlePrice,
        quantity: 1,
        size: `${selectedBundleSize}-Pack Bundle`,
        scent: selectedScents.join(', '),
        image: '🎁',
        isCustom: true
    };

    if (window.cartManager) {
        window.cartManager.addItem(cartItem);
    } else {
        alert(`Added room spray bundle to cart!\nScents: ${selectedScents.join(', ')}\nTotal: $${selectedBundlePrice.toFixed(2)}`);
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