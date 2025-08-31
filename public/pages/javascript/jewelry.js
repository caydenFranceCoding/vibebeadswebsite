// Jewelry Page JavaScript with Cart Integration
// File: public/pages/javascript/jewelry.js

// Product data for jewelry
const jewelryProducts = [
    {
        id: 301,
        name: 'Rose Quartz Serenity Bracelet',
        price: 45.00,
        image: null,
        category: 'bracelets',
        description: 'Handcrafted with genuine rose quartz beads, promoting love, healing, and emotional balance. Each stone is carefully selected for its natural beauty and positive energy.',
        gemstone: 'Rose Quartz',
        properties: 'Love & Healing',
        emoji: '💖',
        featured: true
    },
    {
        id: 302,
        name: 'Amethyst Clarity Necklace',
        price: 65.00,
        image: null,
        category: 'necklaces',
        description: 'Beautiful amethyst beads create this stunning necklace, known for enhancing clarity, peace, and spiritual awareness. Perfect for meditation and daily wear.',
        gemstone: 'Amethyst',
        properties: 'Clarity & Peace',
        emoji: '💜',
        featured: true
    },
    {
        id: 303,
        name: 'Moonstone Intuition Earrings',
        price: 35.00,
        image: null,
        category: 'earrings',
        description: 'Delicate moonstone drop earrings that enhance intuition and promote emotional balance. The subtle shimmer catches light beautifully.',
        gemstone: 'Moonstone',
        properties: 'Intuition & Balance',
        emoji: '✨',
        featured: true
    },
    {
        id: 304,
        name: 'Black Tourmaline Protection Bracelet',
        price: 52.00,
        image: null,
        category: 'bracelets',
        description: 'Powerful black tourmaline beads provide protection from negative energy while grounding and centering your spirit. A must-have for daily protection.',
        gemstone: 'Black Tourmaline',
        properties: 'Protection & Grounding',
        emoji: '🖤',
        featured: true
    },
    {
        id: 305,
        name: 'Citrine Abundance Necklace',
        price: 58.00,
        image: null,
        category: 'necklaces',
        description: 'Bright citrine beads radiate joy and attract abundance. This sunny stone is perfect for manifesting prosperity and maintaining positive energy.',
        gemstone: 'Citrine',
        properties: 'Abundance & Joy',
        emoji: '💛',
        featured: false
    },
    {
        id: 306,
        name: 'Labradorite Transformation Earrings',
        price: 42.00,
        image: null,
        category: 'earrings',
        description: 'Mystical labradorite stones with incredible flash and color play. Known as the stone of transformation and magic, perfect for those embracing change.',
        gemstone: 'Labradorite',
        properties: 'Transformation & Magic',
        emoji: '🌈',
        featured: false
    },
    {
        id: 307,
        name: 'Clear Quartz Master Healer Bracelet',
        price: 38.00,
        image: null,
        category: 'bracelets',
        description: 'Pure clear quartz beads create this powerful bracelet known as the "master healer." Amplifies energy and intention while bringing clarity to your path.',
        gemstone: 'Clear Quartz',
        properties: 'Amplification & Clarity',
        emoji: '🤍',
        featured: false
    },
    {
        id: 308,
        name: 'Green Aventurine Luck Necklace',
        price: 48.00,
        image: null,
        category: 'necklaces',
        description: 'Beautiful green aventurine beads bring luck, prosperity, and heart healing. Known as the "Stone of Opportunity" for attracting good fortune.',
        gemstone: 'Green Aventurine',
        properties: 'Luck & Opportunity',
        emoji: '🍀',
        featured: false
    },
    {
        id: 309,
        name: 'Hematite Focus Bracelet',
        price: 35.00,
        image: null,
        category: 'bracelets',
        description: 'Sleek hematite beads with a metallic luster provide grounding energy and enhance focus. Perfect for staying centered during busy days.',
        gemstone: 'Hematite',
        properties: 'Grounding & Focus',
        emoji: '⚫',
        featured: false
    },
    {
        id: 310,
        name: 'Turquoise Wisdom Earrings',
        price: 40.00,
        image: null,
        category: 'earrings',
        description: 'Genuine turquoise stones in elegant drop earring design. Known for bringing wisdom, protection, and good fortune to the wearer.',
        gemstone: 'Turquoise',
        properties: 'Wisdom & Protection',
        emoji: '🦚',
        featured: false
    }
];

// State management
let currentFilter = 'all';
let currentProduct = null;
let selectedSize = 'standard';
let selectedSizePrice = 0;
let quantity = 1;

// Custom design state
let selectedStyle = null;
let selectedGemstone = null;
let selectedAccents = [];
let styleBasePrice = 0;
let gemstonePrice = 0;
let accentsPrice = 0;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Wait for cart manager to be ready
    setTimeout(() => {
        renderProducts();
        setupEventListeners();
        setupModalEvents();
        setupFilterButtons();
        setupCustomDesignBuilder();
    }, 100);
});

// Render products based on current filter
function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    // Filter products
    let filteredProducts = jewelryProducts;
    if (currentFilter !== 'all') {
        filteredProducts = jewelryProducts.filter(product => product.category === currentFilter);
    }

    // Clear grid
    productsGrid.innerHTML = '';

    // Add custom design card if showing all or custom filter
    if (currentFilter === 'all' || currentFilter === 'custom') {
        const customCard = createCustomDesignCard();
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

    // Always use emoji placeholder
    const imageContent = `<span style="font-size: 3rem;">${product.emoji || '💎'}</span>`;

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
            name: `${product.name} (Standard Size)`,
            price: product.price,
            quantity: 1,
            size: 'Standard Size',
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

// Create custom design card
function createCustomDesignCard() {
    const card = document.createElement('div');
    card.className = 'product-card fade-in custom-design-card';
    card.onclick = () => openCustomDesignModal();

    card.innerHTML = `
        <div class="product-image">
            <span style="font-size: 4rem;">✨</span>
        </div>
        <div class="product-info">
            <h3 class="product-title">Custom Jewelry Design</h3>
            <div class="gemstone-properties">Personalized Creation</div>
            <p class="product-price">From $35.00 USD</p>
            <p class="product-description">Create your perfect piece by choosing gemstones, style, and personal touches. Each custom design is handcrafted specifically for you.</p>
            <button class="add-to-cart-btn" onclick="event.stopPropagation(); openCustomDesignModal()">Design Your Piece</button>
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
    document.getElementById('modal-product-price').textContent = `$${product.price.toFixed(2)} USD`;
    document.getElementById('modal-product-description').innerHTML = `
        <p><strong>Gemstone:</strong> ${product.gemstone}</p>
        <p><strong>Properties:</strong> ${product.properties}</p>
        <p>${product.description}</p>
    `;

    // Update image - always use emoji placeholder
    const modalImage = document.getElementById('modal-product-image');
    modalImage.style.display = 'none';
    modalImage.parentElement.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 400px; font-size: 6rem; background: linear-gradient(45deg, #f8f6f3, #e8e6e0); border-radius: 8px;">${product.emoji || '💎'}</div>`;

    // Reset options
    selectedSize = 'standard';
    selectedSizePrice = 0;
    quantity = 1;

    // Update size buttons
    document.querySelectorAll('#product-modal .size-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.size === 'standard') {
            btn.classList.add('active');
        }
    });

    // Update quantity and total
    document.getElementById('quantity').value = quantity;
    updateTotalPrice();

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Open custom design modal
function openCustomDesignModal() {
    const modal = document.getElementById('custom-design-modal');

    // Reset all selections
    selectedStyle = null;
    selectedGemstone = null;
    selectedAccents = [];
    styleBasePrice = 0;
    gemstonePrice = 0;
    accentsPrice = 0;

    // Reset form inputs
    document.querySelectorAll('input[name="style"]').forEach(input => {
        input.checked = false;
    });
    document.querySelectorAll('input[name="gemstone"]').forEach(input => {
        input.checked = false;
    });
    document.querySelectorAll('input[name="accents"]').forEach(input => {
        input.checked = false;
    });
    document.getElementById('special-requests').value = '';

    updateCustomPrice();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Setup custom design builder functionality
function setupCustomDesignBuilder() {
    // Style selection
    document.querySelectorAll('input[name="style"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {
                selectedStyle = this.value;
                styleBasePrice = parseInt(this.dataset.basePrice);
                updateCustomPrice();
            }
        });
    });

    // Gemstone selection
    document.querySelectorAll('input[name="gemstone"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {
                selectedGemstone = this.value;
                gemstonePrice = parseInt(this.dataset.price);
                updateCustomPrice();
            }
        });
    });

    // Accent stones selection
    document.querySelectorAll('input[name="accents"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {
                selectedAccents.push({
                    name: this.value,
                    price: parseInt(this.dataset.price)
                });
            } else {
                selectedAccents = selectedAccents.filter(accent => accent.name !== this.value);
            }

            // Calculate total accents price
            accentsPrice = selectedAccents.reduce((total, accent) => total + accent.price, 0);
            updateCustomPrice();
        });
    });
}

// Update custom design price
function updateCustomPrice() {
    const totalPrice = styleBasePrice + gemstonePrice + accentsPrice;
    const addButton = document.querySelector('#custom-design-modal .add-to-cart-btn');
    const priceSpan = document.getElementById('custom-total-price');

    priceSpan.textContent = totalPrice.toFixed(2);
    addButton.disabled = !selectedStyle || !selectedGemstone;
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
            selectedSizePrice = parseInt(this.dataset.price) || 0;

            updateTotalPrice();
        });
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

// Add to cart functions with proper cart integration
window.addToCart = function() {
    if (!currentProduct) return;

    const finalPrice = currentProduct.price + selectedSizePrice;
    let sizeName = selectedSize === 'standard' ? 'Standard Size' : 'Custom Size';

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

window.addCustomToCart = function() {
    if (!selectedStyle || !selectedGemstone) return;

    const totalPrice = styleBasePrice + gemstonePrice + accentsPrice;
    const specialRequests = document.getElementById('special-requests').value;

    // Build custom item name
    let itemName = `Custom ${selectedStyle} - ${selectedGemstone}`;
    if (selectedAccents.length > 0) {
        itemName += ` with ${selectedAccents.map(accent => accent.name).join(', ')}`;
    }

    // Create cart item for custom jewelry
    const cartItem = {
        id: `custom-jewelry-${Date.now()}`,
        name: itemName,
        price: totalPrice,
        quantity: 1,
        size: 'Custom Made',
        scent: specialRequests || null,
        image: '✨',
        isCustom: true
    };

    // Add to cart using cart manager
    if (window.cartManager) {
        window.cartManager.addItem(cartItem);
        console.log('Added custom jewelry to cart via cart manager:', cartItem);
    } else {
        // Fallback for demo
        console.log('Added custom jewelry to cart (fallback):', cartItem);
        alert(`Added custom jewelry to cart!\nDesign: ${itemName}\nTotal: $${totalPrice.toFixed(2)}`);
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