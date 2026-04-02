// Firebase (compat)
// On Firebase Hosting, include /__/firebase/init.js before this file (reserved URL — auto config).
// For local file:// or servers without that URL, load firebase-config.js first (see firebase-config.example.js).
if (typeof firebase === "undefined") {
  console.error(
    "Firebase SDK not loaded. Make sure firebase-*-compat scripts are included before app.js."
  );
} else if (!firebase.apps.length) {
  const cfg =
    typeof window !== "undefined" && window.__FIREBASE_CONFIG__
      ? window.__FIREBASE_CONFIG__
      : null;
  if (cfg && cfg.apiKey) {
    firebase.initializeApp(cfg);
  } else {
    console.error(
      "Firebase not initialized. On Hosting use /__/firebase/init.js before app.js; locally copy firebase-config.example.js to firebase-config.js or run firebase serve."
    );
  }
}

// Only call auth()/firestore() after initializeApp; otherwise the SDK throws and the rest of app.js never runs.
let auth = null;
let db = null;
if (typeof firebase !== "undefined" && firebase.apps.length) {
  auth = firebase.auth();
  db = firebase.firestore();
}

// --- Global toast UI (top-centered, responsive) ---
const TOAST_ROOT_ID = "app-toast-root";

function ensureToastRoot() {
  if (typeof document === "undefined") return null;
  let root = document.getElementById(TOAST_ROOT_ID);
  if (root) return root;
  if (!document.body) return null;

  root = document.createElement("div");
  root.id = TOAST_ROOT_ID;
  root.style.position = "fixed";
  root.style.top = "12px";
  root.style.left = "50%";
  root.style.transform = "translateX(-50%)";
  root.style.width = "100%";
  root.style.zIndex = "9999";
  root.style.display = "flex";
  root.style.flexDirection = "column";
  root.style.alignItems = "center";
  root.style.gap = "8px";
  root.style.pointerEvents = "none";
  document.body.appendChild(root);
  return root;
}

function getToastPalette(type) {
  if (type === "success") {
    return { bg: "#ecfdf3", border: "#16a34a", text: "#14532d" };
  }
  if (type === "error") {
    return { bg: "#fef2f2", border: "#b1241a", text: "#7f1d1d" };
  }
  if (type === "warning") {
    return { bg: "#fff7ed", border: "#ea580c", text: "#9a3412" };
  }
  return { bg: "#ffffff", border: "#b1241a", text: "#111827" };
}

function showToast(message, { type = "info", duration = 3200 } = {}) {
  const root = ensureToastRoot();
  if (!root) {
    console[type === "error" ? "error" : "log"](message);
    return;
  }

  const palette = getToastPalette(type);
  const toast = document.createElement("div");
  toast.setAttribute("role", "status");
  toast.style.pointerEvents = "auto";
  toast.style.width = "min(90vw, 420px)";
  toast.style.background = palette.bg;
  toast.style.color = palette.text;
  toast.style.border = `1px solid ${palette.border}`;
  toast.style.borderLeft = `5px solid ${palette.border}`;
  toast.style.borderRadius = "10px";
  toast.style.boxShadow = "0 10px 24px rgba(17, 24, 39, 0.14)";
  toast.style.padding = "10px 12px";
  toast.style.fontSize = "13px";
  toast.style.fontWeight = "600";
  toast.style.lineHeight = "1.4";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(6px) scale(0.98)";
  toast.style.transition = "opacity 160ms ease, transform 160ms ease";
  toast.textContent = String(message || "");
  root.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0) scale(1)";
  });

  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(6px) scale(0.98)";
    window.setTimeout(() => toast.remove(), 180);
  }, Math.max(1200, duration));
}

function showConfirmToast(
  message,
  { confirmText = "Confirm", cancelText = "Cancel", type = "warning" } = {}
) {
  return new Promise((resolve) => {
    const root = ensureToastRoot();
    if (!root) {
      resolve(false);
      return;
    }

    const palette = getToastPalette(type);
    const toast = document.createElement("div");
    toast.style.pointerEvents = "auto";
    toast.style.width = "min(90vw, 420px)";
    toast.style.background = palette.bg;
    toast.style.color = palette.text;
    toast.style.border = `1px solid ${palette.border}`;
    toast.style.borderLeft = `5px solid ${palette.border}`;
    toast.style.borderRadius = "10px";
    toast.style.boxShadow = "0 10px 24px rgba(17, 24, 39, 0.14)";
    toast.style.padding = "10px 12px";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(6px) scale(0.98)";
    toast.style.transition = "opacity 160ms ease, transform 160ms ease";

    const text = document.createElement("p");
    text.style.margin = "0 0 8px 0";
    text.style.fontSize = "13px";
    text.style.fontWeight = "600";
    text.style.lineHeight = "1.45";
    text.textContent = String(message || "");

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";
    actions.style.justifyContent = "flex-end";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = cancelText;
    cancelBtn.style.padding = "6px 9px";
    cancelBtn.style.borderRadius = "8px";
    cancelBtn.style.border = "1px solid #cbd5e1";
    cancelBtn.style.background = "#ffffff";
    cancelBtn.style.color = "#334155";
    cancelBtn.style.fontWeight = "600";
    cancelBtn.style.cursor = "pointer";

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.textContent = confirmText;
    confirmBtn.style.padding = "6px 9px";
    confirmBtn.style.borderRadius = "8px";
    confirmBtn.style.border = "1px solid #b1241a";
    confirmBtn.style.background = "#b1241a";
    confirmBtn.style.color = "#ffffff";
    confirmBtn.style.fontWeight = "700";
    confirmBtn.style.cursor = "pointer";

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    toast.appendChild(text);
    toast.appendChild(actions);
    root.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0) scale(1)";
    });

    const close = (result) => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(6px) scale(0.98)";
      window.setTimeout(() => toast.remove(), 180);
      resolve(result);
    };

    cancelBtn.addEventListener("click", () => close(false));
    confirmBtn.addEventListener("click", () => close(true));
  });
}

// Auth state
let currentUser = null;
let authReadyResolve = null;
const authReady = new Promise((resolve) => {
  authReadyResolve = resolve;
});

if (auth) {
  auth.onAuthStateChanged((user) => {
    currentUser = user;
    authReadyResolve();
  });
} else {
  authReadyResolve();
}

async function requireAuthUser() {
  await authReady;
  if (!currentUser) {
    try {
      window.location.href = "customerLogin.html";
    } catch {
      // ignore
    }
    return null;
  }
  return currentUser;
}

async function requireAdminUser({ redirectOnFail = true } = {}) {
  const user = await requireAuthUser();
  if (!user) return null;

  // Recommended: use Firebase Custom Claims like { admin: true }.
  // Backward-compatible fallback: also supports your older Firestore doc
  // at `admins/{uid}` with field `isAdmin: true`.
  let isAdmin = false;
  try {
    const tokenResult = await user.getIdTokenResult(true);
    isAdmin = tokenResult?.claims?.admin === true;
  } catch {
    // If token fetch fails, fall back to Firestore doc.
  }

  if (!isAdmin && db) {
    try {
      const adminDoc = await db.collection("admins").doc(user.uid).get();
      isAdmin = adminDoc.exists && adminDoc.data()?.isAdmin === true;
    } catch {
      // ignore
    }
  }

  if (!isAdmin) {
    if (redirectOnFail) {
      try {
        window.location.href = "customerLogin.html";
      } catch {
        // ignore
      }
    }
    return null;
  }

  return user;
}

// Firestore caches
let menuItemsCache = [];
let ordersCache = [];
let reservationsCache = [];

function mapMenuItemsSnapshot(snap) {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
function mapOrdersSnapshot(snap) {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
function mapReservationsSnapshot(snap) {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function fetchMenuItems() {
  if (!db) return;
  const snap = await db.collection("menuItems").get();
  menuItemsCache = mapMenuItemsSnapshot(snap);
}

async function fetchOrdersAll() {
  const snap = await db.collection("orders").get();
  ordersCache = mapOrdersSnapshot(snap).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

async function fetchReservationsAll() {
  const snap = await db.collection("reservations").get();
  reservationsCache = mapReservationsSnapshot(snap).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

async function fetchCustomerOrders(customerId) {
  const snap = await db
    .collection("orders")
    .where("customerId", "==", customerId)
    .get();
  return mapOrdersSnapshot(snap).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

async function fetchCustomerReservations(customerId) {
  const snap = await db
    .collection("reservations")
    .where("customerId", "==", customerId)
    .get();
  return mapReservationsSnapshot(snap).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

// Simple client-side data store for the restaurant app
const StorageKeys = {
  MENU: "menuItems",
  CART: "cartItems",
  ORDERS: "orders",
  RESERVATIONS: "reservations",
};

function safeRead(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// --- MENU ITEMS ---

function getMenuItems() {
  return menuItemsCache;
}

function saveMenuItems(items) {
  // Menu items are stored in Firestore; this is kept for backward compatibility.
  menuItemsCache = Array.isArray(items) ? items : [];
}

function seedMenuIfEmpty() {
  // No default items; admin manages the entire menu.
  return;
}

// --- VALIDATION HELPERS ---
function isValidBDPhone(raw) {
  const digits = String(raw || "").replace(/[^\d]/g, "");
  // Allow: 01XXXXXXXXX (11 digits) or 8801XXXXXXXXX (13 digits)
  if (/^01\d{9}$/.test(digits)) return true;
  if (/^8801\d{9}$/.test(digits)) return true;
  return false;
}

function normalizeBDPhone(raw) {
  const digits = String(raw || "").replace(/[^\d]/g, "");
  if (/^01\d{9}$/.test(digits)) return `+88${digits}`;
  if (/^8801\d{9}$/.test(digits)) return `+${digits}`;
  return String(raw || "").trim();
}

function isValidHttpUrl(url) {
  const s = String(url || "").trim();
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeCart(cart) {
  const safe = Array.isArray(cart) ? cart : [];
  const cleaned = safe
    .map((i) => ({
      id: String(i?.id || ""),
      name: String(i?.name || "Item"),
      price: Number(i?.price || 0),
      qty: Number(i?.qty || 0),
    }))
    .filter((i) => i.id && Number.isFinite(i.price) && i.price >= 0)
    .map((i) => ({ ...i, qty: Math.max(0, Math.floor(i.qty || 0)) }))
    .filter((i) => i.qty > 0);
  return cleaned;
}

const RESERVATION_CAPACITY_RULES = {
  maxReservationsPerSlot: 8,
  maxGuestsPerSlot: 24,
};

const FOOD_IMAGE_LIBRARY = [
  { file: "Foods/burger.jpg", keywords: ["burger"] },
  { file: "Foods/pizza.jpg", keywords: ["pizza"] },
  { file: "Foods/pasta.jpg", keywords: ["pasta", "spaghetti", "macaroni"] },
  { file: "Foods/biriyani.jpg", keywords: ["biriyani", "biryani"] },
  { file: "Foods/friedChecken.jpg", keywords: ["fried chicken", "fried checken"] },
  { file: "Foods/khicuri.jpg", keywords: ["khicuri", "khichuri"] },
  { file: "Foods/ChickenKhicuri.jpg", keywords: ["chicken khicuri", "chicken khichuri"] },
  { file: "Foods/muttonCurryRice.jpg", keywords: ["mutton curry", "curry rice"] },
  { file: "Foods/vatVorta.jpg", keywords: ["vat vorta", "bhat vorta", "vorta"] },
  { file: "Foods/Lemonade.jpg", keywords: ["lemonade"] },
  { file: "Foods/coffee.jpg", keywords: ["coffee"] },
  { file: "Foods/coke.jpg", keywords: ["coke", "cola"] },
  { file: "Foods/sprite.jpg", keywords: ["sprite"] },
  { file: "Foods/mixJuice.jpg", keywords: ["mix juice", "mixed juice", "juice"] },
  { file: "Foods/icecream.jpg", keywords: ["ice cream", "icecream"] },
  { file: "Foods/donuts.jpg", keywords: ["donut", "donuts"] },
  { file: "Foods/kulfi.jpg", keywords: ["kulfi"] },
  { file: "Foods/muffine.jpg", keywords: ["muffin", "muffine"] },
  { file: "Foods/pastry.jpg", keywords: ["pastry", "cake"] },
];

function pickFoodImageForItem(name, category) {
  const text = `${String(name || "").toLowerCase()} ${String(category || "").toLowerCase()}`;
  const match = FOOD_IMAGE_LIBRARY.find((entry) =>
    entry.keywords.some((kw) => text.includes(kw))
  );
  return match?.file || "";
}

function isActiveReservationForCapacity(reservation) {
  const status = String(reservation?.status || "Pending").trim().toLowerCase();
  return status !== "cancelled" && status !== "canceled";
}

function getReservationSlotCapacity(date, time, reservations = getReservations()) {
  const sameSlot = (Array.isArray(reservations) ? reservations : []).filter(
    (r) =>
      isActiveReservationForCapacity(r) &&
      String(r?.date || "") === String(date || "") &&
      String(r?.time || "") === String(time || "")
  );
  const reservationCount = sameSlot.length;
  const guestCount = sameSlot.reduce(
    (sum, r) => sum + Math.max(0, Number(r?.guestCount || 0)),
    0
  );
  const isFullByReservations =
    reservationCount >= RESERVATION_CAPACITY_RULES.maxReservationsPerSlot;
  const isFullByGuests = guestCount >= RESERVATION_CAPACITY_RULES.maxGuestsPerSlot;
  return {
    reservationCount,
    guestCount,
    isFullByReservations,
    isFullByGuests,
    isFull: isFullByReservations || isFullByGuests,
  };
}

// --- CART ---

function getCart() {
  const raw = safeRead(StorageKeys.CART);
  const cleaned = sanitizeCart(raw);
  // If storage got corrupted (qty <= 0, etc.), self-heal silently.
  try {
    if (JSON.stringify(raw) !== JSON.stringify(cleaned)) safeWrite(StorageKeys.CART, cleaned);
  } catch {
    // ignore
  }
  return cleaned;
}

function saveCart(cart) {
  safeWrite(StorageKeys.CART, cart);
  updateCartBadges();
  if (typeof renderCartSidebar === "function") {
    renderCartSidebar();
  }
}

function addToCartFromItem(itemId) {
  const items = getMenuItems().filter((m) => m.active !== false);
  const item = items.find((m) => m.id === itemId);
  if (!item) return;

  const cart = getCart();
  const existing = cart.find((c) => c.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: 1,
    });
  }
  saveCart(cart);
  showToast(`Added "${item.name}" to cart.`, { type: "success" });
}

function updateCartBadges() {
  const cart = getCart();
  const count = cart.reduce((sum, i) => sum + (i.qty || 0), 0);
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = String(count);
  });
}

// --- ORDERS ---

function getOrders() {
  return ordersCache;
}

function saveOrders(orders) {
  ordersCache = Array.isArray(orders) ? orders : [];
}

async function createOrderFromCart(customerInfo) {
  const user = await requireAuthUser();
  const cart = sanitizeCart(getCart());
  if (!cart.length || !user) return null;

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const orderId = `ORD-${Date.now()}`;

  const orderData = {
    id: orderId,
    customerId: user.uid,
    customerName: customerInfo?.customerName || "",
    phone: normalizeBDPhone(customerInfo?.phone || ""),
    email: customerInfo?.email || user.email || "",
    address: customerInfo?.address || "",
    orderType: customerInfo?.orderType || "Delivery",
    items: cart.map((i) => ({
      itemId: i.id,
      name: i.name,
      price: i.price,
      qty: i.qty,
    })),
    total,
    status: "Pending",
    specialNote: customerInfo?.specialNote || "",
    createdAt: new Date().toISOString(),
  };

  await db.collection("orders").doc(orderId).set(orderData);
  ordersCache.unshift(orderData);
  saveCart([]);
  return orderData;
}

// --- RESERVATIONS ---

function getReservations() {
  return reservationsCache;
}

function saveReservations(reservations) {
  reservationsCache = Array.isArray(reservations) ? reservations : [];
}

async function createReservation(payload) {
  const user = await requireAuthUser();
  if (!user) return null;

  const reservationId = `RES-${Date.now()}`;
  const reservation = {
    id: reservationId,
    customerId: user.uid,
    name: payload?.name || payload?.guestName || "",
    phone: payload?.phone || "",
    email: payload?.email || "",
    date: payload?.date || "",
    time: payload?.time || "",
    guestCount:
      payload?.guestCount ?? payload?.guests ?? payload?.guestCount ?? 0,
    specialRequest: payload?.specialRequest || payload?.notes || "",
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  await db.collection("reservations").doc(reservationId).set(reservation);
  reservationsCache.unshift(reservation);
  return reservation;
}

function formatBDT(amount) {
  const n = Number(amount || 0);
  return `৳${n.toFixed(2)}`;
}

function normalizeOrderStatus(status) {
  const raw = String(status || "Pending").trim().toLowerCase();
  if (raw === "done" || raw === "completed") return "Completed";
  if (raw === "canceled" || raw === "cancelled") return "Cancelled";
  if (raw === "preparing") return "Preparing";
  if (raw === "ready") return "Ready";
  return "Pending";
}

function formatOrderDateTime(iso) {
  if (!iso) return "-";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString();
}

function renderOrderDetailsItems(container, items) {
  if (!container) return;
  const safeItems = Array.isArray(items) ? items : [];
  if (!safeItems.length) {
    container.innerHTML = '<p class="order-details-empty">No items found.</p>';
    return;
  }
  container.innerHTML = safeItems
    .map((item) => {
      const name = item?.name || "Item";
      const qty = Number(item?.qty || 0);
      const price = Number(item?.price || 0);
      const lineTotal = price * qty;
      return `
        <div class="order-details-item-row">
          <div class="order-details-item-meta">
            <p class="order-details-item-name">${name}</p>
            <p class="order-details-item-sub">৳${price.toFixed(2)} x ${qty}</p>
          </div>
          <span class="order-details-item-total">৳${lineTotal.toFixed(2)}</span>
        </div>
      `;
    })
    .join("");
}

async function syncCustomerNavAuthUI() {
  await authReady;
  const user = auth?.currentUser || null;
  const authButtons = Array.from(document.querySelectorAll("[data-auth-cta]"));
  const userChips = Array.from(document.querySelectorAll("[data-user-chip]"));
  const orderNowButtons = Array.from(document.querySelectorAll("[data-order-now]"));
  const mobileCustomerNavs = Array.from(
    document.querySelectorAll("[data-customer-mobile-nav]")
  );

  authButtons.forEach((btn) => {
    if (user) {
      btn.textContent = "Logout";
      btn.setAttribute("data-logout", "true");
      btn.onclick = null;
    } else {
      btn.textContent = "Login";
      btn.removeAttribute("data-logout");
      btn.onclick = () => {
        window.location.href = "customerLogin.html";
      };
    }
  });

  userChips.forEach((chip) => {
    if (user) {
      chip.classList.remove("hidden");
      const nameEl = chip.querySelector("[data-user-chip-name]");
      if (nameEl) nameEl.textContent = user.displayName || user.email || "Profile";
    } else {
      chip.classList.add("hidden");
    }
  });

  // Keep checkout / order CTA visible for both guests and logged-in users.
  orderNowButtons.forEach((btn) => btn.classList.remove("hidden"));

  // Keep customer mobile nav visible for both guest and logged-in users.
  mobileCustomerNavs.forEach((nav) => {
    nav.classList.remove("hidden");
  });
}

// --- PAGE INITIALISERS ---

async function initMenuManagementPage() {
  const admin = await requireAdminUser();
  if (!admin) return;

  const tbody = document.getElementById("menu-table-body");
  const form = document.getElementById("menu-item-form");
  if (!tbody || !form) return;

  async function renderStats() {
    const items = getMenuItems();
    const total = items.length;
    const active = items.filter((m) => m.active !== false).length;
    const inactive = total - active;
    const categoriesCount = new Set(
      items.map((m) => m.category).filter(Boolean)
    ).size;

    const totalEl = document.getElementById("admin-menu-total-items");
    const activeEl = document.getElementById("admin-menu-active-items");
    const inactiveEl = document.getElementById("admin-menu-inactive-items");
    const categoriesEl = document.getElementById(
      "admin-menu-categories-count"
    );
    const labelEl = document.getElementById("admin-menu-showing-label");

    if (totalEl) totalEl.textContent = String(total);
    if (activeEl) activeEl.textContent = String(active);
    if (inactiveEl) inactiveEl.textContent = String(inactive);
    if (categoriesEl) categoriesEl.textContent = String(categoriesCount);
    if (labelEl) labelEl.textContent = `Showing ${total} items`;
  }

  try {
    await fetchMenuItems();
  } catch (err) {
    console.error("Failed to load menuItems:", err);
    showToast(
      "Could not load menu items. Check that you are signed in as admin and that Firestore rules allow reads.",
      { type: "error", duration: 4500 }
    );
    return;
  }

  function renderTable() {
    const items = getMenuItems();
    tbody.innerHTML = "";
    if (!items.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="admin-menu-empty-cell">No menu items yet. Use the form below to add one.</td></tr>';
      return;
    }

    items.forEach((item) => {
      const tr = document.createElement("tr");
      tr.className = "admin-menu-row";
      tr.innerHTML = `
        <td class="admin-menu-cell">
          <div class="admin-menu-image-wrap">
            <img src="${item.image || ""}" alt="${item.name}" class="admin-menu-image">
          </div>
        </td>
        <td class="admin-menu-cell">
          <div class="admin-menu-item-name">${item.name}</div>
          <div class="admin-menu-item-desc">${item.description || ""}</div>
        </td>
        <td class="admin-menu-cell">
          <span class="admin-menu-category">${item.category || ""}</span>
        </td>
        <td class="admin-menu-cell">
          <span class="admin-menu-price">৳${item.price.toFixed(2)}</span>
        </td>
        <td class="admin-menu-cell">
          <span class="admin-menu-status ${
            item.active === false
              ? "admin-menu-status--inactive"
              : "admin-menu-status--active"
          }">
            ${item.active === false ? "Inactive" : "Active"}
          </span>
        </td>
        <td class="admin-menu-cell admin-menu-cell-actions">
          <div class="admin-menu-actions">
            <button data-id="${item.id}" class="delete-menu-item admin-menu-delete-btn">
              <span class="material-symbols-outlined admin-menu-delete-icon">delete</span>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderTable();
  renderStats();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = form.querySelector("[name='name']").value.trim();
    const category = form.querySelector("[name='category']").value.trim();
    const priceValue = parseFloat(
      form.querySelector("[name='price']").value || "0"
    );
    const description = form
      .querySelector("[name='description']")
      .value.trim();
    const image = form.querySelector("[name='image']").value.trim();
    const autoFoodImage = pickFoodImageForItem(name, category);

    if (!name) {
      showToast("Item name is required.", { type: "warning" });
      return;
    }
    if (!category) {
      showToast("Category is required.", { type: "warning" });
      return;
    }
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      showToast("Price must be a valid positive number.", { type: "warning" });
      return;
    }
    if (image && !autoFoodImage && !isValidHttpUrl(image)) {
      showToast("Image URL must be a valid http/https link (or leave it empty).", {
        type: "warning",
      });
      return;
    }

    const newItem = {
      id: `item-${Date.now()}`,
      name,
      category,
      price: priceValue,
      description,
      image:
        autoFoodImage ||
        image ||
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAEgK7lzJAJu6zY_2fbn7J9NJAlyFZr8zcykV461zbrCfQ0AJRO_uXWdDotejxQiVpQ5SEDHYJ1OToI981jqF85i6LJq1BakQuhYZwHOx2FcJW8LUKRKNYmUA6nYYqBegb25B5F-JdOcN_PgBguQfdTORj0FCLu9SFMEzqayZeO5MI4vuep2H3xMZ15ow0EVVu1M6V3Y_HyUhuYyG-t8VcOoGyU8E0vMxzSe20RATCxdQnNfFTRpJnNF_zHtufmfCgsQ3t-kcQqJrUV",
      active: true,
    };

    try {
      await db.collection("menuItems").doc(newItem.id).set(newItem);
      await fetchMenuItems();
      form.reset();
      renderTable();
      renderStats();
    } catch (err) {
      console.error("Failed to add menu item:", err);
      showToast(`Failed to add item. ${err?.message || "Check console for details."}`, {
        type: "error",
        duration: 4500,
      });
    }
  });

  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-menu-item");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    if (!id) return;
    const ok = await showConfirmToast(
      "Delete this menu item? This action cannot be undone.",
      { confirmText: "Delete", cancelText: "Keep", type: "warning" }
    );
    if (!ok) return;
    try {
      await db.collection("menuItems").doc(id).delete();
      await fetchMenuItems();
      renderTable();
      renderStats();
    } catch (err) {
      console.error("Failed to delete menu item:", err);
      showToast(
        `Failed to delete item. ${err?.message || "Check console for details."}`,
        { type: "error", duration: 4500 }
      );
    }
  });
}

async function initPublicMenu(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!db) {
    container.innerHTML =
      '<p class="public-menu-empty">Firebase did not initialize. On Hosting ensure /__/firebase/init.js is loaded before app.js; locally use firebase serve or firebase-config.js.</p>';
    showToast("Firebase not ready. Check the browser console.", {
      type: "error",
      duration: 5000,
    });
    return;
  }

  if (!menuItemsCache.length) {
    await fetchMenuItems();
  }

  let selectedCategory = "";
  let searchTerm = "";
  let sortBy = "popular";

  const searchInput = document.getElementById("menu-search-input");
  const sortButtons = Array.from(document.querySelectorAll("[data-menu-sort]"));
  const categoryButtons = Array.from(
    document.querySelectorAll("[data-menu-category]")
  );

  function getFilteredItems() {
    let filtered = getMenuItems().filter((m) => m.active !== false);
    if (selectedCategory) {
      filtered = filtered.filter(
        (m) =>
          String(m.category || "").toLowerCase() ===
          selectedCategory.toLowerCase()
      );
    }
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          String(m.name || "").toLowerCase().includes(t) ||
          String(m.description || "").toLowerCase().includes(t) ||
          String(m.category || "").toLowerCase().includes(t)
      );
    }
    if (sortBy === "price_asc") {
      filtered = [...filtered].sort(
        (a, b) => Number(a.price || 0) - Number(b.price || 0)
      );
    } else if (sortBy === "price_desc") {
      filtered = [...filtered].sort(
        (a, b) => Number(b.price || 0) - Number(a.price || 0)
      );
    }
    return filtered;
  }

  function renderMenu() {
    const items = getFilteredItems();
    if (!items.length) {
      container.innerHTML =
        '<p class="public-menu-empty">No matching items found.</p>';
      return;
    }

    container.innerHTML = "";
    items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "public-menu-card";
    card.innerHTML = `
      <div class="public-menu-card-media">
        <img src="${item.image || ""}" alt="${item.name}" class="public-menu-card-image">
        <div class="public-menu-card-price-pill">
          ৳${item.price.toFixed(2)}
        </div>
      </div>
      <div class="public-menu-card-body">
        <h3 class="public-menu-card-title">${item.name}</h3>
        <p class="public-menu-card-category">${item.category || ""}</p>
        <p class="public-menu-card-description">${
          item.description || ""
        }</p>
        <div class="public-menu-card-actions">
          <button data-menu-id="${
            item.id
          }" class="add-to-cart public-menu-add-btn">
            <span class="material-symbols-outlined public-menu-add-icon">add_shopping_cart</span>
            Add
          </button>
        </div>
      </div>
    `;
      container.appendChild(card);
    });
  }

  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-to-cart");
    if (!btn) return;
    const id = btn.getAttribute("data-menu-id");
    if (!id) return;
    addToCartFromItem(id);
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchTerm = searchInput.value.trim();
      renderMenu();
    });
  }

  sortButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      sortBy = btn.getAttribute("data-menu-sort") || "popular";
      sortButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("menu-sort-btn-active", active);
      });
      renderMenu();
    });
  });

  categoryButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const next = btn.getAttribute("data-menu-category") || "";
      selectedCategory = selectedCategory === next ? "" : next;
      categoryButtons.forEach((b) => {
        const active = !!(b === btn && selectedCategory);
        b.classList.toggle("menu-category-link-active", active);
      });
      renderMenu();
    });
  });

  renderMenu();
}

async function initCheckoutPage() {
  await authReady;
  const user = auth?.currentUser || null;

  updateCartBadges();
  const listEl = document.getElementById("order-items");
  const subtotalEl = document.getElementById("order-subtotal");
  const totalEl = document.getElementById("order-total");
  const placeBtn = document.getElementById("place-order-btn");
  const form = document.getElementById("checkout-form");
  if (!listEl || !subtotalEl || !totalEl || !placeBtn || !form) return;

  // Order type toggle (Delivery / Takeaway / Dine-in)
  const typeInput = document.getElementById("order-type-input");
  const typeButtons = Array.from(document.querySelectorAll("[data-order-type]"));
  let selectedOrderType = typeInput?.value || "Delivery";

  function setSelectedOrderType(type) {
    selectedOrderType = type;
    if (typeInput) typeInput.value = type;
    typeButtons.forEach((btn) => {
      const btnType = btn.getAttribute("data-order-type");
      const isSelected = btnType === selectedOrderType;
      btn.classList.toggle("checkout-order-type-btn--active", isSelected);
    });
  }

  // Payment method cards: keep same selected effect for either option.
  const paymentOptions = Array.from(
    document.querySelectorAll("[data-payment-option]")
  );
  function setSelectedPayment(optionEl) {
    paymentOptions.forEach((el) => {
      const input = el.querySelector("input[type='radio']");
      const isSelected = el === optionEl;
      if (input) input.checked = isSelected;
      el.classList.toggle("payment-option--selected", isSelected);
      el.classList.toggle("payment-option--unselected", !isSelected);
    });
  }

  // Initialize selected UI state
  setSelectedOrderType(selectedOrderType);
  if (paymentOptions.length) {
    const selected =
      paymentOptions.find((el) =>
        el.querySelector("input[type='radio']")?.checked
      ) || paymentOptions[0];
    if (selected) setSelectedPayment(selected);
    paymentOptions.forEach((el) => {
      el.addEventListener("click", () => setSelectedPayment(el));
    });
  }
  typeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setSelectedOrderType(btn.getAttribute("data-order-type") || "Delivery");
    });
  });

  function renderSummary() {
    const cart = getCart();
    listEl.innerHTML = "";
    if (!cart.length) {
      listEl.innerHTML =
        '<p class="checkout-order-items-empty">Your cart is empty. Please add items from the menu.</p>';
      subtotalEl.textContent = "৳0.00";
      totalEl.textContent = "৳0.00";
      return;
    }
    let subtotal = 0;
    cart.forEach((item) => {
      subtotal += item.price * item.qty;
      const row = document.createElement("div");
      row.className = "checkout-summary-row";
      row.innerHTML = `
        <div class="checkout-summary-meta">
          <p class="checkout-summary-item-name">${item.name}</p>
          <p class="checkout-summary-item-qty">৳${item.price.toFixed(
            2
          )} × ${item.qty}</p>
        </div>
        <span class="checkout-summary-item-total">৳${(item.price * item.qty).toFixed(2)}</span>
      `;
      listEl.appendChild(row);
    });
    subtotalEl.textContent = `৳${subtotal.toFixed(2)}`;
    totalEl.textContent = `৳${subtotal.toFixed(2)}`;
  }

  renderSummary();

  placeBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const cart = sanitizeCart(getCart());
    if (!cart.length) {
      showToast("Your cart is empty.", { type: "warning" });
      return;
    }
    if (!auth?.currentUser) {
      showToast("Please log in to place your order.", {
        type: "warning",
        duration: 2600,
      });
      setTimeout(() => {
        window.location.href = "customerLogin.html";
      }, 700);
      return;
    }
    const fullName = (form.querySelector("[name='fullName']")?.value || "").trim();
    const phone = (form.querySelector("[name='phone']")?.value || "").trim();
    const address = (form.querySelector("[name='address']")?.value || "").trim();
    if (!fullName || !phone) {
      showToast("Name and phone number are required.", { type: "warning" });
      return;
    }
    if (!isValidBDPhone(phone)) {
      showToast("Please enter a valid Bangladesh phone number (01XXXXXXXXX).", {
        type: "warning",
      });
      return;
    }
    if (selectedOrderType === "Delivery" && !address) {
      showToast("Delivery address is required for delivery orders.", {
        type: "warning",
      });
      return;
    }
    const customerInfo = {
      customerName: fullName,
      phone: normalizeBDPhone(phone),
      address,
      email: auth?.currentUser?.email || "",
      orderType: selectedOrderType,
      specialNote: "",
    };

    const order = await createOrderFromCart(customerInfo);
    if (!order) return;
    renderSummary();
    showToast(`Order ${order.id} placed successfully!`, { type: "success" });
    try {
      window.location.href = "customerProfile.html";
    } catch {
      // ignore
    }
  });
}

function renderCartSidebar() {
  const listEl = document.getElementById("menu-cart-items");
  const subtotalEl = document.getElementById("menu-cart-subtotal");
  const totalEl = document.getElementById("menu-cart-total");
  if (!listEl || !subtotalEl || !totalEl) return;

  const cart = getCart();
  listEl.innerHTML = "";

  if (!cart.length) {
    listEl.innerHTML =
      '<p class="menu-cart-empty">Your cart is empty. Add items from the menu.</p>';
    subtotalEl.textContent = "৳0.00";
    totalEl.textContent = "৳0.00";
    return;
  }

  let subtotal = 0;
  cart.forEach((item) => {
    subtotal += item.price * item.qty;
    const row = document.createElement("div");
    row.className = "menu-cart-item-row";
    row.innerHTML = `
      <div class="menu-cart-item-meta">
        <h4 class="menu-cart-item-name">${item.name}</h4>
        <p class="menu-cart-item-unit-price">৳${item.price.toFixed(
          2
        )} × ${item.qty}</p>
        <div class="menu-cart-qty-controls">
          <button data-cart-dec="${
            item.id
          }" class="menu-cart-qty-btn">
            <span class="material-symbols-outlined menu-cart-qty-icon" data-icon="remove">remove</span>
          </button>
          <span class="menu-cart-qty-value">${item.qty}</span>
          <button data-cart-inc="${
            item.id
          }" class="menu-cart-qty-btn">
            <span class="material-symbols-outlined menu-cart-qty-icon" data-icon="add">add</span>
          </button>
        </div>
      </div>
      <div class="menu-cart-item-right">
        <span class="menu-cart-item-total">৳${(item.price * item.qty).toFixed(2)}</span>
        <button data-cart-remove="${
          item.id
        }" class="menu-cart-remove-btn">
          <span class="material-symbols-outlined menu-cart-remove-icon" data-icon="delete">delete</span>
        </button>
      </div>
    `;
    listEl.appendChild(row);
  });

  subtotalEl.textContent = `৳${subtotal.toFixed(2)}`;
  totalEl.textContent = `৳${subtotal.toFixed(2)}`;
}

function initMenuCartSidebar() {
  const listEl = document.getElementById("menu-cart-items");
  if (!listEl) return;

  renderCartSidebar();

  listEl.addEventListener("click", (e) => {
    const dec = e.target.closest("[data-cart-dec]");
    const inc = e.target.closest("[data-cart-inc]");
    const rem = e.target.closest("[data-cart-remove]");
    const cart = getCart();

    if (dec) {
      const id = dec.getAttribute("data-cart-dec");
      const item = cart.find((c) => c.id === id);
      if (!item) return;
      if (item.qty > 1) {
        item.qty -= 1;
      } else {
        const idx = cart.findIndex((c) => c.id === id);
        if (idx !== -1) cart.splice(idx, 1);
      }
      saveCart(cart);
      return;
    }

    if (inc) {
      const id = inc.getAttribute("data-cart-inc");
      const item = cart.find((c) => c.id === id);
      if (!item) return;
      item.qty += 1;
      saveCart(cart);
      return;
    }

    if (rem) {
      const id = rem.getAttribute("data-cart-remove");
      const idx = cart.findIndex((c) => c.id === id);
      if (idx !== -1) {
        cart.splice(idx, 1);
        saveCart(cart);
      }
    }
  });

  const checkoutBtn = document.getElementById("menu-checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.onclick = (e) => {
      const cart = getCart();
      if (!cart.length) {
        e.preventDefault();
        showToast("Your cart is empty. Add items before checkout.", {
          type: "warning",
        });
        return false;
      }
      window.location.href = "orderCheckout.html";
      return true;
    };
  }
}

async function initOrderManagementPage() {
  const admin = await requireAdminUser();
  if (!admin) return;

  const tbody = document.getElementById("orders-table-body");
  if (!tbody) return;
  const searchInput = document.getElementById("order-search-input");
  const filterButtons = Array.from(document.querySelectorAll("[data-order-filter]"));
  const newOrderBtn = document.getElementById("admin-new-order-btn");
  const orderModal = document.getElementById("admin-order-modal");
  const orderModalClose = document.getElementById("admin-order-modal-close");
  const orderModalCancel = document.getElementById("admin-order-modal-cancel");
  const createOrderForm = document.getElementById("admin-create-order-form");
  const addOrderItemLineBtn = document.getElementById("admin-add-order-item-line");
  const orderItemsWrap = document.getElementById("admin-order-items-wrap");
  const orderDetailsModal = document.getElementById("admin-order-details-modal");
  const orderDetailsClose = document.getElementById("admin-order-details-close");
  const orderDetailsId = document.getElementById("admin-order-details-id");
  const orderDetailsCustomer = document.getElementById("admin-order-details-customer");
  const orderDetailsStatus = document.getElementById("admin-order-details-status");
  const orderDetailsDate = document.getElementById("admin-order-details-date");
  const orderDetailsType = document.getElementById("admin-order-details-type");
  const orderDetailsPhone = document.getElementById("admin-order-details-phone");
  const orderDetailsAddress = document.getElementById("admin-order-details-address");
  const orderDetailsTotal = document.getElementById("admin-order-details-total");
  const orderDetailsItems = document.getElementById("admin-order-details-items");

  try {
    await fetchOrdersAll();
  } catch (err) {
    console.error("Failed to load orders:", err);
    showToast(
      `Could not load orders. ${err?.message || "Please check permissions."}`,
      { type: "error", duration: 4500 }
    );
    return;
  }

  let selectedFilter = "All";
  let searchTerm = "";

  function setActiveFilterButton() {
    filterButtons.forEach((btn) => {
      const value = btn.getAttribute("data-order-filter") || "All";
      const active = value === selectedFilter;
      btn.classList.toggle("order-filter-btn--active", active);
    });
  }

  function getFilteredOrders() {
    const term = (searchTerm || "").toLowerCase();
    return getOrders().filter((order) => {
      const status = normalizeOrderStatus(order.status).toLowerCase();
      const matchesFilter =
        selectedFilter === "All" || status === selectedFilter.toLowerCase();
      if (!matchesFilter) return false;
      if (!term) return true;
      const inId = String(order.id || "").toLowerCase().includes(term);
      const inName = String(order.customerName || "").toLowerCase().includes(term);
      const inType = String(order.orderType || "").toLowerCase().includes(term);
      return inId || inName || inType;
    });
  }

  function renderOrders() {
    const orders = getFilteredOrders();
    tbody.innerHTML = "";
    if (!orders.length) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="admin-orders-empty-cell">No matching orders found.</td></tr>';
      return;
    }

    orders.forEach((order) => {
      const status = normalizeOrderStatus(order.status);
      const items = Array.isArray(order.items) ? order.items : [];
      const itemNamesList = items.map((i) => i?.name).filter(Boolean);
      const itemNames = itemNamesList.join(", ") || "N/A";
      const previewNames =
        itemNamesList.length > 2
          ? `${itemNamesList.slice(0, 2).join(", ")} +${itemNamesList.length - 2} more`
          : itemNames;
      const totalQty = items.reduce((sum, i) => sum + (Number(i?.qty) || 0), 0);
      const total = Number(order?.total) || 0;
      const firstName = String(order.customerName || "Guest").trim().split(/\s+/)[0];
      const detailsId = `order-items-${String(order.id).replace(/[^a-zA-Z0-9_-]/g, "")}`;
      const row = document.createElement("tr");
      row.className = "admin-order-row";
      row.setAttribute("data-order-row-id", String(order.id || ""));
      row.innerHTML = `
        <td class="admin-order-cell admin-order-cell-id">#${order.id}</td>
        <td class="admin-order-cell admin-order-cell-name">
          ${firstName || "Guest"}
        </td>
        <td class="admin-order-cell admin-order-cell-items">
          <div class="admin-order-items-stack">
            <p class="admin-order-items-preview" title="${itemNames}">${previewNames}</p>
            ${
              itemNamesList.length > 2
                ? `<button type="button" class="admin-order-expand-btn" data-order-expand="${detailsId}" data-expanded="false">Show all</button>
                   <p id="${detailsId}" class="hidden admin-order-items-full">${itemNames}</p>`
                : ""
            }
          </div>
        </td>
        <td class="admin-order-cell admin-order-cell-qty">
          ${totalQty}
        </td>
        <td class="admin-order-cell admin-order-cell-total">৳${total.toFixed(2)}</td>
        <td class="admin-order-cell">
          <select data-order-id="${
            order.id
          }" class="order-status admin-order-status-select">
            ${["Pending", "Preparing", "Ready", "Completed", "Cancelled"]
              .map(
                (s) =>
                  `<option value="${s}" ${
                    status === s ? "selected" : ""
                  }>${s}</option>`
              )
              .join("")}
          </select>
        </td>
        <td class="admin-order-cell admin-order-cell-actions">
          <button data-delete-order="${
            order.id
          }" class="admin-order-delete-btn">
            <span class="material-symbols-outlined admin-order-delete-icon">delete</span>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  renderOrders();
  setActiveFilterButton();

  // --- Admin create order ---
  let menuForOrder = [];
  function addOrderItemRow() {
    if (!orderItemsWrap) return;
    const row = document.createElement("div");
    row.className = "admin-order-item-line";
    const options = menuForOrder
      .map((m) => `<option value="${m.id}">${m.name} - ৳${Number(m.price || 0).toFixed(2)}</option>`)
      .join("");
    row.innerHTML = `
      <select class="admin-order-item-select" data-order-item-id>${options}</select>
      <input type="number" min="1" value="1" class="admin-order-item-qty" data-order-item-qty />
      <button type="button" class="admin-order-item-remove" data-remove-order-line>×</button>
    `;
    orderItemsWrap.appendChild(row);
  }

  if (newOrderBtn && orderModal) {
    newOrderBtn.addEventListener("click", async () => {
      try {
        await fetchMenuItems();
        menuForOrder = getMenuItems().filter((m) => m.active !== false);
      } catch {
        menuForOrder = [];
      }
      if (!menuForOrder.length) {
        showToast("No active menu items available to create order.", { type: "warning" });
        return;
      }
      if (orderItemsWrap) {
        orderItemsWrap.innerHTML = "";
        addOrderItemRow();
      }
      orderModal.classList.remove("hidden");
    });
  }
  if (orderModalClose && orderModal) {
    orderModalClose.addEventListener("click", () => orderModal.classList.add("hidden"));
  }
  if (orderModalCancel && orderModal) {
    orderModalCancel.addEventListener("click", () => orderModal.classList.add("hidden"));
  }
  if (addOrderItemLineBtn) {
    addOrderItemLineBtn.addEventListener("click", addOrderItemRow);
  }
  if (orderItemsWrap) {
    orderItemsWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-remove-order-line]");
      if (!btn) return;
      const row = btn.closest(".admin-order-item-line");
      if (row) row.remove();
    });
  }

  function openAdminOrderDetails(orderId) {
    if (!orderDetailsModal) return;
    const order = getOrders().find((o) => String(o.id) === String(orderId));
    if (!order) return;
    const status = normalizeOrderStatus(order.status);
    if (orderDetailsId) orderDetailsId.textContent = `#${order.id || "-"}`;
    if (orderDetailsCustomer) orderDetailsCustomer.textContent = order.customerName || "Guest";
    if (orderDetailsStatus) orderDetailsStatus.textContent = status;
    if (orderDetailsDate) orderDetailsDate.textContent = formatOrderDateTime(order.createdAt);
    if (orderDetailsType) orderDetailsType.textContent = order.orderType || "-";
    if (orderDetailsPhone) orderDetailsPhone.textContent = order.phone || "-";
    if (orderDetailsAddress) orderDetailsAddress.textContent = order.address || "-";
    if (orderDetailsTotal) orderDetailsTotal.textContent = formatBDT(order.total);
    renderOrderDetailsItems(orderDetailsItems, order.items);
    orderDetailsModal.classList.remove("hidden");
  }

  if (orderDetailsClose && orderDetailsModal) {
    orderDetailsClose.addEventListener("click", () => orderDetailsModal.classList.add("hidden"));
  }
  if (orderDetailsModal) {
    orderDetailsModal.addEventListener("click", (e) => {
      if (e.target === orderDetailsModal) orderDetailsModal.classList.add("hidden");
    });
  }
  if (createOrderForm) {
    createOrderForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!menuForOrder.length) return;
      const customerName = createOrderForm.querySelector("[name='customerName']")?.value?.trim() || "Guest";
      const phone = createOrderForm.querySelector("[name='phone']")?.value?.trim() || "";
      const orderType = createOrderForm.querySelector("[name='orderType']")?.value || "Delivery";
      const lines = Array.from(orderItemsWrap?.querySelectorAll(".admin-order-item-line") || []);
      const items = lines
        .map((line) => {
          const itemId = line.querySelector("[data-order-item-id]")?.value;
          const qty = Number(line.querySelector("[data-order-item-qty]")?.value || 0);
          const menuItem = menuForOrder.find((m) => m.id === itemId);
          if (!menuItem || qty <= 0) return null;
          return { itemId: menuItem.id, name: menuItem.name, price: Number(menuItem.price || 0), qty };
        })
        .filter(Boolean);
      if (!items.length) {
        showToast("Please add at least one valid item.", { type: "warning" });
        return;
      }
      const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
      const orderId = `ORD-${Date.now()}`;
      const orderData = {
        id: orderId,
        customerId: currentUser?.uid || "admin-created",
        customerName,
        phone,
        email: "",
        address: "",
        orderType,
        items,
        total,
        status: "Pending",
        specialNote: "",
        createdAt: new Date().toISOString(),
      };
      try {
        await db.collection("orders").doc(orderId).set(orderData);
        await fetchOrdersAll();
        renderOrders();
        orderModal?.classList.add("hidden");
        createOrderForm.reset();
        showToast("Order created successfully.", { type: "success" });
      } catch (err) {
        showToast(`Failed to create order. ${err?.message || err}`, { type: "error", duration: 4500 });
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchTerm = searchInput.value.trim();
      renderOrders();
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedFilter = btn.getAttribute("data-order-filter") || "All";
      setActiveFilterButton();
      renderOrders();
    });
  });

  tbody.addEventListener("change", async (e) => {
    const select = e.target.closest(".order-status");
    if (!select) return;
    const id = select.getAttribute("data-order-id");
    const nextStatus = normalizeOrderStatus(select.value);
    try {
      await db.collection("orders").doc(id).update({ status: nextStatus });
      await fetchOrdersAll();
      renderOrders();
    } catch (err) {
      console.error("Failed to update order status:", err);
      showToast(`Failed to update order. ${err?.message || err}`, {
        type: "error",
        duration: 4500,
      });
    }
  });

  tbody.addEventListener("click", async (e) => {
    const expandBtn = e.target.closest("[data-order-expand]");
    if (expandBtn) {
      const targetId = expandBtn.getAttribute("data-order-expand");
      const details = targetId ? document.getElementById(targetId) : null;
      if (!details) return;
      const expanded = expandBtn.getAttribute("data-expanded") === "true";
      details.classList.toggle("hidden", expanded);
      expandBtn.setAttribute("data-expanded", expanded ? "false" : "true");
      expandBtn.textContent = expanded ? "Show all" : "Show less";
      return;
    }

    const row = e.target.closest("[data-order-row-id]");
    if (
      row &&
      !e.target.closest("[data-delete-order]") &&
      !e.target.closest("[data-order-expand]") &&
      !e.target.closest(".order-status") &&
      !e.target.closest("button,select,input,textarea,a,label")
    ) {
      openAdminOrderDetails(row.getAttribute("data-order-row-id"));
      return;
    }

    const btn = e.target.closest("[data-delete-order]");
    if (!btn) return;
    const id = btn.getAttribute("data-delete-order");
    const ok = await showConfirmToast(
      "Delete this order? This action cannot be undone.",
      { confirmText: "Delete", cancelText: "Keep", type: "warning" }
    );
    if (!ok) return;
    try {
      await db.collection("orders").doc(id).delete();
      await fetchOrdersAll();
      renderOrders();
    } catch (err) {
      console.error("Failed to delete order:", err);
      showToast(`Failed to delete order. ${err?.message || err}`, {
        type: "error",
        duration: 4500,
      });
    }
  });
}

async function initReservationFormPage() {
  await authReady;

  const form = document.getElementById("reservation-form");
  if (!form) return;

  const timeInput = form.querySelector("[name='time']");
  const dateInput = form.querySelector("[name='date']");
  const timeButtons = Array.from(form.querySelectorAll("[data-time-option]"));

  const now = new Date();
  const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    .toISOString()
    .slice(0, 10);
  if (dateInput) dateInput.setAttribute("min", todayISO);

  async function refreshSlotAvailability() {
    const selectedDate = (dateInput?.value || "").trim();
    if (!timeButtons.length) return;
    if (!selectedDate) {
      timeButtons.forEach((btn) => {
        btn.disabled = false;
        btn.removeAttribute("title");
      });
      return;
    }

    try {
      await fetchReservationsAll();
    } catch {
      // If fetch fails, use local cache only.
    }

    timeButtons.forEach((btn) => {
      const t = btn.getAttribute("data-time-option") || "";
      const cap = getReservationSlotCapacity(selectedDate, t);
      const isFull = cap.isFull;
      btn.disabled = isFull;
      if (isFull) {
        btn.setAttribute(
          "title",
          `Slot full (${cap.reservationCount}/${RESERVATION_CAPACITY_RULES.maxReservationsPerSlot} reservations, ${cap.guestCount}/${RESERVATION_CAPACITY_RULES.maxGuestsPerSlot} guests)`
        );
      } else {
        btn.removeAttribute("title");
      }
      if (isFull && timeInput?.value === t) {
        timeInput.value = "";
        btn.classList.remove("reservation-time-btn-selected");
      }
    });
  }

  if (timeInput && timeButtons.length) {
    timeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        const timeValue = btn.getAttribute("data-time-option") || "";
        timeInput.value = timeValue;

        timeButtons.forEach((b) => b.removeAttribute("data-time-selected"));
        btn.setAttribute("data-time-selected", "true");

        // Visual toggle to match selected slot
        timeButtons.forEach((b) => {
          const isSelected =
            b.getAttribute("data-time-option") === timeValue;
          b.classList.toggle("reservation-time-btn-selected", isSelected);
        });
      });
    });
  }
  if (dateInput) {
    dateInput.addEventListener("change", refreshSlotAvailability);
  }
  await refreshSlotAvailability();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!auth?.currentUser) {
      showToast("Please log in to confirm your reservation.", {
        type: "warning",
        duration: 2600,
      });
      setTimeout(() => {
        window.location.href = "customerLogin.html";
      }, 700);
      return;
    }
    const guests = form.querySelector("[name='guests']").value || "";
    const date = (form.querySelector("[name='date']").value || "").trim();
    const time = (form.querySelector("[name='time']")?.value || "").trim();
    const name = (form.querySelector("[name='name']").value || "").trim();
    const phone = (form.querySelector("[name='phone']").value || "").trim();
    const email = form.querySelector("[name='email']").value || "";
    const notes = form.querySelector("[name='notes']").value || "";

    if (!guests || !date || !time || !name || !phone) {
      showToast("Please fill guests, date, time, name and phone.", {
        type: "warning",
      });
      return;
    }

    const guestCountNum = Number(guests);
    if (!Number.isFinite(guestCountNum) || guestCountNum < 1) {
      showToast("Guest count must be at least 1.", { type: "warning" });
      return;
    }
    if (!time) {
      showToast("Please select a reservation time.", { type: "warning" });
      return;
    }
    if (!isValidBDPhone(phone)) {
      showToast("Please enter a valid Bangladesh phone number (01XXXXXXXXX).", {
        type: "warning",
      });
      return;
    }
    // Date cannot be in the past (local timezone).
    if (date < todayISO) {
      showToast("Reservation date cannot be in the past.", { type: "warning" });
      return;
    }

    // Prevent same-day repeated spam (local cooldown + Firestore duplicate check).
    const phoneNorm = normalizeBDPhone(phone);
    const spamKey = `resv:${phoneNorm}:${date}`;
    try {
      const last = Number(localStorage.getItem(spamKey) || "0");
      if (last && Date.now() - last < 2 * 60 * 1000) {
        showToast("Please wait a moment before submitting another reservation.", {
          type: "warning",
        });
        return;
      }
    } catch {
      // ignore
    }
    await refreshSlotAvailability();
    const userId = auth?.currentUser?.uid || "";
    const reservations = getReservations();
    const duplicateSameSlot = reservations.some((r) => {
      if (!isActiveReservationForCapacity(r)) return false;
      if (String(r?.date || "") !== date || String(r?.time || "") !== time) return false;
      const rPhone = normalizeBDPhone(r?.phone || "");
      return String(r?.customerId || "") === userId || rPhone === phoneNorm;
    });
    if (duplicateSameSlot) {
      showToast("You already have a reservation at this same date and time.", {
        type: "warning",
      });
      return;
    }
    const slotCapacity = getReservationSlotCapacity(date, time, reservations);
    if (slotCapacity.isFull) {
      showToast("That time slot is already full. Please select another time.", {
        type: "warning",
      });
      return;
    }
    if (
      slotCapacity.guestCount + guestCountNum >
      RESERVATION_CAPACITY_RULES.maxGuestsPerSlot
    ) {
      showToast("Not enough remaining seats in this slot for that guest count.", {
        type: "warning",
      });
      return;
    }

    await createReservation({
      name,
      guestCount: guestCountNum,
      date,
      time,
      phone: phoneNorm,
      email,
      specialRequest: notes,
    });

    form.reset();
    if (timeInput) timeInput.value = "";
    try {
      localStorage.setItem(spamKey, String(Date.now()));
    } catch {
      // ignore
    }
    showToast("Reservation requested successfully.", { type: "success" });
    try {
      window.location.href = "customerProfile.html";
    } catch {
      // ignore
    }
  });
}

async function initReservationManagementPage() {
  const admin = await requireAdminUser();
  if (!admin) return;

  const tbody = document.getElementById("reservations-table-body");
  if (!tbody) return;
  const searchInput = document.getElementById("reservation-search-input");
  const statusFilter = document.getElementById("reservation-status-filter");
  const guestFilter = document.getElementById("reservation-guest-filter");
  const clearFiltersBtn = document.getElementById("reservation-clear-filters");
  const newReservationBtn = document.getElementById("admin-new-reservation-btn");
  const reservationModal = document.getElementById("admin-reservation-modal");
  const reservationModalClose = document.getElementById("admin-reservation-modal-close");
  const reservationModalCancel = document.getElementById("admin-reservation-modal-cancel");
  const createReservationForm = document.getElementById("admin-create-reservation-form");

  await fetchReservationsAll();

  let searchTerm = "";
  let selectedStatus = "All Reservations";
  let selectedGuestRange = "Any Size";

  function guestRangeMatches(guestCount) {
    const n = Number(guestCount) || 0;
    if (selectedGuestRange === "Any Size") return true;
    if (selectedGuestRange === "1-2 Guests") return n >= 1 && n <= 2;
    if (selectedGuestRange === "3-5 Guests") return n >= 3 && n <= 5;
    if (selectedGuestRange === "6+ Guests") return n >= 6;
    return true;
  }

  function getFilteredReservations() {
    const term = (searchTerm || "").toLowerCase();
    return getReservations().filter((r) => {
      const status = String(r.status || "Pending");
      const statusMatches =
        selectedStatus === "All Reservations" || status === selectedStatus;
      if (!statusMatches) return false;
      if (!guestRangeMatches(r.guestCount)) return false;
      if (!term) return true;
      return (
        String(r.name || "").toLowerCase().includes(term) ||
        String(r.email || "").toLowerCase().includes(term) ||
        String(r.phone || "").toLowerCase().includes(term) ||
        String(r.id || "").toLowerCase().includes(term)
      );
    });
  }

  function renderReservations() {
    const reservations = getFilteredReservations();
    tbody.innerHTML = "";
    if (!reservations.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="admin-reserve-empty-cell">No matching reservations found.</td></tr>';
      return;
    }
    reservations.forEach((r) => {
      const row = document.createElement("tr");
      row.className = "admin-reserve-row";
      row.innerHTML = `
        <td class="admin-reserve-cell">
          <div class="admin-reserve-customer">
            <div class="admin-reserve-avatar">
              ${(r.name || "")
                .split(" ")
                .map((p) => p[0])
                .join("")
                .toUpperCase()}
            </div>
            <span class="admin-reserve-name">${r.name || ""}</span>
          </div>
        </td>
        <td class="admin-reserve-cell admin-reserve-date">${r.date}</td>
        <td class="admin-reserve-cell admin-reserve-time">${r.time}</td>
        <td class="admin-reserve-cell admin-reserve-guests-cell">
          <span class="admin-reserve-guests-pill">${r.guestCount}</span>
        </td>
        <td class="admin-reserve-cell">
          <span class="admin-reserve-status ${
            r.status === "Cancelled"
              ? "admin-reserve-status--cancelled"
              : r.status === "Confirmed"
              ? "admin-reserve-status--confirmed"
              : "admin-reserve-status--pending"
          }">
            ${r.status}
          </span>
        </td>
        <td class="admin-reserve-cell admin-reserve-actions-cell">
          <div class="admin-reserve-actions">
            <button data-res-id="${
              r.id
            }" data-res-action="pending" class="admin-res-action-btn admin-res-action-btn--pending">Pending</button>
            <button data-res-id="${
              r.id
            }" data-res-action="confirm" class="admin-res-action-btn admin-res-action-btn--confirm">Confirm</button>
            <button data-res-id="${
              r.id
            }" data-res-action="cancel" class="admin-res-action-btn admin-res-action-btn--cancel">Cancel</button>
            <button data-res-id="${
              r.id
            }" data-res-action="delete" class="admin-res-action-btn admin-res-action-btn--delete" title="Delete reservation">
              Delete
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  renderReservations();

  // --- Admin create reservation ---
  if (newReservationBtn && reservationModal) {
    newReservationBtn.addEventListener("click", () => {
      reservationModal.classList.remove("hidden");
    });
  }
  if (reservationModalClose && reservationModal) {
    reservationModalClose.addEventListener("click", () =>
      reservationModal.classList.add("hidden")
    );
  }
  if (reservationModalCancel && reservationModal) {
    reservationModalCancel.addEventListener("click", () =>
      reservationModal.classList.add("hidden")
    );
  }
  if (createReservationForm) {
    createReservationForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(createReservationForm);
      const id = `RES-${Date.now()}`;
      const data = {
        id,
        customerId: currentUser?.uid || "admin-created",
        name: String(fd.get("name") || "").trim(),
        phone: String(fd.get("phone") || "").trim(),
        email: String(fd.get("email") || "").trim(),
        date: String(fd.get("date") || "").trim(),
        time: String(fd.get("time") || "").trim(),
        guestCount: Number(fd.get("guestCount") || 0),
        specialRequest: String(fd.get("specialRequest") || "").trim(),
        status: "Pending",
        createdAt: new Date().toISOString(),
      };
      if (!data.name || !data.phone || !data.date || !data.time || !data.guestCount) {
        showToast("Please fill required reservation fields.", { type: "warning" });
        return;
      }
      try {
        await db.collection("reservations").doc(id).set(data);
        await fetchReservationsAll();
        renderReservations();
        createReservationForm.reset();
        reservationModal?.classList.add("hidden");
        showToast("Reservation created successfully.", { type: "success" });
      } catch (err) {
        showToast(`Failed to create reservation. ${err?.message || err}`, {
          type: "error",
          duration: 4500,
        });
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchTerm = searchInput.value.trim();
      renderReservations();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      selectedStatus = statusFilter.value;
      renderReservations();
    });
  }

  if (guestFilter) {
    guestFilter.addEventListener("change", () => {
      selectedGuestRange = guestFilter.value;
      renderReservations();
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      searchTerm = "";
      selectedStatus = "All Reservations";
      selectedGuestRange = "Any Size";
      if (searchInput) searchInput.value = "";
      if (statusFilter) statusFilter.value = "All Reservations";
      if (guestFilter) guestFilter.value = "Any Size";
      renderReservations();
    });
  }

  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-res-action]");
    if (!btn) return;
    const id = btn.getAttribute("data-res-id");
    const action = btn.getAttribute("data-res-action");

    if (action === "delete") {
      const ok = await showConfirmToast(
        "Delete this reservation? This action cannot be undone.",
        { confirmText: "Delete", cancelText: "Keep", type: "warning" }
      );
      if (!ok) return;
      try {
        await db.collection("reservations").doc(id).delete();
        await fetchReservationsAll();
        renderReservations();
        showToast("Reservation deleted.", { type: "warning" });
      } catch (err) {
        console.error("Failed to delete reservation:", err);
        showToast(`Failed to delete reservation. ${err?.message || err}`, {
          type: "error",
          duration: 4500,
        });
      }
      return;
    }

    const newStatus =
      action === "confirm"
        ? "Confirmed"
        : action === "pending"
        ? "Pending"
        : "Cancelled";
    const ok = await showConfirmToast(
      action === "confirm"
        ? "Confirm this reservation?"
        : action === "pending"
        ? "Move this reservation to pending?"
        : "Cancel this reservation?",
      {
        confirmText:
          action === "confirm"
            ? "Confirm"
            : action === "pending"
            ? "Set Pending"
            : "Cancel",
        cancelText: "Back",
        type:
          action === "confirm"
            ? "info"
            : action === "pending"
            ? "warning"
            : "warning",
      }
    );
    if (!ok) return;
    await db.collection("reservations").doc(id).update({ status: newStatus });
    await fetchReservationsAll();
    renderReservations();
    showToast(
      action === "confirm"
        ? "Reservation confirmed."
        : action === "pending"
        ? "Reservation moved to pending."
        : "Reservation cancelled.",
      { type: action === "confirm" ? "success" : "warning" }
    );
  });
}

async function initAdminDashboardPage() {
  const admin = await requireAdminUser();
  if (!admin) return;

  const totalOrdersEl = document.getElementById("admin-total-orders");
  const totalReservationsEl = document.getElementById(
    "admin-total-reservations"
  );
  const totalMenuItemsEl = document.getElementById(
    "admin-total-menu-items"
  );
  const pendingOrdersEl = document.getElementById("admin-pending-orders");
  const dateEl = document.getElementById("admin-today-date");
  const recentOrdersBody = document.getElementById(
    "admin-recent-orders-body"
  );
  const recentReservationsBody = document.getElementById(
    "admin-recent-reservations-body"
  );

  if (
    !totalOrdersEl &&
    !totalReservationsEl &&
    !totalMenuItemsEl &&
    !pendingOrdersEl &&
    !recentOrdersBody &&
    !recentReservationsBody
  ) {
    return;
  }

  const loadResults = await Promise.allSettled([
    fetchMenuItems(),
    fetchOrdersAll(),
    fetchReservationsAll(),
  ]);
  const rejectedCount = loadResults.filter((r) => r.status === "rejected").length;
  if (rejectedCount > 0) {
    console.warn("Dashboard partial load issue:", loadResults);
  }
  if (rejectedCount === loadResults.length) {
    showToast(
      "Dashboard data could not be loaded. Please check permissions.",
      { type: "error", duration: 4200 }
    );
  }

  const orders = getOrders();
  const reservations = getReservations();
  const items = getMenuItems();

  if (dateEl) {
    const d = new Date();
    dateEl.textContent = d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }

  if (totalOrdersEl) totalOrdersEl.textContent = String(orders.length);
  if (totalReservationsEl)
    totalReservationsEl.textContent = String(reservations.length);
  if (totalMenuItemsEl)
    totalMenuItemsEl.textContent = String(items.filter((m) => m.active !== false).length);
  if (pendingOrdersEl) {
    pendingOrdersEl.textContent = String(
      orders.filter((o) => normalizeOrderStatus(o.status) === "Pending").length
    );
  }

  async function refreshDashboardData() {
    const settled = await Promise.allSettled([fetchOrdersAll(), fetchReservationsAll()]);
    if (settled.every((r) => r.status === "rejected")) {
      showToast("Could not refresh dashboard data.", {
        type: "error",
        duration: 4000,
      });
    }
    initAdminDashboardPage();
  }

  // Recent Orders Table
  if (recentOrdersBody) {
    const slice = orders.slice(0, 6);
    recentOrdersBody.innerHTML = "";

    if (!slice.length) {
      recentOrdersBody.innerHTML =
        '<tr><td colspan="5" class="admin-dashboard-empty-cell">No orders yet.</td></tr>';
    } else {
      slice.forEach((order) => {
        const name = order.customerName || "Guest";
        const initials = name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0])
          .join("")
          .toUpperCase();

        const status = normalizeOrderStatus(order.status);
        const total = Number(order?.total) || 0;
        let badgeClasses = "admin-dashboard-status admin-dashboard-status--pending";
        let badgeLabel = status;

        if (status === "Completed") {
          badgeClasses = "admin-dashboard-status admin-dashboard-status--completed";
          badgeLabel = "Completed";
        } else if (status === "Cancelled") {
          badgeClasses = "admin-dashboard-status admin-dashboard-status--cancelled";
          badgeLabel = "Cancelled";
        } else if (status === "Preparing") {
          badgeClasses = "admin-dashboard-status admin-dashboard-status--preparing";
          badgeLabel = "Preparing";
        } else if (status === "Ready") {
          badgeClasses = "admin-dashboard-status admin-dashboard-status--ready";
          badgeLabel = "Ready";
        } else {
          badgeClasses = "admin-dashboard-status admin-dashboard-status--pending";
          badgeLabel = "Pending";
        }

        const tr = document.createElement("tr");
        tr.className = "admin-dashboard-order-row";
        tr.innerHTML = `
          <td class="admin-dashboard-cell admin-dashboard-cell-id">#${order.id}</td>
          <td class="admin-dashboard-cell">
            <div class="admin-dashboard-customer">
              <div class="admin-dashboard-customer-avatar">
                ${initials || "GU"}
              </div>
              <span class="admin-dashboard-customer-name">${name}</span>
            </div>
          </td>
          <td class="admin-dashboard-cell admin-dashboard-cell-total">${formatBDT(total)}</td>
          <td class="admin-dashboard-cell">
            <span class="${badgeClasses}">${badgeLabel}</span>
          </td>
          <td class="admin-dashboard-cell admin-dashboard-cell-actions">
            <select data-dash-order-id="${
              order.id
            }" class="dashboard-order-status admin-dashboard-order-select">
              ${["Pending", "Preparing", "Ready", "Completed", "Cancelled"]
                .map(
                  (s) =>
                    `<option value="${s}" ${
                      status === s
                        ? "selected"
                        : ""
                    }>${s}</option>`
                )
                .join("")}
            </select>
          </td>
        `;
        recentOrdersBody.appendChild(tr);
      });

      recentOrdersBody.onchange = async (e) => {
        const select = e.target.closest(".dashboard-order-status");
        if (!select) return;
        const id = select.getAttribute("data-dash-order-id");
        const nextStatus = normalizeOrderStatus(select.value);
        try {
          await db.collection("orders").doc(id).update({ status: nextStatus });
          showToast(`Order ${id} set to ${nextStatus}.`, { type: "success" });
          await refreshDashboardData();
        } catch (err) {
          console.error("Dashboard order status update failed:", err);
          showToast(`Failed to update order: ${err?.message || err}`, {
            type: "error",
            duration: 4500,
          });
        }
      };
    }
  }

  // Recent Reservations Cards
  if (recentReservationsBody) {
    const slice = reservations.slice(0, 3);
    recentReservationsBody.innerHTML = "";

    if (!slice.length) {
      recentReservationsBody.innerHTML =
        '<p class="admin-dashboard-res-empty">No reservations yet.</p>';
    } else {
      slice.forEach((r) => {
        const guestName = r.name || "Guest";
        const guests = r.guestCount || "";
        const time = r.time || "";
        const status = r.status || "Pending";

        let borderClass = "admin-dashboard-res-card--pending";
        let timeClass = "admin-dashboard-res-time";
        let opacityClass = "";

        if (status === "Confirmed") {
          borderClass = "admin-dashboard-res-card--confirmed";
          timeClass = "admin-dashboard-res-time admin-dashboard-res-time--confirmed";
        } else if (status === "Cancelled") {
          borderClass = "admin-dashboard-res-card--cancelled";
          timeClass = "admin-dashboard-res-time";
          opacityClass = "admin-dashboard-res-card--dim";
        }

        const card = document.createElement("div");
        card.className = `admin-dashboard-res-card ${borderClass} ${opacityClass}`.trim();
        card.innerHTML = `
          <div class="admin-dashboard-res-head">
            <h4 class="admin-dashboard-res-name">${guestName}</h4>
            <span class="${timeClass}">${time}</span>
          </div>
          <div class="admin-dashboard-res-meta">
            <div class="admin-dashboard-res-meta-item">
              <span class="material-symbols-outlined admin-dashboard-res-groups-icon">groups</span>
              <span class="admin-dashboard-res-guests">${guests} Guests</span>
            </div>
          </div>
          <div class="admin-dashboard-res-status-wrap">
            <span class="admin-dashboard-res-status ${status === "Confirmed"
              ? "admin-dashboard-res-status--confirmed"
              : status === "Cancelled"
              ? "admin-dashboard-res-status--cancelled"
              : "admin-dashboard-res-status--pending"
            }">${status}</span>
          </div>
          <div class="admin-dashboard-res-actions">
            <button data-dash-res-id="${
              r.id
            }" data-dash-res-status="Pending" class="admin-dashboard-res-btn admin-dashboard-res-btn--pending">Pending</button>
            <button data-dash-res-id="${
              r.id
            }" data-dash-res-status="Confirmed" class="admin-dashboard-res-btn admin-dashboard-res-btn--confirm">Confirm</button>
            <button data-dash-res-id="${
              r.id
            }" data-dash-res-status="Cancelled" class="admin-dashboard-res-btn admin-dashboard-res-btn--cancel">Cancel</button>
          </div>
        `;
        recentReservationsBody.appendChild(card);
      });

      recentReservationsBody.onclick = async (e) => {
        const btn = e.target.closest("[data-dash-res-status]");
        if (!btn) return;
        const id = btn.getAttribute("data-dash-res-id");
        const nextStatus = btn.getAttribute("data-dash-res-status");
        try {
          await db.collection("reservations").doc(id).update({ status: nextStatus });
          showToast(`Reservation ${id} set to ${nextStatus}.`, {
            type: nextStatus === "Confirmed" ? "success" : "warning",
          });
          await refreshDashboardData();
        } catch (err) {
          console.error("Dashboard reservation update failed:", err);
          showToast(`Failed to update reservation: ${err?.message || err}`, {
            type: "error",
            duration: 4500,
          });
        }
      };
    }
  }
}

async function initAdminNotifications() {
  const roots = Array.from(document.querySelectorAll("[data-admin-notif-root]"));
  if (!roots.length) return;

  const admin = await requireAdminUser();
  if (!admin) return;

  async function loadNotifications() {
    await Promise.allSettled([fetchOrdersAll(), fetchReservationsAll()]);
    const orders = getOrders().map((o) => ({
      type: "order",
      id: o.id,
      customerName: o.customerName || "Guest",
      createdAt: o.createdAt || "",
      text: `New order from ${o.customerName || "Guest"} (#${o.id})`,
    }));
    const reservations = getReservations().map((r) => ({
      type: "reservation",
      id: r.id,
      customerName: r.name || "Guest",
      createdAt: r.createdAt || "",
      text: `New reservation by ${r.name || "Guest"} (${r.date || "-"} ${
        r.time || ""
      })`,
    }));

    return [...orders, ...reservations]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
      .slice(0, 4);
  }

  function formatWhen(iso) {
    const d = new Date(iso || "");
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString([], {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function renderAllRoots() {
    const notifications = await loadNotifications();
    roots.forEach((root) => {
      const countEl = root.querySelector("[data-admin-notif-count]");
      const listEl = root.querySelector("[data-admin-notif-list]");
      if (countEl) countEl.textContent = String(notifications.length);
      if (!listEl) return;
      if (!notifications.length) {
        listEl.innerHTML =
          '<div class="admin-notif-empty">No notifications yet.</div>';
        return;
      }
      listEl.innerHTML = notifications
        .map(
          (n) => `
            <div class="admin-notif-item">
              <p class="admin-notif-item-text">${n.text}</p>
              <p class="admin-notif-item-time">${formatWhen(n.createdAt)}</p>
            </div>
          `
        )
        .join("");
    });
  }

  roots.forEach((root) => {
    const toggle = root.querySelector("[data-admin-notif-toggle]");
    const panel = root.querySelector("[data-admin-notif-panel]");
    if (!toggle || !panel) return;
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = panel.classList.contains("hidden");
      roots.forEach((r) => {
        const p = r.querySelector("[data-admin-notif-panel]");
        if (p) p.classList.add("hidden");
      });
      if (isHidden) panel.classList.remove("hidden");
    });
  });

  document.addEventListener("click", () => {
    roots.forEach((root) => {
      const panel = root.querySelector("[data-admin-notif-panel]");
      if (panel) panel.classList.add("hidden");
    });
  });

  await renderAllRoots();
  window.setInterval(renderAllRoots, 20000);
}

// --- Customer Auth / Profile Pages ---

async function initCustomerLoginPage() {
  await authReady;
  const googleBtn = document.getElementById("google-signin-btn");
  const form = document.querySelector("form");

  async function handleAfterLogin() {
    await authReady;
    const user = auth?.currentUser;
    if (!user) return;

    let profileComplete = false;
    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      const data = userDoc.exists ? userDoc.data() : null;
      profileComplete = !!data?.profileComplete;
    } catch (err) {
      // If Firestore rules deny reads, still redirect user to reg.
      console.warn("Could not read users/{uid} during login:", err);
      profileComplete = false;
    }

    window.location.href = profileComplete
      ? "customerProfile.html"
      : "customerReg.html";
  }

  if (auth?.currentUser) {
    await handleAfterLogin();
    return;
  }

  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
        await handleAfterLogin();
      } catch (err) {
        console.error(err);
        showToast(`Google sign-in failed: ${err?.message || err}`, {
          type: "error",
          duration: 4500,
        });
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const email = document.getElementById("email")?.value || "";
        const password = document.getElementById("password")?.value || "";
        if (!email || !password) {
          showToast("Please enter email and password.", { type: "warning" });
          return;
        }
        await auth.signInWithEmailAndPassword(email, password);
        await handleAfterLogin();
      } catch (err) {
        console.error(err);
        showToast(`Sign-in failed: ${err?.message || err}`, {
          type: "error",
          duration: 4500,
        });
      }
    });
  }
}

async function initAdminLoginPage() {
  await authReady;
  const form = document.getElementById("admin-login-form");
  if (!form) return;

  // If already signed in, just send them to the admin dashboard (or show error).
  if (auth?.currentUser) {
    const admin = await requireAdminUser({ redirectOnFail: false });
    if (admin) window.location.href = "adminDB.html";
    else {
      showToast("Access denied. This account is not an admin.", {
        type: "error",
      });
      await auth.signOut();
    }
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("admin-email")?.value || "";
    const password = document.getElementById("admin-password")?.value || "";

    if (!email || !password) {
      showToast("Please enter admin email and password.", { type: "warning" });
      return;
    }

    try {
      await auth.signInWithEmailAndPassword(email, password);
      const admin = await requireAdminUser({ redirectOnFail: false });
      if (!admin) {
        showToast("Access denied. This account is not an admin.", {
          type: "error",
        });
        await auth.signOut();
        return;
      }
      window.location.href = "adminDB.html";
    } catch (err) {
      console.error(err);
      showToast(`Admin sign-in failed: ${err?.message || err}`, {
        type: "error",
        duration: 4500,
      });
    }
  });
}

async function initCustomerRegPage() {
  const user = await requireAuthUser();
  if (!user) return;

  const form = document.querySelector("form");
  if (!form) return;

  let userDoc = null;
  try {
    userDoc = await db.collection("users").doc(user.uid).get();
    if (userDoc.exists && userDoc.data()?.profileComplete) {
      window.location.href = "customerProfile.html";
      return;
    }
  } catch (err) {
    // If reads are blocked by rules, we still allow the user to submit profile.
    console.warn("Could not read users/{uid} on reg page:", err);
  }

  // Pre-fill email from auth
  const emailInput = form.querySelector("[name='email']");
  if (emailInput && !emailInput.value) emailInput.value = user.email || "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const firstName =
        form.querySelector("[name='first_name']")?.value || "";
      const lastName =
        form.querySelector("[name='last_name']")?.value || "";
      const email = form.querySelector("[name='email']")?.value || user.email || "";
      const phone = form.querySelector("[name='phone']")?.value || "";
      const cuisine = form.querySelector("[name='cuisine']")?.value || "";

      const data = {
        uid: user.uid,
        profileComplete: true,
        firstName,
        lastName,
        email,
        phone,
        cuisine,
        avatarUrl:
          user.photoURL || (userDoc?.data ? userDoc.data().avatarUrl : "") || "",
        createdAt: userDoc?.exists
          ? userDoc.data().createdAt
          : new Date().toISOString(),
      };

      await db.collection("users").doc(user.uid).set(data, { merge: true });
      window.location.href = "customerProfile.html";
    } catch (err) {
      console.error(err);
      showToast(`Saving profile failed: ${err?.message || err}`, {
        type: "error",
        duration: 4500,
      });
    }
  });
}

async function initCustomerProfilePage() {
  const user = await requireAuthUser();
  if (!user) return;

  const nameEl = document.getElementById("profile-name");
  const emailEl = document.getElementById("profile-email");
  const phoneEl = document.getElementById("profile-phone");
  const addressEl = document.getElementById("profile-address");
  const avatarEl = document.getElementById("profile-avatar");
  const totalOrdersEl = document.getElementById("profile-total-orders");
  const totalSpendEl = document.getElementById("profile-total-spend");
  const lastOrderEl = document.getElementById("profile-last-order");
  const tbody = document.getElementById("profile-orders-tbody");
  const reservationTbody = document.getElementById("profile-reservations-tbody");
  const editBtn = document.getElementById("profile-edit-btn");
  const editModal = document.getElementById("profile-edit-modal");
  const editClose = document.getElementById("profile-edit-close");
  const editCancel = document.getElementById("profile-edit-cancel");
  const editForm = document.getElementById("profile-edit-form");
  const orderDetailsModal = document.getElementById("profile-order-details-modal");
  const orderDetailsClose = document.getElementById("profile-order-details-close");
  const orderDetailsId = document.getElementById("profile-order-details-id");
  const orderDetailsStatus = document.getElementById("profile-order-details-status");
  const orderDetailsDate = document.getElementById("profile-order-details-date");
  const orderDetailsType = document.getElementById("profile-order-details-type");
  const orderDetailsPhone = document.getElementById("profile-order-details-phone");
  const orderDetailsAddress = document.getElementById("profile-order-details-address");
  const orderDetailsTotal = document.getElementById("profile-order-details-total");
  const orderDetailsItems = document.getElementById("profile-order-details-items");

  const userDoc = await db.collection("users").doc(user.uid).get();
  const profile = userDoc.exists ? userDoc.data() : {};

  const DEFAULT_AVATAR_DATA_URI =
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#f4e2e0"/>
            <stop offset="1" stop-color="#f9f9ff"/>
          </linearGradient>
        </defs>
        <rect width="320" height="320" rx="56" fill="url(#g)"/>
        <circle cx="160" cy="132" r="56" fill="#b1241a" opacity="0.18"/>
        <path d="M64 292c18-56 62-84 96-84s78 28 96 84" fill="#b1241a" opacity="0.14"/>
      </svg>`
    );

  if (avatarEl) {
    const applyFallbackAvatar = () => {
      if (avatarEl.dataset.fallbackApplied === "true") return;
      avatarEl.dataset.fallbackApplied = "true";
      avatarEl.src = DEFAULT_AVATAR_DATA_URI;
    };
    avatarEl.addEventListener("error", applyFallbackAvatar);
  }

  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
  if (nameEl) nameEl.textContent = fullName || user.displayName || user.email || "User";
  if (emailEl) emailEl.textContent = profile.email || user.email || "";
  if (phoneEl) phoneEl.textContent = profile.phone || "";
  if (addressEl) addressEl.textContent = profile.address || "";

  if (avatarEl && (profile.avatarUrl || user.photoURL)) {
    avatarEl.src = profile.avatarUrl || user.photoURL;
  }

  if (editBtn && editModal && editForm) {
    editBtn.addEventListener("click", () => {
      editForm.querySelector("[name='firstName']").value = profile.firstName || "";
      editForm.querySelector("[name='lastName']").value = profile.lastName || "";
      editForm.querySelector("[name='email']").value = profile.email || user.email || "";
      editForm.querySelector("[name='phone']").value = profile.phone || "";
      editForm.querySelector("[name='address']").value = profile.address || "";
      editModal.classList.remove("hidden");
    });
    const closeModal = () => editModal.classList.add("hidden");
    if (editClose) editClose.addEventListener("click", closeModal);
    if (editCancel) editCancel.addEventListener("click", closeModal);
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const firstName = editForm.querySelector("[name='firstName']").value.trim();
      const lastName = editForm.querySelector("[name='lastName']").value.trim();
      const email = editForm.querySelector("[name='email']").value.trim();
      const phone = editForm.querySelector("[name='phone']").value.trim();
      const address = editForm.querySelector("[name='address']").value.trim();
      try {
        await db.collection("users").doc(user.uid).set(
          { firstName, lastName, email, phone, address, profileComplete: true },
          { merge: true }
        );
        if (nameEl)
          nameEl.textContent =
            `${firstName || ""} ${lastName || ""}`.trim() || email || "User";
        if (emailEl) emailEl.textContent = email;
        if (phoneEl) phoneEl.textContent = phone;
        if (addressEl) addressEl.textContent = address;
        showToast("Profile updated successfully.", { type: "success" });
        closeModal();
      } catch (err) {
        showToast(`Failed to update profile. ${err?.message || err}`, {
          type: "error",
          duration: 4500,
        });
      }
    });
  }

  let orders = [];
  let reservations = [];
  try {
    orders = await fetchCustomerOrders(user.uid);
    reservations = await fetchCustomerReservations(user.uid);
  } catch (err) {
    console.warn("Could not load customer orders:", err);
    console.warn("Could not load customer reservations:", err);
    // Keep existing static layout if Firestore rules prevent reading.
    return;
  }

  const totalSpend = orders.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0
  );
  const lastOrder = orders[0];

  if (totalOrdersEl) totalOrdersEl.textContent = String(orders.length);
  if (totalSpendEl) totalSpendEl.textContent = formatBDT(totalSpend);
  if (lastOrderEl && lastOrder?.createdAt) {
    const dt = new Date(lastOrder.createdAt);
    lastOrderEl.textContent = dt.toLocaleDateString();
    if (addressEl && lastOrder?.address) addressEl.textContent = lastOrder.address;
  }

  if (!tbody) return;

  function openProfileOrderDetails(orderId) {
    if (!orderDetailsModal) return;
    const order = orders.find((o) => String(o.id) === String(orderId));
    if (!order) return;
    const status = normalizeOrderStatus(order.status);
    if (orderDetailsId) orderDetailsId.textContent = `#${order.id || "-"}`;
    if (orderDetailsStatus) orderDetailsStatus.textContent = status;
    if (orderDetailsDate) orderDetailsDate.textContent = formatOrderDateTime(order.createdAt);
    if (orderDetailsType) orderDetailsType.textContent = order.orderType || "-";
    if (orderDetailsPhone) orderDetailsPhone.textContent = order.phone || "-";
    if (orderDetailsAddress) orderDetailsAddress.textContent = order.address || "-";
    if (orderDetailsTotal) orderDetailsTotal.textContent = formatBDT(order.total);
    renderOrderDetailsItems(orderDetailsItems, order.items);
    orderDetailsModal.classList.remove("hidden");
  }

  if (orderDetailsClose && orderDetailsModal) {
    orderDetailsClose.addEventListener("click", () => orderDetailsModal.classList.add("hidden"));
  }
  if (orderDetailsModal) {
    orderDetailsModal.addEventListener("click", (e) => {
      if (e.target === orderDetailsModal) orderDetailsModal.classList.add("hidden");
    });
  }

  // Keep existing static rows if we got no orders yet.
  if (!orders.length) return;

  tbody.innerHTML = "";

  orders.forEach((order) => {
    const status = normalizeOrderStatus(order.status);
    let badgeClasses = "profile-status-badge profile-status-badge--pending";
    if (status === "Completed")
      badgeClasses = "profile-status-badge profile-status-badge--completed";
    if (status === "Preparing") badgeClasses = "profile-status-badge profile-status-badge--preparing";
    if (status === "Ready") badgeClasses = "profile-status-badge profile-status-badge--ready";
    if (status === "Cancelled")
      badgeClasses = "profile-status-badge profile-status-badge--cancelled";

    const dt = order.createdAt ? new Date(order.createdAt) : null;
    const dateStr = dt ? dt.toLocaleDateString() : "";

    const tr = document.createElement("tr");
    tr.className = "profile-orders-row";
    tr.innerHTML = `
      <td class="profile-order-cell profile-order-id-cell">#${order.id}</td>
      <td class="profile-order-cell profile-order-date-cell">${dateStr}</td>
      <td class="profile-order-cell profile-order-total-cell">${formatBDT(order.total)}</td>
      <td class="profile-order-cell">
        <span class="${badgeClasses}">${status}</span>
      </td>
      <td class="profile-order-cell profile-order-action-cell">
        <a class="profile-view-link" href="#" data-profile-order-details="${order.id}">View Details</a>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.addEventListener("click", (e) => {
    const link = e.target.closest("[data-profile-order-details]");
    if (!link) return;
    e.preventDefault();
    const orderId = link.getAttribute("data-profile-order-details");
    if (!orderId) return;
    openProfileOrderDetails(orderId);
  });

  if (!reservationTbody) return;

  reservationTbody.innerHTML = "";
  if (!reservations.length) {
    reservationTbody.innerHTML =
      '<tr class="profile-orders-row"><td class="profile-order-cell profile-order-date-cell" colspan="5">No reservations yet.</td></tr>';
    return;
  }

  reservations.forEach((r) => {
    const status = r.status || "Pending";
    let badgeClasses = "profile-status-badge profile-status-badge--pending";
    if (status === "Confirmed") badgeClasses = "profile-status-badge profile-status-badge--completed";
    if (status === "Cancelled" || status === "Canceled")
      badgeClasses = "profile-status-badge profile-status-badge--cancelled";

    const tr = document.createElement("tr");
    tr.className = "profile-orders-row";
    tr.innerHTML = `
      <td class="profile-order-cell profile-order-id-cell">#${r.id || ""}</td>
      <td class="profile-order-cell profile-order-date-cell">${r.date || ""}</td>
      <td class="profile-order-cell profile-order-date-cell">${r.time || ""}</td>
      <td class="profile-order-cell profile-order-date-cell">${r.guestCount ?? ""}</td>
      <td class="profile-order-cell">
        <span class="${badgeClasses}">${status}</span>
      </td>
    `;
    reservationTbody.appendChild(tr);
  });
}

// Auto init per-page based on markers
document.addEventListener("DOMContentLoaded", () => {
  (async () => {
    await syncCustomerNavAuthUI();
    updateCartBadges();

    // Shared sign-out handler for links/buttons with `data-logout`
    document.querySelectorAll("[data-logout]").forEach((el) => {
      el.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await auth?.signOut();
        } catch (err) {
          console.error("Logout failed:", err);
        }
        window.location.href = "hmp.html";
      });
    });

    // Customer pages
    if (document.getElementById("google-signin-btn")) {
      await initCustomerLoginPage();
    }
    if (document.getElementById("admin-login-form")) {
      await initAdminLoginPage();
    }
    if (document.querySelector("[name='first_name']")) {
      await initCustomerRegPage();
    }
    if (document.getElementById("profile-name")) {
      await initCustomerProfilePage();
    }

    // Menu pages
    if (document.getElementById("menu-table-body")) {
      await initMenuManagementPage();
    }
    if (document.getElementById("public-menu-items")) {
      await initPublicMenu("public-menu-items");
    }
    if (document.getElementById("home-menu-items")) {
      await initPublicMenu("home-menu-items");
    }

    // Cart sidebar
    if (document.getElementById("menu-cart-items")) {
      initMenuCartSidebar();
    }

    // Checkout
    if (document.getElementById("checkout-form")) {
      await initCheckoutPage();
    }

    // Admin pages
    if (document.getElementById("orders-table-body")) {
      await initOrderManagementPage();
    }
    if (document.getElementById("reservation-form")) {
      await initReservationFormPage();
    }
    if (document.getElementById("reservations-table-body")) {
      await initReservationManagementPage();
    }
    if (document.getElementById("admin-total-orders")) {
      await initAdminDashboardPage();
    }
    if (document.querySelector("[data-admin-notif-root]")) {
      await initAdminNotifications();
    }
  })().catch((err) => console.error(err));
});

