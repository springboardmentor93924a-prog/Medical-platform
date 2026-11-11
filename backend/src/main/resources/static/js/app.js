/**
 * MEDISTOCK - Clinical Pharmacy & Inventory Management
 * Strictly integrates with Java Spring Boot REST API & MySQL medistock.sql database.
 */

const API_BASE_URL = 'http://localhost:8080/api/admin';

// Global showToast implementation
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) {
    console.log(`[Toast ${type}]: ${message}`);
    return;
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  if (type === 'error') {
    toast.style.background = '#2c1218';
    toast.style.borderLeft = '4px solid #f43f5e';
  } else if (type === 'success') {
    toast.style.background = '#0d261c';
    toast.style.borderLeft = '4px solid #00e599';
  } else {
    toast.style.background = '#0d1d36';
    toast.style.borderLeft = '4px solid #38bdf8';
  }
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}
window.showToast = showToast;

// App State
let currentView = 'dashboard';
let allContacts = [];
let activeContact = null;
let activeRoleFilter = 'ALL';

// Medicines State
let allMedicines = [];
let activeCategoryFilter = 'ALL';
let activeSupplierFilter = 'ALL';
let activeStockStatusFilter = 'ALL';
let activeSearchQuery = '';
let activeSortColumn = 'name';
let activeSortDirection = 'asc';
let deletingMedicineIndex = null;
let allCategories = [];
let activeCategorySearchQuery = '';
let deletingCategoryId = null;

// Suppliers State
let allSuppliers = [];
let activeSupplierSearchQuery = '';
let deletingSupplierId = null;

async function getApiErrorMessage(response, fallbackMessage) {
  try {
    const body = await response.json();
    return body.detail || body.message || body.error || `${fallbackMessage} (HTTP ${response.status}).`;
  } catch {
    return `${fallbackMessage} (HTTP ${response.status}).`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initMedicinesCatalog();
  initCategoryCatalog();
  initSuppliersCatalog();
  initNavigation();
  initThemeToggle();
  initModals();
  initMessaging();
  initUserProfileDropdown();

  // Set default expiry date to 2 years ahead
  const expiryInput = document.getElementById('inputExpiryDate');
  if (expiryInput) {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    expiryInput.value = futureDate.toISOString().split('T')[0];
  }

  // Initial load
  Promise.all([loadCategoriesData(), loadSuppliersData()]).then(() => loadMedicinesData());
  fetchDashboardData();
  loadNotifications();

  // Refresh Synchronizer
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.style.transform = 'rotate(360deg)';
      refreshBtn.style.transition = 'transform 0.6s ease';
      if (currentView === 'dashboard') {
        fetchDashboardData();
      } else if (currentView === 'medicines') {
        loadMedicinesData(true);
      } else if (currentView === 'suppliers') {
        loadSuppliersData();
      } else if (currentView === 'inventory') {
        loadInventoryMovements();
      } else if (currentView === 'categories') {
        loadCategoriesData();
      } else if (currentView === 'purchase-orders') {
        loadPurchaseOrders();
      } else if (currentView === 'billing-pos') {
        refreshPosMedicines();
      } else if (currentView === 'sales-history') {
        loadSalesHistory();
      } else if (currentView === 'users-roles') {
        loadUsersRoles();
      } else if (currentView === 'expiry') {
        if (window.loadExpiryTelemetry) window.loadExpiryTelemetry();
      } else if (currentView === 'reports') {
        loadReports();
      } else if (currentView === 'notifications') {
        loadNotifications();
      } else {
        fetchContacts();
        if (activeContact) fetchConversation(activeContact.userId);
      }
      setTimeout(() => { refreshBtn.style.transform = 'none'; }, 600);
    });
  }
});

/* ==========================================================================
   NAVIGATION VIEW SWITCHING
   ========================================================================== */
function initNavigation() {
  const navDashboardBtn = document.getElementById('navDashboardBtn');
  const navMessagesBtn = document.getElementById('navMessagesBtn');
  const navMedicinesBtn = document.getElementById('navMedicinesBtn');
  const navExpiryBtn = document.getElementById('navExpiryBtn');
  const navCategoriesBtn = document.getElementById('navCategoriesBtn');
  const navSuppliersBtn = document.getElementById('navSuppliersBtn');
  const navInventoryBtn = document.getElementById('navInventoryBtn');
  const navPurchaseOrdersBtn = document.getElementById('navPurchaseOrdersBtn');
  const navBillingPosBtn = document.getElementById('navBillingPosBtn');
  const navSalesHistoryBtn = document.getElementById('navSalesHistoryBtn');
  const navUsersRolesBtn = document.getElementById('navUsersRolesBtn');
  const navReportsBtn = document.getElementById('navReportsBtn');
  const navNotificationsBtn = document.getElementById('navNotificationsBtn');
  const topNotificationsBtn = document.getElementById('topNotificationsBtn');
  const logoLink = document.getElementById('logoLink');
  const linkToMedicines = document.getElementById('linkToMedicines');

  if (navDashboardBtn) {
    navDashboardBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('dashboard');
    });
  }

  if (logoLink) {
    logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('dashboard');
    });
  }

  if (navMedicinesBtn) {
    navMedicinesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('medicines');
    });
  }

  if (navExpiryBtn) {
    navExpiryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('expiry');
    });
  }

  if (navSuppliersBtn) {
    navSuppliersBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('suppliers');
    });
  }
  if (navInventoryBtn) {
    navInventoryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('inventory');
    });
  }
  if (navPurchaseOrdersBtn) {
    navPurchaseOrdersBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('purchase-orders');
    });
  }
  if (navBillingPosBtn) {
    navBillingPosBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('billing-pos');
    });
  }
  if (navSalesHistoryBtn) {
    navSalesHistoryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('sales-history');
    });
  }
  if (navUsersRolesBtn) {
    navUsersRolesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('users-roles');
    });
  }
  if (navReportsBtn) {
    navReportsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('reports');
    });
  }
  if (navNotificationsBtn) {
    navNotificationsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('notifications');
    });
  }
  if (topNotificationsBtn) {
    topNotificationsBtn.addEventListener('click', () => switchView('notifications'));
  }

  if (navCategoriesBtn) {
    navCategoriesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('categories');
    });
  }

  if (linkToMedicines) {
    linkToMedicines.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('medicines');
    });
  }

  // Dashboard KPI and Card Action Links
  const linkToSuppliers = document.getElementById('linkToSuppliers');
  const linkToReplenishment = document.getElementById('linkToReplenishment');
  const linkToExpiryQuarantine = document.getElementById('linkToExpiryQuarantine');
  const linkToViewAllOrders = document.getElementById('linkToViewAllOrders');
  const linkToFullInventory = document.getElementById('linkToFullInventory');

  if (linkToSuppliers) {
    linkToSuppliers.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('suppliers');
    });
  }

  if (linkToReplenishment) {
    linkToReplenishment.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('inventory');
    });
  }

  if (linkToExpiryQuarantine) {
    linkToExpiryQuarantine.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('expiry');
    });
  }

  if (linkToViewAllOrders) {
    linkToViewAllOrders.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('purchase-orders');
    });
  }

  if (linkToFullInventory) {
    linkToFullInventory.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('inventory');
    });
  }

  const kpiSuppliersCard = document.getElementById('kpiSuppliers')?.closest('.kpi-card');
  if (kpiSuppliersCard) {
    kpiSuppliersCard.style.cursor = 'pointer';
    kpiSuppliersCard.addEventListener('click', () => switchView('suppliers'));
  }

  const kpiLowStockCard = document.getElementById('kpiLowStock')?.closest('.kpi-card');
  if (kpiLowStockCard) {
    kpiLowStockCard.style.cursor = 'pointer';
    kpiLowStockCard.addEventListener('click', () => switchView('inventory'));
  }

  if (navMessagesBtn) {
    navMessagesBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('messages');
    });
  }

  // Dashboard Quick Action Buttons
  const dashBillingPosBtn = document.getElementById('dashBillingPosBtn');
  const dashNewOrderBtn = document.getElementById('dashNewOrderBtn');
  const dashStockAuditBtn = document.getElementById('dashStockAuditBtn');
  const dashAuditReportBtn = document.getElementById('dashAuditReportBtn');

  if (dashBillingPosBtn) {
    dashBillingPosBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('billing-pos');
    });
  }

  if (dashNewOrderBtn) {
    dashNewOrderBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('purchase-orders');
    });
  }

  if (dashStockAuditBtn) {
    dashStockAuditBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('inventory');
    });
  }

  if (dashAuditReportBtn) {
    dashAuditReportBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('reports');
    });
  }
}

function switchView(viewName) {
  currentView = viewName;

  const dashboardView = document.getElementById('dashboardView');
  const messagesView = document.getElementById('messagesView');
  const medicinesView = document.getElementById('medicinesView');
  const expiryView = document.getElementById('expiryView');
  const categoriesView = document.getElementById('categoriesView');
  const suppliersView = document.getElementById('suppliersView');
  const inventoryView = document.getElementById('inventoryView');
  const purchaseOrdersView = document.getElementById('purchaseOrdersView');
  const billingPosView = document.getElementById('billingPosView');
  const salesHistoryView = document.getElementById('salesHistoryView');
  const usersRolesView = document.getElementById('usersRolesView');
  const reportsView = document.getElementById('reportsView');
  const notificationsView = document.getElementById('notificationsView');
  const navDashboardBtn = document.getElementById('navDashboardBtn');
  const navMessagesBtn = document.getElementById('navMessagesBtn');
  const navMedicinesBtn = document.getElementById('navMedicinesBtn');
  const navExpiryBtn = document.getElementById('navExpiryBtn');
  const navCategoriesBtn = document.getElementById('navCategoriesBtn');
  const navSuppliersBtn = document.getElementById('navSuppliersBtn');
  const navInventoryBtn = document.getElementById('navInventoryBtn');
  const navPurchaseOrdersBtn = document.getElementById('navPurchaseOrdersBtn');
  const navBillingPosBtn = document.getElementById('navBillingPosBtn');
  const navSalesHistoryBtn = document.getElementById('navSalesHistoryBtn');
  const navUsersRolesBtn = document.getElementById('navUsersRolesBtn');
  const navReportsBtn = document.getElementById('navReportsBtn');
  const navNotificationsBtn = document.getElementById('navNotificationsBtn');
  const topNavTitle = document.getElementById('topNavTitle');
  const topNavSubtitle = document.getElementById('topNavSubtitle');

  // Remove active from all nav items
  if (navDashboardBtn) navDashboardBtn.classList.remove('active');
  if (navMessagesBtn) navMessagesBtn.classList.remove('active');
  if (navMedicinesBtn) navMedicinesBtn.classList.remove('active');
  if (navExpiryBtn) navExpiryBtn.classList.remove('active');
  if (navCategoriesBtn) navCategoriesBtn.classList.remove('active');
  if (navSuppliersBtn) navSuppliersBtn.classList.remove('active');
  if (navInventoryBtn) navInventoryBtn.classList.remove('active');
  if (navPurchaseOrdersBtn) navPurchaseOrdersBtn.classList.remove('active');
  if (navBillingPosBtn) navBillingPosBtn.classList.remove('active');
  if (navSalesHistoryBtn) navSalesHistoryBtn.classList.remove('active');
  if (navUsersRolesBtn) navUsersRolesBtn.classList.remove('active');
  if (navReportsBtn) navReportsBtn.classList.remove('active');
  if (navNotificationsBtn) navNotificationsBtn.classList.remove('active');

  // Hide all views
  if (dashboardView) dashboardView.classList.remove('active-view');
  if (messagesView) messagesView.classList.remove('active-view');
  if (medicinesView) medicinesView.classList.remove('active-view');
  if (expiryView) expiryView.classList.remove('active-view');
  if (categoriesView) categoriesView.classList.remove('active-view');
  if (suppliersView) suppliersView.classList.remove('active-view');
  if (inventoryView) inventoryView.classList.remove('active-view');
  if (purchaseOrdersView) purchaseOrdersView.classList.remove('active-view');
  if (billingPosView) billingPosView.classList.remove('active-view');
  if (salesHistoryView) salesHistoryView.classList.remove('active-view');
  if (usersRolesView) usersRolesView.classList.remove('active-view');
  if (reportsView) reportsView.classList.remove('active-view');
  if (notificationsView) notificationsView.classList.remove('active-view');

  if (viewName === 'notifications') {
    window.scrollTo(0, 0);
    if (navNotificationsBtn) navNotificationsBtn.classList.add('active');
    if (notificationsView) notificationsView.classList.add('active-view');
    topNavTitle.textContent = 'Notifications';
    if (topNavSubtitle) topNavSubtitle.style.display = 'none';
    loadNotifications();
  } else if (viewName === 'reports') {
    window.scrollTo(0, 0);
    if (navReportsBtn) navReportsBtn.classList.add('active');
    if (reportsView) reportsView.classList.add('active-view');
    topNavTitle.textContent = 'Reports';
    if (topNavSubtitle) topNavSubtitle.style.display = 'none';
    loadReports();
  } else if (viewName === 'users-roles') {
    window.scrollTo(0, 0);
    if (navUsersRolesBtn) navUsersRolesBtn.classList.add('active');
    if (usersRolesView) usersRolesView.classList.add('active-view');
    topNavTitle.textContent = 'Users & Roles';
    if (topNavSubtitle) topNavSubtitle.style.display = 'none';
    loadUsersRoles();
  } else if (viewName === 'sales-history') {
    window.scrollTo(0, 0);
    if (navSalesHistoryBtn) navSalesHistoryBtn.classList.add('active');
    if (salesHistoryView) salesHistoryView.classList.add('active-view');
    topNavTitle.textContent = 'Sales History';
    if (topNavSubtitle) topNavSubtitle.style.display = 'none';
    loadSalesHistory();
  } else if (viewName === 'billing-pos') {
    if (navBillingPosBtn) navBillingPosBtn.classList.add('active');
    if (billingPosView) billingPosView.classList.add('active-view');
    topNavTitle.textContent = 'Billing / POS';
    if (topNavSubtitle) topNavSubtitle.style.display = 'none';
    refreshPosMedicines();
  } else if (viewName === 'purchase-orders') {
    if (navPurchaseOrdersBtn) navPurchaseOrdersBtn.classList.add('active');
    if (purchaseOrdersView) purchaseOrdersView.classList.add('active-view');
    topNavTitle.textContent = 'Parcel Tracker';
    if (topNavSubtitle) topNavSubtitle.style.display = 'none';
    loadPurchaseOrders();
  } else if (viewName === 'inventory') {
    if (navInventoryBtn) navInventoryBtn.classList.add('active');
    if (inventoryView) inventoryView.classList.add('active-view');
    topNavTitle.textContent = 'Inventory';
    if (topNavSubtitle) topNavSubtitle.style.display = 'none';
    loadInventoryMovements();
  } else if (viewName === 'medicines') {
    if (navMedicinesBtn) navMedicinesBtn.classList.add('active');
    if (medicinesView) medicinesView.classList.add('active-view');

    topNavTitle.textContent = 'Medicines';
    if (topNavSubtitle) topNavSubtitle.style.display = 'none';

    updateSupplierDropdowns();
    renderMedicinesTable();
  } else if (viewName === 'expiry') {
    window.scrollTo(0, 0);
    if (navExpiryBtn) navExpiryBtn.classList.add('active');
    if (expiryView) expiryView.classList.add('active-view');

    topNavTitle.textContent = 'Expiry';
    if (topNavSubtitle) topNavSubtitle.style.display = 'none';

    if (window.loadExpiryTelemetry) window.loadExpiryTelemetry();
  } else if (viewName === 'suppliers') {
    if (navSuppliersBtn) navSuppliersBtn.classList.add('active');
    if (suppliersView) suppliersView.classList.add('active-view');

    topNavTitle.textContent = 'Suppliers';
    if (topNavSubtitle) topNavSubtitle.style.display = 'none';

    renderSuppliersTable();
  } else if (viewName === 'categories') {
    if (navCategoriesBtn) navCategoriesBtn.classList.add('active');
    if (categoriesView) categoriesView.classList.add('active-view');

    topNavTitle.textContent = 'Categories';
    if (topNavSubtitle) topNavSubtitle.style.display = 'none';

    loadCategoriesData();
  } else if (viewName === 'messages') {
    if (navMessagesBtn) navMessagesBtn.classList.add('active');
    if (messagesView) messagesView.classList.add('active-view');

    topNavTitle.textContent = 'Direct Team Communications';
    if (topNavSubtitle) {
      topNavSubtitle.style.display = 'block';
      topNavSubtitle.textContent = 'Collaborate with clinical pharmacists, ward nurses, and verified pharmaceutical suppliers.';
    }

    fetchContacts();
  } else {
    if (navDashboardBtn) navDashboardBtn.classList.add('active');
    if (dashboardView) dashboardView.classList.add('active-view');

    topNavTitle.textContent = 'Pharmacy Clinical Operations';
    if (topNavSubtitle) {
      topNavSubtitle.style.display = 'block';
      topNavSubtitle.textContent = 'Real-time inventory valuation, stock safety buffers, and clinical procurement tracking.';
    }

    fetchDashboardData();
  }
}

/* ==========================================================================
   DASHBOARD STATS & REPOSITORY QUERIES
   ========================================================================== */
async function fetchDashboardData() {
  try {
    const res = await fetch(`${API_BASE_URL}/dashboard/stats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderDashboard(data);
  } catch (err) {
    console.warn("Spring Boot backend offline or restarting:", err);
    // Render clean initial state
    renderDashboard({
      totalMedicines: 0,
      inventoryValue: 0.00,
      purchaseOrdersCount: 0,
      suppliersCount: 0,
      lowStockCount: 0,
      stockStatus: { inStock: 0, inStockPercent: 0, lowStock: 0, lowStockPercent: 0, outOfStock: 0, outOfStockPercent: 0, message: "Awaiting database synchronization." },
      expiringSoon: { nearExpiryCount: 0, expiredCount: 0 },
      recentOrders: [],
      topMedicines: []
    });
  }
}

function renderDashboard(data) {
  // Top 5 KPI Metrics
  setText('kpiTotalMedicines', data.totalMedicines || 0);
  setText('kpiInventoryValue', '₹' + Number(data.inventoryValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  setText('kpiPurchaseOrders', data.purchaseOrdersCount || 0);
  setText('kpiSuppliers', data.suppliersCount || 0);
  setText('kpiLowStock', data.lowStockCount || 0);

  // Stock Status Donut Gauge
  const stock = data.stockStatus || {};
  setText('stockTotalCount', data.totalMedicines || 0);
  setText('stockInStockVal', `${stock.inStock || 0} (${stock.inStockPercent || 0}%)`);
  setText('stockLowStockVal', `${stock.lowStock || 0} (${stock.lowStockPercent || 0}%)`);
  setText('stockOutStockVal', `${stock.outOfStock || 0} (${stock.outOfStockPercent || 0}%)`);
  setText('stockStatusMsg', stock.message || "Database synchronized with MySQL repository.");

  const circle = document.getElementById('donutGreenCircle');
  if (circle) {
    const percent = stock.inStockPercent || 0;
    const offset = 283 - (283 * percent) / 100;
    circle.style.strokeDashoffset = (data.totalMedicines === 0) ? 283 : offset;
  }

  // Expiration Tracking
  const expiry = data.expiringSoon || {};
  setText('nearExpiryCount', expiry.nearExpiryCount || 0);
  setText('expiredCount', expiry.expiredCount || 0);

  // Procurement Orders Table
  const poBody = document.getElementById('recentPoTableBody');
  if (poBody) {
    if (!data.recentOrders || data.recentOrders.length === 0) {
      poBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-dim); padding: 30px 10px;">
            No procurement orders recorded yet. Use Quick Actions to draft a purchase order.
          </td>
        </tr>
      `;
    } else {
      poBody.innerHTML = data.recentOrders.map(po => `
        <tr>
          <td class="po-code">${escapeHtml(po.poNumber)}</td>
          <td>${escapeHtml(po.supplier)}</td>
          <td>${escapeHtml(po.date)}</td>
          <td class="price-text">₹${Number(po.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td><span class="po-status-badge status-${String(po.status).toLowerCase()}">${escapeHtml(po.status)}</span></td>
        </tr>
      `).join('');
    }
  }

  // Top Stocked Formularies
  const topBody = document.getElementById('topMedicinesTableBody');
  if (topBody) {
    if (!data.topMedicines || data.topMedicines.length === 0) {
      topBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-dim); padding: 25px 10px;">
            No inventory logged yet. Click "+ Add Medicine" to record your first batch.
          </td>
        </tr>
      `;
    } else {
      topBody.innerHTML = data.topMedicines.map(m => `
        <tr>
          <td style="color: var(--text-dim); font-weight: 600;">${m.rank}</td>
          <td>
            <span class="medicine-row-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
                <path d="m8.5 8.5 7 7"/>
              </svg>
            </span>
            <strong style="color: var(--text-main); font-weight: 500;">${escapeHtml(m.medicineName)}</strong>
          </td>
          <td style="font-weight: 700; color: #00e599;">${m.quantity}</td>
          <td style="color: var(--text-dim);">${escapeHtml(m.unit)}</td>
        </tr>
      `).join('');
    }
  }
}

/* ==========================================================================
   MESSAGES & INTERNAL COMMUNICATIONS
   ========================================================================== */
function initMessaging() {
  const searchInput = document.getElementById('contactSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderContactsList();
    });
  }

  const pills = document.querySelectorAll('.role-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeRoleFilter = pill.getAttribute('data-role');
      renderContactsList();
    });
  });

  const sendForm = document.getElementById('chatSendMessageForm');
  if (sendForm) {
    sendForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('chatMessageInput');
      const text = input.value.trim();
      if (!text || !activeContact) return;

      const payload = {
        senderId: 1, // Logged in MediStock Admin
        receiverId: activeContact.userId,
        messageText: text
      };

      try {
        const res = await fetch(`${API_BASE_URL}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const sentMessage = await res.json();
          appendChatMessage(sentMessage);
          input.value = '';

          activeContact.lastMessage = text;
          renderContactsList();
          showToast(`Message sent to ${activeContact.name}`, "success");
        } else {
          showToast("Failed to write message to MySQL database.", "error");
        }
      } catch (err) {
        console.error("Error communicating with message API:", err);
        showToast("Error connecting to database service.", "error");
      }
    });
  }
}

async function fetchContacts() {
  try {
    const res = await fetch(`${API_BASE_URL}/contacts?userId=1`);
    if (res.ok) {
      allContacts = await res.json();
    } else {
      allContacts = [];
    }
  } catch (err) {
    console.warn("Could not query contacts from MySQL:", err);
    allContacts = [];
  }

  if (!activeContact && allContacts.length > 0) {
    activeContact = allContacts[0];
  }

  renderContactsList();
  if (activeContact) {
    selectContact(activeContact.userId);
  }
}

function renderContactsList() {
  const container = document.getElementById('contactsList');
  if (!container) return;

  const searchVal = (document.getElementById('contactSearchInput')?.value || '').toLowerCase();

  const filtered = allContacts.filter(c => {
    const matchesRole = (activeRoleFilter === 'ALL') || (c.roleName === activeRoleFilter);
    const matchesSearch = c.name.toLowerCase().includes(searchVal) ||
                          (c.email && c.email.toLowerCase().includes(searchVal)) ||
                          c.roleName.toLowerCase().includes(searchVal);
    return matchesRole && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<li style="padding: 24px; text-align: center; color: var(--text-dim); font-size: 0.85rem;">No contacts matching query in users table.</li>`;
    return;
  }

  container.innerHTML = filtered.map(c => {
    const isSelected = activeContact && activeContact.userId === c.userId;
    const badgeClass = getRoleBadgeClass(c.roleName);

    return `
      <li class="contact-card ${isSelected ? 'selected' : ''}" onclick="selectContact(${c.userId})">
        <div class="avatar-wrapper">
          <div class="avatar-circle avatar-ra">${escapeHtml(c.initials)}</div>
          <span class="online-dot"></span>
        </div>
        <div class="contact-details">
          <div class="contact-name-row">
            <span class="contact-name">${escapeHtml(c.name)}</span>
            <span class="role-badge ${badgeClass}">${escapeHtml(c.roleName)}</span>
          </div>
          <div class="contact-subtext">${escapeHtml(c.lastMessage || 'Click to start conversation...')}</div>
        </div>
      </li>
    `;
  }).join('');
}

window.selectContact = async function(contactId) {
  const contact = allContacts.find(c => c.userId === contactId);
  if (!contact) return;
  activeContact = contact;

  renderContactsList();

  const avatarEl = document.getElementById('activeChatAvatar');
  avatarEl.className = 'avatar-circle avatar-ra';
  avatarEl.textContent = contact.initials;

  setText('activeChatName', contact.name);
  setText('activeChatMeta', `${contact.roleName} • ${contact.email || 'Internal User'}`);

  const input = document.getElementById('chatMessageInput');
  if (input) input.placeholder = `Draft message to ${contact.name}...`;

  await fetchConversation(contact.userId);
};

async function fetchConversation(contactId) {
  const messagesContainer = document.getElementById('chatMessagesBody');
  if (!messagesContainer) return;

  try {
    const res = await fetch(`${API_BASE_URL}/messages?userId=1&contactId=${contactId}`);
    if (res.ok) {
      const messages = await res.json();
      renderConversation(messages);
    } else {
      renderConversation([]);
    }
  } catch (err) {
    console.warn("Could not query messages from database:", err);
    renderConversation([]);
  }
}

function renderConversation(messages) {
  const container = document.getElementById('chatMessagesBody');
  if (!container) return;

  if (!messages || messages.length === 0) {
    container.innerHTML = `
      <div class="chat-empty-state" id="chatEmptyState">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <div class="empty-title">No previous communication history with ${escapeHtml(activeContact ? activeContact.name : 'this user')}.</div>
        <div class="empty-sub">Send a message to initiate collaboration.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = messages.map(m => `
    <div class="chat-bubble ${m.isOutgoing ? 'outgoing' : 'incoming'}">
      <div class="bubble-content">${escapeHtml(m.messageText)}</div>
      <div class="bubble-meta">${escapeHtml(m.sentAt)}</div>
    </div>
  `).join('');

  container.scrollTop = container.scrollHeight;
}

function appendChatMessage(msg) {
  const container = document.getElementById('chatMessagesBody');
  if (!container) return;

  const emptyState = document.getElementById('chatEmptyState');
  if (emptyState) emptyState.remove();

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${msg.isOutgoing ? 'outgoing' : 'incoming'}`;
  bubble.innerHTML = `
    <div class="bubble-content">${escapeHtml(msg.messageText)}</div>
    <div class="bubble-meta">${escapeHtml(msg.sentAt || 'Just now')}</div>
  `;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function getRoleBadgeClass(roleName) {
  switch ((roleName || '').toUpperCase()) {
    case 'ADMIN': return 'badge-admin';
    case 'PHARMACIST': return 'badge-pharmacist';
    case 'STAFF': return 'badge-staff';
    case 'SUPPLIER': return 'badge-supplier';
    default: return 'badge-staff';
  }
}

/* ==========================================================================
   MEDICINES CATALOG DATA & CONTROLS (IMAGES 1, 2, 3, 4, 5)
   ========================================================================== */

function initMedicinesCatalog() {
  // Search input live filtering
  const searchInput = document.getElementById('medSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeSearchQuery = e.target.value.trim().toLowerCase();
      renderMedicinesTable();
    });
  }

  // Keyboard shortcut hint (focus search)
  const shortcutHint = document.querySelector('.med-search-shortcut');
  if (shortcutHint && searchInput) {
    shortcutHint.addEventListener('click', () => {
      searchInput.focus();
    });
  }
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
      if (currentView === 'medicines' && searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    }
  });

  // Category Dropdown (Image 3)
  setupCustomDropdown('categoryDropdown', (val, label) => {
    activeCategoryFilter = val;
    const labelEl = document.getElementById('categoryDropdownLabel');
    if (labelEl) labelEl.textContent = label;
    renderMedicinesTable();
  });

  // Supplier Dropdown (Image 4)
  setupCustomDropdown('supplierDropdown', (val, label) => {
    activeSupplierFilter = val;
    const labelEl = document.getElementById('supplierDropdownLabel');
    if (labelEl) labelEl.textContent = label;
    renderMedicinesTable();
  });

  // Stock Status Dropdown (Image 5)
  setupCustomDropdown('stockStatusDropdown', (val, label) => {
    activeStockStatusFilter = val;
    const labelEl = document.getElementById('stockStatusDropdownLabel');
    if (labelEl) labelEl.textContent = label;
    renderMedicinesTable();
  });

  // Reset Filters Button
  const resetBtn = document.getElementById('medResetFiltersBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeSearchQuery = '';
      activeCategoryFilter = 'ALL';
      activeSupplierFilter = 'ALL';
      activeStockStatusFilter = 'ALL';
      activeSortColumn = 'name';
      activeSortDirection = 'asc';

      if (searchInput) searchInput.value = '';
      resetDropdownUI('categoryDropdown', 'All Categories', 'ALL');
      resetDropdownUI('supplierDropdown', 'All Suppliers', 'ALL');
      resetDropdownUI('stockStatusDropdown', 'All Stock Status', 'ALL');

      renderMedicinesTable();
      showToast("Filters restored to default view.", "info");
    });
  }

  // Sortable column headers
  const sortHeaders = document.querySelectorAll('.sortable-column');
  sortHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-sort');
      if (activeSortColumn === col) {
        activeSortDirection = activeSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        activeSortColumn = col;
        activeSortDirection = 'asc';
      }

      sortHeaders.forEach(h => {
        const arrow = h.querySelector('.sort-arrows');
        if (arrow) arrow.textContent = '↕';
      });

      const currentArrow = th.querySelector('.sort-arrows');
      if (currentArrow) {
        currentArrow.textContent = activeSortDirection === 'asc' ? '↑' : '↓';
      }

      renderMedicinesTable();
    });
  });

  // Add Medicine Button (Image 1 CTA -> Opens Image 2 Modal)
  const addBtn = document.getElementById('openAddNewMedicineBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      openAddMedicineModal(-1);
    });
  }

  // Bulk Set Sell Price Button
  const bulkBtn = document.getElementById('openBulkPriceModalBtn');
  const bulkModal = document.getElementById('bulkPriceModal');
  const closeBulkBtn = document.getElementById('closeBulkPriceBtn');
  const cancelBulkBtn = document.getElementById('cancelBulkPriceBtn');
  const bulkForm = document.getElementById('bulkPriceForm');

  if (bulkBtn && bulkModal) {
    bulkBtn.addEventListener('click', () => {
      bulkModal.classList.add('open');
    });
  }
  if (closeBulkBtn && bulkModal) {
    closeBulkBtn.addEventListener('click', () => bulkModal.classList.remove('open'));
  }
  if (cancelBulkBtn && bulkModal) {
    cancelBulkBtn.addEventListener('click', () => bulkModal.classList.remove('open'));
  }
  if (bulkModal) {
    bulkModal.addEventListener('click', (e) => {
      if (e.target === bulkModal) bulkModal.classList.remove('open');
    });
  }
  if (bulkForm && bulkModal) {
    bulkForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (await applyBulkSellPrice()) bulkModal.classList.remove('open');
    });
  }
  document.querySelectorAll('input[name="bulkPricingMode"]').forEach(input => {
    input.addEventListener('change', () => {
      const label = document.getElementById('bulkAdjustmentValueLabel');
      const isMarkup = document.querySelector('input[name="bulkPricingMode"]:checked')?.value === 'markup';
      if (label) label.textContent = isMarkup ? 'Markup percentage (%) *' : 'Flat selling price (INR) *';
    });
  });

  // Delete Confirmation Modal Wiring
  const deleteModal = document.getElementById('deleteConfirmModal');
  const closeDeleteBtn = document.getElementById('closeDeleteModalBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

  if (closeDeleteBtn && deleteModal) {
    closeDeleteBtn.addEventListener('click', () => deleteModal.classList.remove('open'));
  }
  if (cancelDeleteBtn && deleteModal) {
    cancelDeleteBtn.addEventListener('click', () => deleteModal.classList.remove('open'));
  }
  if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) deleteModal.classList.remove('open');
    });
  }
  if (confirmDeleteBtn && deleteModal) {
    confirmDeleteBtn.addEventListener('click', () => {
      if (deletingMedicineIndex !== null) {
        performDeleteMedicine(deletingMedicineIndex);
        deletingMedicineIndex = null;
      }
      deleteModal.classList.remove('open');
    });
  }
}

function setupCustomDropdown(dropdownId, onChangeCallback) {
  const container = document.getElementById(dropdownId);
  if (!container) return;

  const trigger = container.querySelector('.med-dropdown-trigger');
  const items = container.querySelectorAll('.med-dropdown-item');

  if (trigger) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close other dropdowns
      document.querySelectorAll('.med-dropdown').forEach(d => {
        if (d !== container) d.classList.remove('open');
      });
      container.classList.toggle('open');
    });
  }

  items.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = item.getAttribute('data-val');
      const label = item.textContent.trim();

      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      container.classList.remove('open');
      if (onChangeCallback) onChangeCallback(val, label);
    });
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      container.classList.remove('open');
    }
  });
}

function resetDropdownUI(dropdownId, defaultLabel, defaultValue) {
  const container = document.getElementById(dropdownId);
  if (!container) return;
  const labelEl = container.querySelector('.med-dropdown-trigger span');
  if (labelEl) labelEl.textContent = defaultLabel;

  const items = container.querySelectorAll('.med-dropdown-item');
  items.forEach(i => {
    if (i.getAttribute('data-val') === defaultValue) {
      i.classList.add('active');
    } else {
      i.classList.remove('active');
    }
  });
}

function loadMedicinesData(forceRefresh = false) {
  const tableBody = document.getElementById('medicinesTableBody');
  if (tableBody) tableBody.innerHTML = '<tr><td colspan="11" class="med-empty-cell">Loading medicines from the database…</td></tr>';

  return fetch(`${API_BASE_URL}/medicines`, { headers: { Accept: 'application/json' } })
    .then(async response => {
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || `Unable to load medicines (HTTP ${response.status}).`);
      }
      return response.json();
    })
    .then(rows => {
      if (!Array.isArray(rows)) throw new Error('The medicines API returned an unexpected response.');
      allMedicines = rows.map(medicine => ({
        medicineId: medicine.medicineId,
        batchId: medicine.batchId,
        code: medicine.medicineCode || `MED-${String(medicine.medicineId).padStart(4, '0')}`,
        name: medicine.medicineName,
        genericName: medicine.genericName,
        manufacturer: medicine.manufacturer,
        category: medicine.category,
        dosage: medicine.dosage,
        buyPrice: medicine.purchasePrice,
        sellPrice: medicine.sellingPrice,
        stock: medicine.quantity ?? 0,
        reorderLevel: medicine.reorderLevel ?? 10,
        expiryDate: medicine.expiryDate,
        supplier: medicine.supplierName,
        supplierContactPerson: medicine.supplierContactPerson,
        supplierContactNumber: medicine.supplierContactNumber,
        supplierEmail: medicine.supplierEmail,
        supplierId: medicine.supplierId == null ? '' : String(medicine.supplierId),
        batchNo: medicine.batchNumber,
        rack: medicine.rackLocation,
        prescriptionRequired: medicine.prescriptionRequired
      }));
      renderMedicinesTable();
      updateSupplierDropdowns();
      syncDashboardMetrics();
    })
    .catch(error => {
      allMedicines = [];
      renderMedicinesTable();
      syncDashboardMetrics();
      showToast(error.message || 'Could not load medicines from the database.', 'error');
    });
}

function saveMedicinesToStorage() {
  syncDashboardMetrics();
}

function computeStockStatus(quantity, reorderLevel, expiryDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (expiryDateStr) {
    const expDate = new Date(expiryDateStr);
    if (expDate < today) return 'EXPIRED';

    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    if (expDate <= thirtyDaysLater) return 'NEAR_EXPIRY';
  }

  const qty = Number(quantity || 0);
  const reorder = Number(reorderLevel || 10);

  if (qty <= 0) return 'OUT_OF_STOCK';
  if (qty <= reorder) return 'LOW_STOCK';
  return 'AVAILABLE';
}

function renderMedicinesTable() {
  const tableBody = document.getElementById('medicinesTableBody');
  if (!tableBody) return;

  const query = activeSearchQuery.toLowerCase();

  // Filter medicines
  let filtered = allMedicines.filter(m => {
    // Search match
    const matchQuery = !query ||
      (m.name && m.name.toLowerCase().includes(query)) ||
      (m.code && m.code.toLowerCase().includes(query)) ||
      (m.genericName && m.genericName.toLowerCase().includes(query)) ||
      (m.category && m.category.toLowerCase().includes(query)) ||
      (m.manufacturer && m.manufacturer.toLowerCase().includes(query));

    // Category match
    const matchCat = (activeCategoryFilter === 'ALL') || (m.category === activeCategoryFilter);

    // Supplier match
    const matchSupplier = (activeSupplierFilter === 'ALL')
      || String(m.supplierId || '') === String(activeSupplierFilter);

    // Stock Status match
    const currentStatus = computeStockStatus(m.stock, m.reorderLevel, m.expiryDate);
    const matchStatus = (activeStockStatusFilter === 'ALL') || (currentStatus === activeStockStatusFilter);

    return matchQuery && matchCat && matchSupplier && matchStatus;
  });

  // Sort medicines
  filtered.sort((a, b) => {
    let valA, valB;
    switch (activeSortColumn) {
      case 'name':
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
        break;
      case 'category':
        valA = (a.category || '').toLowerCase();
        valB = (b.category || '').toLowerCase();
        break;
      case 'stock':
        valA = Number(a.stock || 0);
        valB = Number(b.stock || 0);
        break;
      case 'expiry':
        valA = new Date(a.expiryDate || '2099-01-01').getTime();
        valB = new Date(b.expiryDate || '2099-01-01').getTime();
        break;
      default:
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
    }

    if (valA < valB) return activeSortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return activeSortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Update counters
  setText('showingMedCount', filtered.length);
  setText('totalMedCount', allMedicines.length);

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="11" class="med-empty-cell">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="40" height="40" style="margin: 0 auto; display: block; color: var(--text-dim);">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <p>No medicines found matching the selected filters.</p>
          <button class="btn-toolbar-ghost" style="margin: 14px auto 0; display: inline-flex;" onclick="document.getElementById('medResetFiltersBtn')?.click()">
            Clear Filters &amp; Reset
          </button>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map((m, rowNumber) => {
    const originalIndex = allMedicines.indexOf(m);
    const status = computeStockStatus(m.stock, m.reorderLevel, m.expiryDate);

    // Format Code for Circle Badge (similar to stacked ME D- 302 2 in reference Image 1)
    const codeStr = m.code || 'MED-0000';
    const codeParts = formatCodeForBadge(codeStr);

    // Status Pill Class & Label
    const statusClass = getStatusClass(status);
    const statusLabel = formatStatusLabel(status);

    return `
      <tr data-index="${originalIndex}">
        <td class="med-row-number">${rowNumber + 1}</td>
        <td>
          <div class="med-code-circle" title="Formulary Code: ${escapeHtml(codeStr)}">
            ${codeParts}
          </div>
        </td>
        <td>
          <span class="med-brand-title">${escapeHtml(m.name)}</span>
          <span class="med-mfr-subtitle">${escapeHtml(m.manufacturer || 'Manufacturer not recorded')}</span>
        </td>
        <td>
          <span class="med-formula-text">${escapeHtml(m.genericName || 'Formula not specified')}</span>
        </td>
        <td>
          <span class="med-category-text">${escapeHtml(m.category || '—')}</span>
        </td>
        <td>
          <div class="price-stack">
            <span class="price-buy">Buy: ₹${Number(m.buyPrice || 0).toFixed(2)}</span>
            <span class="price-sell">Sell: ₹${Number(m.sellPrice || 0).toFixed(2)}</span>
          </div>
        </td>
        <td>
          <span class="stock-units">${m.stock} unit(s)</span>
        </td>
        <td>
          <div class="status-badge-stack">
            <span class="status-pill ${statusClass}">${statusLabel}</span>
          </div>
        </td>
        <td>
          <span class="med-expiry-text">${escapeHtml(m.expiryDate || 'N/A')}</span>
        </td>
        <td>
          <div class="med-supplier-block">
            <span class="med-supplier-title">${escapeHtml(m.supplier || '—')}</span>
            <span class="med-supplier-badge">${escapeHtml(m.supplierContactPerson || m.supplierEmail || m.supplierContactNumber || 'Contact not recorded')}</span>
          </div>
        </td>
        <td style="text-align: center;">
          <div class="action-buttons-group">
            <button class="table-action-btn btn-edit" title="Edit Medicine" onclick="openAddMedicineModal(${m.medicineId})" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="table-action-btn btn-delete" title="Delete Medicine" onclick="promptDeleteMedicine(${m.medicineId})" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function formatCodeForBadge(code) {
  // e.g. "MED-1011" -> ME / D- / 101 / 1
  if (code.length >= 7) {
    const p1 = code.substring(0, 2);
    const p2 = code.substring(2, 4);
    const p3 = code.substring(4, 7);
    const p4 = code.substring(7);
    return `<span>${escapeHtml(p1)}</span><span>${escapeHtml(p2)}</span><span>${escapeHtml(p3)}</span>${p4 ? `<span>${escapeHtml(p4)}</span>` : ''}`;
  }
  return `<span>${escapeHtml(code)}</span>`;
}

function getStatusClass(status) {
  switch (status) {
    case 'AVAILABLE': return 'available';
    case 'EXPIRED': return 'expired';
    case 'LOW_STOCK': return 'low-stock';
    case 'OUT_OF_STOCK': return 'out-of-stock';
    case 'NEAR_EXPIRY': return 'near-expiry';
    default: return 'available';
  }
}

function formatStatusLabel(status) {
  switch (status) {
    case 'AVAILABLE': return 'AVAILABLE';
    case 'EXPIRED': return 'EXPIRED';
    case 'LOW_STOCK': return 'LOW STOCK';
    case 'OUT_OF_STOCK': return 'OUT OF STOCK';
    case 'NEAR_EXPIRY': return 'NEAR EXPIRY';
    default: return 'AVAILABLE';
  }
}

/* ==========================================================================
   IMAGE 2: ADD / EDIT MEDICINE MODAL CONTROLS
   ========================================================================== */
window.openAddMedicineModal = function(identifier = -1) {
  const modal = document.getElementById('addMedicineModal');
  const title = document.getElementById('medicineModalTitle');
  const form = document.getElementById('addMedicineForm');
  const indexInput = document.getElementById('editMedicineIndex');

  if (!modal || !form) return;

  const med = allMedicines.find(item => item.medicineId === Number(identifier)) || allMedicines[identifier];

  if (med) {
    const editIndex = allMedicines.indexOf(med);
    if (title) title.textContent = 'Edit Medicine Details';
    if (indexInput) indexInput.value = editIndex;

    document.getElementById('inputMedName').value = med.name || '';
    document.getElementById('inputMedCode').value = med.code || '';
    document.getElementById('inputGenericName').value = med.genericName || '';
    document.getElementById('inputManufacturer').value = med.manufacturer || '';
    document.getElementById('inputPurchasePrice').value = med.buyPrice || '';
    document.getElementById('inputSellingPrice').value = med.sellPrice || '';
    document.getElementById('inputExpiryDate').value = med.expiryDate || '';
    const category = allCategories.find(item => item.categoryName === med.category);
    document.getElementById('inputCategory').value = category ? String(category.categoryId) : '';
    document.getElementById('inputBatchNo').value = med.batchNo || '';
    document.getElementById('inputRack').value = med.rack || '';
    document.getElementById('inputSupplier').value = med.supplierId || '';
    document.getElementById('inputReorderLevel').value = med.reorderLevel !== undefined ? med.reorderLevel : 10;
    document.getElementById('inputQuantity').value = med.stock !== undefined ? med.stock : 0;
    document.getElementById('inputPrescription').checked = !!med.prescriptionRequired;

    const saveBtn = document.getElementById('saveMedicineBtn');
    if (saveBtn) saveBtn.textContent = 'Update Medicine';
  } else {
    if (title) title.textContent = 'Add New Medicine';
    if (indexInput) indexInput.value = -1;
    form.reset();

    // Auto-generate next code
    const nextCode = getNextMedicineCode();
    document.getElementById('inputMedCode').value = nextCode;
    document.getElementById('inputBatchNo').value = `BATCH-${new Date().getFullYear()}-${nextCode.slice(4)}`;
    document.getElementById('inputReorderLevel').value = '10';
    document.getElementById('inputQuantity').value = '50';
    document.getElementById('inputPurchasePrice').value = '35.00';
    document.getElementById('inputSellingPrice').value = '45.00';

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    document.getElementById('inputExpiryDate').value = futureDate.toISOString().split('T')[0];
    document.getElementById('inputCategory').value = allCategories.length
      ? String(allCategories[0].categoryId)
      : '';
    document.getElementById('inputSupplier').value = '';

    const saveBtn = document.getElementById('saveMedicineBtn');
    if (saveBtn) saveBtn.textContent = 'Save Medicine';
  }

  modal.classList.add('open');
};

function getNextMedicineCode() {
  const usedNumbers = new Set(allMedicines
    .map(medicine => /^MED-(\d+)$/i.exec(medicine.code || ''))
    .filter(match => match && Number.isSafeInteger(Number(match[1])))
    .map(match => Number(match[1])));
  let number = 1;
  while (usedNumbers.has(number)) {
    number++;
  }
  return `MED-${String(number).padStart(4, '0')}`;
}

window.promptDeleteMedicine = function(identifier) {
  const med = allMedicines.find(item => item.medicineId === Number(identifier)) || allMedicines[identifier];
  if (!med) return;
  deletingMedicineIndex = allMedicines.indexOf(med);
  const nameEl = document.getElementById('deleteTargetMedName');
  if (nameEl) nameEl.textContent = `"${med.name}" (${med.code})`;

  const modal = document.getElementById('deleteConfirmModal');
  if (modal) modal.classList.add('open');
};

async function performDeleteMedicine(index) {
  if (index < 0 || index >= allMedicines.length) return;
  const medicine = allMedicines[index];
  try {
    const response = await fetch(`${API_BASE_URL}/medicines/${medicine.medicineId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Unable to delete medicine.'));
    await loadMedicinesData(true);
    fetchDashboardData();
    if (window.loadExpiryTelemetry) window.loadExpiryTelemetry();
    showToast(`Medicine "${medicine.name}" removed successfully from database.`, "success");
  } catch (error) {
    showToast(error.message || 'Could not delete medicine from the database.', 'error');
  }
}

async function applyBulkSellPrice() {
  const supplierId = document.getElementById('bulkTargetSupplier')?.value;
  const pricingMode = document.querySelector('input[name="bulkPricingMode"]:checked')?.value;
  const value = Number(document.getElementById('bulkAdjustmentValue')?.value);
  if (!supplierId || !Number.isFinite(value) || value < 0) {
    showToast('Choose a supplier and enter a non-negative price value.', 'error');
    return false;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/medicines/prices/by-supplier`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplierId: Number(supplierId), pricingMode, value })
    });
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Unable to update selling prices.'));
    const result = await response.json();
    await loadMedicinesData(true);
    fetchDashboardData();
    showToast(`Selling prices updated for ${result.updatedBatches} batch(es).`, 'success');
    return true;
  } catch (error) {
    showToast(error.message || 'Could not update selling prices in the database.', 'error');
    return false;
  }
}

function syncDashboardMetrics() {
  // Recalculate KPIs based on current medicines array
  const total = allMedicines.length;
  let totalVal = 0;
  let lowStockCount = 0;
  let outStockCount = 0;
  let inStockCount = 0;
  let expiredCount = 0;
  let nearExpiryCount = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  allMedicines.forEach(m => {
    const qty = Number(m.stock || 0);
    const buy = Number(m.buyPrice || 0);
    totalVal += (qty * buy);

    const st = computeStockStatus(qty, m.reorderLevel, m.expiryDate);
    if (st === 'EXPIRED') expiredCount++;
    else if (st === 'NEAR_EXPIRY') nearExpiryCount++;
    else if (st === 'OUT_OF_STOCK') outStockCount++;
    else if (st === 'LOW_STOCK') lowStockCount++;
    else inStockCount++;
  });

  setText('kpiTotalMedicines', total);
  setText('kpiInventoryValue', '₹' + totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  setText('kpiLowStock', lowStockCount);
  setText('stockTotalCount', total);

  const totalStatus = inStockCount + lowStockCount + outStockCount + expiredCount + nearExpiryCount;
  const inStockPct = totalStatus > 0 ? Math.round((inStockCount / totalStatus) * 100) : 0;
  const lowStockPct = totalStatus > 0 ? Math.round((lowStockCount / totalStatus) * 100) : 0;
  const outStockPct = totalStatus > 0 ? Math.round((outStockCount / totalStatus) * 100) : 0;

  setText('stockInStockVal', `${inStockCount} (${inStockPct}%)`);
  setText('stockLowStockVal', `${lowStockCount} (${lowStockPct}%)`);
  setText('stockOutStockVal', `${outStockCount} (${outStockPct}%)`);
  setText('nearExpiryCount', nearExpiryCount);
  setText('expiredCount', expiredCount);

  const circle = document.getElementById('donutGreenCircle');
  if (circle) {
    const offset = 283 - (283 * inStockPct) / 100;
    circle.style.strokeDashoffset = (total === 0) ? 283 : offset;
  }
}

function initModals() {
  const modal = document.getElementById('addMedicineModal');
  const openDashboardBtn = document.getElementById('openAddMedicineModalBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelModalBtn');
  const form = document.getElementById('addMedicineForm');

  if (openDashboardBtn) {
    openDashboardBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openAddMedicineModal(-1);
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  if (cancelBtn && modal) {
    cancelBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const editIdx = parseInt(document.getElementById('editMedicineIndex').value, 10);
      const name = document.getElementById('inputMedName').value.trim();
      const code = document.getElementById('inputMedCode').value.trim();
      const genericName = document.getElementById('inputGenericName').value.trim();
      const manufacturer = document.getElementById('inputManufacturer').value.trim();
      const buyPrice = Number(document.getElementById('inputPurchasePrice').value || 0);
      const sellPrice = Number(document.getElementById('inputSellingPrice').value);
      const expiryDate = document.getElementById('inputExpiryDate').value;
      const categoryId = Number(document.getElementById('inputCategory').value);
      const categoryRecord = allCategories.find(item => item.categoryId === categoryId);
      const batchNo = document.getElementById('inputBatchNo').value.trim();
      const rack = document.getElementById('inputRack').value.trim();
      const supplierId = document.getElementById('inputSupplier').value;
      const reorderLevel = Number(document.getElementById('inputReorderLevel').value || 0);
      const stock = Number(document.getElementById('inputQuantity').value || 0);
      const prescriptionRequired = document.getElementById('inputPrescription').checked;
      const supplierRecord = allSuppliers.find(item => String(item.supplierId) === supplierId);
      const payload = {
        medicineName: name,
        medicineCode: code,
        genericName,
        manufacturer,
        category: categoryRecord?.categoryName,
        categoryId: categoryRecord?.categoryId,
        prescriptionRequired,
        supplierId: supplierRecord?.supplierId,
        batchId: editIdx >= 0 ? allMedicines[editIdx]?.batchId : undefined,
        batchNumber: batchNo,
        quantity: stock,
        reorderLevel,
        purchasePrice: buyPrice,
        sellingPrice: sellPrice,
        expiryDate,
        rackLocation: rack
      };

      const saveButton = document.getElementById('saveMedicineBtn');
      if (saveButton) saveButton.disabled = true;
      try {
        const isEditing = editIdx >= 0 && allMedicines[editIdx];
        const endpoint = isEditing
          ? `${API_BASE_URL}/medicines/${allMedicines[editIdx].medicineId}`
          : `${API_BASE_URL}/medicines`;
        const response = await fetch(endpoint, {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          throw new Error(await getApiErrorMessage(response, 'Unable to save medicine.'));
        }

        await loadMedicinesData(true);
        fetchDashboardData();
        modal.classList.remove('open');
        form.reset();
        showToast(`Medicine "${name}" ${isEditing ? 'updated' : 'saved'} in the database.`, 'success');
      } catch (error) {
        showToast(error.message || 'Could not save medicine to the database.', 'error');
      } finally {
        if (saveButton) saveButton.disabled = false;
      }
    });
  }
}

function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
    });
  }
}

function initUserProfileDropdown() {
  const pillBtn = document.getElementById('userProfilePillBtn');
  const dropdownMenu = document.getElementById('userDropdownMenu');
  const myProfileBtn = document.getElementById('menuMyProfileBtn');
  const logoutBtn = document.getElementById('menuLogoutBtn');
  const profileModal = document.getElementById('profileModal');
  const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
  const confirmProfileCloseBtn = document.getElementById('confirmProfileCloseBtn');

  if (pillBtn && dropdownMenu) {
    pillBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdownMenu.classList.contains('show');
      if (isOpen) {
        dropdownMenu.classList.remove('show');
        pillBtn.classList.remove('active');
        pillBtn.setAttribute('aria-expanded', 'false');
      } else {
        dropdownMenu.classList.add('show');
        pillBtn.classList.add('active');
        pillBtn.setAttribute('aria-expanded', 'true');
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdownMenu.contains(e.target) && !pillBtn.contains(e.target)) {
        dropdownMenu.classList.remove('show');
        pillBtn.classList.remove('active');
        pillBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdownMenu.classList.remove('show');
        pillBtn.classList.remove('active');
        pillBtn.setAttribute('aria-expanded', 'false');
        if (profileModal) profileModal.classList.remove('open');
      }
    });
  }

  // My Profile Click -> opens modal
  if (myProfileBtn && profileModal) {
    myProfileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      dropdownMenu.classList.remove('show');
      pillBtn.classList.remove('active');
      profileModal.classList.add('open');
    });
  }

  // Close profile modal buttons
  if (closeProfileModalBtn && profileModal) {
    closeProfileModalBtn.addEventListener('click', () => {
      profileModal.classList.remove('open');
    });
  }
  if (confirmProfileCloseBtn && profileModal) {
    confirmProfileCloseBtn.addEventListener('click', () => {
      profileModal.classList.remove('open');
    });
  }
  if (profileModal) {
    profileModal.addEventListener('click', (e) => {
      if (e.target === profileModal) profileModal.classList.remove('open');
    });
  }

  // Logout Click
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      dropdownMenu.classList.remove('show');
      pillBtn.classList.remove('active');
      showToast("Logging out... Session terminated.", "info");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ==========================================================================
   MEDICINE CATEGORY MANAGEMENT
   ========================================================================== */

function initCategoryCatalog() {
  const searchInput = document.getElementById('categorySearchInput');
  const addButton = document.getElementById('openAddCategoryBtn');
  const tableBody = document.getElementById('categoriesTableBody');
  const form = document.getElementById('categoryForm');
  const modal = document.getElementById('categoryModal');
  const deleteModal = document.getElementById('deleteCategoryModal');

  searchInput?.addEventListener('input', () => {
    activeCategorySearchQuery = searchInput.value.trim().toLowerCase();
    renderCategoriesTable();
  });

  addButton?.addEventListener('click', () => openCategoryModal());
  tableBody?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category-action]');
    if (!button) return;
    const categoryId = Number(button.dataset.categoryId);
    const category = allCategories.find(item => item.categoryId === categoryId);
    if (!category) return;
    if (button.dataset.categoryAction === 'edit') openCategoryModal(category);
    if (button.dataset.categoryAction === 'delete') openDeleteCategoryModal(category);
  });

  form?.addEventListener('submit', handleSaveCategory);
  document.getElementById('closeCategoryModalBtn')?.addEventListener('click', closeCategoryModal);
  document.getElementById('cancelCategoryBtn')?.addEventListener('click', closeCategoryModal);
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeCategoryModal();
  });

  document.getElementById('closeDeleteCategoryBtn')?.addEventListener('click', closeDeleteCategoryModal);
  document.getElementById('cancelDeleteCategoryBtn')?.addEventListener('click', closeDeleteCategoryModal);
  document.getElementById('confirmDeleteCategoryBtn')?.addEventListener('click', handleDeleteCategory);
  deleteModal?.addEventListener('click', (event) => {
    if (event.target === deleteModal) closeDeleteCategoryModal();
  });
}

async function loadCategoriesData() {
  const tableBody = document.getElementById('categoriesTableBody');
  if (tableBody) {
    tableBody.innerHTML = '<tr><td colspan="4" class="category-empty-state">Loading medicine categories…</td></tr>';
  }
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error(`Unable to load categories (HTTP ${response.status}).`);
    allCategories = await response.json();
    updateMedicineCategoryDropdowns();
    renderCategoriesTable();
  } catch (error) {
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="4" class="category-empty-state">Could not load categories. Check the backend connection and try refreshing.</td></tr>';
    }
    showToast(error.message || 'Could not load categories from the database.', 'error');
  }
}

function updateMedicineCategoryDropdowns() {
  const categoryNames = allCategories.map(category => category.categoryName);
  const select = document.getElementById('inputCategory');
  if (select) {
    const selected = select.value;
    select.innerHTML = allCategories.length
      ? allCategories.map(category => `<option value="${category.categoryId}">${escapeHtml(category.categoryName)}</option>`).join('')
      : '<option value="" selected disabled>No categories in database</option>';
    if (allCategories.some(category => String(category.categoryId) === selected)) {
      select.value = selected;
    } else if (allCategories.length) {
      select.value = String(allCategories[0].categoryId);
    }
  }

  const menu = document.getElementById('categoryDropdownMenu');
  if (!menu) return;
  if (activeCategoryFilter !== 'ALL' && !categoryNames.includes(activeCategoryFilter)) {
    activeCategoryFilter = 'ALL';
    const label = document.getElementById('categoryDropdownLabel');
    if (label) label.textContent = 'All Categories';
  }
  menu.innerHTML = `<div class="med-dropdown-item ${activeCategoryFilter === 'ALL' ? 'active' : ''}" data-val="ALL" role="option">All Categories</div>` +
    categoryNames.map(name => `<div class="med-dropdown-item ${activeCategoryFilter === name ? 'active' : ''}" data-val="${escapeHtml(name)}" role="option">${escapeHtml(name)}</div>`).join('');
  menu.querySelectorAll('.med-dropdown-item').forEach(item => {
    item.addEventListener('click', event => {
      event.stopPropagation();
      menu.querySelectorAll('.med-dropdown-item').forEach(option => option.classList.remove('active'));
      item.classList.add('active');
      document.getElementById('categoryDropdown')?.classList.remove('open');
      activeCategoryFilter = item.dataset.val;
      const label = document.getElementById('categoryDropdownLabel');
      if (label) label.textContent = item.textContent.trim();
      renderMedicinesTable();
    });
  });
}

function renderCategoriesTable() {
  const tableBody = document.getElementById('categoriesTableBody');
  if (!tableBody) return;

  const query = activeCategorySearchQuery;
  const filtered = allCategories.filter(category =>
    !query ||
    (category.categoryName || '').toLowerCase().includes(query) ||
    (category.description || '').toLowerCase().includes(query)
  );

  setText('showingCategoryCount', filtered.length);
  setText('totalCategoryCount', allCategories.length);
  if (!filtered.length) {
    const message = query ? 'No categories match your search.' : 'No medicine categories have been added yet.';
    tableBody.innerHTML = `<tr><td colspan="4" class="category-empty-state">${message}</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered.map((category, index) => `
    <tr>
      <td class="category-id-cell">#${index + 1}</td>
      <td class="category-name-cell">${escapeHtml(category.categoryName)}</td>
      <td class="category-description-cell">${escapeHtml(category.description || '—')}</td>
      <td class="category-row-actions">
        <button type="button" class="category-icon-btn" data-category-action="edit" data-category-id="${category.categoryId}" aria-label="Edit ${escapeHtml(category.categoryName)}" title="Edit category">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"></path>
          </svg>
        </button>
        <button type="button" class="category-icon-btn" data-category-action="delete" data-category-id="${category.categoryId}" aria-label="Delete ${escapeHtml(category.categoryName)}" title="Delete category">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="m19 6-1 14H6L5 6"></path><path d="M10 11v5M14 11v5"></path>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

function openCategoryModal(category = null) {
  const form = document.getElementById('categoryForm');
  if (!form) return;
  form.reset();
  document.getElementById('editCategoryId').value = category?.categoryId || '';
  document.getElementById('categoryNameInput').value = category?.categoryName || '';
  document.getElementById('categoryDescriptionInput').value = category?.description || '';
  setText('categoryModalTitle', category ? 'Edit Category' : 'Create Category');
  setText('saveCategoryBtn', category ? 'Save Changes' : 'Save Category');
  document.getElementById('categoryModal').classList.add('open');
  document.getElementById('categoryNameInput').focus();
}

function closeCategoryModal() {
  document.getElementById('categoryModal')?.classList.remove('open');
}

function openDeleteCategoryModal(category) {
  deletingCategoryId = category.categoryId;
  setText('deleteCategoryName', category.categoryName);
  document.getElementById('deleteCategoryModal')?.classList.add('open');
}

function closeDeleteCategoryModal() {
  document.getElementById('deleteCategoryModal')?.classList.remove('open');
  deletingCategoryId = null;
}

async function getCategoryError(response) {
  try {
    const data = await response.json();
    return data.detail || data.message || `Request failed (HTTP ${response.status}).`;
  } catch {
    return `Request failed (HTTP ${response.status}).`;
  }
}

async function handleSaveCategory(event) {
  event.preventDefault();
  const nameInput = document.getElementById('categoryNameInput');
  const categoryName = nameInput.value.trim();
  if (!categoryName) {
    nameInput.focus();
    return;
  }

  const id = document.getElementById('editCategoryId').value;
  const payload = {
    categoryName,
    description: document.getElementById('categoryDescriptionInput').value.trim() || null
  };

  try {
    const response = await fetch(id
      ? `${API_BASE_URL}/categories/${encodeURIComponent(id)}`
      : `${API_BASE_URL}/categories`, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await getCategoryError(response));

    const savedCategory = await response.json();
    const existingIndex = allCategories.findIndex(category => category.categoryId === savedCategory.categoryId);
    if (existingIndex >= 0) allCategories[existingIndex] = savedCategory;
    else allCategories.push(savedCategory);
    allCategories.sort((a, b) => a.categoryId - b.categoryId);
    updateMedicineCategoryDropdowns();
    renderCategoriesTable();
    closeCategoryModal();
    showToast(`Category "${savedCategory.categoryName}" saved to the database.`, 'success');
  } catch (error) {
    showToast(error.message || 'Could not save the category.', 'error');
  }
}

async function handleDeleteCategory() {
  if (deletingCategoryId === null) return;
  try {
    const response = await fetch(`${API_BASE_URL}/categories/${encodeURIComponent(deletingCategoryId)}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error(await getCategoryError(response));
    allCategories = allCategories.filter(category => category.categoryId !== deletingCategoryId);
    updateMedicineCategoryDropdowns();
    renderCategoriesTable();
    closeDeleteCategoryModal();
    showToast('Category deleted from the database.', 'success');
  } catch (error) {
    showToast(error.message || 'Could not delete the category.', 'error');
  }
}

/* ==========================================================================
   SUPPLIERS MANAGEMENT (MATCHING REFERENCE IMAGE 1 & 2)
   & DYNAMIC SYNCHRONIZATION WITH MEDICINES PAGE DROPDOWNS
   ========================================================================== */

function initSuppliersCatalog() {
  const searchInput = document.getElementById('supplierSearchInput');
  const modal = document.getElementById('addSupplierModal');
  const form = document.getElementById('addSupplierForm');
  const deleteModal = document.getElementById('deleteSupplierModal');

  searchInput?.addEventListener('input', () => {
    activeSupplierSearchQuery = searchInput.value.trim().toLowerCase();
    renderSuppliersTable();
  });
  document.getElementById('openAddSupplierModalBtn')?.addEventListener('click', () => openAddSupplierModal());
  document.getElementById('suppliersTableBody')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-supplier-action]');
    if (!button) return;
    const supplierId = Number(button.dataset.supplierId);
    if (button.dataset.supplierAction === 'edit') openAddSupplierModal(supplierId);
    if (button.dataset.supplierAction === 'delete') promptDeleteSupplier(supplierId);
  });

  form?.addEventListener('submit', handleSaveSupplier);
  document.getElementById('closeSupplierModalBtn')?.addEventListener('click', closeSupplierModal);
  document.getElementById('cancelSupplierModalBtn')?.addEventListener('click', closeSupplierModal);
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeSupplierModal();
  });
  document.getElementById('closeDeleteSupplierModalBtn')?.addEventListener('click', closeDeleteSupplierModal);
  document.getElementById('cancelDeleteSupplierBtn')?.addEventListener('click', closeDeleteSupplierModal);
  document.getElementById('confirmDeleteSupplierBtn')?.addEventListener('click', handleDeleteSupplier);
  deleteModal?.addEventListener('click', (event) => {
    if (event.target === deleteModal) closeDeleteSupplierModal();
  });
}

async function loadSuppliersData() {
  const tbody = document.getElementById('suppliersTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="supplier-empty-state">Loading suppliers…</td></tr>';
  try {
    const response = await fetch(`${API_BASE_URL}/suppliers`);
    if (!response.ok) throw new Error(await getSupplierError(response));
    allSuppliers = (await response.json()).sort((a, b) => a.supplierId - b.supplierId);
    setText('kpiSuppliers', allSuppliers.length);
    renderSuppliersTable();
    updateSupplierDropdowns();
  } catch (error) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="supplier-empty-state">Could not load suppliers from the database. Check the backend connection and try again.</td></tr>';
    showToast(error.message || 'Could not load suppliers from the database.', 'error');
  }
}

/**
 * DYNAMIC SYNCHRONIZATION:
 * Automatically synchronizes any newly added, edited, or deleted supplier
 * into both Medicines page drop box sections:
 *  1. The toolbar filter dropdown (#supplierDropdownMenu)
 *  2. The Add / Edit Medicine modal dropdown (#inputSupplier)
 */
function updateSupplierDropdowns() {
  // 1. Update Medicines Filter Dropdown Menu (#supplierDropdownMenu)
  const menu = document.getElementById('supplierDropdownMenu');
  if (menu) {
    if (activeSupplierFilter !== 'ALL'
        && !allSuppliers.some(supplier => String(supplier.supplierId) === String(activeSupplierFilter))) {
      activeSupplierFilter = 'ALL';
      const labelEl = document.getElementById('supplierDropdownLabel');
      if (labelEl) labelEl.textContent = 'All Suppliers';
    }

    let itemsHtml = `<div class="med-dropdown-item ${activeSupplierFilter === 'ALL' ? 'active' : ''}" data-val="ALL" role="option">All Suppliers</div>`;
    allSuppliers.forEach(supplier => {
      const supplierId = String(supplier.supplierId);
      const isAct = (activeSupplierFilter === supplierId);
      itemsHtml += `<div class="med-dropdown-item ${isAct ? 'active' : ''}" data-val="${escapeHtml(supplierId)}" role="option">${escapeHtml(supplier.supplierName)}</div>`;
    });
    menu.innerHTML = itemsHtml;

    // Re-bind item click listeners for custom dropdown
    const items = menu.querySelectorAll('.med-dropdown-item');
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = item.getAttribute('data-val');
        const label = item.textContent.trim();

        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const container = document.getElementById('supplierDropdown');
        if (container) container.classList.remove('open');

        activeSupplierFilter = val;
        const labelEl = document.getElementById('supplierDropdownLabel');
        if (labelEl) labelEl.textContent = label;
        renderMedicinesTable();
      });
    });
  }

  // 2. Update Add / Edit Medicine Modal Dropdown Select (#inputSupplier)
  const select = document.getElementById('inputSupplier');
  if (select) {
    const curVal = select.value;
    select.innerHTML = '<option value="">No supplier selected</option>' +
      allSuppliers.map(supplier =>
        `<option value="${supplier.supplierId}">${escapeHtml(supplier.supplierName)}</option>`
      ).join('');
    if (allSuppliers.some(supplier => String(supplier.supplierId) === curVal)) {
      select.value = curVal;
    } else {
      select.value = '';
    }
  }

  const bulkSupplierSelect = document.getElementById('bulkTargetSupplier');
  if (bulkSupplierSelect) {
    const selectedSupplierId = bulkSupplierSelect.value;
    bulkSupplierSelect.innerHTML = '<option value="">Select a supplier</option>' +
      allSuppliers.map(supplier =>
        `<option value="${supplier.supplierId}">${escapeHtml(supplier.supplierName)}</option>`
      ).join('');
    if (allSuppliers.some(supplier => String(supplier.supplierId) === selectedSupplierId)) {
      bulkSupplierSelect.value = selectedSupplierId;
    }
  }
}

function renderSuppliersTable() {
  const tbody = document.getElementById('suppliersTableBody');
  const countEl = document.getElementById('showingSupplierCount');
  const totalEl = document.getElementById('totalSupplierCount');

  if (!tbody) return;

  let filtered = allSuppliers.filter(s => {
    if (!activeSupplierSearchQuery) return true;
    const q = activeSupplierSearchQuery.toLowerCase();
    const nameMatch = (s.supplierName || '').toLowerCase().includes(q);
    const repMatch = (s.contactPerson || '').toLowerCase().includes(q);
    const emailMatch = (s.email || '').toLowerCase().includes(q);
    const phoneMatch = (s.contactNumber || '').toLowerCase().includes(q);
    const addressMatch = (s.address || '').toLowerCase().includes(q);
    return nameMatch || repMatch || emailMatch || phoneMatch || addressMatch;
  });

  if (countEl) countEl.textContent = filtered.length;
  if (totalEl) totalEl.textContent = allSuppliers.length;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-dim); padding: 40px 10px;">
          <div style="font-size: 1rem; margin-bottom: 6px; color: #94a3b8;">No matching suppliers found.</div>
          <div style="font-size: 0.85rem;">Click "+ Add Supplier" to register a new vendor.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((s, index) => {
    const originalIndex = allSuppliers.indexOf(s);
    const displayId = s.id || s.supplierId || (originalIndex + 1);

    return `
      <tr data-index="${originalIndex}">
        <td>
          <span class="supplier-id-badge">#${displayId}</span>
        </td>
        <td>
          <div class="supplier-name-title">${escapeHtml(s.supplierName)}</div>
          <div class="supplier-rep-sub">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>${escapeHtml(s.contactPerson || 'Representative')}</span>
          </div>
        </td>
        <td>
          <div class="supplier-info-item email">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>${escapeHtml(s.email || 'N/A')}</span>
          </div>
        </td>
        <td>
          <div class="supplier-info-item phone">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <span>${escapeHtml(s.contactNumber || 'N/A')}</span>
          </div>
        </td>
        <td>
          <div class="supplier-info-item address">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>${escapeHtml(s.address || 'N/A')}</span>
          </div>
        </td>
        <td style="text-align: center;">
          <div class="action-buttons-group">
            <button class="table-action-btn btn-edit" title="Edit Supplier" onclick="openAddSupplierModal(${s.supplierId})" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="table-action-btn btn-delete" title="Delete Supplier" onclick="promptDeleteSupplier(${s.supplierId})" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.openAddSupplierModal = function(identifier = -1) {
  const modal = document.getElementById('addSupplierModal');
  const title = document.getElementById('supplierModalTitle');
  const form = document.getElementById('addSupplierForm');
  const indexInput = document.getElementById('editSupplierIndex');
  const idInput = document.getElementById('editSupplierId');
  const saveBtn = document.getElementById('saveSupplierBtn');

  if (!modal || !form) return;

  const s = allSuppliers.find(item => item.supplierId === Number(identifier)) || allSuppliers[identifier];

  if (s) {
    const editIndex = allSuppliers.indexOf(s);
    if (title) title.textContent = 'Edit Supplier Details';
    if (indexInput) indexInput.value = editIndex;
    if (idInput) idInput.value = s.supplierId || s.id || '';
    if (saveBtn) saveBtn.textContent = 'Update Supplier';

    document.getElementById('inputSupplierName').value = s.supplierName || '';
    document.getElementById('inputContactPerson').value = s.contactPerson || '';
    document.getElementById('inputSupplierEmail').value = s.email || '';
    document.getElementById('inputSupplierPhone').value = s.contactNumber || '';
    document.getElementById('inputSupplierAddress').value = s.address || '';
  } else {
    if (title) title.textContent = 'Register New Supplier';
    if (indexInput) indexInput.value = -1;
    if (idInput) idInput.value = '';
    if (saveBtn) saveBtn.textContent = 'Save Supplier';
    form.reset();
  }

  modal.classList.add('open');
};

window.promptDeleteSupplier = function(identifier) {
  const s = allSuppliers.find(item => item.supplierId === Number(identifier)) || allSuppliers[identifier];
  if (!s) return;
  deletingSupplierId = s.supplierId;
  deletingSupplierIndex = allSuppliers.indexOf(s);
  const nameEl = document.getElementById('deleteTargetSupplierName');
  if (nameEl) nameEl.textContent = `"${s.supplierName}"`;

  const modal = document.getElementById('deleteSupplierModal');
  if (modal) modal.classList.add('open');
};

window.handleSaveSupplierBtnClick = function(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  handleSaveSupplier();
};

async function handleSaveSupplier() {
  const modal = document.getElementById('addSupplierModal');
  const indexInput = document.getElementById('editSupplierIndex');
  const idInput = document.getElementById('editSupplierId');
  const nameInput = document.getElementById('inputSupplierName');
  const repInput = document.getElementById('inputContactPerson');
  const emailInput = document.getElementById('inputSupplierEmail');
  const phoneInput = document.getElementById('inputSupplierPhone');
  const addrInput = document.getElementById('inputSupplierAddress');

  if (!nameInput) return;
  const supplierName = nameInput.value.trim();

  if (!supplierName) {
    showToast("Please enter the supplier name.", "error");
    nameInput.focus();
    return;
  }

  const editIdx = indexInput ? parseInt(indexInput.value, 10) : -1;
  const editId = idInput ? idInput.value : '';
  const contactPerson = repInput ? repInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const contactNumber = phoneInput ? phoneInput.value.trim() : '';
  const address = addrInput ? addrInput.value.trim() : '';

  const supplierData = {
    supplierName,
    contactPerson: contactPerson || 'Representative',
    email: email || 'contact@pharmacy.com',
    contactNumber: contactNumber || 'N/A',
    address: address || 'Central Warehouse'
  };

  let localId;

  // 1. Update UI state IMMEDIATELY for 100% responsiveness
  if (editIdx >= 0 && allSuppliers[editIdx]) {
    const oldName = allSuppliers[editIdx].supplierName;
    localId = allSuppliers[editIdx].id || allSuppliers[editIdx].supplierId || (editIdx + 1);
    allSuppliers[editIdx] = {
      ...supplierData,
      id: localId,
      supplierId: localId
    };

    allMedicines.forEach(m => {
      if (m.supplier === oldName) m.supplier = supplierName;
    });
    saveMedicinesToStorage();
    showToast(`Supplier "${supplierName}" updated successfully!`, "success");
  } else {
    localId = allSuppliers.length > 0 ? Math.max(...allSuppliers.map(s => Number(s.id || s.supplierId || 0))) + 1 : 1;
    const newSupplier = {
      ...supplierData,
      id: localId,
      supplierId: localId
    };
    allSuppliers.push(newSupplier);
    showToast(`Supplier "${supplierName}" saved successfully!`, "success");
  }

  // Persist locally & refresh tables + dropdowns immediately
  saveSuppliersToStorage();
  renderSuppliersTable();
  updateSupplierDropdowns();

  // Close modal immediately
  if (modal) modal.classList.remove('open');

  // Reset form
  const form = document.getElementById('addSupplierForm');
  if (form) form.reset();
  if (indexInput) indexInput.value = -1;
  if (idInput) idInput.value = '';

  // 2. Persist to Spring Boot REST API & MySQL database asynchronously
  try {
    const isEdit = (editIdx >= 0 && editId);
    const url = isEdit ? `${API_BASE_URL}/suppliers/${editId}` : `${API_BASE_URL}/suppliers`;
    const method = isEdit ? 'PUT' : 'POST';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplierData),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const savedEntity = await res.json();
      console.log("Supplier successfully saved in MySQL database:", savedEntity);
      if (savedEntity && savedEntity.supplierId) {
        const found = allSuppliers.find(s => s.supplierName === supplierName);
        if (found) {
          found.supplierId = savedEntity.supplierId;
          found.id = savedEntity.supplierId;
          saveSuppliersToStorage();
          renderSuppliersTable();
        }
      }
    }
  } catch (err) {
    console.warn("Backend sync notice:", err);
  }
}

async function performDeleteSupplier(index) {
  if (index < 0 || index >= allSuppliers.length) return;
  const s = allSuppliers[index];
  const targetId = s.supplierId || s.id;

  try {
    if (targetId) {
      await fetch(`${API_BASE_URL}/suppliers/${targetId}`, { method: 'DELETE' });
      console.log(`Supplier ${targetId} deleted from MySQL database.`);
    }
  } catch (err) {
    console.warn("Backend offline during delete:", err);
  }

  const removed = allSuppliers.splice(index, 1)[0];
  saveSuppliersToStorage();
  renderSuppliersTable();
  updateSupplierDropdowns();
  showToast(`Supplier "${removed.supplierName}" removed from directory.`, "info");
}

function getSupplierError(response) {
  return response.text().then((text) => {
    if (!text) return `Supplier request failed (HTTP ${response.status}).`;
    try {
      const body = JSON.parse(text);
      return body.message || body.error || body.detail || `Supplier request failed (HTTP ${response.status}).`;
    } catch {
      return text;
    }
  });
}

function renderSuppliersTable() {
  const tbody = document.getElementById('suppliersTableBody');
  if (!tbody) return;

  const query = activeSupplierSearchQuery;
  const filtered = allSuppliers.filter((supplier) =>
    !query || [
      supplier.supplierName,
      supplier.contactPerson,
      supplier.email,
      supplier.contactNumber,
      supplier.address
    ].some(value => (value || '').toLowerCase().includes(query))
  );

  setText('showingSupplierCount', filtered.length);
  setText('totalSupplierCount', allSuppliers.length);
  setText('kpiSuppliers', allSuppliers.length);

  if (!filtered.length) {
    const message = query ? 'No suppliers match your search.' : 'No suppliers have been added yet.';
    tbody.innerHTML = `<tr><td colspan="6" class="supplier-empty-state">${message}</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((supplier, index) => `
    <tr>
      <td><span class="supplier-id-badge">#${index + 1}</span></td>
      <td>
        <div class="supplier-name-title">${escapeHtml(supplier.supplierName)}</div>
        <div class="supplier-rep-sub">${escapeHtml(supplier.contactPerson || '—')}</div>
      </td>
      <td>${escapeHtml(supplier.email || '—')}</td>
      <td>${escapeHtml(supplier.contactNumber || '—')}</td>
      <td>${escapeHtml(supplier.address || '—')}</td>
      <td class="supplier-actions-cell">
        <div class="action-buttons-group">
          <button class="table-action-btn btn-edit" title="Edit supplier" aria-label="Edit ${escapeHtml(supplier.supplierName)}" data-supplier-action="edit" data-supplier-id="${supplier.supplierId}" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="table-action-btn btn-delete" title="Delete supplier" aria-label="Delete ${escapeHtml(supplier.supplierName)}" data-supplier-action="delete" data-supplier-id="${supplier.supplierId}" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.openAddSupplierModal = function(supplierId = null) {
  const modal = document.getElementById('addSupplierModal');
  const form = document.getElementById('addSupplierForm');
  if (!modal || !form) return;

  const supplier = supplierId === null
    ? null
    : allSuppliers.find(item => item.supplierId === Number(supplierId));
  if (supplierId !== null && !supplier) {
    showToast('That supplier could not be found. Refresh the list and try again.', 'error');
    return;
  }

  form.reset();
  document.getElementById('editSupplierId').value = supplier ? supplier.supplierId : '';
  document.getElementById('supplierModalTitle').textContent = supplier ? 'Edit Supplier Details' : 'Register New Supplier';
  document.getElementById('saveSupplierBtn').textContent = supplier ? 'Update Supplier' : 'Save Supplier';
  document.getElementById('inputSupplierName').value = supplier?.supplierName || '';
  document.getElementById('inputContactPerson').value = supplier?.contactPerson || '';
  document.getElementById('inputSupplierEmail').value = supplier?.email || '';
  document.getElementById('inputSupplierPhone').value = supplier?.contactNumber || '';
  document.getElementById('inputSupplierAddress').value = supplier?.address || '';
  modal.classList.add('open');
};

window.promptDeleteSupplier = function(supplierId) {
  const supplier = allSuppliers.find(item => item.supplierId === Number(supplierId));
  if (!supplier) return;
  deletingSupplierId = supplier.supplierId;
  setText('deleteTargetSupplierName', `"${supplier.supplierName}"`);
  document.getElementById('deleteSupplierModal')?.classList.add('open');
};

function closeSupplierModal() {
  document.getElementById('addSupplierModal')?.classList.remove('open');
}

function closeDeleteSupplierModal() {
  document.getElementById('deleteSupplierModal')?.classList.remove('open');
  deletingSupplierId = null;
}

async function handleSaveSupplier(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const supplierId = document.getElementById('editSupplierId').value;
  const supplierData = {
    supplierName: document.getElementById('inputSupplierName').value.trim(),
    contactPerson: document.getElementById('inputContactPerson').value.trim() || null,
    email: document.getElementById('inputSupplierEmail').value.trim() || null,
    contactNumber: document.getElementById('inputSupplierPhone').value.trim() || null,
    address: document.getElementById('inputSupplierAddress').value.trim() || null
  };
  const saveButton = document.getElementById('saveSupplierBtn');
  saveButton.disabled = true;

  try {
    const response = await fetch(
      supplierId ? `${API_BASE_URL}/suppliers/${supplierId}` : `${API_BASE_URL}/suppliers`,
      {
        method: supplierId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData)
      }
    );
    if (!response.ok) throw new Error(await getSupplierError(response));
    const savedSupplier = await response.json();
    if (!savedSupplier.supplierId) throw new Error('The backend did not return the saved supplier record.');

    const existingIndex = allSuppliers.findIndex(item => item.supplierId === savedSupplier.supplierId);
    if (existingIndex < 0) allSuppliers.push(savedSupplier);
    else allSuppliers[existingIndex] = savedSupplier;
    allSuppliers.sort((a, b) => a.supplierId - b.supplierId);
    updateSupplierDropdowns();
    renderSuppliersTable();
    closeSupplierModal();
    form.reset();
    document.getElementById('editSupplierId').value = '';
    showToast(`Supplier "${savedSupplier.supplierName}" ${supplierId ? 'updated' : 'saved'} successfully.`, 'success');
  } catch (error) {
    showToast(error.message || 'Could not save supplier to the database.', 'error');
  } finally {
    saveButton.disabled = false;
  }
}

async function handleDeleteSupplier() {
  if (deletingSupplierId === null) return;
  const supplier = allSuppliers.find(item => item.supplierId === deletingSupplierId);
  if (!supplier) return closeDeleteSupplierModal();

  const deleteButton = document.getElementById('confirmDeleteSupplierBtn');
  deleteButton.disabled = true;
  try {
    const response = await fetch(`${API_BASE_URL}/suppliers/${deletingSupplierId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await getSupplierError(response));
    allSuppliers = allSuppliers.filter(item => item.supplierId !== deletingSupplierId);
    updateSupplierDropdowns();
    renderSuppliersTable();
    showToast(`Supplier "${supplier.supplierName}" deleted successfully.`, 'success');
    closeDeleteSupplierModal();
  } catch (error) {
    showToast(error.message || 'Could not delete supplier from the database.', 'error');
  } finally {
    deleteButton.disabled = false;
  }
}
