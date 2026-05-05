// Base API URL — uses relative path so it works both locally and on Cloud Run
const API_URL = '';

// State
let cart = JSON.parse(localStorage.getItem('r3gym_cart')) || [];

// DOM Elements
const cartIcon = document.getElementById('cart-icon');
const cartCount = document.getElementById('cart-count');
const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');

// Hardcoded plans as ultimate fallback to ensure UI never breaks
const FALLBACK_PLANS = [
    { id: 1, name: "Monthly", price: 999, image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop" },
    { id: 2, name: "Quarterly", price: 2499, image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1469&auto=format&fit=crop" },
    { id: 3, name: "Half-Yearly", price: 3999, image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop" },
    { id: 4, name: "Yearly", price: 6999, image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1470&auto=format&fit=crop" }
];

document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    initScrollAnimations();
    initChatbot();

    if (document.getElementById('plans-container')) {
        fetchPlans();
    }

    if (cartIcon) cartIcon.addEventListener('click', toggleCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
    if (cartOverlay) cartOverlay.addEventListener('click', toggleCart);

    // Mobile menu logic
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.getElementById('nav-links');
    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Header scroll
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        });
    }
});

function toggleCart() {
    if (cartDrawer && cartOverlay) {
        cartDrawer.classList.toggle('active');
        cartOverlay.classList.toggle('active');
    }
}

function addToCart(plan) {
    const existing = cart.find(item => item.id === plan.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...plan, quantity: 1 });
    }
    saveCart();
    updateCartUI();
    
    if (cartDrawer && !cartDrawer.classList.contains('active')) {
        toggleCart();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
    
    if (document.getElementById('checkout-items')) {
        renderCheckout();
    }
}

function saveCart() {
    localStorage.setItem('r3gym_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;

    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';
        let total = 0;

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name} (x${item.quantity})</h4>
                    <p>₹${itemTotal}</p>
                </div>
                <div class="remove-item" onclick="removeFromCart(${item.id})">✕</div>
            `;
            cartItemsContainer.appendChild(div);
        });

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align:center; margin-top:20px; color: #888;">Your cart is empty.</p>';
        }

        if (cartTotalElement) {
            cartTotalElement.textContent = `₹${total}`;
        }
    }
}

function renderPlansList(plans) {
    const container = document.getElementById('plans-container');
    container.innerHTML = '';
    plans.forEach(plan => {
        const card = document.createElement('div');
        card.className = 'plan-card fade-in';
        const badgeHTML = plan.id === 2 ? '<div class="plan-badge">Best Value</div>' : '';
        card.innerHTML = `
            ${badgeHTML}
            <img src="${plan.image}" alt="${plan.name}" class="plan-img">
            <div class="plan-content">
                <h3>${plan.name}</h3>
                <div class="plan-price">₹${plan.price}</div>
                <button class="btn" onclick='addToCart(${JSON.stringify(plan)})'>Add to Cart</button>
            </div>
        `;
        container.appendChild(card);
    });
    initScrollAnimations();
}

async function fetchPlans() {
    const container = document.getElementById('plans-container');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_URL}/plans`);
        if (!response.ok) throw new Error("Backend response error");
        const plans = await response.json();
        renderPlansList(plans);
    } catch (error) {
        // Fallback silently if backend is offline
        renderPlansList(FALLBACK_PLANS);
    }
}

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// Local Chatbot Logic for when backend is offline
function getLocalChatResponse(msg) {
    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes("membership") || lowerMsg.includes("price") || lowerMsg.includes("plan") || lowerMsg.includes("cost")) {
        return "Here are our plans: Monthly (₹999), Quarterly (₹2499), Half-Yearly (₹3999), and Yearly (₹6999).";
    } else if (lowerMsg.includes("workout") || lowerMsg.includes("exercise") || lowerMsg.includes("training")) {
        return "Focus on consistency! Mix compound movements like squats and deadlifts with cardio for the best results.";
    } else if (lowerMsg.includes("diet") || lowerMsg.includes("nutrition") || lowerMsg.includes("food")) {
        return "A balanced diet is key. Ensure you get enough protein for recovery, along with complex carbs and healthy fats.";
    } else {
        return "I'm your R3 GYM trainer! Ask me about memberships, pricing, workouts, or diet.";
    }
}

// Generate a simple session ID for chat memory
const chatSessionId = 'session_' + Math.random().toString(36).substr(2, 9);

function initChatbot() {
    const chatBtn = document.getElementById('chat-btn');
    const chatModal = document.getElementById('chat-modal');
    const chatClose = document.getElementById('chat-close');
    const chatSend = document.getElementById('chat-send');
    const chatInput = document.getElementById('chat-input-field');
    const chatBody = document.getElementById('chat-body');

    if (!chatBtn || !chatModal) return;

    chatBtn.addEventListener('click', () => {
        chatModal.classList.toggle('active');
    });

    chatClose.addEventListener('click', () => {
        chatModal.classList.remove('active');
    });

    const addMessage = (msg, sender) => {
        const div = document.createElement('div');
        div.className = `chat-msg ${sender}`;
        div.textContent = msg;
        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight;
    };

    const sendMessage = async () => {
        const msg = chatInput.value.trim();
        if (!msg) return;

        addMessage(msg, 'user');
        chatInput.value = '';

        try {
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: msg,
                    session_id: chatSessionId 
                })
            });
            if (!response.ok) throw new Error("Backend offline");
            const data = await response.json();
            addMessage(data.response, 'bot');
        } catch (error) {
            // Local fallback logic so it never shows "offline"
            addMessage(getLocalChatResponse(msg), 'bot');
        }
    };

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}
