// Updated Candles Page JavaScript with YOUR ACTUAL IMAGES
// File: public/pages/javascript/candles.js

// Product data with your real image paths
const candleProducts = [
    {
        id: 1,
        name: 'Apple Ginger Spritz',
        price: 45.00,
        image: '../images/candles/apple ginger spritz.jpeg',
        category: 'signature',
        description: 'Crisp apple meets warming ginger with a bubbly spritz finish. Fresh, spicy, and invigorating - perfect for energizing any space.',
        burnTime: '45-50 hours',
        emoji: '🍎',
        featured: true
    },
    {
        id: 2,
        name: 'Blackberry Margarita',
        price: 42.00,
        image: '../images/candles/black berry margarita.jpeg',
        category: 'signature',
        description: 'Sweet blackberries blended with zesty lime and a hint of salt. Like a summer cocktail in candle form.',
        burnTime: '45-50 hours',
        emoji: '🫐',
        featured: true
    },
    {
        id: 3,
        name: 'Black Coral Moss',
        price: 48.00,
        image: '../images/candles/black coral & moss.jpeg',
        category: 'signature',
        description: 'Deep oceanic blend with earthy moss undertones. Mysterious and sophisticated, perfect for creating an elegant atmosphere.',
        burnTime: '45-50 hours',
        emoji: '🌊',
        featured: true
    },
    {
        id: 4,
        name: 'Egyptian Amber',
        price: 50.00,
        image: '../images/candles/egyption amber.jpeg',
        category: 'signature',
        description: 'Exotic and mysterious blend of amber resin, frankincense, and warm spices. Transport yourself to ancient lands.',
        burnTime: '45-50 hours',
        emoji: '🏺',
        featured: true
    },
    {
        id: 5,
        name: 'Mango Papaya',
        price: 38.00,
        image: '../images/candles/mango papaya.jpeg',
        category: 'signature',
        description: 'Tropical paradise with ripe mango and sweet papaya. Brings sunshine and summer vibes to any room.',
        burnTime: '45-50 hours',
        emoji: '🥭',
        featured: false
    },
    {
        id: 6,
        name: 'Pink Watermelon Lemon',
        price: 40.00,
        image: '../images/candles/pink watermelon lemon.jpeg',
        category: 'signature',
        description: 'Juicy pink watermelon with bright lemon zest. Refreshing and uplifting, perfect for summer gatherings.',
        burnTime: '45-50 hours',
        emoji: '🍉',
        featured: false
    },
    {
        id: 7,
        name: 'Sweet Jamaica',
        price: 46.00,
        image: '../images/candles/vanilla bean.jpeg', // Using vanilla bean as closest match
        category: 'signature',
        description: 'Island-inspired blend of coconut, tropical fruits, and warm vanilla. Escape to the Caribbean with every breath.',
        burnTime: '45-50 hours',
        emoji: '🏝️',
        featured: false
    },
    // Adding more products based on your available images
    {
        id: 8,
        name: 'Vanilla Bean',
        price: 42.00,
        image: '../images/candles/vanilla bean.jpeg',
        category: 'signature',
        description: 'Rich, creamy vanilla bean with warm undertones. Classic and comforting scent that creates a cozy atmosphere.',
        burnTime: '45-50 hours',
        emoji: '🤍',
        featured: false
    },
    {
        id: 9,
        name: 'Black Truffle Amber Woods',
        price: 55.00,
        image: '../images/candles/black truffle amber woods.jpeg',
        category: 'signature',
        description: 'Luxurious blend of black truffle, amber, and rich woods. Sophisticated and mysterious, perfect for evening ambiance.',
        burnTime: '45-50 hours',
        emoji: '🖤',
        featured: false
    },
    {
        id: 10,
        name: 'Cinnamon Chai',
        price: 44.00,
        image: '../images/candles/cinnamon chai.jpeg',
        category: 'signature',
        description: 'Warm cinnamon spice blended with aromatic chai tea. Cozy and inviting, perfect for cool evenings.',
        burnTime: '45-50 hours',
        emoji: '🍂',
        featured: false
    },
    {
        id: 11,
        name: 'Grapefruit & Mint',
        price: 41.00,
        image: '../images/candles/grapefruit & mint.jpeg',
        category: 'signature',
        description: 'Fresh grapefruit with cooling mint. Energizing and refreshing, perfect for morning motivation.',
        burnTime: '45-50 hours',
        emoji: '🍊',
        featured: false
    },
    {
        id: 12,
        name: 'Moonflower Nectar',
        price: 47.00,
        image: '../images/candles/moonflower nectar.jpeg',
        category: 'signature',
        description: 'Exotic moonflower with sweet nectar notes. Floral and dreamy, perfect for evening relaxation.',
        burnTime: '45-50 hours',
        emoji: '🌙',
        featured: false
    }
];

// State management
let currentFilter = 'all';
let currentProduct = null;
let selectedSize = '8oz';
let selectedSizePrice = 0;
let quantity = 1;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
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

    let filteredProducts = candleProducts;
    if (currentFilter !== 'all') {
        filteredProducts = candleProducts.filter(product => product.category === currentFilter);
    }

    productsGrid.innerHTML = '';

    if (currentFilter === 'all' || currentFilter === 'custom') {
        const customCard = createCustomScentCard();
        productsGrid.appendChild(customCard);
    }

    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });

    document.querySelectorAll('.fade-in').forEach(el => {
        el.classList.add('visible');
    });
}

// UPDATED: Create product card with real images
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
        imageContent = `<span style="font-size: 3rem;">${product.emoji || '🕯️'}</span>`;
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
    const product = candleProducts.find(p => p.id === productId);
    if (!product) return;

    if (window.cartManager) {
        const cartItem = {
            id: product.id,
            name: `${product.name} (8oz)`,
            price: product.price,
            quantity: 1,
            size: '8oz',
            scent: null,
            image: product.emoji,
            isCustom: false
        };

        window.cartManager.addItem(cartItem);
    } else {
        console.log('Added to cart:', product.name);
        alert(`Added ${product.name} to cart!`);
    }
}

// Create custom scent card
function createCustomScentCard() {
    const card = document.createElement('div');
    card.className = 'product-card fade-in custom-scent-card';
    card.onclick = () => openCustomScentModal();

    card.innerHTML = `
        <div class="product-image">
            <span style="font-size: 4rem;">✨</span>
        </div>
        <div class="product-info">
            <h3 class="product-title">Pick Your Scent</h3>
            <p class="product-price">From $38.00 USD</p>
            <p class="product-description">Create your perfect custom candle by choosing from our collection of premium fragrances</p>
            <button class="add-to-cart-btn" onclick="event.stopPropagation(); openCustomScentModal()">Customize Candle</button>
        </div>
    `;

    return card;
}

// UPDATED: Open product modal with real images
function openProductModal(product) {
    currentProduct = product;
    const modal = document.getElementById('product-modal');

    document.getElementById('modal-product-title').textContent = product.name;
    document.getElementById('modal-product-price').textContent = `$${product.price.toFixed(2)} USD`;
    document.getElementById('modal-product-description').innerHTML = `
        <p>${product.description}</p>
        <p><strong>Burn Time:</strong> ${product.burnTime}</p>
    `;

    // UPDATED: Use real image in modal
    const modalImageContainer = document.querySelector('#product-modal .modal-image');
    if (product.image) {
        modalImageContainer.innerHTML = `<img id="modal-product-image" src="${product.image}" alt="${product.name}">`;
    } else {
        modalImageContainer.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 400px; font-size: 6rem; background: linear-gradient(45deg, #f8f6f3, #e8e6e0); border-radius: 8px;">${product.emoji || '🕯️'}</div>`;
    }

    selectedSize = '8oz';
    selectedSizePrice = 0;
    quantity = 1;

    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.size === '8oz') {
            btn.classList.add('active');
        }
        if (btn.dataset.size === '8oz') {
            btn.textContent = `8oz Candle - $${product.price.toFixed(2)}`;
            btn.dataset.price = '0';
        } else {
            btn.textContent = `16oz Candle - $${(product.price + 20).toFixed(2)}`;
            btn.dataset.price = '20';
        }
    });

    document.getElementById('quantity').value = quantity;
    updateTotalPrice();

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Open custom scent modal
function openCustomScentModal() {
    const modal = document.getElementById('custom-scent-modal');

    document.querySelectorAll('input[name="scent"]').forEach(input => {
        input.checked = false;
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

// Update custom scent price
function updateCustomPrice() {
    const selectedScent = document.querySelector('input[name="scent"]:checked');
    const addButton = document.querySelector('#custom-scent-modal .add-to-cart-btn');
    const priceSpan = document.getElementById('custom-total-price');

    if (selectedScent) {
        const basePrice = parseInt(selectedScent.dataset.price);
        const total = basePrice + selectedSizePrice;

        priceSpan.textContent = total.toFixed(2);
        addButton.disabled = false;
    } else {
        priceSpan.textContent = '0.00';
        addButton.disabled = true;
    }
}

// Add to cart functions
window.addToCart = function() {
    if (!currentProduct) return;

    const finalPrice = currentProduct.price + selectedSizePrice;

    const cartItem = {
        id: currentProduct.id,
        name: `${currentProduct.name} (${selectedSize})`,
        price: finalPrice,
        quantity: quantity,
        size: selectedSize,
        scent: null,
        image: currentProduct.emoji,
        isCustom: false
    };

    if (window.cartManager) {
        window.cartManager.addItem(cartItem);
        console.log('Added to cart via cart manager:', cartItem);
    } else {
        console.log('Added to cart (fallback):', cartItem);
        alert(`Added ${cartItem.name} to cart!\nQuantity: ${quantity}\nTotal: $${(finalPrice * quantity).toFixed(2)}`);
    }

    closeModal();
};

window.addCustomToCart = function() {
    const selectedScent = document.querySelector('input[name="scent"]:checked');
    if (!selectedScent) return;

    const basePrice = parseInt(selectedScent.dataset.price);
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
        console.log('Added custom candle to cart via cart manager:', cartItem);
    } else {
        console.log('Added custom candle to cart (fallback):', cartItem);
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