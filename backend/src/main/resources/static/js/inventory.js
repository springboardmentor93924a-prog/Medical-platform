let allInventoryMovements = [];
let inventorySearchTerm = '';
let inventoryActionFilter = 'ALL';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('inventorySearchInput')?.addEventListener('input', (event) => {
    inventorySearchTerm = event.target.value.trim().toLowerCase();
    renderInventoryMovements();
  });
  document.getElementById('inventoryActionFilter')?.addEventListener('change', (event) => {
    inventoryActionFilter = event.target.value;
    renderInventoryMovements();
  });
  document.getElementById('syncInventoryLogsBtn')?.addEventListener('click', loadInventoryMovements);
});

async function loadInventoryMovements() {
  const tableBody = document.getElementById('inventoryMovementsBody');
  const syncButton = document.getElementById('syncInventoryLogsBtn');
  if (!tableBody) return;
  tableBody.innerHTML = '<tr><td colspan="6" class="inventory-empty-state">Loading stock movements…</td></tr>';
  if (syncButton) syncButton.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/inventory/movements`);
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `Could not load inventory movements (HTTP ${response.status}).`);
    }
    allInventoryMovements = await response.json();
    renderInventoryMovements();
  } catch (error) {
    tableBody.innerHTML = '<tr><td colspan="6" class="inventory-empty-state">Could not load inventory movements from the database. Check the backend connection and try again.</td></tr>';
    setText('inventoryShowingCount', '0');
    setText('inventoryTotalCount', '0');
    showToast(error.message || 'Could not load inventory movements from the database.', 'error');
  } finally {
    if (syncButton) syncButton.disabled = false;
  }
}

function renderInventoryMovements() {
  const tableBody = document.getElementById('inventoryMovementsBody');
  if (!tableBody) return;
  const filtered = allInventoryMovements.filter((movement) => {
    const action = normalizeInventoryAction(movement);
    const matchesAction = inventoryActionFilter === 'ALL' || action === inventoryActionFilter;
    const searchText = [
      movement.medicineName,
      movement.medicineId,
      movement.batchNumber,
      movement.actionType,
      movement.actionedBy
    ].join(' ').toLowerCase();
    return matchesAction && (!inventorySearchTerm || searchText.includes(inventorySearchTerm));
  });

  setText('inventoryShowingCount', filtered.length);
  setText('inventoryTotalCount', allInventoryMovements.length);

  if (!filtered.length) {
    const message = allInventoryMovements.length
      ? 'No stock movements match these filters.'
      : 'No stock movement records are available in the database yet.';
    tableBody.innerHTML = `<tr><td colspan="6" class="inventory-empty-state">${message}</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered.map((movement) => {
    const action = normalizeInventoryAction(movement);
    const actionLabel = action === 'IN' ? 'Stock IN' : action === 'OUT' ? 'Stock OUT' : movement.actionType;
    const quantity = Math.abs(Number(movement.quantityChanged) || 0);
    const quantityLabel = `${action === 'OUT' ? '-' : '+'}${quantity} units`;
    const timestamp = movement.timestamp ? new Date(movement.timestamp).toLocaleString() : '—';
    return `
      <tr>
        <td><span class="inventory-timestamp">${escapeHtml(timestamp)}</span></td>
        <td>
          <div class="inventory-medicine">
            <span class="inventory-medicine-code">MED-${escapeHtml(movement.medicineId)}</span>
            <strong>${escapeHtml(movement.medicineName || '—')}</strong>
          </div>
        </td>
        <td><span class="inventory-batch">${escapeHtml(movement.batchNumber || '—')}</span></td>
        <td><span class="inventory-action ${action === 'IN' ? 'stock-in' : action === 'OUT' ? 'stock-out' : ''}">${escapeHtml(actionLabel || '—')}</span></td>
        <td><strong class="inventory-quantity ${action === 'IN' ? 'stock-in' : action === 'OUT' ? 'stock-out' : ''}">${escapeHtml(quantityLabel)}</strong></td>
        <td><span class="inventory-user">${escapeHtml(movement.actionedBy || '—')}</span></td>
      </tr>
    `;
  }).join('');
}

function normalizeInventoryAction(movement) {
  const type = String(movement.actionType || '').toUpperCase();
  if (type.includes('OUT') || Number(movement.quantityChanged) < 0) return 'OUT';
  if (type.includes('IN') || Number(movement.quantityChanged) > 0) return 'IN';
  return 'OTHER';
}
