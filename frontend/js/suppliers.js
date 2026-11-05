const SUPPLIER_API_URL = `${API_BASE_URL}/suppliers`;
let supplierSearchTerm = '';
let pendingSupplierDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('supplierSearchInput')?.addEventListener('input', (event) => {
    supplierSearchTerm = event.target.value.trim().toLowerCase();
    renderSuppliersTable();
  });
  document.getElementById('openAddSupplierModalBtn')?.addEventListener('click', () => openSupplierForm());
  document.getElementById('suppliersTableBody')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-supplier-action]');
    if (!button) return;
    const supplierId = Number(button.dataset.supplierId);
    if (button.dataset.supplierAction === 'edit') openSupplierForm(supplierId);
    if (button.dataset.supplierAction === 'delete') openSupplierDeleteConfirmation(supplierId);
  });
  document.getElementById('addSupplierForm')?.addEventListener('submit', saveSupplier);
  document.getElementById('closeSupplierModalBtn')?.addEventListener('click', closeSupplierForm);
  document.getElementById('cancelSupplierModalBtn')?.addEventListener('click', closeSupplierForm);
  document.getElementById('addSupplierModal')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeSupplierForm();
  });
  document.getElementById('closeDeleteSupplierModalBtn')?.addEventListener('click', closeSupplierDeleteConfirmation);
  document.getElementById('cancelDeleteSupplierBtn')?.addEventListener('click', closeSupplierDeleteConfirmation);
  document.getElementById('confirmDeleteSupplierBtn')?.addEventListener('click', deleteSupplier);
  document.getElementById('deleteSupplierModal')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeSupplierDeleteConfirmation();
  });
  loadSuppliersData();
});

async function loadSuppliersData() {
  const tableBody = document.getElementById('suppliersTableBody');
  if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" class="supplier-empty-state">Loading suppliers…</td></tr>';
  try {
    const response = await fetch(SUPPLIER_API_URL);
    if (!response.ok) throw new Error(await supplierResponseError(response));
    allSuppliers = (await response.json()).sort((a, b) => a.supplierId - b.supplierId);
    renderSuppliersTable();
  } catch (error) {
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" class="supplier-empty-state">Could not load suppliers from the database. Check the backend connection and try again.</td></tr>';
    showToast(error.message || 'Could not load suppliers from the database.', 'error');
  }
}

function renderSuppliersTable() {
  const tableBody = document.getElementById('suppliersTableBody');
  if (!tableBody) return;
  const filtered = allSuppliers.filter(supplier => !supplierSearchTerm || [
    supplier.supplierName,
    supplier.contactPerson,
    supplier.email,
    supplier.contactNumber,
    supplier.address
  ].some(value => (value || '').toLowerCase().includes(supplierSearchTerm)));
  document.getElementById('showingSupplierCount').textContent = filtered.length;
  document.getElementById('totalSupplierCount').textContent = allSuppliers.length;

  if (!filtered.length) {
    tableBody.innerHTML = `<tr><td colspan="6" class="supplier-empty-state">${supplierSearchTerm ? 'No suppliers match your search.' : 'No suppliers have been added yet.'}</td></tr>`;
    return;
  }
  tableBody.innerHTML = filtered.map((supplier, index) => `
    <tr>
      <td><span class="supplier-id-badge">#${index + 1}</span></td>
      <td><div class="supplier-name-title">${escapeHtml(supplier.supplierName)}</div><div class="supplier-rep-sub">${escapeHtml(supplier.contactPerson || '—')}</div></td>
      <td>${escapeHtml(supplier.email || '—')}</td>
      <td>${escapeHtml(supplier.contactNumber || '—')}</td>
      <td>${escapeHtml(supplier.address || '—')}</td>
      <td class="supplier-actions-cell">
        <div class="action-buttons-group">
          <button class="table-action-btn btn-edit" type="button" title="Edit supplier" aria-label="Edit supplier" data-supplier-action="edit" data-supplier-id="${supplier.supplierId}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="table-action-btn btn-delete" type="button" title="Delete supplier" aria-label="Delete supplier" data-supplier-action="delete" data-supplier-id="${supplier.supplierId}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openSupplierForm(supplierId = null) {
  const form = document.getElementById('addSupplierForm');
  const supplier = supplierId === null ? null : allSuppliers.find(item => item.supplierId === supplierId);
  if (supplierId !== null && !supplier) {
    showToast('Supplier not found. Refresh the list and try again.', 'error');
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
  document.getElementById('addSupplierModal').classList.add('open');
}

function closeSupplierForm() {
  document.getElementById('addSupplierModal').classList.remove('open');
}

async function saveSupplier(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const supplierId = document.getElementById('editSupplierId').value;
  const payload = {
    supplierName: document.getElementById('inputSupplierName').value.trim(),
    contactPerson: document.getElementById('inputContactPerson').value.trim() || null,
    email: document.getElementById('inputSupplierEmail').value.trim() || null,
    contactNumber: document.getElementById('inputSupplierPhone').value.trim() || null,
    address: document.getElementById('inputSupplierAddress').value.trim() || null
  };
  const button = document.getElementById('saveSupplierBtn');
  button.disabled = true;
  try {
    const response = await fetch(supplierId ? `${SUPPLIER_API_URL}/${supplierId}` : SUPPLIER_API_URL, {
      method: supplierId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(await supplierResponseError(response));
    const saved = await response.json();
    if (!saved.supplierId) throw new Error('The backend did not return the saved supplier record.');
    const index = allSuppliers.findIndex(item => item.supplierId === saved.supplierId);
    if (index < 0) allSuppliers.push(saved);
    else allSuppliers[index] = saved;
    allSuppliers.sort((a, b) => a.supplierId - b.supplierId);
    renderSuppliersTable();
    closeSupplierForm();
    form.reset();
    document.getElementById('editSupplierId').value = '';
    showToast(`Supplier "${saved.supplierName}" ${supplierId ? 'updated' : 'saved'} successfully.`, 'success');
  } catch (error) {
    showToast(error.message || 'Could not save supplier to the database.', 'error');
  } finally {
    button.disabled = false;
  }
}

function openSupplierDeleteConfirmation(supplierId) {
  const supplier = allSuppliers.find(item => item.supplierId === supplierId);
  if (!supplier) return;
  pendingSupplierDeleteId = supplierId;
  document.getElementById('deleteTargetSupplierName').textContent = `"${supplier.supplierName}"`;
  document.getElementById('deleteSupplierModal').classList.add('open');
}

function closeSupplierDeleteConfirmation() {
  document.getElementById('deleteSupplierModal').classList.remove('open');
  pendingSupplierDeleteId = null;
}

async function deleteSupplier() {
  if (pendingSupplierDeleteId === null) return;
  const supplier = allSuppliers.find(item => item.supplierId === pendingSupplierDeleteId);
  const button = document.getElementById('confirmDeleteSupplierBtn');
  button.disabled = true;
  try {
    const response = await fetch(`${SUPPLIER_API_URL}/${pendingSupplierDeleteId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await supplierResponseError(response));
    allSuppliers = allSuppliers.filter(item => item.supplierId !== pendingSupplierDeleteId);
    renderSuppliersTable();
    showToast(`Supplier "${supplier.supplierName}" deleted successfully.`, 'success');
    closeSupplierDeleteConfirmation();
  } catch (error) {
    showToast(error.message || 'Could not delete supplier from the database.', 'error');
  } finally {
    button.disabled = false;
  }
}

async function supplierResponseError(response) {
  const text = await response.text();
  if (!text) return `Supplier request failed (HTTP ${response.status}).`;
  try {
    const body = JSON.parse(text);
    return body.message || body.error || body.detail || `Supplier request failed (HTTP ${response.status}).`;
  } catch {
    return text;
  }
}
