// Candles Page JavaScript

// Product data
const candleProducts = [
    {
        id: 1,
        name: 'Apple Ginger Spritz',
        price: 45.00,
        image: '../images/vanilla bean.jpg', // Fixed path
        category: 'signature',
        description: 'Crisp apple meets warming ginger with a bubbly spritz finish. Fresh, spicy, and invigorating - perfect for energizing any space.',
        burnTime: '45-50 hours',
        featured: true
    },
    {
        id: 2,
        name: 'Blackberry Margarita',
        price: 42.00,
        image: '../images/sweet tobacco.jpg', // Fixed path
        category: 'signature',
        description: 'Sweet blackberries blended with zesty lime and a hint of salt. Like a summer cocktail in candle form.',
        burnTime: '45-50 hours',
        featured: true
    },
    {
        id: 3,
        name: 'Black Coral Moss',
        price: 48.00,
        image: '../images/golden hour.jpg', // Fixed path
        category: 'signature',
        description: 'Deep oceanic blend with earthy moss undertones. Mysterious and sophisticated, perfect for creating an elegant atmosphere.',
        burnTime: '45-50 hours',
        featured: true
    },
    {
        id: 4,
        name: 'Egyptian Amber',
        price: 50.00,
        image: '../images/egyptian amber room spray.jpg', // Fixed path
        category: 'signature',
        description: 'Exotic and mysterious blend of amber resin, frankincense, and warm spices. Transport yourself to ancient lands.',
        burnTime: '45-50 hours',
        featured: true
    },
    {
        id: 5,
        name: 'Mango Papaya',
        price: 38.00,
        image: '../images/grapefruit and min.jpg', // Fixed path
        category: 'signature',
        description: 'Tropical paradise with ripe mango and sweet papaya. Brings sunshine and summer vibes to any room.',
        burnTime: '45-50 hours',
        featured: false
    },
    {
        id: 6,
        name: 'Pink Watermelon Lemon',
        price: 40.00,
        image: '../images/fall leaves sticks.jpg', // Fixed path
        category: 'signature',
        description: 'Juicy pink watermelon with bright lemon zest. Refreshing and uplifting, perfect for summer gatherings.',
        burnTime: '45-50 hours',
        featured: false
    },
    {
        id: 7,
        name: 'Sweet Jamaica',
        price: 46.00,
        image: null, // Using emoji placeholder
        category: 'signature',
        description: 'Island-inspired blend of coconut, tropical fruits, and warm vanilla. Escape to the Caribbean with every breath.',
        burnTime: '45-50 hours',
        emoji: '🏝️',
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
    renderProducts();
    setupEventListeners();
    setupModalEvents();
    setupFilterButtons();
});

// Render products based on current filter
function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    // Filter products
    let filteredProducts = candleProducts;
    if (currentFilter !== 'all') {
        filteredProducts = candleProducts.filter(product => product.category === currentFilter);
    }

    // Clear grid
    productsGrid.innerHTML = '';

    // Add custom scent card if showing all or custom filter
    if (currentFilter === 'all' || currentFilter === 'custom') {
        const customCard = createCustomScentCard();
        productsGrid.appendChild(customCard);
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

// Create product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card fade-in';
    card.setAttribute('data-product-id', product.id);
    card.onclick = () => openProductModal(product);

    const imageContent = product.image
        ? `<img src="${product.image}" alt="${product.name}">`
        : `<span style="font-size: 3rem;">${product.emoji || '🕯️'}</span>`;

    card.innerHTML = `
        <div class="product-image">
            ${imageContent}
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-price">From $${product.price.toFixed(2)} USD</p>
            <p class="product-description">${product.description.substring(0, 100)}...</p>
        </div>
    `;

    return card;
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
        <div class="product-info">
            <h3 class="product-title">Pick Your Scent</h3>
            <p class="product-price">From $38.00 USD</p>
            <p class="product-description">Create your perfect custom candle by choosing from our collection of premium fragrances</p>
        </div>
    `;

    return card;
}

// Open product modal
function openProductModal(product) {
    currentProduct = product;
    const modal = document.getElementById('product-modal');

    // Update modal content
    document.getElementById('modal-product-title').textContent = product.name;
    document.getElementById('modal-product-price').textContent = `${product.price.toFixed(2)} USD`;
    document.getElementById('modal-product-description').innerHTML = `
        <p>${product.description}</p>
        <p><strong>Burn Time:</strong> ${product.burnTime}</p>
    `;

    // Update image
    const modalImage = document.getElementById('modal-product-image');
    if (product.image) {
        modalImage.src = product.image;
        modalImage.alt = product.name;
        modalImage.style.display = 'block';
    } else {
        modalImage.style.display = 'none';
        modalImage.parentElement.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 400px; font-size: 6rem; background: linear-gradient(45deg, #f8f6f3, #e8e6e0); border-radius: 8px;">${product.emoji || '🕯️'}</div>`;
    }

    // Reset options
    selectedSize = '8oz';
    selectedSizePrice = 0;
    quantity = 1;

    // Update size buttons
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.size === '8oz') {
            btn.classList.add('active');
        }
        // Update prices based on current product
        if (btn.dataset.size === '8oz') {
            btn.textContent = `8oz Candle - ${product.price.toFixed(2)}`;
            btn.dataset.price = '0';
        } else {
            btn.textContent = `16oz Candle - ${(product.price + 20).toFixed(2)}`;
            btn.dataset.price = '20';
        }
    });

    // Update quantity and total
    document.getElementById('quantity').value = quantity;
    updateTotalPrice();

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Open custom scent modal
function openCustomScentModal() {
    const modal = document.getElementById('custom-scent-modal');

    // Reset selections
    document.querySelectorAll('input[name="scent"]').forEach(input => {
        input.checked = false;
    });

    // Reset size selection
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
            } else if (this.closest('#custom-scent-modal')) {
                updateCustomPrice();
            }
        });
    });

    // Custom scent selection
    document.querySelectorAll('input[name="scent"]').forEach(input => {
        input.addEventListener('change', updateCustomPrice);
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

    const total = (currentProduct.price + selectedSizePrice) * quantity;

    // Show success message (you can integrate with your cart system)
    alert(`Added to cart!\n${currentProduct.name} (${selectedSize})\nQuantity: ${quantity}\nTotal: ${total.toFixed(2)}`);

    closeModal();

    // Update cart counter (example)
    updateCartCounter();
};

window.addCustomToCart = function() {
    const selectedScent = document.querySelector('input[name="scent"]:checked');
    if (!selectedScent) return;

    const basePrice = parseInt(selectedScent.dataset.price);
    const total = basePrice + selectedSizePrice;

    alert(`Added custom candle to cart!\nScent: ${selectedScent.value} (${selectedSize})\nTotal: ${total.toFixed(2)}`);

    closeModal();
    updateCartCounter();
};

// Update cart counter
function updateCartCounter() {
    const cartIcon = document.querySelector('.cart-icon .cart-text');
    if (cartIcon) {
        const currentCount = parseInt(cartIcon.textContent.match(/\d+/)?.[0] || 0);
        cartIcon.textContent = `Cart (${currentCount + 1})`;
    }
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

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
});