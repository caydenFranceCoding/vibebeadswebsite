// Wax Melts Page JavaScript with Cart Integration
// File: public/pages/javascript/wax-melts.js

// Product data for wax melts
const waxMeltProducts = [
    {
        id: 201,
        name: 'Citrus Burst',
        price: 8.00,
        image: null,
        category: 'signature',
        description: 'Energizing blend of orange, lemon, and grapefruit. Each cube delivers 8-12 hours of bright, uplifting fragrance perfect for morning motivation.',
        cubesPerPack: 6,
        emoji: '🍊',
        featured: true
    },
    {
        id: 202,
        name: 'Vanilla Cream',
        price: 8.00,
        image: null,
        category: 'signature',
        description: 'Rich, creamy vanilla with hints of sweet caramel. Warm and comforting scent that creates a cozy atmosphere in any room.',
        cubesPerPack: 6,
        emoji: '🤍',
        featured: true
    },
    {
        id: 203,
        name: 'Lavender Fields',
        price: 9.00,
        image: null,
        category: 'signature',
        description: 'Pure French lavender with subtle herbal undertones. Perfect for relaxation and creating a peaceful, spa-like environment.',
        cubesPerPack: 6,
        emoji: '💜',
        featured: true
    },
    {
        id: 204,
        name: 'Cinnamon Spice',
        price: 8.00,
        image: null,
        category: 'signature',
        description: 'Warm cinnamon bark with touches of clove and nutmeg. Brings the cozy feeling of autumn to your home year-round.',
        cubesPerPack: 6,
        emoji: '🍂',
        featured: true
    },
    {
        id: 205,
        name: 'Berry Bliss',
        price: 9.00,
        image: null,
        category: 'signature',
        description: 'Sweet mix of strawberries, blueberries, and blackberries. Fresh and fruity scent that brightens any space instantly.',
        cubesPerPack: 6,
        emoji: '🫐',
        featured: false
    },
    {
        id: 206,
        name: 'Green Apple',
        price: 8.00,
        image: null,
        category: 'signature',
        description: 'Crisp Granny Smith apples with a fresh, clean finish. Refreshing scent that energizes and revitalizes your home.',
        cubesPerPack: 6,
        emoji: '🍏',
        featured: false
    },
    {
        id: 207,
        name: 'Amber Woods',
        price: 10.00,
        image: null,
        category: 'signature',
        description: 'Rich amber resin blended with sandalwood and cedar. Sophisticated, masculine scent perfect for evening relaxation.',
        cubesPerPack: 6,
        emoji: '🌲',
        featured: false
    },
    {
        id: 208,
        name: 'Spring Rain',
        price: 8.00,
        image: null,
        category: 'signature',
        description: 'Fresh petrichor scent of spring rain on earth. Clean, airy fragrance that brings the outdoors inside.',
        cubesPerPack: 6,
        emoji: '🌧️',
        featured: false
    },
    {
        id: 209,
        name: 'Garden Mint',
        price: 8.00,
        image: null,
        category: 'signature',
        description: 'Cool spearmint and peppermint leaves. Invigorating scent that refreshes and awakens the senses naturally.',
        cubesPerPack: 6,
        emoji: '🌿',
        featured: false
    },
    {
        id: 210,
        name: 'Pumpkin Spice',
        price: 9.00,
        image: null,
        category: 'seasonal',
        description: 'Classic fall blend of pumpkin, cinnamon, and warm spices. The perfect autumn fragrance for cozy evenings at home.',
        cubesPerPack: 6,
        emoji: '🎃',
        featured: false
    },
    {
        id: 211,
        name: 'Fresh Pine',
        price: 8.00,
        image: null,
        category: 'seasonal',
        description: 'Crisp pine needles with hints of winter air. Brings the fresh scent of Christmas trees into your home.',
        cubesPerPack: 6,
        emoji: '🌲',
        featured: false
    },
    {
        id: 212,
        name: 'Summer Breeze',
        price: 8.00,
        image: null,
        category: 'seasonal',
        description: 'Light, airy scent of ocean breeze and beach florals. Perfect for bringing summer vibes indoors.',
        cubesPerPack: 6,
        emoji: '🌊',
        featured: false
    }
];

// State management
let currentFilter = 'all';
let currentProduct = null;
let selectedPackSize = 'single';
let selectedPackPrice = 0;
let quantity = 1;

// Multi-pack builder state
let selectedMultipackSize = 3;
let selectedMultipackPrice = 22;
let selectedScents = [];
let maxScents = 3;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Wait for cart manager to be ready
    setTimeout(() => {
        renderProducts();
        setupEventListeners();
        setupModalEvents();
        setupFilterButtons();
        setupMultipackBuilder();
    }, 100);
});

// Render products based on current filter
function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    // Filter products
    let filteredProducts = waxMeltProducts;
    if (currentFilter !== 'all') {
        filteredProducts = waxMeltProducts.filter(product => product.category === currentFilter);
    }

    // Clear grid
    productsGrid.innerHTML = '';

    // Add multi-pack builder if showing all or multipacks filter
    if (currentFilter === 'all' || currentFilter === 'multipacks') {
        const multipackCard = createMultipackCard();
        productsGrid.appendChild(multipackCard);
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
    const imageContent = `<span style="font-size: 3rem;">${product.emoji || '🧩'}</span>`;

    card.innerHTML = `
        <div class="product-image">
            ${imageContent}
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-price">From $${product.price.toFixed(2)} USD</p>
            <p class="product-description">${product.description.substring(0, 100)}...</p>
            <button class="add-to-cart-btn" onclick="event.stopPropagation(); quickAddToCart(${product.id})">Quick Add Single Pack</button>
        </div>
    `;

    return card;
}

// Quick add to cart function
function quickAddToCart(productId) {
    const product = waxMeltProducts.find(p => p.id === productId);
    if (!product) return;

    if (window.cartManager) {
        const cartItem = {
            id: product.id,
            name: `${product.name} Wax Melts (Single Pack)`,
            price: product.price,
            quantity: 1,
            size: 'Single Pack',
            scent: null,
            image: product.emoji,
            isCustom: false
        };

        window.cartManager.addItem(cartItem);
    } else {
        // Fallback for demo
        console.log('Added to cart:', product.name);
        alert(`Added ${product.name} Wax Melts to cart!`);
    }
}

// Create multi-pack builder card
function createMultipackCard() {
    const card = document.createElement('div');
    card.className = 'product-card fade-in multipack-builder-card';
    card.onclick = () => openMultipackModal();

    card.innerHTML = `
        <div class="product-image">
            <span style="font-size: 4rem;">🎁</span>
        </div>
        <div class="product-info">
            <h3 class="product-title">Multi-Pack Builder</h3>
            <p class="product-price">From $22.00 USD</p>
            <p class="product-description">Mix and match your favorite scents for the perfect collection. Save up to $8 with our bundle deals!</p>
            <button class="add-to-cart-btn" onclick="event.stopPropagation(); openMultipackModal()">Build Your Pack</button>
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
        <p>${product.description}</p>
        <p><strong>Pack Size:</strong> ${product.cubesPerPack} cubes per pack</p>
        <p><strong>Burn Time:</strong> 8-12 hours per cube</p>
    `;

    // Update image - always use emoji placeholder
    const modalImage = document.getElementById('modal-product-image');
    modalImage.style.display = 'none';
    modalImage.parentElement.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 400px; font-size: 6rem; background: linear-gradient(45deg, #f9f3ff, #f0e6ff); border-radius: 8px;">${product.emoji || '🧩'}</div>`;

    // Reset options
    selectedPackSize = 'single';
    selectedPackPrice = 0;
    quantity = 1;

    // Update pack buttons
    document.querySelectorAll('#product-modal .pack-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.pack === 'single') {
            btn.classList.add('active');
        }
        // Update prices based on current product
        if (btn.dataset.pack === 'single') {
            btn.textContent = `Single Pack - $${product.price.toFixed(2)}`;
            btn.dataset.price = '0';
        } else if (btn.dataset.pack === '3pack') {
            const threePackPrice = (product.price * 2);
            btn.textContent = `3-Pack Bundle - $${threePackPrice.toFixed(2)}`;
            btn.dataset.price = (threePackPrice - product.price).toFixed(2);
        } else if (btn.dataset.pack === '6pack') {
            const sixPackPrice = (product.price * 3.25);
            btn.textContent = `6-Pack Bundle - $${sixPackPrice.toFixed(2)}`;
            btn.dataset.price = (sixPackPrice - product.price).toFixed(2);
        }
    });

    // Update quantity and total
    document.getElementById('quantity').value = quantity;
    updateTotalPrice();

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Open multi-pack modal
function openMultipackModal() {
    const modal = document.getElementById('multipack-modal');

    // Reset selections
    selectedScents = [];
    selectedMultipackSize = 3;
    selectedMultipackPrice = 22;
    maxScents = 3;

    // Reset checkboxes
    document.querySelectorAll('input[name="multipack-scents"]').forEach(input => {
        input.checked = false;
    });

    // Reset size buttons
    document.querySelectorAll('#multipack-modal .multipack-size-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.size === '3') {
            btn.classList.add('active');
        }
    });

    updateMultipackUI();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Setup multi-pack builder functionality
function setupMultipackBuilder() {
    // Size selection
    document.querySelectorAll('.multipack-size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.multipack-size-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            selectedMultipackSize = parseInt(this.dataset.size);
            selectedMultipackPrice = parseInt(this.dataset.price);
            maxScents = selectedMultipackSize;

            // Reset selections if over new limit
            if (selectedScents.length > maxScents) {
                selectedScents = selectedScents.slice(0, maxScents);
                document.querySelectorAll('input[name="multipack-scents"]').forEach((input, index) => {
                    input.checked = selectedScents.includes(input.value);
                });
            }

            updateMultipackUI();
        });
    });

    // Scent selection
    document.querySelectorAll('input[name="multipack-scents"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {
                if (selectedScents.length < maxScents) {
                    selectedScents.push(this.value);
                } else {
                    this.checked = false;
                    alert(`You can only select ${maxScents} scents for this pack size.`);
                }
            } else {
                selectedScents = selectedScents.filter(scent => scent !== this.value);
            }
            updateMultipackUI();
        });
    });
}

// Update multi-pack UI
function updateMultipackUI() {
    document.getElementById('selected-count').textContent = selectedScents.length;
    document.getElementById('max-count').textContent = maxScents;
    document.getElementById('multipack-total-price').textContent = selectedMultipackPrice.toFixed(2);

    const addButton = document.querySelector('#multipack-modal .add-to-cart-btn');
    addButton.disabled = selectedScents.length !== maxScents;
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
    // Pack button clicks
    document.querySelectorAll('.pack-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active from siblings
            this.parentElement.querySelectorAll('.pack-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            selectedPackSize = this.dataset.pack;
            selectedPackPrice = parseFloat(this.dataset.price) || 0;

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
    const total = (basePrice + selectedPackPrice) * quantity;

    document.getElementById('total-price').textContent = total.toFixed(2);
}

// Add to cart functions with proper cart integration
window.addToCart = function() {
    if (!currentProduct) return;

    const finalPrice = currentProduct.price + selectedPackPrice;
    let packName = '';

    switch(selectedPackSize) {
        case 'single':
            packName = 'Single Pack';
            break;
        case '3pack':
            packName = '3-Pack Bundle';
            break;
        case '6pack':
            packName = '6-Pack Bundle';
            break;
        default:
            packName = 'Single Pack';
    }

    // Create cart item
    const cartItem = {
        id: `${currentProduct.id}-${selectedPackSize}`,
        name: `${currentProduct.name} Wax Melts (${packName})`,
        price: finalPrice,
        quantity: quantity,
        size: packName,
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

window.addMultipackToCart = function() {
    if (selectedScents.length !== maxScents) return;

    // Create cart item for multi-pack
    const cartItem = {
        id: `multipack-${Date.now()}`,
        name: `Custom ${selectedMultipackSize}-Pack Mix (${selectedScents.join(', ')})`,
        price: selectedMultipackPrice,
        quantity: 1,
        size: `${selectedMultipackSize}-Pack Mix`,
        scent: selectedScents.join(', '),
        image: '🎁',
        isCustom: true
    };

    // Add to cart using cart manager
    if (window.cartManager) {
        window.cartManager.addItem(cartItem);
        console.log('Added multi-pack to cart via cart manager:', cartItem);
    } else {
        // Fallback for demo
        console.log('Added multi-pack to cart (fallback):', cartItem);
        alert(`Added custom multi-pack to cart!\nScents: ${selectedScents.join(', ')}\nTotal: $${selectedMultipackPrice.toFixed(2)}`);
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