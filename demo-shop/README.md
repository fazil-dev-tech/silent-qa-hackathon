# LUMINA GEAR • E-Commerce QA Bug Benchmark Store

> **Official Demo & Benchmark Store for SilentQA Automated Telemetry Testing**  
> Accessible online at: **[https://silentai.dpdns.org/shop/](https://silentai.dpdns.org/shop/)**  
> Alternative mirror: **[https://hhhcct.vercel.app/shop/](https://hhhcct.vercel.app/shop/)**

---

## 1. Project Overview

**Lumina Gear** is a modern, high-conversion e-commerce storefront crafted in vanilla **HTML5, CSS3, and JavaScript (ES6+)**. It delivers a luxury dark-mode aesthetic with realistic product photography, an interactive shopping cart slide-out drawer, a multi-step checkout modal with credit card simulator, currency switching, product search, and order confirmation flows.

Embedded inside this application are **10 intentional, realistic software defects** engineered to test and benchmark the automated telemetry capture and Playwright test synthesis capabilities of **SilentQA**.

---

## 2. Quick Start & Local Execution

This directory is completely standalone and requires **no build tools, bundlers, or Node modules**:

### Option A: Direct Browser File
Double-click `index.html` or open it directly in Google Chrome:
```bash
start index.html
```

### Option B: Local Web Server (Recommended)
Run any lightweight static server:
```bash
# Using Python 3
python -m http.server 8080

# Or using npx
npx serve .
```
Then visit `http://localhost:8080` in Chrome with the **SilentQA Chrome Extension** enabled.

---

## 3. Directory Structure

```text
demo-shop/
├── index.html           # Semantic HTML5 layout, product grid, modal dialogs, and QA HUD
├── styles.css           # Modern dark-mode design system with glassmorphism & responsive CSS
├── app.js               # Reactive cart store, catalog state, checkout flow & bug triggers
├── README.md            # Comprehensive store documentation and test catalog
└── Shopping_Store_Known_Bugs_Catalog.pdf # Official 8-page QA Bug Dossier & Playwright Specs
```

---

## 4. The 10 Embedded Software Defects

The store includes an interactive **QA Defect Benchmark HUD** pinned to the left edge of the screen. You can expand it at any time to inspect any defect or click on it to auto-scroll and highlight the target element.

| Bug ID | Category | Severity | Title & Brief Summary |
| :--- | :--- | :--- | :--- |
| **BUG-001** | `RACE_CONDITION` | High | **Double-Add Cart Race Condition**: Clicking *Add to Cart* on *Aura Pro Headphones* lacks button debounce, firing duplicate async state updates and incrementing the cart quantity by 2 instead of 1. |
| **BUG-002** | `DEAD_CLICK` | Medium | **Unresponsive "Special Deals" Navbar**: The *Special Deals* link in the navigation header attaches an event listener that executes `e.preventDefault()` without performing any DOM navigation or toast feedback. |
| **BUG-003** | `RAGE_CLICK` | Critical | **Frozen Checkout "Place Order" Button**: Submitting payment in checkout throws an unhandled `TypeError: Cannot read properties of undefined (reading 'gateway_nonce')`, trapping the submit button in an infinite loading spinner. |
| **BUG-004** | `OBSCURED_CLICK` | Medium | **Unclickable "Apply Coupon" Button**: The discount code button in the cart drawer is blocked by an invisible overlay element (`z-index: 10`, `opacity: 0`), intercepting user click events. |
| **BUG-005** | `MATH_ANOMALY` | High | **Negative Cart Quantity Decrement**: Clicking the minus `[-]` button on cart line items decrements quantity into negative integers (`0, -1, -2`), corrupting subtotals and discounts. |
| **BUG-006** | `DOM_CRASH` | High | **Quick View Blank Modal Crash**: Clicking *Quick View* on *Apex Pro Keyboard* invokes `document.querySelector('#nonExistentModalContainer')`, throwing an unhandled null pointer error and rendering an empty modal. |
| **BUG-007** | `CONSOLE_FLOOD`| Medium | **Search Input Unthrottled 500 Flood**: Entering text into the header search bar fires un-debounced HTTP requests on every single keystroke, causing rapid 500 API responses and flooding the developer console. |
| **BUG-008** | `STATE_DESYNC` | Medium | **Currency Switcher Price Desync**: Changing the currency dropdown (e.g. from USD to EUR) updates product card labels but fails to trigger recalculation inside the active shopping cart state. |
| **BUG-009** | `NETWORK_502`  | High | **Payment Gateway Bad Gateway (502)**: Completing checkout using an American Express test card triggers a simulated `502 Bad Gateway` error from the simulated payment processor endpoint. |
| **BUG-010** | `SILENT_DISCARD`| Medium | **Silent Form Discard on Missing Email**: Leaving the shipping email input empty in the checkout modal silently blocks the user from proceeding without presenting any validation error or banner. |

---

## 5. Automated Bug Verification with SilentQA

1. **Install the SilentQA Extension**: Load `apps/extension` into Chrome (`chrome://extensions` -> Developer Mode -> Load Unpacked).
2. **Start Recording**: Click the SilentQA extension icon and press **Start Recording**.
3. **Reproduce the Defect**: Perform any user flow above (e.g., click "Place Order" during checkout).
4. **Stop Recording & Generate**: SilentQA's causal engine analyzes the telemetry ring buffer (DOM mutations, network failures, console traces, and click timings) and automatically synthesizes a deterministic Playwright test script reproducing the defect.

---

## 6. Official Bug Catalog PDF

Download the complete publication-grade PDF dossier containing detailed reproduction steps, telemetry fingerprints, root-cause code snippets, and ready-to-run Playwright specs:
- **File**: `Shopping_Store_Known_Bugs_Catalog.pdf`
- **Online URL**: [https://silentai.dpdns.org/shop/Shopping_Store_Known_Bugs_Catalog.pdf](https://silentai.dpdns.org/shop/Shopping_Store_Known_Bugs_Catalog.pdf)

