const PURCHASE_ORDER_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'RECEIVED',
  'CANCELLED'
];
let purchaseOrders = [];
let purchaseOrderSuppliers = [];
let purchaseOrderMedicines = [];
let activePurchaseOrder = null;
let pendingDeletePurchaseOrderId = null;

// Safe global showToast fallback if not defined elsewhere
if (typeof window.showToast !== 'function') {
  window.showToast = function(message, type = 'info') {
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
  };
}

function getPoApiBase() {
  if (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) return API_BASE_URL;
  if (window.location.protocol.startsWith('http')) return `${window.location.origin}/api/admin`;
  return 'http://localhost:8080/api/admin';
}

document.addEventListener('DOMContentLoaded', initPurchaseOrders);

function initPurchaseOrders() {
  document.getElementById('purchaseOrderSearchInput')?.addEventListener('input', renderPurchaseOrders);
  document.getElementById('purchaseOrderStatusFilter')?.addEventListener('change', renderPurchaseOrders);

  // Listen for changes on target supplier to re-group medicines by supplier
  document.getElementById('purchaseOrderSupplierSelect')?.addEventListener('change', () => {
    refreshAllMedicineDropdowns();
    updatePurchaseOrderTotal();
  });

  // Delegate input and change events inside purchase order lines
  const linesContainer = document.getElementById('purchaseOrderLines');
  if (linesContainer) {
    linesContainer.addEventListener('input', updatePurchaseOrderTotal);

    linesContainer.addEventListener('change', (event) => {
      // Medicine selection changed: auto-populate unit price from database
      if (event.target.classList.contains('po-line-medicine')) {
        const select = event.target;
        const line = select.closest('.po-order-line');
        const medId = Number(select.value);
        const medicine = purchaseOrderMedicines.find((m) => Number(m.medicineId) === medId);

        if (medicine && line) {
          const priceInput = line.querySelector('.po-line-price');
          if (priceInput && medicine.purchasePrice > 0) {
            priceInput.value = Number(medicine.purchasePrice).toFixed(2);
          }

          // If supplier is not chosen yet, auto-select this medicine's supplier from database
          const supplierSelect = document.getElementById('purchaseOrderSupplierSelect');
          if (supplierSelect && !supplierSelect.value && medicine.supplierId) {
            supplierSelect.value = String(medicine.supplierId);
            refreshAllMedicineDropdowns();
          }
        }
        updatePurchaseOrderTotal();
        return;
      }

      // Quantity or price changed
      if (event.target.classList.contains('po-line-quantity') || event.target.classList.contains('po-line-price')) {
        updatePurchaseOrderTotal();
      }
    });

    linesContainer.addEventListener('click', (event) => {
      const removeButton = event.target.closest('[data-remove-po-line]');
      if (removeButton) {
        removeButton.closest('.po-order-line').remove();
        updatePurchaseOrderTotal();
      }
    });
  }

  // Delegate table button clicks: Approve, Reject, View, Edit, Delete
  document.getElementById('purchaseOrdersTableBody')?.addEventListener('click', (event) => {
    const approveButton = event.target.closest('[data-approve-po]');
    if (approveButton) {
      approvePurchaseOrder(Number(approveButton.dataset.approvePo), approveButton.dataset.poNumber);
      return;
    }
    const rejectButton = event.target.closest('[data-reject-po]');
    if (rejectButton) {
      rejectPurchaseOrder(Number(rejectButton.dataset.rejectPo), rejectButton.dataset.poNumber);
      return;
    }
    const viewButton = event.target.closest('[data-view-po]');
    if (viewButton) {
      openPurchaseOrderDetails(Number(viewButton.dataset.viewPo));
      return;
    }
    const deleteButton = event.target.closest('[data-delete-po]');
    if (deleteButton) {
      openDeletePurchaseOrderModal(Number(deleteButton.dataset.deletePo), deleteButton.dataset.poNumber);
      return;
    }
  });

  document.getElementById('purchaseOrderForm')?.addEventListener('submit', submitPurchaseOrder);
  document.getElementById('purchaseOrderStatusForm')?.addEventListener('submit', submitPurchaseOrderStatus);
  document.getElementById('confirmDeletePurchaseOrderBtn')?.addEventListener('click', confirmDeletePurchaseOrder);

  document.querySelectorAll('[data-close-po-modal]').forEach((button) => {
    button.addEventListener('click', () => closePurchaseOrderModal(button.dataset.closePoModal));
  });

  ['viewPurchaseOrderModal', 'changePurchaseOrderStatusModal', 'deletePurchaseOrderModal'].forEach((id) => {
    document.getElementById(id)?.addEventListener('click', (event) => {
      if (event.target.id === id) closePurchaseOrderModal(id);
    });
  });
}

async function loadPurchaseOrders() {
  const body = document.getElementById('purchaseOrdersTableBody');
  if (!body) return;
  body.innerHTML = '<tr><td colspan="8" class="po-empty-state">Loading parcel orders from database…</td></tr>';
  try {
    const baseUrl = getPoApiBase();
    const response = await fetch(`${baseUrl}/purchase-orders`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(await purchaseOrderError(response, 'Could not load purchase orders from database.'));
    purchaseOrders = await response.json();
    renderPurchaseOrders();
  } catch (error) {
    body.innerHTML = `<tr><td colspan="8" class="po-empty-state" style="color: #f87171 !important;">${escapePurchaseOrderHtml(error.message)}</td></tr>`;
    setPurchaseOrderCounts(0, 0);
  }
}

function getOrderProductsInfo(order) {
  if (!order || !Array.isArray(order.items) || !order.items.length) {
    return {
      productHtml: '<span style="color: var(--text-dim);">—</span>',
      qtyHtml: '<span style="color: var(--text-dim);">0 units</span>'
    };
  }
  const totalUnits = order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const primaryItem = order.items[0];
  const allNames = order.items.map((it) => it.medicineName).join(', ');

  let productHtml = `<span class="po-product-main" title="${escapePurchaseOrderHtml(allNames)}">${escapePurchaseOrderHtml(primaryItem.medicineName)}</span>`;
  if (order.items.length > 1) {
    const extraCount = order.items.length - 1;
    productHtml += ` <span class="po-more-items-badge" title="${escapePurchaseOrderHtml(allNames)}">+${extraCount} more</span>`;
  }

  let qtyHtml = `<span class="po-qty-value">${totalUnits.toLocaleString()} units</span>`;
  if (order.items.length > 1) {
    qtyHtml += ` <small style="color: var(--text-dim); font-size: 0.74rem;">(${order.items.length} items)</small>`;
  }

  return { productHtml, qtyHtml };
}

function renderPurchaseOrders() {
  const body = document.getElementById('purchaseOrdersTableBody');
  if (!body) return;
  const query = (document.getElementById('purchaseOrderSearchInput')?.value || '').trim().toLowerCase();
  const status = document.getElementById('purchaseOrderStatusFilter')?.value || 'ALL';

  const filtered = purchaseOrders.filter((order) => {
    const itemsMatch = Array.isArray(order.items) && order.items.some((it) =>
      String(it.medicineName || '').toLowerCase().includes(query)
    );
    const matchesSearch = [order.poNumber, order.supplierName, order.issuedBy]
      .some((value) => String(value || '').toLowerCase().includes(query)) || itemsMatch;
    return matchesSearch && (status === 'ALL' || String(order.status).toUpperCase() === status.toUpperCase());
  });

  if (!filtered.length) {
    body.innerHTML = `<tr><td colspan="8" class="po-empty-state">${purchaseOrders.length ? 'No parcel orders match the specified filters.' : 'No parcel orders recorded in the database yet. Click "+ Generate PO" to create one.'}</td></tr>`;
    setPurchaseOrderCounts(0, purchaseOrders.length);
    return;
  }

  body.innerHTML = filtered.map((order, index) => {
    const { productHtml, qtyHtml } = getOrderProductsInfo(order);
    const isPending = String(order.status).toUpperCase() === 'PENDING';
    const statusLower = String(order.status || 'pending').toLowerCase();

    return `
    <tr>
      <td class="po-id-cell">
        <div class="po-number-cell">${escapePurchaseOrderHtml(order.poNumber)}</div>
        <small style="color: var(--text-dim); font-size: 0.76rem;">ID: #${order.purchaseOrderId}</small>
      </td>
      <td class="po-product-cell">${productHtml}</td>
      <td class="po-qty-cell">${qtyHtml}</td>
      <td>${escapePurchaseOrderHtml(order.supplierName)}</td>
      <td>${formatPurchaseOrderDate(order.orderDate)}</td>
      <td class="po-amount-cell">${formatPurchaseOrderCurrency(order.totalAmount)}</td>
      <td><span class="po-status-badge status-${statusLower}">${escapePurchaseOrderHtml(order.status)}</span></td>
      <td class="po-row-actions">
        ${isPending ? `
          <button class="po-icon-btn po-approve-btn" type="button" data-approve-po="${Number(order.purchaseOrderId)}" data-po-number="${escapePurchaseOrderHtml(order.poNumber)}" aria-label="Approve ${escapePurchaseOrderHtml(order.poNumber)}" title="Approve purchase order">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>
          <button class="po-icon-btn po-reject-btn" type="button" data-reject-po="${Number(order.purchaseOrderId)}" data-po-number="${escapePurchaseOrderHtml(order.poNumber)}" aria-label="Reject ${escapePurchaseOrderHtml(order.poNumber)}" title="Reject purchase order">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        ` : ''}
        <button class="po-icon-btn po-view-btn" type="button" data-view-po="${Number(order.purchaseOrderId)}" aria-label="View ${escapePurchaseOrderHtml(order.poNumber)}" title="View order details">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        </button>
        <button class="po-icon-btn po-delete-btn" type="button" data-delete-po="${Number(order.purchaseOrderId)}" data-po-number="${escapePurchaseOrderHtml(order.poNumber)}" aria-label="Delete ${escapePurchaseOrderHtml(order.poNumber)}" title="Delete order">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    </tr>`;
  }).join('');

  setPurchaseOrderCounts(filtered.length, purchaseOrders.length);
}

function setPurchaseOrderCounts(showing, total) {
  const showingElement = document.getElementById('purchaseOrdersShowingCount');
  const totalElement = document.getElementById('purchaseOrdersTotalCount');
  if (showingElement) showingElement.textContent = showing;
  if (totalElement) totalElement.textContent = total;
}

async function approvePurchaseOrder(id, poNumber) {
  try {
    const baseUrl = getPoApiBase();
    const response = await fetch(`${baseUrl}/purchase-orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ status: 'APPROVED' })
    });
    if (!response.ok) throw new Error(await purchaseOrderError(response, 'Could not approve purchase order.'));
    const updated = await response.json();
    await loadPurchaseOrders();
    if (typeof fetchDashboardData === 'function') fetchDashboardData();
    window.showToast(`Purchase order ${poNumber || updated.poNumber || ''} approved successfully.`, 'success');
  } catch (error) {
    window.showToast(error.message, 'error');
  }
}

async function rejectPurchaseOrder(id, poNumber) {
  try {
    const baseUrl = getPoApiBase();
    const response = await fetch(`${baseUrl}/purchase-orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ status: 'REJECTED' })
    });
    if (!response.ok) throw new Error(await purchaseOrderError(response, 'Could not reject purchase order.'));
    const updated = await response.json();
    await loadPurchaseOrders();
    if (typeof fetchDashboardData === 'function') fetchDashboardData();
    window.showToast(`Purchase order ${poNumber || updated.poNumber || ''} has been rejected.`, 'info');
  } catch (error) {
    window.showToast(error.message, 'error');
  }
}

async function ensureSuppliersAndMedicinesLoaded(forceRefresh = false) {
  if (!forceRefresh && purchaseOrderSuppliers.length && purchaseOrderMedicines.length) return;
  const baseUrl = getPoApiBase();
  const [suppliersResponse, medicinesResponse] = await Promise.all([
    fetch(`${baseUrl}/suppliers`, { headers: { Accept: 'application/json' } }),
    fetch(`${baseUrl}/medicines`, { headers: { Accept: 'application/json' } })
  ]);
  if (!suppliersResponse.ok) throw new Error(await purchaseOrderError(suppliersResponse, 'Could not load suppliers from database.'));
  if (!medicinesResponse.ok) throw new Error(await purchaseOrderError(medicinesResponse, 'Could not load medicines from database.'));

  const rawSuppliers = await suppliersResponse.json();
  const rawMedicines = await medicinesResponse.json();

  purchaseOrderSuppliers = Array.isArray(rawSuppliers) ? rawSuppliers : [];

  // Deduplicate catalog rows by medicineId
  const uniqueMedicinesMap = new Map();
  if (Array.isArray(rawMedicines)) {
    rawMedicines.forEach((item) => {
      if (!item || !item.medicineId) return;
      const mId = Number(item.medicineId);
      if (!uniqueMedicinesMap.has(mId)) {
        uniqueMedicinesMap.set(mId, {
          medicineId: mId,
          medicineCode: item.medicineCode || `MED-${mId}`,
          medicineName: item.medicineName || 'Unnamed Medicine',
          genericName: item.genericName || '',
          dosage: item.dosage || '',
          category: item.category || '',
          purchasePrice: Number(item.purchasePrice != null ? item.purchasePrice : 0),
          sellingPrice: Number(item.sellingPrice != null ? item.sellingPrice : 0),
          supplierId: item.supplierId != null ? Number(item.supplierId) : null,
          supplierName: item.supplierName || ''
        });
      }
    });
  }
  purchaseOrderMedicines = Array.from(uniqueMedicinesMap.values());
}

function buildMedicineOptions(selectedMedicineId = null, filterSupplierId = null) {
  let html = '<option value="">Select medicine</option>';
  if (!purchaseOrderMedicines || !purchaseOrderMedicines.length) {
    return html + '<option value="" disabled>No medicines available in database</option>';
  }

  const sid = filterSupplierId ? Number(filterSupplierId) : null;
  const supplierMeds = sid ? purchaseOrderMedicines.filter((m) => m.supplierId === sid) : [];
  const otherMeds = sid ? purchaseOrderMedicines.filter((m) => m.supplierId !== sid) : purchaseOrderMedicines;

  const renderOption = (m) => {
    const isSelected = selectedMedicineId && Number(m.medicineId) === Number(selectedMedicineId);
    let label = m.medicineName || 'Unnamed Medicine';
    if (m.dosage && m.dosage.length <= 25) {
      label += ` (${m.dosage})`;
    } else if (m.genericName && m.genericName !== m.medicineName) {
      label += ` (${m.genericName})`;
    }
    const codeTag = m.medicineCode ? `[${m.medicineCode}] ` : '';
    const priceTag = m.purchasePrice > 0 ? ` — ₹${m.purchasePrice.toFixed(2)}` : '';
    return `<option value="${Number(m.medicineId)}"${isSelected ? ' selected' : ''} data-price="${m.purchasePrice}" data-supplier-id="${m.supplierId || ''}">${escapePurchaseOrderHtml(codeTag + label + priceTag)}</option>`;
  };

  if (sid && supplierMeds.length > 0) {
    const supplierObj = purchaseOrderSuppliers.find((s) => Number(s.supplierId) === sid);
    const supName = supplierObj ? supplierObj.supplierName : 'Selected Supplier';
    html += `<optgroup label="Medicines from ${escapePurchaseOrderHtml(supName)} (${supplierMeds.length})">`;
    html += supplierMeds.map(renderOption).join('');
    html += '</optgroup>';

    if (otherMeds.length > 0) {
      html += `<optgroup label="Other Catalog Medicines (${otherMeds.length})">`;
      html += otherMeds.map(renderOption).join('');
      html += '</optgroup>';
    }
  } else {
    html += otherMeds.map(renderOption).join('');
  }

  return html;
}

function refreshAllMedicineDropdowns() {
  const currentSupplierId = document.getElementById('purchaseOrderSupplierSelect')?.value || null;
  document.querySelectorAll('.po-order-line').forEach((line) => {
    const medSelect = line.querySelector('.po-line-medicine');
    if (!medSelect) return;
    const currentVal = medSelect.value;
    medSelect.innerHTML = buildMedicineOptions(currentVal, currentSupplierId);
  });
}

async function openPurchaseOrderForm(editPoId = null) {
  try {
    // Always refresh fresh medicines and suppliers directly from database
    await ensureSuppliersAndMedicinesLoaded(true);

    const supplierSelect = document.getElementById('purchaseOrderSupplierSelect');
    supplierSelect.innerHTML = '<option value="">Select supplier</option>' + purchaseOrderSuppliers
      .map((supplier) => `<option value="${Number(supplier.supplierId)}">${escapePurchaseOrderHtml(supplier.supplierName)}${supplier.contactPerson ? ` (${escapePurchaseOrderHtml(supplier.contactPerson)})` : ''}</option>`)
      .join('');
    
    const linesContainer = document.getElementById('purchaseOrderLines');
    linesContainer.innerHTML = '';
    const title = document.getElementById('generatePurchaseOrderTitle');
    const submitBtn = document.getElementById('submitPurchaseOrderBtn');
    const hiddenIdInput = document.getElementById('editPurchaseOrderId');

    if (editPoId) {
      if (title) title.textContent = 'Edit Purchase Order';
      if (submitBtn) submitBtn.textContent = 'Update Purchase Order';
      if (hiddenIdInput) hiddenIdInput.value = editPoId;

      const orderResponse = await fetch(`${getPoApiBase()}/purchase-orders/${editPoId}`, { headers: { Accept: 'application/json' } });
      if (!orderResponse.ok) throw new Error(await purchaseOrderError(orderResponse, 'Could not load purchase order for editing.'));
      const order = await orderResponse.json();

      supplierSelect.value = String(order.supplierId);
      if (Array.isArray(order.items) && order.items.length) {
        order.items.forEach((item) => {
          addPurchaseOrderLine(item.medicineId, item.quantity, item.unitPrice);
        });
      } else {
        addPurchaseOrderLine();
      }
    } else {
      if (title) title.textContent = 'Generate Purchase Order';
      if (submitBtn) submitBtn.textContent = 'Issue Purchase Order';
      if (hiddenIdInput) hiddenIdInput.value = '';
      document.getElementById('purchaseOrderForm').reset();
      addPurchaseOrderLine();
    }

    updatePurchaseOrderTotal();
    openPurchaseOrderModal('generatePurchaseOrderModal');

    if (!purchaseOrderSuppliers.length || !purchaseOrderMedicines.length) {
      window.showToast('Add at least one supplier and one medicine before issuing a purchase order.', 'info');
    }
  } catch (error) {
    window.showToast(error.message, 'error');
  }
}

function addPurchaseOrderLine(selectedMedicineId = null, initialQuantity = 1, initialPrice = '') {
  const currentSupplierId = document.getElementById('purchaseOrderSupplierSelect')?.value || null;
  const medicineOptions = buildMedicineOptions(selectedMedicineId, currentSupplierId);

  let defaultPrice = initialPrice;
  if ((defaultPrice === '' || defaultPrice == null) && selectedMedicineId) {
    const med = purchaseOrderMedicines.find((m) => Number(m.medicineId) === Number(selectedMedicineId));
    if (med && med.purchasePrice > 0) {
      defaultPrice = Number(med.purchasePrice).toFixed(2);
    }
  }

  const line = document.createElement('div');
  line.className = 'po-order-line';
  line.innerHTML = `
    <select class="po-line-medicine" aria-label="Select medicine" required>${medicineOptions}</select>
    <input class="po-line-quantity" type="number" min="1" step="1" value="${initialQuantity || 1}" aria-label="Quantity" required>
    <input class="po-line-price" type="number" min="0.01" step="0.01" value="${defaultPrice != null && defaultPrice !== '' ? defaultPrice : ''}" placeholder="Unit price" aria-label="Unit price" required>
    <button class="po-remove-line-btn" type="button" data-remove-po-line aria-label="Remove medicine line">&times;</button>`;
  document.getElementById('purchaseOrderLines').appendChild(line);
  updatePurchaseOrderTotal();
}

function updatePurchaseOrderTotal() {
  let total = 0;
  document.querySelectorAll('.po-order-line').forEach((line) => {
    const quantity = Number(line.querySelector('.po-line-quantity')?.value) || 0;
    const price = Number(line.querySelector('.po-line-price')?.value) || 0;
    total += quantity * price;
  });
  const totalEl = document.getElementById('purchaseOrderCalculatedTotal');
  if (totalEl) totalEl.textContent = formatPurchaseOrderCurrency(total);
}

async function submitPurchaseOrder(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const supplierSelect = document.getElementById('purchaseOrderSupplierSelect');
  const supplierId = Number(supplierSelect.value);
  if (!supplierId) {
    window.showToast('Please select a target supplier.', 'error');
    supplierSelect.focus();
    return;
  }

  const lines = [...document.querySelectorAll('.po-order-line')].map((line) => ({
    medicineId: Number(line.querySelector('.po-line-medicine').value),
    quantity: Number(line.querySelector('.po-line-quantity').value),
    unitPrice: Number(line.querySelector('.po-line-price').value)
  }));

  if (!lines.length || lines.some((line) => !line.medicineId || line.quantity < 1 || line.unitPrice <= 0)) {
    window.showToast('Select a medicine and enter a positive quantity and unit price for every line.', 'error');
    return;
  }

  const editId = document.getElementById('editPurchaseOrderId')?.value;
  const button = document.getElementById('submitPurchaseOrderBtn');
  button.disabled = true;
  try {
    const baseUrl = getPoApiBase();
    const url = editId ? `${baseUrl}/purchase-orders/${editId}` : `${baseUrl}/purchase-orders`;
    const method = editId ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        supplierId: supplierId,
        items: lines
      })
    });
    if (!response.ok) throw new Error(await purchaseOrderError(response, `Could not ${editId ? 'update' : 'issue'} purchase order.`));
    closePurchaseOrderModal('generatePurchaseOrderModal');
    await loadPurchaseOrders();
    if (typeof fetchDashboardData === 'function') fetchDashboardData();
    window.showToast(`Purchase order ${editId ? 'updated' : 'issued'} successfully in database.`, 'success');
  } catch (error) {
    window.showToast(error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

function openDeletePurchaseOrderModal(id, poNumber) {
  pendingDeletePurchaseOrderId = id;
  const messageEl = document.getElementById('deletePurchaseOrderMessage');
  if (messageEl) {
    messageEl.textContent = `Delete purchase order "${poNumber}"? This cannot be undone.`;
  }
  openPurchaseOrderModal('deletePurchaseOrderModal');
}

async function confirmDeletePurchaseOrder() {
  if (!pendingDeletePurchaseOrderId) return;
  const btn = document.getElementById('confirmDeletePurchaseOrderBtn');
  if (btn) btn.disabled = true;
  try {
    const baseUrl = getPoApiBase();
    const response = await fetch(`${baseUrl}/purchase-orders/${pendingDeletePurchaseOrderId}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error(await purchaseOrderError(response, 'Could not delete purchase order.'));
    closePurchaseOrderModal('deletePurchaseOrderModal');
    pendingDeletePurchaseOrderId = null;
    await loadPurchaseOrders();
    if (typeof fetchDashboardData === 'function') fetchDashboardData();
    window.showToast('Purchase order deleted successfully from the database.', 'success');
  } catch (error) {
    window.showToast(error.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function openPurchaseOrderDetails(id) {
  try {
    const baseUrl = getPoApiBase();
    const response = await fetch(`${baseUrl}/purchase-orders/${id}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(await purchaseOrderError(response, 'Could not load purchase order details.'));
    activePurchaseOrder = await response.json();
    renderPurchaseOrderDetails();
    openPurchaseOrderModal('viewPurchaseOrderModal');
  } catch (error) {
    window.showToast(error.message, 'error');
  }
}

function renderPurchaseOrderDetails() {
  const order = activePurchaseOrder;
  if (!order) return;
  document.getElementById('viewPurchaseOrderTitle').textContent = `PO: ${order.poNumber}`;
  const isPending = String(order.status).toUpperCase() === 'PENDING';
  const statusLower = String(order.status || 'pending').toLowerCase();

  const itemRows = (order.items || []).map((item) => `
    <tr>
      <td><strong>${escapePurchaseOrderHtml(item.medicineName)}</strong></td>
      <td>${Number(item.quantity)} units</td>
      <td>${formatPurchaseOrderCurrency(item.unitPrice)}</td>
      <td class="po-amount-cell">${formatPurchaseOrderCurrency(item.lineTotal)}</td>
    </tr>`).join('') || '<tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 16px;">No item details available.</td></tr>';

  document.getElementById('purchaseOrderDetails').innerHTML = `
    <div class="po-detail-summary">
      <div><span>PO REFERENCE</span><strong>${escapePurchaseOrderHtml(order.poNumber)}</strong><small>Database ID: #${order.purchaseOrderId}</small></div>
      <div><span>PARCEL STATUS</span><strong><span class="po-status-badge status-${statusLower}">${escapePurchaseOrderHtml(order.status)}</span></strong></div>
      <div><span>SUPPLIER VENDOR</span><strong>${escapePurchaseOrderHtml(order.supplierName)}</strong><small>Rep: ${escapePurchaseOrderHtml(order.supplierContactPerson || 'Not specified')}</small></div>
      <div><span>ORDER DATE</span><strong>${formatPurchaseOrderDate(order.orderDate)}</strong></div>
      <div style="grid-column: 1 / -1;"><span>ISSUED BY</span><strong>${escapePurchaseOrderHtml(order.issuedBy)}</strong></div>
    </div>
    <h3 class="po-detail-section-title">Ordered Items (${order.items ? order.items.length : 0})</h3>
    <div class="po-detail-table-scroll">
      <table class="po-detail-table">
        <thead><tr><th>Medicine / Product Name</th><th>Quantity</th><th>Unit Price</th><th>Line Total</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>
    <div class="po-detail-total">Total Procurement Value: <strong>${formatPurchaseOrderCurrency(order.totalAmount)}</strong></div>
    <div class="po-modal-actions">
      ${isPending ? `
        <button id="modalApprovePoBtn" class="po-approve-action-btn" type="button">✓ Approve Order</button>
        <button id="modalRejectPoBtn" class="po-reject-action-btn" type="button">✗ Reject Order</button>
      ` : ''}
      <button id="openChangePurchaseOrderStatusBtn" class="po-primary-btn" type="button">Change Status</button>
      <button class="po-secondary-btn" type="button" data-close-po-modal="viewPurchaseOrderModal">Close</button>
    </div>`;

  if (isPending) {
    document.getElementById('modalApprovePoBtn')?.addEventListener('click', async () => {
      await approvePurchaseOrder(order.purchaseOrderId, order.poNumber);
      const updated = purchaseOrders.find((p) => p.purchaseOrderId === order.purchaseOrderId);
      if (updated) {
        activePurchaseOrder = updated;
        renderPurchaseOrderDetails();
      } else {
        closePurchaseOrderModal('viewPurchaseOrderModal');
      }
    });

    document.getElementById('modalRejectPoBtn')?.addEventListener('click', async () => {
      await rejectPurchaseOrder(order.purchaseOrderId, order.poNumber);
      const updated = purchaseOrders.find((p) => p.purchaseOrderId === order.purchaseOrderId);
      if (updated) {
        activePurchaseOrder = updated;
        renderPurchaseOrderDetails();
      } else {
        closePurchaseOrderModal('viewPurchaseOrderModal');
      }
    });
  }

  document.getElementById('openChangePurchaseOrderStatusBtn')?.addEventListener('click', () => {
    document.getElementById('changePurchaseOrderStatusTitle').textContent = `Update Status: ${order.poNumber}`;
    document.getElementById('purchaseOrderStatusSelect').value = order.status;
    openPurchaseOrderModal('changePurchaseOrderStatusModal');
  });

  document.querySelector('#purchaseOrderDetails [data-close-po-modal="viewPurchaseOrderModal"]')
    ?.addEventListener('click', () => closePurchaseOrderModal('viewPurchaseOrderModal'));
}

async function submitPurchaseOrderStatus(event) {
  event.preventDefault();
  if (!activePurchaseOrder) return;
  const status = document.getElementById('purchaseOrderStatusSelect').value;
  if (!PURCHASE_ORDER_STATUSES.includes(status)) return;
  const button = document.getElementById('applyPurchaseOrderStatusBtn');
  button.disabled = true;
  try {
    const baseUrl = getPoApiBase();
    const response = await fetch(`${baseUrl}/purchase-orders/${activePurchaseOrder.purchaseOrderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!response.ok) throw new Error(await purchaseOrderError(response, 'Could not update purchase order status.'));
    activePurchaseOrder = await response.json();
    closePurchaseOrderModal('changePurchaseOrderStatusModal');
    await loadPurchaseOrders();
    renderPurchaseOrderDetails();
    openPurchaseOrderModal('viewPurchaseOrderModal');
    window.showToast(`Order status updated to ${status}.`, 'success');
  } catch (error) {
    window.showToast(error.message, 'error');
  } finally {
    button.disabled = false;
  }
}

function openPurchaseOrderModal(id) {
  document.getElementById(id)?.classList.add('is-open');
}

function closePurchaseOrderModal(id) {
  document.getElementById(id)?.classList.remove('is-remove');
  document.getElementById(id)?.classList.remove('is-open');
}

function formatPurchaseOrderCurrency(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(amount) || 0);
}

function formatPurchaseOrderDate(dateValue) {
  if (!dateValue) return '—';
  const [year, month, day] = String(dateValue).slice(0, 10).split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'numeric', year: 'numeric' })
    .format(new Date(year, month - 1, day));
}

function escapePurchaseOrderHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

async function purchaseOrderError(response, fallback) {
  try {
    const error = await response.json();
    return error.message || error.error || fallback;
  } catch {
    return fallback;
  }
}
