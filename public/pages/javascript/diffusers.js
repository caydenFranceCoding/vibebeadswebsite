// Updated Diffusers Page JavaScript with Product Images and $5 Refills
// File: public/pages/javascript/diffusers.js

// Product data for diffusers with your actual images
const diffuserProducts = [
    {
        id: 101,
        name: 'Alpine Balsam',
        price: 35.00,
        image: '../images/diffusers/alpine balsam.jpeg',
        category: 'signature',
        description: 'Fresh mountain air with crisp balsam fir and cedar notes. Transport yourself to a peaceful alpine forest with this invigorating, woodsy fragrance.',
        duration: '2-3 months',
        emoji: '🌲',
        featured: true
    },
    {
        id: 102,
        name: 'Beach Linen',
        price: 38.00,
        image: '../images/diffusers/beach linen.jpeg',
        category: 'signature',
        description: 'Fresh ocean breeze meets clean linen sheets. Crisp and airy scent that brings the relaxing feeling of a coastal getaway to your home.',
        duration: '2-3 months',
        emoji: '🏖️',
        featured: true
    },
    {
        id: 103,
        name: 'Black Currant & Jasmine',
        price: 42.00,
        image: '../images/diffusers/black current & jasmine.jpeg',
        category: 'signature',
        description: 'Rich black currant berries blended with exotic jasmine flowers. A sophisticated floral-fruity scent perfect for elegant spaces.',
        duration: '2-3 months',
        emoji: '🫐',
        featured: true
    },
    {
        id: 104,
        name: 'Blueberry Cheesecake',
        price: 38.00,
        image: '../images/diffusers/blueberry cheesecake.jpeg',
        category: 'signature',
        description: 'Delicious blueberry cheesecake with vanilla cream and graham cracker crust. Sweet and comforting, like your favorite dessert.',
        duration: '2-3 months',
        emoji: '🧁',
        featured: true
    },
    {
        id: 105,
        name: 'Cool Citrus Basil',
        price: 36.00,
        image: '../images/diffusers/cool citrus basil.jpeg',
        category: 'signature',
        description: 'Refreshing citrus zest balanced with aromatic basil leaves. Clean and energizing, perfect for kitchens and workspaces.',
        duration: '2-3 months',
        emoji: '🍋',
        featured: false
    },
    {
        id: 106,
        name: 'Frosted Juniper',
        price: 34.00,
        image: '../images/diffusers/frosted juniper.jpeg',
        category: 'seasonal',
        description: 'Crisp juniper berries with a touch of winter frost. Cool and refreshing, bringing the essence of winter evergreens indoors.',
        duration: '2-3 months',
        emoji: '❄️',
        featured: false
    },
    {
        id: 107,
        name: 'Honeysuckle Jasmine',
        price: 40.00,
        image: '../images/diffusers/honeysuckle jasmine.jpeg',
        category: 'signature',
        description: 'Sweet honeysuckle nectar paired with delicate jasmine blooms. Romantic and floral, perfect for creating a garden-like atmosphere.',
        duration: '2-3 months',
        emoji: '🌸',
        featured: false
    }
];

// State management
let currentFilter = 'all';
let currentProduct = null;
let selectedSize = '100ml';
let selectedSizePrice = 0;
let quantity = 1;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Wait for cart manager to be ready
    setTimeout(() => {
        renderProducts();
        setupEventListeners();
        setupModalEvents();
        setupFilterButtons();
    }, 100);
});

// Render products based on current filter
function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    // Filter products
    let filteredProducts = diffuserProducts;
    if (currentFilter !== 'all') {
        filteredProducts = diffuserProducts.filter(product => product.category === currentFilter);
    }

    // Clear grid
    productsGrid.innerHTML = '';

    // Add refill oils card if showing all or refills filter
    if (currentFilter === 'all' || currentFilter === 'refills') {
        const refillCard = createRefillCard();
        productsGrid.appendChild(refillCard);
    }

    // Add product cards
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });

    // Initialize fade-in animations
    document.querySelectorAll('.fade-in').forEach(el => {
        el.classList.add('visible');
    });
}

// Create product card with real images
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card fade-in';
    card.setAttribute('data-product-id', product.id);
    card.onclick = () => openProductModal(product);

    // Use real image if available, fall back to emoji
    let imageContent;
    if (product.image) {
        imageContent = `<img src="${product.image}" alt="${product.name}" loading="lazy">`;
    } else {
        imageContent = `<span style="font-size: 3rem;">${product.emoji || '💨'}</span>`;
    }

    card.innerHTML = `
        <div class="product-image">
            ${imageContent}
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-price">From $${product.price.toFixed(2)} USD</p>
            <p class="product-description">${product.description.substring(0, 100)}...</p>
            <button class="add-to-cart-btn" onclick="event.stopPropagation(); quickAddToCart(${product.id})">Quick Add to Cart</button>
        </div>
    `;

    return card;
}

// Quick add to cart function
function quickAddToCart(productId) {
    const product = diffuserProducts.find(p => p.id === productId);
    if (!product) return;

    if (window.cartManager) {
        const cartItem = {
            id: product.id,
            name: `${product.name} Diffuser (100ml)`,
            price: product.price,
            quantity: 1,
            size: '100ml',
            scent: null,
            image: product.emoji,
            isCustom: false
        };

        window.cartManager.addItem(cartItem);
    } else {
        // Fallback for demo
        console.log('Added to cart:', product.name);
        alert(`Added ${product.name} Diffuser to cart!`);
    }
}

// Create refill oils card - UPDATED PRICE TO $5
function createRefillCard() {
    const card = document.createElement('div');
    card.className = 'product-card fade-in refill-oils-card';
    card.onclick = () => openRefillModal();

    card.innerHTML = `
        <div class="product-image">
            <span style="font-size: 4rem;">🧴</span>
        </div>
        <div class="product-info">
            <h3 class="product-title">Refill Oils</h3>
            <p class="product-price">From $5.00 USD</p>
            <p class="product-description">Extend the life of your diffuser with our premium refill oils in a variety of scents</p>
            <button class="add-to-cart-btn" onclick="event.stopPropagation(); openRefillModal()">Browse Refills</button>
        </div>
    `;

    return card;
}

// Open product modal with real images
function openProductModal(product) {
    currentProduct = product;
    const modal = document.getElementById('product-modal');

    // Update modal content
    document.getElementById('modal-product-title').textContent = product.name;
    document.getElementById('modal-product-price').textContent = `$${product.price.toFixed(2)} USD`;
    document.getElementById('modal-product-description').innerHTML = `
        <p>${product.description}</p>
        <p><strong>Duration:</strong> ${product.duration}</p>
    `;

    // Use real image in modal if available
    const modalImageContainer = document.querySelector('#product-modal .modal-image');
    if (product.image) {
        modalImageContainer.innerHTML = `<img id="modal-product-image" src="${product.image}" alt="${product.name}">`;
    } else {
        modalImageContainer.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 400px; font-size: 6rem; background: linear-gradient(45deg, #f0f6ff, #e0f0ff); border-radius: 8px;">${product.emoji || '💨'}</div>`;
    }

    // Reset options
    selectedSize = '100ml';
    selectedSizePrice = 0;
    quantity = 1;

    // Update size buttons
    document.querySelectorAll('#product-modal .size-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.size === '100ml') {
            btn.classList.add('active');
        }
        // Update prices based on current product
        if (btn.dataset.size === '100ml') {
            btn.textContent = `100ml Diffuser - $${product.price.toFixed(2)}`;
            btn.dataset.price = '0';
        } else {
            btn.textContent = `200ml Diffuser - $${(product.price + 15).toFixed(2)}`;
            btn.dataset.price = '15';
        }
    });

    // Update quantity and total
    document.getElementById('quantity').value = quantity;
    updateTotalPrice();

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Open refill modal with UPDATED $5 PRICING
function openRefillModal() {
    const modal = document.getElementById('refill-modal');

    // Reset selections
    document.querySelectorAll('input[name="refill"]').forEach(input => {
        input.checked = false;
    });

    // Reset size selection
    document.querySelectorAll('#refill-modal .size-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.size === '100ml') {
            btn.classList.add('active');
        }
    });

    updateRefillPrice();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close modals
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// Setup event listeners
function setupEventListeners() {
    // Size button clicks
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active from siblings
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

    // Refill selection
    document.querySelectorAll('input[name="refill"]').forEach(input => {
        input.addEventListener('change', updateRefillPrice);
    });

    // Quantity controls
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
    // Close button clicks
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModal);
    });

    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    });

    // Escape key to close
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
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Update filter
            currentFilter = this.dataset.category;
            renderProducts();
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

// Update refill oil price - UPDATED WITH $5 BASE PRICES
function updateRefillPrice() {
    const selectedRefill = document.querySelector('input[name="refill"]:checked');
    const addButton = document.querySelector('#refill-modal .add-to-cart-btn');
    const priceSpan = document.getElementById('refill-total-price');

    if (selectedRefill) {
        // All refills now start at $5 instead of varying prices
        const basePrice = 5; // Base price is now $5 for all refills
        const total = basePrice + selectedSizePrice;

        priceSpan.textContent = total.toFixed(2);
        addButton.disabled = false;
    } else {
        priceSpan.textContent = '0.00';
        addButton.disabled = true;
    }
}

// Add to cart functions with proper cart integration
window.addToCart = function() {
    if (!currentProduct) return;

    const finalPrice = currentProduct.price + selectedSizePrice;

    // Create cart item
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

    // Add to cart using cart manager
    if (window.cartManager) {
        window.cartManager.addItem(cartItem);
        console.log('Added to cart via cart manager:', cartItem);
    } else {
        // Fallback for demo
        console.log('Added to cart (fallback):', cartItem);
        alert(`Added ${cartItem.name} to cart!\nQuantity: ${quantity}\nTotal: $${(finalPrice * quantity).toFixed(2)}`);
    }

    closeModal();
};

// UPDATED: Add refill to cart with $5 base price
window.addRefillToCart = function() {
    const selectedRefill = document.querySelector('input[name="refill"]:checked');
    if (!selectedRefill) return;

    const basePrice = 5; // Now $5 for all refills
    const finalPrice = basePrice + selectedSizePrice;

    // Create cart item for refill oil
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

    // Add to cart using cart manager
    if (window.cartManager) {
        window.cartManager.addItem(cartItem);
        console.log('Added refill oil to cart via cart manager:', cartItem);
    } else {
        // Fallback for demo
        console.log('Added refill oil to cart (fallback):', cartItem);
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

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
});