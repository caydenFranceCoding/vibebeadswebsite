// Updated Diffusers Page JavaScript with NEW PRICING STRUCTURE
// File: public/pages/javascript/diffusers.js

// Product data for diffusers with UPDATED PRICING
const diffuserProducts = [
    {
        id: 101,
        name: 'Alpine Balsam',
        price: 16.00, // Updated: was 35.00
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
        price: 16.00, // Updated: was 38.00
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
        price: 16.00, // Updated: was 42.00
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
        price: 16.00, // Updated: was 38.00
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
        price: 16.00, // Updated: was 36.00
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
        price: 16.00, // Updated: was 34.00
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
        price: 16.00, // Updated: was 40.00
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
let selectedSize = '5.2oz';
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

    let filteredProducts = diffuserProducts;
    if (currentFilter !== 'all') {
        filteredProducts = diffuserProducts.filter(product => product.category === currentFilter);
    }

    productsGrid.innerHTML = '';

    if (currentFilter === 'all' || currentFilter === 'refills') {
        const refillCard = createRefillCard();
        productsGrid.appendChild(refillCard);
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

function quickAddToCart(productId) {
    const product = diffuserProducts.find(p => p.id === productId);
    if (!product) return;

    if (window.cartManager) {
        const cartItem = {
            id: product.id,
            name: `${product.name} Diffuser (5.2oz)`,
            price: product.price,
            quantity: 1,
            size: '5.2oz',
            scent: null,
            image: product.emoji,
            isCustom: false
        };

        window.cartManager.addItem(cartItem);
    } else {
        console.log('Added to cart:', product.name);
        alert(`Added ${product.name} Diffuser to cart!`);
    }
}

// UPDATED: Create refill oils card with $5 pricing
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

// UPDATED: Open product modal with new pricing structure
function openProductModal(product) {
    currentProduct = product;
    const modal = document.getElementById('product-modal');

    document.getElementById('modal-product-title').textContent = product.name;
    document.getElementById('modal-product-price').textContent = `$${product.price.toFixed(2)} USD`;
    document.getElementById('modal-product-description').innerHTML = `
        <p>${product.description}</p>
        <p><strong>Duration:</strong> ${product.duration}</p>
    `;

    const modalImageContainer = document.querySelector('#product-modal .modal-image');
    if (product.image) {
        modalImageContainer.innerHTML = `<img id="modal-product-image" src="${product.image}" alt="${product.name}">`;
    } else {
        modalImageContainer.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 400px; font-size: 6rem; background: linear-gradient(45deg, #f0f6ff, #e0f0ff); border-radius: 8px;">${product.emoji || '💨'}</div>`;
    }

    selectedSize = '5.2oz';
    selectedSizePrice = 0;
    quantity = 1;

    // UPDATED: New size pricing structure
    document.querySelectorAll('#product-modal .size-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.size === '5.2oz') {
            btn.classList.add('active');
        }
        if (btn.dataset.size === '5.2oz') {
            btn.textContent = `5.2oz Diffuser - $${product.price.toFixed(2)}`;
            btn.dataset.price = '0';
        } else {
            btn.textContent = `10oz Diffuser - $${(product.price + 11).toFixed(2)}`; // $11 more for 10oz
            btn.dataset.price = '11';
        }
    });

    document.getElementById('quantity').value = quantity;
    updateTotalPrice();

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function openRefillModal() {
    const modal = document.getElementById('refill-modal');

    document.querySelectorAll('input[name="refill"]').forEach(input => {
        input.checked = false;
    });

    document.querySelectorAll('#refill-modal .size-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.size === '5.2oz') {
            btn.classList.add('active');
        }
    });

    updateRefillPrice();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
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
            selectedSizePrice = parseInt(this.dataset.price) || parseInt(this.dataset.extra) || 0;

            if (this.closest('#product-modal')) {
                updateTotalPrice();
            } else if (this.closest('#refill-modal')) {
                updateRefillPrice();
            }
        });
    });

    document.querySelectorAll('input[name="refill"]').forEach(input => {
        input.addEventListener('change', updateRefillPrice);
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

// UPDATED: Refill oil pricing remains $5
function updateRefillPrice() {
    const selectedRefill = document.querySelector('input[name="refill"]:checked');
    const addButton = document.querySelector('#refill-modal .add-to-cart-btn');
    const priceSpan = document.getElementById('refill-total-price');

    if (selectedRefill) {
        const basePrice = 5; // Base price remains $5 for all refills
        const total = basePrice + selectedSizePrice;

        priceSpan.textContent = total.toFixed(2);
        addButton.disabled = false;
    } else {
        priceSpan.textContent = '0.00';
        addButton.disabled = true;
    }
}

window.addToCart = function() {
    if (!currentProduct) return;

    const finalPrice = currentProduct.price + selectedSizePrice;

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

    if (window.cartManager) {
        window.cartManager.addItem(cartItem);
        console.log('Added to cart via cart manager:', cartItem);
    } else {
        console.log('Added to cart (fallback):', cartItem);
        alert(`Added ${cartItem.name} to cart!\nQuantity: ${quantity}\nTotal: $${(finalPrice * quantity).toFixed(2)}`);
    }

    closeModal();
};

window.addRefillToCart = function() {
    const selectedRefill = document.querySelector('input[name="refill"]:checked');
    if (!selectedRefill) return;

    const basePrice = 5; // Remains $5 for all refills
    const finalPrice = basePrice + selectedSizePrice;

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

    if (window.cartManager) {
        window.cartManager.addItem(cartItem);
        console.log('Added refill oil to cart via cart manager:', cartItem);
    } else {
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

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
});