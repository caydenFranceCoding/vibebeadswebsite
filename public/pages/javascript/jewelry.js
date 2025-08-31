// Jewelry Page JavaScript - Bracelets Only
// File: public/pages/javascript/jewelry.js

// Product data for bracelets only
const jewelryProducts = [
    {
        id: 301,
        name: 'Faceted Gemstone & Metallic Spacer Bracelet',
        price: 20.00,
        image: '../images/jewelry/faceted gemstone & metalic spacer.jpeg',
        category: 'bracelets',
        description: 'Elegant faceted gemstones paired with metallic spacer beads create sophisticated contrast. Each faceted stone catches light beautifully while metallic accents add modern luxury.',
        gemstone: 'Faceted Mixed Stones',
        properties: 'Elegance & Light',
        emoji: '✨',
        featured: true
    },
    {
        id: 303,
        name: 'White Tiger Eye & Agate Multi-Stone Bracelet',
        price: 20.00,
        image: '../images/jewelry/white eyed tiger with multiple color stones (agate).jpeg',
        category: 'bracelets',
        description: 'White tiger eye centerpiece surrounded by colorful agate stones creates a striking combination. Perfect balance of grounding energy and vibrant color.',
        gemstone: 'White Tiger Eye & Agate',
        properties: 'Balance & Protection',
        emoji: '🤍',
        featured: true
    },
    {
        id: 304,
        name: 'Black Onyx & Silver Skull Bracelet',
        price: 20.00,
        image: '../images/jewelry/black onyx & silver skull.jpeg',
        category: 'bracelets',
        description: 'Bold black onyx beads with distinctive silver skull accent. Edgy design that combines protection stone properties with modern gothic style.',
        gemstone: 'Black Onyx',
        properties: 'Protection & Strength',
        emoji: '💀',
        featured: true
    },
    {
        id: 305,
        name: 'Yellow Jade Prosperity Bracelet',
        price: 20.00,
        image: '../images/jewelry/yellow jade.jpeg',
        category: 'bracelets',
        description: 'Smooth yellow jade beads radiate warmth and prosperity energy. Traditional stone known for attracting good fortune and financial abundance.',
        gemstone: 'Yellow Jade',
        properties: 'Prosperity & Joy',
        emoji: '💛',
        featured: false
    },
    {
        id: 307,
        name: 'Mystery Stone Discovery Bracelet',
        price: 20.00,
        image: '../images/jewelry/unknown for now.jpeg',
        category: 'bracelets',
        description: 'Unique mixed stones waiting to be identified. Each piece tells its own story with mysterious beauty and unknown metaphysical properties to discover.',
        gemstone: 'Mixed Mystery Stones',
        properties: 'Discovery & Wonder',
        emoji: '❓',
        featured: false
    },
    {
        id: 309,
        name: 'Hematite Tiger Eye Power Bracelet',
        price: 20.00,
        image: '../images/jewelry/hematite tiger eye.jpeg',
        category: 'bracelets',
        description: 'Powerful combination of metallic hematite and golden tiger eye. Grounding and focusing energies merge for ultimate concentration and strength.',
        gemstone: 'Hematite & Tiger Eye',
        properties: 'Focus & Power',
        emoji: '⚡',
        featured: false
    },
    {
        id: 310,
        name: 'Blue Cat Eye & Tiger Eye Vision Bracelet',
        price: 20.00,
        image: '../images/jewelry/blue cat eye with large tiger eye.jpeg',
        category: 'bracelets',
        description: 'Mesmerizing blue cat eye stone paired with large tiger eye centerpiece. Enhances intuition and clear vision while maintaining grounded strength.',
        gemstone: 'Blue Cat Eye & Tiger Eye',
        properties: 'Vision & Intuition',
        emoji: '👁️',
        featured: false
    },
    {
        id: 311,
        name: 'Blue Tiger Eye Calm Bracelet',
        price: 20.00,
        image: '../images/jewelry/blue tiger eye.jpeg',
        category: 'bracelets',
        description: 'Rare blue tiger eye beads with subtle shimmer and calming energy. Promotes clear communication and peaceful resolution of conflicts.',
        gemstone: 'Blue Tiger Eye',
        properties: 'Communication & Calm',
        emoji: '💙',
        featured: false
    },
    {
        id: 313,
        name: 'Mahogany Obsidian Cowboy Hat Bracelet',
        price: 20.00,
        image: '../images/jewelry/mahoganu obsidian stone with cowboy hat.jpeg',
        category: 'bracelets',
        description: 'Rich mahogany obsidian beads with charming cowboy hat accent. Western-inspired piece that grounds energy and connects to earth wisdom.',
        gemstone: 'Mahogany Obsidian',
        properties: 'Grounding & Adventure',
        emoji: '🤠',
        featured: false
    },
    {
        id: 314,
        name: 'Map Jasper Cowboy Boots Adventure Bracelet',
        price: 20.00,
        image: '../images/jewelry/map jasper with cowboy boots charm.jpeg',
        category: 'bracelets',
        description: 'Unique map jasper stones with adorable cowboy boots charm. Perfect for wanderers and adventurers seeking new paths and experiences.',
        gemstone: 'Map Jasper',
        properties: 'Journey & Discovery',
        emoji: '🥾',
        featured: false
    },
    {
        id: 316,
        name: 'Orange Tiger Eye Fire Bracelet',
        price: 20.00,
        image: '../images/jewelry/orange tiger eye.jpeg',
        category: 'bracelets',
        description: 'Vibrant orange tiger eye beads with warm, fiery energy. Enhances creativity, motivation, and personal power while bringing joy and optimism.',
        gemstone: 'Orange Tiger Eye',
        properties: 'Creativity & Motivation',
        emoji: '🔥',
        featured: false
    },
    {
        id: 317,
        name: 'Yellow Jasper Sunshine Bracelet',
        price: 20.00,
        image: '../images/jewelry/yellow jasper.jpeg',
        category: 'bracelets',
        description: 'Bright yellow jasper beads radiating sunshine energy. Known for bringing positivity, mental clarity, and emotional stability throughout the day.',
        gemstone: 'Yellow Jasper',
        properties: 'Positivity & Clarity',
        emoji: '☀️',
        featured: false
    },
    {
        id: 318,
        name: 'Yellow Tiger Eye Prosperity Bracelet',
        price: 20.00,
        image: '../images/jewelry/yellow tiger eye.jpeg',
        category: 'bracelets',
        description: 'Golden yellow tiger eye beads for manifesting prosperity and abundance. This powerful stone enhances willpower and attracts wealth and success.',
        gemstone: 'Yellow Tiger Eye',
        properties: 'Prosperity & Success',
        emoji: '💰',
        featured: false
    }
];

// State management
let currentFilter = 'all';
let currentProduct = null;
let selectedSize = 'single';
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

    // Filter products - only bracelets now, but keeping filter logic for consistency
    let filteredProducts = jewelryProducts;
    if (currentFilter !== 'all') {
        filteredProducts = jewelryProducts.filter(product => product.category === currentFilter);
    }

    // Clear grid
    productsGrid.innerHTML = '';

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

    // Use real image if available, fall back to emoji
    let imageContent;
    if (product.image) {
        imageContent = `<img src="${product.image}" alt="${product.name}" loading="lazy">`;
    } else {
        imageContent = `<span style="font-size: 3rem;">${product.emoji || '💎'}</span>`;
    }

    card.innerHTML = `
        <div class="product-image">
            ${imageContent}
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <div class="gemstone-properties">${product.properties}</div>
            <p class="product-price">$${product.price.toFixed(2)} USD</p>
            <p class="product-description">${product.description.substring(0, 120)}...</p>
            <button class="add-to-cart-btn" onclick="event.stopPropagation(); quickAddToCart(${product.id})">Quick Add to Cart</button>
        </div>
    `;

    return card;
}

// Quick add to cart function
function quickAddToCart(productId) {
    const product = jewelryProducts.find(p => p.id === productId);
    if (!product) return;

    if (window.cartManager) {
        const cartItem = {
            id: product.id,
            name: `${product.name} (Single Wrap)`,
            price: product.price,
            quantity: 1,
            size: 'Single Wrap',
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

// Open product modal
function openProductModal(product) {
    currentProduct = product;
    const modal = document.getElementById('product-modal');

    // Update modal content
    document.getElementById('modal-product-title').textContent = product.name;
    document.getElementById('modal-product-price').textContent = `$${product.price.toFixed(2)} USD`;
    document.getElementById('modal-product-description').innerHTML = `
        <p><strong>Gemstone:</strong> ${product.gemstone}</p>
        <p><strong>Properties:</strong> ${product.properties}</p>
        <p>${product.description}</p>
    `;

    // Use real image in modal
    const modalImageContainer = document.querySelector('#product-modal .modal-image');
    if (product.image) {
        modalImageContainer.innerHTML = `<img id="modal-product-image" src="${product.image}" alt="${product.name}">`;
    } else {
        modalImageContainer.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 400px; font-size: 6rem; background: linear-gradient(45deg, #f8f6f3, #e8e6e0); border-radius: 8px;">${product.emoji || '💎'}</div>`;
    }

    // Update size options for bracelets
    const sizeOptionsContainer = document.querySelector('#product-modal .size-options');
    sizeOptionsContainer.innerHTML = `
        <h4>Wrap Style (One Size Fits All):</h4>
        <div class="size-buttons">
            <button class="size-btn active" data-size="single" data-price="0">Single Wrap - $20</button>
            <button class="size-btn" data-size="double" data-price="15">Double Wrap - $35</button>
            <button class="size-btn" data-size="triple" data-price="30">Triple Wrap - $50</button>
        </div>
    `;

    // Reset options
    selectedSize = 'single';
    selectedSizePrice = 0;
    quantity = 1;

    // Re-setup size button event listeners
    setupSizeButtons();

    // Update quantity and total
    document.getElementById('quantity').value = quantity;
    updateTotalPrice();

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Setup size button event listeners
function setupSizeButtons() {
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active from siblings
            this.parentElement.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            selectedSize = this.dataset.size;
            selectedSizePrice = parseInt(this.dataset.price) || 0;

            updateTotalPrice();
        });
    });
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

// Get size display name for cart
function getSizeDisplayName(sizeType) {
    switch(sizeType) {
        case 'single': return 'Single Wrap';
        case 'double': return 'Double Wrap';
        case 'triple': return 'Triple Wrap';
        default: return 'Single Wrap';
    }
}

// Add to cart function
window.addToCart = function() {
    if (!currentProduct) return;

    const finalPrice = currentProduct.price + selectedSizePrice;
    const sizeName = getSizeDisplayName(selectedSize);

    // Create cart item
    const cartItem = {
        id: currentProduct.id,
        name: `${currentProduct.name} (${sizeName})`,
        price: finalPrice,
        quantity: quantity,
        size: sizeName,
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