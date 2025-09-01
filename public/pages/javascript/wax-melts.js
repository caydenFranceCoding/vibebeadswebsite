// Wax Melts Page JavaScript with UPDATED PRICING - $5.00 per container
// File: public/pages/javascript/wax-melts.js

// Product data with UPDATED PRICING - All wax melts now $5.00
const waxMeltProducts = [
    {
        id: 201,
        name: 'Apple Ginger Spritz',
        price: 5.00, // Updated: was 8.00
        image: '../images/wax melts/apple ginger spritz.jpeg',
        category: 'signature',
        description: 'Energizing blend of crisp apple and warming ginger with a bubbly spritz finish. Each cube delivers 8-12 hours of bright, uplifting fragrance perfect for morning motivation.',
        cubesPerPack: 6,
        emoji: '🍊',
        featured: true
    },
    {
        id: 202,
        name: 'Ginger & Spice',
        price: 5.00, // Updated: was 8.00
        image: '../images/wax melts/ginger & spice.jpeg',
        category: 'signature',
        description: 'Warm ginger root with aromatic spices including cinnamon and clove. Creates a cozy, inviting atmosphere perfect for cool evenings.',
        cubesPerPack: 6,
        emoji: '🧡',
        featured: true
    },
    {
        id: 203,
        name: 'Grapefruit & Mint',
        price: 5.00, // Updated: was 9.00
        image: '../images/wax melts/grapefruit & mint.jpeg',
        category: 'signature',
        description: 'Fresh pink grapefruit paired with cooling mint leaves. Refreshing and energizing scent that awakens the senses.',
        cubesPerPack: 6,
        emoji: '💚',
        featured: true
    },
    {
        id: 204,
        name: 'Hot Apple Pie',
        price: 5.00, // Updated: was 8.00
        image: '../images/wax melts/hot apple pie.jpeg',
        category: 'signature',
        description: 'Warm baked apples with cinnamon, nutmeg, and buttery pie crust. Brings the cozy feeling of home baking to any space.',
        cubesPerPack: 6,
        emoji: '🥧',
        featured: true
    },
    {
        id: 205,
        name: 'Maple Walnut Pancakes',
        price: 5.00, // Updated: was 9.00
        image: '../images/wax melts/maple walnut pancakes.jpeg',
        category: 'signature',
        description: 'Rich maple syrup with toasted walnuts and fluffy pancakes. Sweet and comforting breakfast scent that makes any day special.',
        cubesPerPack: 6,
        emoji: '🥞',
        featured: false
    },
    {
        id: 206,
        name: 'Moonflower Nectar',
        price: 5.00, // Updated: was 8.00
        image: '../images/wax melts/moonflower nectar.jpeg',
        category: 'signature',
        description: 'Exotic moonflower blooms with sweet nectar notes. Mysterious and enchanting floral scent perfect for evening relaxation.',
        cubesPerPack: 6,
        emoji: '🌙',
        featured: false
    },
    {
        id: 207,
        name: 'Sweet Jamaica',
        price: 5.00, // Updated: was 10.00
        image: '../images/wax melts/sweet jamaica.jpeg',
        category: 'signature',
        description: 'Tropical blend of coconut, pineapple, and warm vanilla with island spices. Escape to the Caribbean with this exotic fragrance.',
        cubesPerPack: 6,
        emoji: '🏝️',
        featured: false
    },
    {
        id: 208,
        name: 'Almond Macaron',
        price: 5.00, // Updated: was 8.00
        image: '../images/wax melts/almond macaron.jpeg',
        category: 'signature',
        description: 'Sweet almond with delicate vanilla cream filling. Sophisticated French patisserie scent that adds elegance to any room.',
        cubesPerPack: 6,
        emoji: '🍰',
        featured: false
    }
];

// State management
let currentFilter = 'all';
let currentProduct = null;
let selectedPackSize = 'single';
let selectedPackPrice = 0;
let quantity = 1;

// Multi-pack builder state - UPDATED PRICING
let selectedMultipackSize = 3;
let selectedMultipackPrice = 13; // Updated: was 22 (now $13 for 3-pack)
let selectedScents = [];
let maxScents = 3;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        renderProducts();
        setupEventListeners();
        setupModalEvents();
        setupFilterButtons();
        setupMultipackBuilder();
    }, 100);
});

function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;

    let filteredProducts = waxMeltProducts;
    if (currentFilter !== 'all') {
        filteredProducts = waxMeltProducts.filter(product => product.category === currentFilter);
    }

    productsGrid.innerHTML = '';

    if (currentFilter === 'all' || currentFilter === 'multipacks') {
        const multipackCard = createMultipackCard();
        productsGrid.appendChild(multipackCard);
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
        imageContent = `<span style="font-size: 3rem;">${product.emoji || '🧩'}</span>`;
    }

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
        console.log('Added to cart:', product.name);
        alert(`Added ${product.name} Wax Melts to cart!`);
    }
}

// UPDATED: Multi-pack builder card with new pricing
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
            <p class="product-price">From $13.00 USD</p>
            <p class="product-description">Mix and match your favorite scents for the perfect collection. Save money with our bundle deals!</p>
            <button class="add-to-cart-btn" onclick="event.stopPropagation(); openMultipackModal()">Build Your Pack</button>
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
        <p><strong>Pack Size:</strong> ${product.cubesPerPack} cubes per pack</p>
        <p><strong>Burn Time:</strong> 8-12 hours per cube</p>
    `;

    const modalImageContainer = document.querySelector('#product-modal .modal-image');
    if (product.image) {
        modalImageContainer.innerHTML = `<img id="modal-product-image" src="${product.image}" alt="${product.name}">`;
    } else {
        modalImageContainer.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 400px; font-size: 6rem; background: linear-gradient(45deg, #f9f3ff, #f0e6ff); border-radius: 8px;">${product.emoji || '🧩'}</div>`;
    }

    selectedPackSize = 'single';
    selectedPackPrice = 0;
    quantity = 1;

    // UPDATED: New pack pricing structure
    document.querySelectorAll('#product-modal .pack-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.pack === 'single') {
            btn.classList.add('active');
        }
        if (btn.dataset.pack === 'single') {
            btn.textContent = `Single Pack - $${product.price.toFixed(2)}`;
            btn.dataset.price = '0';
        } else if (btn.dataset.pack === '3pack') {
            const threePackPrice = (product.price * 2.6); // About $13 for 3-pack instead of $15
            btn.textContent = `3-Pack Bundle - $${threePackPrice.toFixed(2)} (Save $2)`;
            btn.dataset.price = (threePackPrice - product.price).toFixed(2);
        } else if (btn.dataset.pack === '6pack') {
            const sixPackPrice = (product.price * 4.8); // About $24 for 6-pack instead of $30
            btn.textContent = `6-Pack Bundle - $${sixPackPrice.toFixed(2)} (Save $6)`;
            btn.dataset.price = (sixPackPrice - product.price).toFixed(2);
        }
    });

    document.getElementById('quantity').value = quantity;
    updateTotalPrice();

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// UPDATED: Multi-pack modal with new pricing
function openMultipackModal() {
    const modal = document.getElementById('multipack-modal');

    selectedScents = [];
    selectedMultipackSize = 3;
    selectedMultipackPrice = 13; // Updated: was 22
    maxScents = 3;

    document.querySelectorAll('input[name="multipack-scents"]').forEach(input => {
        input.checked = false;
    });

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

// UPDATED: Multi-pack builder with new pricing
function setupMultipackBuilder() {
    document.querySelectorAll('.multipack-size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.multipack-size-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            selectedMultipackSize = parseInt(this.dataset.size);

            // Updated pricing structure
            if (selectedMultipackSize === 3) {
                selectedMultipackPrice = 13; // Was 22
            } else if (selectedMultipackSize === 6) {
                selectedMultipackPrice = 24; // Was 40
            }

            maxScents = selectedMultipackSize;

            if (selectedScents.length > maxScents) {
                selectedScents = selectedScents.slice(0, maxScents);
                document.querySelectorAll('input[name="multipack-scents"]').forEach((input, index) => {
                    input.checked = selectedScents.includes(input.value);
                });
            }

            updateMultipackUI();
        });
    });

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

function updateMultipackUI() {
    document.getElementById('selected-count').textContent = selectedScents.length;
    document.getElementById('max-count').textContent = maxScents;
    document.getElementById('multipack-total-price').textContent = selectedMultipackPrice.toFixed(2);

    const addButton = document.querySelector('#multipack-modal .add-to-cart-btn');
    addButton.disabled = selectedScents.length !== maxScents;
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

function setupEventListeners() {
    document.querySelectorAll('.pack-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.parentElement.querySelectorAll('.pack-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            selectedPackSize = this.dataset.pack;
            selectedPackPrice = parseFloat(this.dataset.price) || 0;

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
    const total = (basePrice + selectedPackPrice) * quantity;

    document.getElementById('total-price').textContent = total.toFixed(2);
}

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

    if (window.cartManager) {
        window.cartManager.addItem(cartItem);
        console.log('Added to cart via cart manager:', cartItem);
    } else {
        console.log('Added to cart (fallback):', cartItem);
        alert(`Added ${cartItem.name} to cart!\nQuantity: ${quantity}\nTotal: $${(finalPrice * quantity).toFixed(2)}`);
    }

    closeModal();
};

window.addMultipackToCart = function() {
    if (selectedScents.length !== maxScents) return;

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

    if (window.cartManager) {
        window.cartManager.addItem(cartItem);
        console.log('Added multi-pack to cart via cart manager:', cartItem);
    } else {
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

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
});