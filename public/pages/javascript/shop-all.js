// Shop All Page JavaScript - Admin Products Only
// File: public/pages/javascript/shop-all.js

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    setupFadeInAnimations();
    setupSmoothScrolling();
    setupNewsletterForm();
    setupQuickNavHighlighting();

    setTimeout(() => {
        console.log('Shop All page loaded with cart integration');
    }, 100);
});

function setupFadeInAnimations() {
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
}

function setupSmoothScrolling() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerHeight = 120;
                const elementPosition = targetElement.offsetTop - headerHeight;

                window.scrollTo({
                    top: elementPosition,
                    behavior: 'smooth'
                });

                updateActiveNavButton(this);
            }
        });
    });
}

function updateActiveNavButton(clickedBtn) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    clickedBtn.classList.add('active');
}

function setupNewsletterForm() {
    const form = document.querySelector('.newsletter-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const emailInput = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector('button');
        const email = emailInput.value.trim();

        if (!email) {
            alert('Please enter your email address');
            return;
        }

        if (!isValidEmail(email)) {
            alert('Please enter a valid email address');
            return;
        }

        emailInput.disabled = true;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Subscribing...';

        setTimeout(() => {
            alert('Thank you for subscribing! You\'ll receive updates about new collections and exclusive offers.');

            emailInput.value = '';
            emailInput.disabled = false;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Subscribe';
        }, 1500);
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function setupQuickNavHighlighting() {
    const sections = document.querySelectorAll('.product-section');
    const navButtons = document.querySelectorAll('.nav-btn');

    if (sections.length === 0 || navButtons.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                const correspondingBtn = document.querySelector(`.nav-btn[href="#${sectionId}"]`);

                if (correspondingBtn) {
                    navButtons.forEach(btn => btn.classList.remove('active'));
                    correspondingBtn.classList.add('active');
                }
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '-100px 0px -50% 0px'
    });

    sections.forEach(section => {
        observer.observe(section);
    });
}

function showTemporaryNotification(message) {
    const existingNotifications = document.querySelectorAll('.temp-notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = 'temp-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        font-size: 0.9rem;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(-6px) scale(0.98)';
        });

        card.addEventListener('mouseup', function() {
            this.style.transform = '';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    document.querySelectorAll('.view-category-btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.02)';
        });

        btn.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
});

function setupStaggeredAnimations() {
    const productCards = document.querySelectorAll('.product-card');

    const staggerObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
            }
        });
    }, {
        threshold: 0.1
    });

    productCards.forEach(card => {
        staggerObserver.observe(card);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(setupStaggeredAnimations, 500);
});