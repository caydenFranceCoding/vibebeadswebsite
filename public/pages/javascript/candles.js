// Updated Candles Page JavaScript with proper Cart Integration
// File: public/pages/javascript/candles.js

// Product data with emoji placeholders
const candleProducts = [
    {
        id: 1,
        name: 'Apple Ginger Spritz',
        price: 45.00,
        image: null,
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
        image: null,
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
        image: null,
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
        image: null,
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
        image: null,
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
        image: null,
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
        image: null,
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

    // Always use emoji placeholder since images don't exist
    const imageContent = `<span style="font-size: 3rem;">${product.emoji || '🕯️'}</span>`;

    card.innerHTML = `
        <div class="product-image">
            ${imageContent}
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-price">From ${product.price.toFixed(2)} USD</p>
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
        // Fallback for demo
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

    // Update image - always use emoji placeholder
    const modalImage = document.getElementById('modal-product-image');
    modalImage.style.display = 'none';
    modalImage.parentElement.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 400px; font-size: 6rem; background: linear-gradient(45deg, #f8f6f3, #e8e6e0); border-radius: 8px;">${product.emoji || '🕯️'}</div>`;

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

// Add to cart functions - Updated with proper cart integration
window.addToCart = function() {
    if (!currentProduct) return;

    const finalPrice = currentProduct.price + selectedSizePrice;

    // Create cart item
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

    // Add to cart using cart manager
    if (window.cartManager) {
        window.cartManager.addItem(cartItem);
        console.log('Added to cart via cart manager:', cartItem);
    } else {
        // Fallback for demo
        console.log('Added to cart (fallback):', cartItem);
        alert(`Added ${cartItem.name} to cart!\nQuantity: ${quantity}\nTotal: ${(finalPrice * quantity).toFixed(2)}`);
    }

    closeModal();
};

window.addCustomToCart = function() {
    const selectedScent = document.querySelector('input[name="scent"]:checked');
    if (!selectedScent) return;

    const basePrice = parseInt(selectedScent.dataset.price);
    const finalPrice = basePrice + selectedSizePrice;

    // Create cart item for custom candle
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

    // Add to cart using cart manager
    if (window.cartManager) {
        window.cartManager.addItem(cartItem);
        console.log('Added custom candle to cart via cart manager:', cartItem);
    } else {
        // Fallback for demo
        console.log('Added custom candle to cart (fallback):', cartItem);
        alert(`Added custom candle to cart!\nScent: ${selectedScent.value} (${selectedSize})\nTotal: ${finalPrice.toFixed(2)}`);
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