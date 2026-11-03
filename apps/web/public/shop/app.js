/**
 * LUMINA GEAR • E-COMMERCE CORE APPLICATION & QA BENCHMARK ENGINE
 * Clean, Modular, Real E-Commerce State Machine with 10 Telemetry Test Defects
 */

// ============================================================================
// 1. PRODUCT CATALOG DATA (8 LUXURY TECH SKUS)
// ============================================================================
const PRODUCTS = [
  {
    id: 'prod-001',
    name: 'Aura Pro Wireless ANC Headphones',
    category: 'audio',
    categoryName: 'Studio Audio',
    price: 349.00,
    originalPrice: 399.00,
    rating: 4.9,
    reviews: 128,
    badge: 'sale',
    badgeText: 'SAVE $50',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&q=85',
    desc: 'Beryllium 40mm acoustic drivers with active hybrid noise cancellation (-42dB) and spatial audio head tracking.',
    isBug001Target: true, // BUG-001 Target (Double-add cart race condition)
  },
  {
    id: 'prod-002',
    name: 'Chronos Ultra Smart Titanium Watch',
    category: 'wearables',
    categoryName: 'Smart Wearables',
    price: 499.00,
    originalPrice: null,
    rating: 4.8,
    reviews: 94,
    badge: 'new',
    badgeText: 'NEW',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=85',
    desc: 'Grade 5 titanium chassis, sapphire crystal display, continuous ECG and biometric telemetry monitoring.',
    isBug001Target: false,
  },
  {
    id: 'prod-003',
    name: 'Apex Pro Magnetic Switch Keyboard',
    category: 'peripherals',
    categoryName: 'Peripherals',
    price: 219.00,
    originalPrice: 249.00,
    rating: 4.7,
    reviews: 210,
    badge: 'hot',
    badgeText: 'POPULAR',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=700&q=85',
    desc: 'Hall effect analog magnetic switches with 0.1mm actuation rapid-trigger mechanics.',
    isBug006Target: true, // BUG-006 Target (Quick View blank modal crash)
  },
  {
    id: 'prod-004',
    name: 'Pulse X Spatial Desktop Studio Monitors',
    category: 'audio',
    categoryName: 'Studio Audio',
    price: 599.00,
    originalPrice: 650.00,
    rating: 5.0,
    reviews: 62,
    badge: null,
    badgeText: null,
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=700&q=85',
    desc: 'Bi-amplified reference studio monitors with DSP room calibration and optical inputs.',
    isBug001Target: false,
  },
  {
    id: 'prod-005',
    name: 'Vortex Precision Wireless Ergonomic Mouse',
    category: 'peripherals',
    categoryName: 'Peripherals',
    price: 129.00,
    originalPrice: 149.00,
    rating: 4.6,
    reviews: 340,
    badge: 'sale',
    badgeText: 'SALE',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=700&q=85',
    desc: '4K polling wireless sensor with thumb scroll wheel and infinite kinetic scrolling.',
    isBug001Target: false,
  },
  {
    id: 'prod-006',
    name: 'Nova Ring Smart Biometric Health Tracker',
    category: 'wearables',
    categoryName: 'Smart Wearables',
    price: 299.00,
    originalPrice: null,
    rating: 4.9,
    reviews: 78,
    badge: 'new',
    badgeText: 'NEW',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=700&q=85',
    desc: 'Ultra-lightweight aerospace titanium smart ring with sleep, HRV, and body temp sensors.',
    isBug001Target: false,
  },
  {
    id: 'prod-007',
    name: 'Horizon Soundbar Pro Dolby Atmos',
    category: 'audio',
    categoryName: 'Studio Audio',
    price: 449.00,
    originalPrice: 499.00,
    rating: 4.8,
    reviews: 115,
    badge: 'sale',
    badgeText: 'SAVE $50',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=700&q=85',
    desc: '3.1.2 channel Dolby Atmos spatial soundbar with wireless subwoofer and eARC HDMI.',
    isBug001Target: false,
  },
  {
    id: 'prod-008',
    name: 'CyberHub 10-in-1 Thunderbolt 4 Dock',
    category: 'wearables',
    categoryName: 'Smart Wearables',
    price: 189.00,
    originalPrice: null,
    rating: 4.7,
    reviews: 88,
    badge: null,
    badgeText: null,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=700&q=85',
    desc: 'Dual 4K@120Hz display outputs with 96W Power Delivery charging and Gigabit Ethernet.',
    isBug001Target: false,
  }
];

// ============================================================================
// 2. STATE MANAGEMENT
// ============================================================================
let cart = [];
let activeCategory = 'all';
let currentSort = 'featured';
let currentCurrency = 'USD';
let discountAmount = 0;
let appliedCouponCode = '';
let currentShippingMethod = 'free';
let currentCheckoutStep = 1;

const CURRENCY_RATES = {
  USD: { symbol: '$', rate: 1.0 },
  EUR: { symbol: '€', rate: 0.92 },
  GBP: { symbol: '£', rate: 0.79 }
};

// ============================================================================
// 3. INITIALIZATION & EVENT LISTENERS
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  setupEventListeners();
  updateCartBadge();
  updateShippingProgressBar(0);
});

function setupEventListeners() {
  // Category Filter Pills
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-category');
      renderProducts();
    });
  });

  // Open Cart Trigger
  document.getElementById('openCartBtn')?.addEventListener('click', openCartDrawer);

  // BUG-002: Dead click listener on "Special Deals" navbar link
  const dealsLink = document.getElementById('navDealsLink');
  if (dealsLink) {
    dealsLink.addEventListener('click', (e) => {
      e.preventDefault();
      // BUG-002: Does nothing! Zero DOM mutation, zero network call, zero toast.
      console.warn('[BUG-002 Triggered] Special Deals clicked: e.preventDefault() called without navigation.');
      return false;
    });
  }

  // BUG-007: Unthrottled Search Input flooding console
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      // BUG-007: Unthrottled API call simulating 500 server error
      simulateSearchApiCall(query);

      // Client filter
      const filtered = PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.desc.toLowerCase().includes(query) ||
        p.categoryName.toLowerCase().includes(query)
      );
      renderProductList(filtered);
    });
  }

  // BUG-008: Currency switcher updating card symbols but keeping cart total in USD
  const currencySelect = document.getElementById('currencySelect');
  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      currentCurrency = e.target.value;
      // BUG-008: Re-renders catalog prices with new currency symbol...
      renderProducts();
      // ...BUT intentionally omits updating recalculateCartTotals() and renderCartDrawer()!
      console.warn('[BUG-008 Triggered] Currency updated to', currentCurrency, 'on catalog cards, but cart subtotal remains locked in USD.');
      showToast(`Currency changed to ${currentCurrency}`);
    });
  }
}

// ============================================================================
// 4. CATALOG RENDERING & FILTERING
// ============================================================================
function renderProducts() {
  let list = [...PRODUCTS];

  // Category Filter
  if (activeCategory === 'audio') list = list.filter(p => p.category === 'audio');
  else if (activeCategory === 'wearables') list = list.filter(p => p.category === 'wearables');
  else if (activeCategory === 'peripherals') list = list.filter(p => p.category === 'peripherals');
  else if (activeCategory === 'sale') list = list.filter(p => p.badge === 'sale');

  // Sorting
  if (currentSort === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (currentSort === 'price-desc') list.sort((a, b) => b.price - a.price);
  else if (currentSort === 'rating') list.sort((a, b) => b.rating - a.rating);

  renderProductList(list);
}

function renderProductList(items) {
  const container = document.getElementById('productCatalog');
  if (!container) return;

  const curr = CURRENCY_RATES[currentCurrency] || CURRENCY_RATES.USD;

  if (items.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p>No products match your selected filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(product => {
    const convertedPrice = (product.price * curr.rate).toFixed(2);
    const convertedOriginal = product.originalPrice ? (product.originalPrice * curr.rate).toFixed(2) : null;
    const badgeHtml = product.badge ? `<span class="card-badge ${product.badge}">${product.badgeText}</span>` : '';

    return `
      <div class="product-card" id="card-${product.id}">
        <div class="card-img-wrap">
          <img src="${product.image}" alt="${product.name}" class="card-img" loading="lazy" />
          ${badgeHtml}
        </div>
        <div class="card-info">
          <span class="product-category">${product.categoryName}</span>
          <h3 class="product-name">${product.name}</h3>
          <div class="product-rating">
            <span>★★★★★</span>
            <strong>${product.rating}</strong>
            <span>(${product.reviews})</span>
          </div>
          <div class="price-row">
            <span class="current-price">${curr.symbol}${convertedPrice}</span>
            ${convertedOriginal ? `<span class="original-price">${curr.symbol}${convertedOriginal}</span>` : ''}
          </div>
          <div class="card-actions">
            <!-- BUG-001: Aura Pro triggers double-add race condition -->
            <button class="btn-add-cart" id="btn-add-${product.id}" onclick="handleAddToCart('${product.id}')">
              Add to Bag
            </button>
            <!-- BUG-006: Apex Pro Keyboard triggers missing DOM crash -->
            <button class="btn-quick-view" onclick="openQuickView('${product.id}')">
              Quick View
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function handleSortChange(sortVal) {
  currentSort = sortVal;
  renderProducts();
}

function filterByCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.filter-pill').forEach(b => {
    if (b.getAttribute('data-category') === cat) b.classList.add('active');
    else b.classList.remove('active');
  });
  renderProducts();
  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
}

// ============================================================================
// 5. CART STORE & DEFECT IMPLEMENTATIONS
// ============================================================================

// BUG-001: Double-Add Cart Race Condition
function handleAddToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  if (productId === 'prod-001') {
    // Defect: Missing debounce lock! Simulates twin concurrent POST /api/cart dispatches
    console.warn('[BUG-001 Triggered] Aura Pro double-add race condition! Firing 2 concurrent updates.');
    simulateNetworkEvent('POST', '/api/cart/add', { productId, qty: 1 }, 200, 85);
    addItemToCart(product, 1);

    setTimeout(() => {
      simulateNetworkEvent('POST', '/api/cart/add', { productId, qty: 1 }, 200, 82);
      addItemToCart(product, 1);
      showToast('⚠️ Race Condition: Aura Pro added twice (Qty: 2)!', 'warning');
    }, 40);
  } else {
    simulateNetworkEvent('POST', '/api/cart/add', { productId, qty: 1 }, 200, 75);
    addItemToCart(product, 1);
    showToast(`Added ${product.name} to shopping bag.`);
  }

  openCartDrawer();
}

function addItemToCart(product, quantity) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }
  recalculateCartTotals();
  renderCartDrawer();
  updateCartBadge();
}

// BUG-005: Negative Cart Quantity Decrement
function decrementCartItem(productId) {
  const item = cart.find(p => p.id === productId);
  if (item) {
    // BUG-005: Missing boundary check `if (item.quantity <= 1) remove()`!
    // Decrements into negative integers: 0, -1, -2...
    item.quantity = item.quantity - 1;
    console.warn('[BUG-005 Triggered] Decremented item below 1. Current quantity:', item.quantity);
    
    if (item.quantity < 1) {
      showToast(`⚠️ Anomaly: Quantity for ${item.name} is ${item.quantity}!`, 'warning');
    }
    
    recalculateCartTotals();
    renderCartDrawer();
    updateCartBadge();
  }
}

function incrementCartItem(productId) {
  const item = cart.find(p => p.id === productId);
  if (item) {
    item.quantity += 1;
    recalculateCartTotals();
    renderCartDrawer();
    updateCartBadge();
  }
}

function removeCartItem(productId) {
  cart = cart.filter(p => p.id !== productId);
  recalculateCartTotals();
  renderCartDrawer();
  updateCartBadge();
}

function recalculateCartTotals() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const shipping = currentShippingMethod === 'overnight' ? 14.99 : 0.00;
  const grandTotal = Math.max(0, subtotal - discountAmount + tax + shipping);

  // Update Free Shipping Progress Bar ($150 target)
  updateShippingProgressBar(subtotal);

  // Note: BUG-008 means this keeps displaying '$' USD symbol even if currency switched to EUR!
  const subtotalEl = document.getElementById('cartSubtotal');
  const discountEl = document.getElementById('cartDiscount');
  const taxEl = document.getElementById('cartTax');
  const totalEl = document.getElementById('cartGrandTotal');

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${grandTotal.toFixed(2)}`;

  if (discountEl && discountAmount > 0) {
    document.getElementById('discountRow').style.display = 'flex';
    discountEl.textContent = `-$${discountAmount.toFixed(2)}`;
  }

  // Also update checkout totals
  const coSub = document.getElementById('checkoutSubtotal');
  const coTax = document.getElementById('checkoutTax');
  const coTotal = document.getElementById('checkoutGrandTotal');
  if (coSub) coSub.textContent = `$${subtotal.toFixed(2)}`;
  if (coTax) coTax.textContent = `$${tax.toFixed(2)}`;
  if (coTotal) coTotal.textContent = `$${grandTotal.toFixed(2)}`;
}

function updateShippingProgressBar(subtotal) {
  const threshold = 150.00;
  const fill = document.getElementById('shippingProgressBar');
  const label = document.getElementById('shippingProgressLabel');
  if (!fill || !label) return;

  const pct = Math.min(100, (subtotal / threshold) * 100);
  fill.style.width = `${pct}%`;

  if (subtotal >= threshold) {
    label.innerHTML = `<span>🎉 <strong>Congratulations!</strong> You have unlocked <strong>Free Express Shipping!</strong></span>`;
  } else {
    const needed = (threshold - subtotal).toFixed(2);
    label.innerHTML = `<span>Add <strong>$${needed}</strong> more to unlock <strong>Free Express Shipping!</strong></span>`;
  }
}

function renderCartDrawer() {
  const container = document.getElementById('cartItemsContainer');
  const countBadge = document.getElementById('cartItemCountBadge');
  if (!container) return;

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  if (countBadge) countBadge.textContent = `${totalItems} Items`;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-msg">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 0.75rem; opacity: 0.4;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        <p>Your shopping bag is empty.</p>
        <button class="btn btn-secondary" onclick="closeCartDrawer()" style="margin-top: 1rem;">Explore Hardware</button>
      </div>
    `;
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item-row" id="cart-row-${item.id}">
      <img src="${item.image}" alt="${item.name}" class="cart-item-thumb" />
      <div class="cart-item-details">
        <strong class="cart-item-name">${item.name}</strong>
        <span class="cart-item-price">$${item.price.toFixed(2)}</span>
      </div>
      <div class="cart-item-actions">
        <div class="qty-control">
          <!-- BUG-005 Minus decrement button -->
          <button class="qty-btn qty-minus-btn" onclick="decrementCartItem('${item.id}')" aria-label="Decrease quantity">−</button>
          <span class="qty-number">${item.quantity}</span>
          <button class="qty-btn qty-plus-btn" onclick="incrementCartItem('${item.id}')" aria-label="Increase quantity">+</button>
        </div>
        <button class="btn-remove-item" onclick="removeCartItem('${item.id}')">Remove</button>
      </div>
    </div>
  `).join('');
}

function updateCartBadge() {
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = totalItems;
}

function openCartDrawer() {
  document.getElementById('cartBackdrop')?.classList.add('open');
  document.getElementById('cartDrawer')?.classList.add('open');
}

function closeCartDrawer() {
  document.getElementById('cartBackdrop')?.classList.remove('open');
  document.getElementById('cartDrawer')?.classList.remove('open');
}

// BUG-004: Obscured Coupon Apply Button
function handleApplyCoupon() {
  // BUG-004: If clicked normally, the transparent shield intercepts clicks.
  const code = document.getElementById('couponInput')?.value.trim().toUpperCase();
  if (code === 'LUMINA20') {
    discountAmount = 30.00;
    appliedCouponCode = code;
    recalculateCartTotals();
    showToast('Promo code LUMINA20 applied! Saved $30.00.');
  } else {
    showToast('Invalid promo code. Use LUMINA20 for 20% off.', 'warning');
  }
}

// ============================================================================
// 6. CHECKOUT FLOW & PAYMENT DEFECTS
// ============================================================================
function openCheckoutModal() {
  if (cart.length === 0) {
    showToast('Your cart is empty. Add a product first.', 'warning');
    return;
  }
  closeCartDrawer();
  currentCheckoutStep = 1;
  goToStep(1);
  renderCheckoutMiniItems();
  document.getElementById('checkoutBackdrop')?.classList.add('open');
}

function closeCheckoutModal() {
  document.getElementById('checkoutBackdrop')?.classList.remove('open');
}

function goToStep(step) {
  currentCheckoutStep = step;
  document.querySelectorAll('.checkout-step-content').forEach(el => el.style.display = 'none');
  document.getElementById(`step${step}Content`).style.display = 'block';

  document.querySelectorAll('.step-node').forEach((node, idx) => {
    if (idx + 1 <= step) node.classList.add('active');
    else node.classList.remove('active');
  });
}

// BUG-010: Silent Form Discard on Missing Email
function handleStep1Submit() {
  const emailInput = document.getElementById('shipEmail');
  const email = emailInput?.value.trim();

  if (!email) {
    // BUG-010: Silent discard! Returns without advancing AND without displaying error message!
    console.warn('[BUG-010 Triggered] Missing shipping email. Step advancement halted with zero UI error displayed.');
    // Missing: document.getElementById('shipEmailError').style.display = 'block';
    return false;
  }

  goToStep(2);
}

function updateShippingMethod(method) {
  currentShippingMethod = method;
  document.querySelectorAll('.shipping-option-card').forEach(c => c.classList.remove('selected'));
  const radio = document.querySelector(`input[name="shippingMethod"][value="${method}"]`);
  if (radio) {
    radio.checked = true;
    radio.closest('.shipping-option-card')?.classList.add('selected');
  }
  recalculateCartTotals();
}

function fillTestCard(type) {
  const cardInput = document.getElementById('cardNumber');
  const expiryInput = document.getElementById('cardExpiry');
  const cvcInput = document.getElementById('cardCvc');

  if (type === 'visa') {
    if (cardInput) cardInput.value = '4532 8920 1829 4812';
    if (expiryInput) expiryInput.value = '10/29';
    if (cvcInput) cvcInput.value = '742';
    showToast('Loaded valid Visa test card.');
  } else if (type === 'amex') {
    // BUG-009 Target
    if (cardInput) cardInput.value = '3782 8224 6310 005';
    if (expiryInput) expiryInput.value = '08/28';
    if (cvcInput) cvcInput.value = '2004';
    showToast('Loaded American Express test card (Will trigger 502 Gateway).', 'warning');
  }
}

// BUG-003 & BUG-009: Place Order Submit Handler
function handlePlaceOrder() {
  const btn = document.getElementById('placeOrderBtn');
  const cardNum = document.getElementById('cardNumber')?.value.replace(/\s/g, '') || '';

  // Set loading state
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Processing Authorization...`;
  }

  // BUG-009: Amex card triggers simulated HTTP 502 Bad Gateway
  if (cardNum.startsWith('37') || cardNum.startsWith('34')) {
    setTimeout(() => {
      console.error('[BUG-009 Triggered] POST /api/gateway/charge returned 502 Bad Gateway');
      simulateNetworkEvent('POST', '/api/gateway/charge', { cardBin: '3782' }, 502, 620);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `Place Order & Authorize Payment`;
      }
      showToast('❌ HTTP 502 Bad Gateway: Upstream banking processor unresponsive.', 'error');
    }, 700);
    return;
  }

  // BUG-003: Uncaught TypeError freezing button into infinite spinner
  setTimeout(() => {
    try {
      console.error('[BUG-003 Triggered] Uncaught TypeError in processPayment(): Cannot read properties of undefined (reading gateway_nonce)');
      // Defect: window.paymentConfig is undefined, so accessing activeProvider throws uncaught exception
      const nonce = window.paymentConfig.activeProvider.gateway_nonce;
      console.log('Nonce:', nonce);
    } catch (err) {
      // Intentionally re-throw to window.onerror without resetting button loading state!
      window.dispatchEvent(new ErrorEvent('error', {
        error: err,
        message: "Uncaught TypeError: Cannot read properties of undefined (reading 'gateway_nonce') at handlePlaceOrder (app.js:482:21)"
      }));
      // Notice: `btn.disabled = false` is OMITTED! Button is frozen forever!
      showToast('⚠️ Critical Exception: Button trapped in infinite spin. Check console.', 'error');
      return;
    }

    // Normal happy path (never reached unless bug fixed)
    closeCheckoutModal();
    openSuccessModal();
  }, 900);
}

function renderCheckoutMiniItems() {
  const container = document.getElementById('checkoutMiniItems');
  if (!container) return;
  container.innerHTML = cart.map(item => `
    <div class="checkout-item-mini">
      <span>${item.name} &times; ${item.quantity}</span>
      <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
    </div>
  `).join('');
}

function openSuccessModal() {
  document.getElementById('successBackdrop')?.classList.add('open');
  cart = [];
  recalculateCartTotals();
  updateCartBadge();
}

function closeSuccessModal() {
  document.getElementById('successBackdrop')?.classList.remove('open');
}

// ============================================================================
// 7. QUICK VIEW MODAL & BUG-006 SILENT CRASH
// ============================================================================
function openQuickView(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('quickViewBackdrop');
  const title = document.getElementById('qvModalTitle');

  if (productId === 'prod-003') {
    // BUG-006: Queries non-existent selector `#quickViewBodyMissingContainer`
    console.error('[BUG-006 Triggered] TypeError: Cannot set properties of null (setting innerHTML)');
    try {
      const missingTarget = document.querySelector('#quickViewBodyMissingContainer');
      missingTarget.innerHTML = `<p>Test</p>`; // Throws TypeError: null
    } catch (err) {
      window.dispatchEvent(new ErrorEvent('error', {
        error: err,
        message: "Uncaught TypeError: Cannot set properties of null (setting 'innerHTML') at openQuickView (app.js:542:25)"
      }));
    }
    // Opens blank modal with no content
    if (modal) modal.classList.add('open');
    if (title) title.textContent = product.name;
    showToast('⚠️ Silent DOM Crash: Quick View modal body failed to render.', 'warning');
    return;
  }

  // Normal happy path for other products
  const container = document.getElementById('quickViewBodyContainer');
  if (container) {
    container.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="quick-view-img" />
      <div>
        <span class="product-category">${product.categoryName}</span>
        <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: #fff;">${product.name}</h2>
        <div class="product-rating" style="margin-bottom: 1rem;">
          <span>★★★★★</span>
          <strong>${product.rating}</strong>
          <span>(${product.reviews} reviews)</span>
        </div>
        <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.6; margin-bottom: 1.5rem;">${product.desc}</p>
        <div class="price-row">
          <span class="current-price" style="font-size: 1.75rem;">$${product.price.toFixed(2)}</span>
          ${product.originalPrice ? `<span class="original-price">$${product.originalPrice.toFixed(2)}</span>` : ''}
        </div>
        <button class="btn btn-primary btn-full-width" onclick="handleAddToCart('${product.id}'); closeQuickViewModal();">
          Add to Bag
        </button>
      </div>
    `;
  }
  if (modal) modal.classList.add('open');
}

function closeQuickViewModal() {
  document.getElementById('quickViewBackdrop')?.classList.remove('open');
}

// ============================================================================
// 8. QA HELPER & TELEMETRY SIMULATOR
// ============================================================================
function toggleQaHud() {
  const drawer = document.getElementById('qaHudDrawer');
  if (drawer) {
    drawer.classList.toggle('collapsed');
  }
}

function highlightBug(bugId) {
  // Clear any existing highlights
  document.querySelectorAll('.bug-highlighted').forEach(el => el.classList.remove('bug-highlighted'));

  let targetSelector = '';
  if (bugId === 'BUG-001') targetSelector = '#card-prod-001 .btn-add-cart';
  if (bugId === 'BUG-002') targetSelector = '#navDealsLink';
  if (bugId === 'BUG-003') {
    openCheckoutModal();
    goToStep(3);
    targetSelector = '#placeOrderBtn';
  }
  if (bugId === 'BUG-004') {
    openCartDrawer();
    targetSelector = '#couponBoxWrapper';
  }
  if (bugId === 'BUG-005') {
    if (cart.length === 0) addItemToCart(PRODUCTS[0], 1);
    openCartDrawer();
    targetSelector = '.qty-minus-btn';
  }
  if (bugId === 'BUG-006') targetSelector = '#card-prod-003 .btn-quick-view';
  if (bugId === 'BUG-007') targetSelector = '#globalSearchInput';
  if (bugId === 'BUG-008') targetSelector = '#currencySelect';
  if (bugId === 'BUG-009') {
    openCheckoutModal();
    goToStep(3);
    fillTestCard('amex');
    targetSelector = '#placeOrderBtn';
  }
  if (bugId === 'BUG-010') {
    openCheckoutModal();
    goToStep(1);
    document.getElementById('shipEmail').value = '';
    targetSelector = '#shipEmail';
  }

  if (targetSelector) {
    setTimeout(() => {
      const el = document.querySelector(targetSelector);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('bug-highlighted');
        showToast(`Target for ${bugId} highlighted!`);
      }
    }, 200);
  }
}

function simulateSearchApiCall(query) {
  // BUG-007: Unthrottled API call simulating 500 server error
  console.error(`[BUG-007 Triggered] GET /api/search?q=${encodeURIComponent(query)} -> HTTP 500 Internal Server Error`);
  simulateNetworkEvent('GET', `/api/search?q=${encodeURIComponent(query)}`, null, 500, 45);
}

function simulateNetworkEvent(method, url, body, status, durationMs) {
  // Dispatches synthetic telemetry event for SilentQA Chrome Extension
  const event = new CustomEvent('silentqa:network', {
    detail: { method, url, body, status, durationMs, ts: Date.now() }
  });
  window.dispatchEvent(event);
}

function handleNewsletterSubmit(e) {
  e.preventDefault();
  showToast('Welcome to the Lumina Collective! $30 voucher sent to your inbox.');
  e.target.reset();
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}
