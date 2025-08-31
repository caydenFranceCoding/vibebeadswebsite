// Jewelry Page JavaScript with Real Images and Cart Integration
// File: public/pages/javascript/jewelry.js

// Product data for jewelry with names matching image files
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
        id: 302,
        name: 'Iridescent Gemstone & Metallic Spacer Necklace',
        price: 65.00,
        image: '../images/jewelry/iridecent  gemstone & metallic spacer.jpeg',
        category: 'necklaces',
        description: 'Stunning iridescent gemstones shimmer with rainbow colors, complemented by sleek metallic spacers. A mesmerizing piece that changes with the light.',
        gemstone: 'Iridescent Stone',
        properties: 'Magic & Transformation',
        emoji: '🌈',
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
        id: 306,
        name: 'Multicolored Jasper Statement Necklace',
        price: 62.00,
        image: '../images/jewelry/multicolored jasper.jpeg',
        category: 'necklaces',
        description: 'Vibrant multicolored jasper stones create a stunning rainbow effect. Each stone is unique, bringing together earth energies in perfect harmony.',
        gemstone: 'Multicolored Jasper',
        properties: 'Harmony & Grounding',
        emoji: '🌈',
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
        id: 308,
        name: 'Green Jade Healing Necklace',
        price: 55.00,
        image: '../images/jewelry/green jade.jpeg',
        category: 'necklaces',
        description: 'Classic green jade beads in their natural beauty. Revered for centuries for heart healing, good health, and attracting prosperity.',
        gemstone: 'Green Jade',
        properties: 'Health & Prosperity',
        emoji: '💚',
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
        id: 312,
        name: 'Garnet & Gold Spacer Passion Necklace',
        price: 68.00,
        image: '../images/jewelry/garnet stone with gold spacer.jpeg',
        category: 'necklaces',
        description: 'Rich red garnet stones accented with elegant gold spacers. Classic combination that symbolizes love, passion, and commitment.',
        gemstone: 'Garnet',
        properties: 'Passion & Love',
        emoji: '❤️',
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
        id: 315,
        name: 'Multicolored Kyanite Harmony Necklace',
        price: 59.00,
        image: '../images/jewelry/multicolored stone (kyanite).jpeg',
        category: 'necklaces',
        description: 'Beautiful kyanite in multiple natural colors creates perfect energetic harmony. Known for aligning all chakras and promoting tranquility.',
        gemstone: 'Multicolored Kyanite',
        properties: 'Alignment & Tranquility',
        emoji: '🌸',
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
        // For bracelets, use default single wrap pricing
        let sizeName = product.category === 'bracelets' ? 'Single Wrap' : 'Standard Size';

        const cartItem = {
            id: product.id,
            name: `${product.name} (${sizeName})`,
            price: product.price,
            quantity: 1,
            size: sizeName,
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
            <p class="product-price">From $20.00 USD</p>
            <p class="product-description">Create your perfect piece by choosing gemstones, style, and personal touches. Each custom design is handcrafted specifically for you.</p>
            <button class="add-to-cart-btn" onclick="event.stopPropagation(); openCustomDesignModal()">Design Your Piece</button>
        </div>
    `;

    return card;
}

// Function to get size options based on product category
function getSizeOptions(product) {
    if (product.category === 'bracelets') {
        return `
            <div class="size-options">
                <h4>Wrap Style (One Size Fits All):</h4>
                <div class="size-buttons">
                    <button class="size-btn active" data-size="single" data-price="0">Single Wrap - $20</button>
                    <button class="size-btn" data-size="double" data-price="15">Double Wrap - $35</button>
                    <button class="size-btn" data-size="triple" data-price="30">Triple Wrap - $50</button>
                </div>
            </div>
        `;
    } else {
        // For necklaces and earrings, keep standard sizing
        return `
            <div class="size-options">
                <h4>Size:</h4>
                <div class="size-buttons">
                    <button class="size-btn active" data-size="standard" data-price="0">Standard Size</button>
                    <button class="size-btn" data-size="custom" data-price="15">Custom Size (+$15)</button>
                </div>
            </div>
        `;
    }
}

// UPDATED: Open product modal with real images and dynamic sizing
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

    // UPDATED: Use real image in modal
    const modalImageContainer = document.querySelector('#product-modal .modal-image');
    if (product.image) {
        modalImageContainer.innerHTML = `<img id="modal-product-image" src="${product.image}" alt="${product.name}">`;
    } else {
        modalImageContainer.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 400px; font-size: 6rem; background: linear-gradient(45deg, #f8f6f3, #e8e6e0); border-radius: 8px;">${product.emoji || '💎'}</div>`;
    }

    // Update size options based on product category
    const sizeOptionsContainer = document.querySelector('#product-modal .size-options');
    sizeOptionsContainer.outerHTML = getSizeOptions(product);

    // Reset options based on product type
    if (product.category === 'bracelets') {
        selectedSize = 'single';
        selectedSizePrice = 0;
    } else {
        selectedSize = 'standard';
        selectedSizePrice = 0;
    }

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
    // Style selection - updated pricing for bracelets
    document.querySelectorAll('input[name="style"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {
                selectedStyle = this.value;
                // Updated pricing: bracelet $20, necklace $65, earrings $35
                if (this.value === 'bracelet') {
                    styleBasePrice = 20;
                } else {
                    styleBasePrice = parseInt(this.dataset.basePrice);
                }
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
function getSizeDisplayName(product, sizeType) {
    if (product.category === 'bracelets') {
        switch(sizeType) {
            case 'single': return 'Single Wrap';
            case 'double': return 'Double Wrap';
            case 'triple': return 'Triple Wrap';
            default: return 'Single Wrap';
        }
    } else {
        return sizeType === 'standard' ? 'Standard Size' : 'Custom Size';
    }
}

// Add to cart functions with proper cart integration
window.addToCart = function() {
    if (!currentProduct) return;

    const finalPrice = currentProduct.price + selectedSizePrice;
    const sizeName = getSizeDisplayName(currentProduct, selectedSize);

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
        size: selectedStyle === 'bracelet' ? 'Single Wrap (Custom)' : 'Custom Made',
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