/**
 * LUMINA GEAR • E-COMMERCE CORE APPLICATION & QA BENCHMARK ENGINE
 * Contains 10 Intentional Real-World Software Defects for SilentQA Detection
 */

// ============================================================================
// 1. PRODUCT CATALOG DATA
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
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    desc: 'Beryllium acoustic drivers with active noise cancellation and spatial audio head tracking.',
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
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
    desc: 'Grade 5 titanium chassis, sapphire crystal display, continuous ECG and telemetry monitoring.',
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
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
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
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80',
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
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&q=80',
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
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80',
    desc: 'Ultra-lightweight aerospace titanium smart ring with sleep, HRV, and body temp sensors.',
    isBug001Target: false,
  },
  {
    id: 'prod-007',
    name: 'Aero 4K Dual Studio Boom Microphone',
    category: 'audio',
    categoryName: 'Studio Audio',
    price: 189.00,
    originalPrice: 220.00,
    rating: 4.7,
    reviews: 145,
    badge: null,
    badgeText: null,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80',
    desc: 'Cardioid broadcast condenser microphone with built-in hardware pop filter and USB-C.',
    isBug001Target: false,
  },
  {
    id: 'prod-008',
    name: 'OmniDesk Pro Fast Wireless Charging Pad',
    category: 'peripherals',
    categoryName: 'Peripherals',
    price: 79.00,
    originalPrice: 99.00,
    rating: 4.5,
    reviews: 89,
    badge: 'sale',
    badgeText: 'HOT',
    image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&q=80',
    desc: '3-in-1 MagSafe compatible fast charger for phone, watch, and wireless earbuds.',
    isBug001Target: false,
  }
];

// ============================================================================
// 2. STATE MANAGEMENT
// ============================================================================
let cart = [
  { product: PRODUCTS[0], qty: 1 } // Pre-seed cart with Aura Pro for quick testing
];
let currentCurrency = 'USD';
let currencyMultiplier = 1.0;
let currencySymbol = '$';
let activeCategory = 'all';

// ============================================================================
// 3. INITIALIZATION & RENDER
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  updateCartUI();
  setupEventListeners();
  setupBugScenarios();
});

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const filtered = activeCategory === 'all' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === activeCategory);

  grid.innerHTML = filtered.map(product => `
    <article class="product-card" id="card-${product.id}">
      <div class="card-img-wrap">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        ${product.badge ? `<span class="card-badge ${product.badge}">${product.badgeText}</span>` : ''}
      </div>

      <div class="card-info">
        <span class="product-category">${product.categoryName}</span>
        <h3 class="product-name">${product.name}</h3>
        
        <div class="product-rating">
          ★★★★★ <span>(${product.reviews})</span>
        </div>

        <div class="price-row">
          <span class="current-price" data-usd="${product.price}">
            ${currencySymbol}${(product.price * currencyMultiplier).toFixed(2)}
          </span>
          ${product.originalPrice ? `
            <span class="original-price">${currencySymbol}${(product.originalPrice * currencyMultiplier).toFixed(2)}</span>
          ` : ''}
        </div>

        <div class="card-actions">
          <button 
            type="button" 
            class="btn-add-cart ${product.isBug001Target ? 'bug-target-001' : ''}" 
            onclick="handleAddToCart('${product.id}')"
            title="${product.isBug001Target ? '[BUG-001] Triggers double-add race condition' : 'Add to Cart'}"
          >
            Add to Cart
          </button>
          <button 
            type="button" 
            class="btn-quick-view ${product.isBug006Target ? 'bug-target-006' : ''}" 
            onclick="handleQuickView('${product.id}')"
            title="${product.isBug006Target ? '[BUG-006] Triggers blank modal crash' : 'Quick View'}"
          >
            Quick View
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

// ============================================================================
// 4. CART OPERATIONS & UI SYNC
// ============================================================================
function handleAddToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  // --------------------------------------------------------------------------
  // BUG-001: DOUBLE-ADD RACE CONDITION (Missing client debounce)
  // --------------------------------------------------------------------------
  if (product.isBug001Target) {
    console.warn(`[BUG-001 ACTIVE] Double-trigger race condition on ${product.name}! Missing button debounce.`);
    
    // Simulate twin simultaneous POST requests 6ms apart
    simulateNetworkEvent('POST', '/api/cart/add', { id: product.id, qty: 1 }, 200, 85);
    setTimeout(() => {
      simulateNetworkEvent('POST', '/api/cart/add', { id: product.id, qty: 1 }, 200, 82);
    }, 6);

    // Increment twice to create the visible race condition bug!
    addToCartInternal(product);
    addToCartInternal(product);

    showToast(`⚠️ [BUG-001] Added 2x ${product.name} due to race condition!`);
    openCartDrawer();
    return;
  }

  // Normal addition
  simulateNetworkEvent('POST', '/api/cart/add', { id: product.id, qty: 1 }, 200, 60);
  addToCartInternal(product);
  showToast(`Added ${product.name} to cart.`);
  openCartDrawer();
}

function addToCartInternal(product) {
  const existing = cart.find(item => item.product.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ product, qty: 1 });
  }
  updateCartUI();
}

function updateCartUI() {
  const badge = document.getElementById('cartCountBadge');
  const heroBadge = document.getElementById('heroCartCount');
  const itemsCountLabel = document.getElementById('cartItemsCount');
  const cartBody = document.getElementById('cartBody');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartTotal = document.getElementById('cartTotal');

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  if (badge) badge.textContent = totalItems;
  if (heroBadge) heroBadge.textContent = totalItems;
  if (itemsCountLabel) itemsCountLabel.textContent = `${totalItems} items`;

  if (!cartBody) return;

  if (cart.length === 0) {
    cartBody.innerHTML = `<div class="cart-empty-message">Your shopping flight cart is empty.</div>`;
    if (cartSubtotal) cartSubtotal.textContent = '$0.00';
    if (cartTotal) cartTotal.textContent = '$0.00';
    return;
  }

  // Render items
  cartBody.innerHTML = cart.map((item, index) => {
    const itemTotal = (item.product.price * item.qty).toFixed(2);
    return `
      <div class="cart-item-row" id="cart-item-${item.product.id}">
        <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-img">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.product.name}</div>
          <div class="cart-item-price">$${item.product.price.toFixed(2)} each</div>
          <div class="cart-qty-ctrl">
            <!-- BUG-005: Minus button decrements to negative numbers! -->
            <button 
              type="button" 
              class="qty-btn bug-target-005" 
              onclick="handleQuantityDecrement(${index})"
              title="[BUG-005] Decrements below 0 into negative numbers"
            >-</button>
            <span class="qty-val" id="qty-val-${index}">${item.qty}</span>
            <button 
              type="button" 
              class="qty-btn" 
              onclick="handleQuantityIncrement(${index})"
            >+</button>
          </div>
        </div>
        <div>
          <button type="button" class="cart-item-remove" onclick="handleRemoveFromCart(${index})">✕</button>
        </div>
      </div>
    `;
  }).join('');

  // Calculate Subtotal
  // --------------------------------------------------------------------------
  // BUG-008: Currency Desync - Always computes USD in cart total regardless of currency!
  // --------------------------------------------------------------------------
  const rawSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  
  // Format total
  const formattedSubtotal = `$${rawSubtotal.toFixed(2)}`;
  if (cartSubtotal) cartSubtotal.textContent = formattedSubtotal;
  if (cartTotal) cartTotal.textContent = formattedSubtotal;
}

// ----------------------------------------------------------------------------
// BUG-005: NEGATIVE CART QUANTITY DECREMENT (Math logic error)
// ----------------------------------------------------------------------------
function handleQuantityDecrement(index) {
  if (!cart[index]) return;

  // INTENTIONAL DEFECT: Missing `if (cart[index].qty > 1)` guard!
  cart[index].qty -= 1; // Decrements to 0, -1, -2, etc.

  if (cart[index].qty <= 0) {
    console.error(`[BUG-005 ACTIVE] Cart item quantity corrupted to negative value: ${cart[index].qty}!`);
    showToast(`⚠️ [BUG-005] Quantity decremented to negative: ${cart[index].qty}!`, 'error');
  }

  updateCartUI();
}

function handleQuantityIncrement(index) {
  if (!cart[index]) return;
  cart[index].qty += 1;
  updateCartUI();
}

function handleRemoveFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
  showToast('Item removed from cart.');
}

function openCartDrawer() {
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartBackdrop')?.classList.add('open');
}

function closeCartDrawer() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('cartBackdrop')?.classList.remove('open');
}

// ============================================================================
// 5. QUICK VIEW MODAL
// ============================================================================
function handleQuickView(productId) {
  // --------------------------------------------------------------------------
  // BUG-006: QUICK VIEW BLANK MODAL CRASH (Silent DOM crash)
  // --------------------------------------------------------------------------
  if (productId === 'prod-003') {
    console.error('[BUG-006 ACTIVE] Uncaught TypeError: Cannot read properties of null (reading "innerHTML") at handleQuickView(prod-003). Selector "#modal-payload-apex" not found in DOM.');
    // Broken selector causes silent crash:
    const brokenTarget = document.querySelector('#modal-payload-apex');
    try {
      brokenTarget.innerHTML = '<h1>Crash</h1>'; // Throws TypeError!
    } catch (err) {
      console.error(err);
    }

    // Opens blank modal without content
    document.getElementById('quickViewContent').innerHTML = `
      <div style="padding: 3rem; text-align: center; color: #EF4444;">
        <h3>[BUG-006 CRASH]</h3>
        <p style="color: #94A3B8; margin-top: 0.5rem;">Quick View payload failed to render due to missing DOM element.</p>
      </div>
    `;
    document.getElementById('quickViewBackdrop')?.classList.add('open');
    return;
  }

  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const content = document.getElementById('quickViewContent');
  if (content) {
    content.innerHTML = `
      <div class="quick-view-grid">
        <img src="${product.image}" alt="${product.name}" class="quick-view-img">
        <div>
          <span class="product-category">${product.categoryName}</span>
          <h2 style="font-size: 1.4rem; font-weight: 800; margin: 0.25rem 0 0.5rem;">${product.name}</h2>
          <div class="price-row" style="margin-bottom: 0.85rem;">
            <span class="current-price">$${product.price.toFixed(2)}</span>
          </div>
          <p style="color: #94A3B8; font-size: 0.88rem; line-height: 1.6; margin-bottom: 1.25rem;">${product.desc}</p>
          <button class="btn btn-primary" onclick="handleAddToCart('${product.id}'); closeQuickViewModal();">
            Add to Cart ($${product.price.toFixed(2)})
          </button>
        </div>
      </div>
    `;
    document.getElementById('quickViewBackdrop')?.classList.add('open');
  }
}

function closeQuickViewModal() {
  document.getElementById('quickViewBackdrop')?.classList.remove('open');
}

// ============================================================================
// 6. CHECKOUT & PAYMENT OPERATIONS
// ============================================================================
function openCheckoutModal() {
  if (cart.length === 0) {
    showToast('Your cart is empty. Add a product first!', 'error');
    return;
  }
  closeCartDrawer();

  // Populate checkout summary
  const list = document.getElementById('checkoutItemsList');
  if (list) {
    list.innerHTML = cart.map(item => `
      <div class="checkout-item-mini">
        <span>${item.qty}x ${item.product.name}</span>
        <span>$${(item.product.price * item.qty).toFixed(2)}</span>
      </div>
    `).join('');
  }

  const rawSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  document.getElementById('checkoutSubtotal').textContent = `$${rawSubtotal.toFixed(2)}`;
  document.getElementById('checkoutTotal').textContent = `$${rawSubtotal.toFixed(2)}`;

  document.getElementById('checkoutBackdrop')?.classList.add('open');
}

function closeCheckoutModal() {
  document.getElementById('checkoutBackdrop')?.classList.remove('open');
}

function fillTestCard(type) {
  const cardInput = document.getElementById('cardNumber');
  if (type === 'visa') {
    cardInput.value = '4242424242424242'; // Standard passing card
  } else if (type === 'amex') {
    cardInput.value = '378282246310005'; // BUG-009 Gateway failure card
  }
  showToast(`Filled ${type.toUpperCase()} test card.`);
}

// ----------------------------------------------------------------------------
// BUG-003, BUG-009, BUG-010: CHECKOUT SUBMISSION HANDLING
// ----------------------------------------------------------------------------
function handlePlaceOrder() {
  const name = document.getElementById('shipName').value.trim();
  const email = document.getElementById('shipEmail').value.trim();
  const cardNumber = document.getElementById('cardNumber').value.trim();
  const errorBanner = document.getElementById('checkoutErrorBanner');
  const errorMsg = document.getElementById('checkoutErrorMessage');
  const btn = document.getElementById('placeOrderBtn');
  const spinner = document.getElementById('orderBtnSpinner');
  const btnText = document.getElementById('orderBtnText');

  errorBanner.style.display = 'none';

  // --------------------------------------------------------------------------
  // BUG-010: SILENT SHIPPING FORM DISCARD (Missing validation error message)
  // --------------------------------------------------------------------------
  if (!email) {
    console.warn('[BUG-010 ACTIVE] Shipping form validation failed: Email is empty, but no UI error was presented to user.');
    // Silent return without showing any feedback:
    return false;
  }

  // --------------------------------------------------------------------------
  // BUG-009: PAYMENT GATEWAY 502 BAD GATEWAY (When using Amex test card)
  // --------------------------------------------------------------------------
  if (cardNumber.startsWith('37') || cardNumber.startsWith('34')) {
    btn.disabled = true;
    spinner.style.display = 'inline-block';
    btnText.textContent = 'Contacting Amex Gateway...';

    setTimeout(() => {
      simulateNetworkEvent('POST', '/api/v1/checkout/charge', { card_bin: '378282' }, 502, 1450);
      console.error('[BUG-009 ACTIVE] POST /api/v1/checkout/charge 502 (Bad Gateway): Upstream payment server unresponsive.');
      
      btn.disabled = false;
      spinner.style.display = 'none';
      btnText.textContent = 'Place Order & Authorize Telemetry';

      errorBanner.style.display = 'flex';
      errorMsg.textContent = 'HTTP 502 Bad Gateway: Upstream payment processor failed to respond. (BUG-009)';
    }, 1200);
    return;
  }

  // --------------------------------------------------------------------------
  // BUG-003: FROZEN CHECKOUT "PLACE ORDER" BUTTON (Throws TypeError & spins forever)
  // --------------------------------------------------------------------------
  btn.disabled = true;
  spinner.style.display = 'inline-block';
  btnText.textContent = 'Processing Payment...';

  setTimeout(() => {
    // Uncaught exception freezes the button!
    console.error('[BUG-003 ACTIVE] Uncaught TypeError: Cannot read properties of undefined (reading "gateway_nonce") at checkout.js:418');
    
    // Simulate rage click invitation:
    btn.setAttribute('data-frozen', 'true');
    // We intentionally DO NOT reset the spinner or button state, so user rage-clicks!
    showToast('⚠️ [BUG-003] Button frozen! Try clicking repeatedly to trigger rage-click detector.', 'error');
  }, 600);
}

function closeSuccessModal() {
  document.getElementById('successBackdrop')?.classList.remove('open');
}

// ============================================================================
// 7. SETUP BUG SCENARIOS & EVENT LISTENERS
// ============================================================================
function setupBugScenarios() {
  // --------------------------------------------------------------------------
  // BUG-002: UNRESPONSIVE "SPECIAL DEALS" NAVBAR LINK (Dead Click)
  // --------------------------------------------------------------------------
  const dealsLink = document.getElementById('navDealsLink');
  if (dealsLink) {
    dealsLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Dead click: zero DOM mutations and zero network requests within 1000ms!
      console.warn('[BUG-002 ACTIVE] Dead Click detected: Link #navDealsLink fired preventDefault() with no action.');
      showToast('⚠️ [BUG-002] Dead Click! Link did nothing.', 'error');
    });
  }

  // --------------------------------------------------------------------------
  // BUG-004: OBSCURED COUPON APPLY BUTTON
  // --------------------------------------------------------------------------
  const obscureOverlay = document.getElementById('bug004ObscureOverlay');
  if (obscureOverlay) {
    obscureOverlay.addEventListener('click', (e) => {
      e.stopPropagation();
      console.warn('[BUG-004 ACTIVE] Obscured Click: User clicked over Apply Coupon, but hit invisible overlay div#bug004ObscureOverlay.');
      showToast('⚠️ [BUG-004] Obscured Click! Transparent overlay blocked button.', 'error');
    });
  }

  // --------------------------------------------------------------------------
  // BUG-007: SEARCH INPUT MEMORY LEAK & UNTHROTTLED 500 CONSOLE FLOOD
  // --------------------------------------------------------------------------
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value;
      if (q.length > 0) {
        // Fire failing HTTP 500 on every keystroke
        simulateNetworkEvent('GET', `/api/search?q=${encodeURIComponent(q)}`, null, 500, 150);
        console.error(`[BUG-007 ACTIVE] GET /api/search?q=${q} 500 (Internal Server Error): Unthrottled search flood.`);
      }
    });
  }

  // --------------------------------------------------------------------------
  // BUG-008: CURRENCY SWITCHER PRICE DESYNC
  // --------------------------------------------------------------------------
  const currencySelect = document.getElementById('currencySelect');
  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      currentCurrency = e.target.value;
      if (currentCurrency === 'EUR') {
        currencySymbol = '€';
        currencyMultiplier = 0.92;
      } else if (currentCurrency === 'GBP') {
        currencySymbol = '£';
        currencyMultiplier = 0.79;
      } else {
        currencySymbol = '$';
        currencyMultiplier = 1.0;
      }

      console.warn(`[BUG-008 ACTIVE] Currency switched to ${currentCurrency}. Product cards updated to ${currencySymbol}, but cart calculation remains locked in USD!`);
      showToast(`⚠️ [BUG-008] Currency desync: Product cards show ${currencySymbol}, but checkout will charge USD!`, 'error');
      
      // Update product cards
      renderProducts();
      // Notice: updateCartUI() deliberately keeps USD prices!
    });
  }
}

function setupEventListeners() {
  // Category filter tabs
  document.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-category');
      renderProducts();
    });
  });

  // Open cart drawer trigger
  document.getElementById('openCartBtn')?.addEventListener('click', openCartDrawer);

  // QA HUD Drawer Toggle
  const hudToggle = document.getElementById('qaHudToggle');
  const hudDrawer = document.getElementById('qaHudDrawer');
  if (hudToggle && hudDrawer) {
    hudToggle.addEventListener('click', () => {
      hudDrawer.classList.toggle('collapsed');
    });
  }
}

// ============================================================================
// 8. QA HELPER & TELEMETRY SIMULATOR
// ============================================================================
function highlightBug(bugId) {
  // Remove previous highlights
  document.querySelectorAll('.bug-highlighted').forEach(el => el.classList.remove('bug-highlighted'));

  let targetSelector = '';
  if (bugId === 'BUG-001') targetSelector = '#card-prod-001 .btn-add-cart';
  if (bugId === 'BUG-002') targetSelector = '#navDealsLink';
  if (bugId === 'BUG-003') {
    openCheckoutModal();
    targetSelector = '#placeOrderBtn';
  }
  if (bugId === 'BUG-004') {
    openCartDrawer();
    targetSelector = '#couponBoxWrapper';
  }
  if (bugId === 'BUG-005') {
    openCartDrawer();
    targetSelector = '.qty-btn';
  }
  if (bugId === 'BUG-006') targetSelector = '#card-prod-003 .btn-quick-view';
  if (bugId === 'BUG-007') targetSelector = '#globalSearchInput';
  if (bugId === 'BUG-008') targetSelector = '#currencySelect';
  if (bugId === 'BUG-009') {
    openCheckoutModal();
    fillTestCard('amex');
    targetSelector = '#placeOrderBtn';
  }
  if (bugId === 'BUG-010') {
    openCheckoutModal();
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
    }, 150);
  }
}

function simulateNetworkEvent(method, url, body, status, durationMs) {
  // Dispatches a synthetic window event that the SilentQA content script can detect
  const event = new CustomEvent('silentqa:network', {
    detail: { method, url, body, status, durationMs, ts: Date.now() }
  });
  window.dispatchEvent(event);
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
