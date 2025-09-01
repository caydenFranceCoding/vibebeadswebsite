// Room Sprays Page JavaScript with UPDATED PRICING - $9.00 per bottle
// File: public/pages/javascript/room-sprays.js

// Product data with UPDATED PRICING - All room sprays now $9.00
const roomSprayProducts = [
    {
        id: 401,
        name: 'Clean Cotton',
        price: 9.00, // Updated: was 12.00
        image: '../images/room sprays/clean cotton room spray.jpeg',
        category: 'fresh',
        description: 'Fresh, crisp scent of clean laundry drying in the spring air. Perfect for bedrooms, bathrooms, and any space needing instant freshness.',
        duration: '4+ hours',
        emoji: '☁️',
        featured: true
    },
    {
        id: 402,
        name: 'Egyptian Amber',
        price: 9.00, // Updated: was 14.00
        image: '../images/room sprays/egyption amber room spray.jpeg',
        category: 'signature',
        description: 'Rich, exotic amber with warm resin notes and mysterious spices. Creates an sophisticated atmosphere perfect for evening relaxation.',
        duration: '4+ hours',
        emoji: '🏺',
        featured: true
    },
    {
        id: 403,
        name: 'Grapefruit & Mint',
        price: 9.00, // Updated: was 12.00
        image: '../images/room sprays/grape fruit and mint.jpeg',
        category: 'fresh',
        description: 'Energizing blend of pink grapefruit and cooling mint leaves. Instantly refreshes any space with bright, uplifting citrus energy.',
        duration: '4+ hours',
        emoji: '🍊',
        featured: true
    },
    {
        id: 404,
        name: 'Vanilla Orchid',
        price: 9.00, // Updated: was 13.00
        image: '../images/room sprays/vanilla orchid.jpeg',
        category: 'signature',
        description: 'Delicate vanilla bean paired with exotic orchid blooms. Elegant floral scent that adds luxury to any room instantly.',
        duration: '4+ hours',
        emoji: '🌺',
        featured: true
    }
];

// State management
let currentFilter = 'all';
let currentProduct = null;
let selectedSize = '4oz';
let selectedSizePrice = 0;
let quantity = 1;

// Bundle builder state - UPDATED PRICING
let selectedBundleSize = 3;
let selectedBundlePrice = 24; // Updated: was 30 (now $24 for 3-pack)
let selectedScents = [];
let maxScents = 3;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        renderProducts();
        setupEventListeners();
        setupModalEvents();
        setupFilterButtons();
        setupBundleBuilder();
    }, 100);
});

function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    let filteredProducts = roomSprayProducts;
    if (currentFilter !== 'all') {
        filteredProducts = roomSprayProducts.filter(product => product.category === currentFilter);
    }

    productsGrid.innerHTML = '';

    if (currentFilter === 'all' || currentFilter === 'bundle') {
        const bundleCard = createBundleCard();
        productsGrid.appendChild(bundleCard);
    }

    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });

    document.querySelectorAll('.fade-in').forEach(el => {
        el.classList.add('visible');
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card fade-in';
    card.setAttribute('data-product-id', product.id);
    card.onclick = () => openProductModal(product);

    let imageContent;
    if (product.image) {
        imageContent = `<img src="${product.image}" alt="${product.name}" loading="lazy">`;
    } else {
        imageContent = `<span style="font-size: 3rem;">${product.emoji || '🌬️'}</span>`;
    }

    card.innerHTML = `
        <div class="product-image">
            ${imageContent}
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <div class="usage-tip">Lasts ${product.duration}</div>
            <p class="product-price">From $${product.price.toFixed(2)} USD</p>
            <p class="product-description">${product.description.substring(0, 120)}...</p>
            <button class="add-to-cart-btn" onclick="event.stopPropagation(); quickAddToCart(${product.id})">Quick Add to Cart</button>
        </div>
    `;

    return card;
}

function quickAddToCart(productId) {
    const product = roomSprayProducts.find(p => p.id === productId);
    if (!product) return;

    if (window.cartManager) {
        const cartItem = {
            id: product.id,
            name: `${product.name} Room Spray (4oz)`,
            price: product.price,
            quantity: 1,
            size: '4oz',
            scent: null,
            image: product.emoji,
            isCustom: false
        };

        window.cartManager.addItem(cartItem);
    } else {
        console.log('Added to cart:', product.name);
        alert(`Added ${product.name} Room Spray to cart!`);
    }
}

// UPDATED: Bundle builder card with new pricing
function createBundleCard() {
    const card = document.createElement('div');
    card.className = 'product-card fade-in bundle-builder-card';
    card.onclick = () => openBundleModal();

    card.innerHTML = `
        <div class="product-image">
            <span style="font-size: 4rem;">🎁</span>
        </div>
        <div class="product-info">
            <h3 class="product-title">Bundle Builder</h3>
            <div class="savings-badge">Save up to 20%</div>
            <p class="product-price">From $24.00 USD</p>
            <p class="product-description">Mix and match your favorite room spray scents and save big with our bundle deals!</p>
            <button class="add-to-cart-btn" onclick="event.stopPropagation(); openBundleModal()">Build Your Bundle</button>
        </div>
    `;

    return card;
}

// UPDATED: Open product modal with new pricing structure
function openProductModal(product) {
    currentProduct = product;
    const modal = document.getElementById('product-modal');

    document.getElementById('modal-product-title').textContent = product.name;
    document.getElementById('modal-product-price').textContent = `$${product.price.toFixed(2)} USD`;
    document.getElementById('modal-product-description').innerHTML = `
        <p>${product.description}</p>
        <p><strong>Duration:</strong> ${product.duration}</p>
        <p><strong>Uses:</strong> Home, office, car, fabric-safe</p>
    `;

    const modalImageContainer = document.querySelector('#product-modal .modal-image');
    if (product.image) {
        modalImageContainer.innerHTML = `<img id="modal-product-image" src="${product.image}" alt="${product.name}">`;
    } else {
        modalImageContainer.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 400px; font-size: 6rem; background: linear-gradient(45deg, #f0f8ff, #e6f3ff); border-radius: 8px;">${product.emoji || '🌬️'}</div>`;
    }

    selectedSize = '4oz';
    selectedSizePrice = 0;
    quantity = 1;

    // UPDATED: New size pricing structure
    document.querySelectorAll('#product-modal .size-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.size === '4oz') {
            btn.classList.add('active');
        }
        if (btn.dataset.size === '4oz') {
            btn.textContent = `4oz Spray - $${product.price.toFixed(2)}`;
            btn.dataset.price = '0';
        } else {
            btn.textContent = `8oz Spray - $${(product.price + 6).toFixed(2)}`; // $6 more for 8oz
            btn.dataset.price = '6';
        }
    });

    document.getElementById('quantity').value = quantity;
    updateTotalPrice();

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// UPDATED: Bundle modal with new pricing
function openBundleModal() {
    const modal = document.getElementById('bundle-modal');

    selectedScents = [];
    selectedBundleSize = 3;
    selectedBundlePrice = 24; // Updated: was 30
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

// UPDATED: Bundle builder with new pricing
function setupBundleBuilder() {
    document.querySelectorAll('.bundle-size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.bundle-size-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            selectedBundleSize = parseInt(this.dataset.size);

            // Updated pricing structure
            if (selectedBundleSize === 3) {
                selectedBundlePrice = 24; // Was 30 (save $3)
            } else if (selectedBundleSize === 5) {
                selectedBundlePrice = 36; // Was 45 (save $9)
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
            renderProducts();
        });
    });
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
        console.log('Added to cart via cart manager:', cartItem);
    } else {
        console.log('Added to cart (fallback):', cartItem);
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
        console.log('Added bundle to cart via cart manager:', cartItem);
    } else {
        console.log('Added bundle to cart (fallback):', cartItem);
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