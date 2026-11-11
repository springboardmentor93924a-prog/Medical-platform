(() => {
  const apiBase = window.location.protocol.startsWith('http')
    ? `${window.location.origin}/api/admin`
    : 'http://localhost:8080/api/admin';
  const reportDefinitions = {
    inventory: {
      title: 'Full Inventory Telemetry & Asset Report',
      fileName: 'inventory-asset-report',
      columns: [
        ['Medicine', 'medicineName'], ['Generic Name', 'genericName'], ['Category', 'category'],
        ['Batch Number', 'batchNumber'], ['Supplier', 'supplierName'], ['Quantity', 'quantity'],
        ['Reorder Level', 'reorderLevel'], ['Purchase Price', 'purchasePrice'],
        ['Selling Price', 'sellingPrice'], ['Inventory Value', 'inventoryValue'], ['Expiry Date', 'expiryDate']
      ]
    },
    'low-stock': {
      title: 'Low Stock & Restock Priority Audit',
      fileName: 'low-stock-restock-audit',
      columns: [
        ['Medicine', 'medicineName'], ['Generic Name', 'genericName'], ['Category', 'category'],
        ['Batch Number', 'batchNumber'], ['Supplier', 'supplierName'], ['Quantity', 'quantity'],
        ['Reorder Level', 'reorderLevel'], ['Units to Reorder', 'unitsToReorder'], ['Expiry Date', 'expiryDate']
      ]
    },
    expiry: {
      title: 'Expiry Risk & Shelf-Life Telemetry Report',
      fileName: 'expiry-risk-report',
      columns: [
        ['Medicine', 'medicineName'], ['Generic Name', 'genericName'], ['Category', 'category'],
        ['Batch Number', 'batchNumber'], ['Supplier', 'supplierName'], ['Quantity', 'quantity'],
        ['Expiry Date', 'expiryDate'], ['Days Until Expiry', 'daysUntilExpiry'], ['Risk Window', 'riskWindow']
      ]
    },
    procurement: {
      title: 'Purchase Orders & Supplier History Report',
      fileName: 'purchase-order-supplier-history',
      columns: [
        ['PO Number', 'poNumber'], ['Supplier', 'supplierName'], ['Supplier Contact', 'supplierContactPerson'],
        ['Order Date', 'orderDate'], ['Status', 'status'], ['Order Total', 'totalAmount'],
        ['Issued By', 'issuedBy'], ['Medicine', 'medicineName'], ['Quantity', 'quantity'],
        ['Unit Price', 'unitPrice'], ['Line Total', 'lineTotal']
      ]
    }
  };

  let inventoryRows;
  let purchaseOrders;
  let loadRequest = 0;

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-report-action]').forEach((button) => {
      button.addEventListener('click', handleReportAction);
    });
    window.addEventListener('afterprint', () => document.body.classList.remove('printing-report'));
  });

  window.loadReports = loadReports;

  async function loadReports() {
    const error = document.getElementById('reportsError');
    if (!error) return;
    const requestId = ++loadRequest;
    error.hidden = true;
    error.textContent = '';
    inventoryRows = undefined;
    purchaseOrders = undefined;

    const [inventoryResult, ordersResult] = await Promise.allSettled([
      fetchJson(`${apiBase}/reports/inventory`),
      fetchJson(`${apiBase}/purchase-orders`)
    ]);
    if (requestId !== loadRequest) return;

    const failures = [];
    if (inventoryResult.status === 'fulfilled' && Array.isArray(inventoryResult.value)) {
      inventoryRows = inventoryResult.value;
    } else {
      failures.push('inventory and stock reports');
    }
    if (ordersResult.status === 'fulfilled' && Array.isArray(ordersResult.value)) {
      purchaseOrders = ordersResult.value;
    } else {
      failures.push('purchase order reports');
    }
    if (failures.length) {
      error.textContent = `Could not load ${failures.join(' and ')}. Use Refresh to try again.`;
      error.hidden = false;
    }
  }

  async function handleReportAction(event) {
    const button = event.currentTarget;
    const type = button.dataset.reportType;
    const action = button.dataset.reportAction;
    const definition = reportDefinitions[type];
    if (!definition || !['csv', 'print'].includes(action)) return;

    button.disabled = true;
    clearError();
    try {
      const rows = await getReportRows(type);
      if (action === 'csv') downloadCsv(definition, rows);
      else printReport(definition, rows);
    } catch (error) {
      showError(error.message || `Could not generate ${definition.title}.`);
    } finally {
      button.disabled = false;
    }
  }

  async function getReportRows(type) {
    if (type === 'procurement') {
      if (purchaseOrders === undefined) {
        purchaseOrders = await fetchJson(`${apiBase}/purchase-orders`);
      }
      if (!Array.isArray(purchaseOrders)) throw new Error('Purchase order data returned an unexpected response.');
      return flattenPurchaseOrders(purchaseOrders);
    }

    if (inventoryRows === undefined) {
      inventoryRows = await fetchJson(`${apiBase}/reports/inventory`);
    }
    if (!Array.isArray(inventoryRows)) throw new Error('Inventory data returned an unexpected response.');
    const rows = inventoryRows.map((row) => ({
      ...row,
      hasBatch: row.batchNumber != null,
      quantity: Number(row.quantity || 0),
      reorderLevel: row.reorderLevel == null ? '' : Number(row.reorderLevel),
      inventoryValue: Number(row.quantity || 0) * Number(row.purchasePrice || 0),
      unitsToReorder: Math.max(0, Number(row.reorderLevel || 0) - Number(row.quantity || 0)),
      daysUntilExpiry: daysUntil(row.expiryDate)
    }));

    if (type === 'low-stock') {
      return rows.filter((row) => row.hasBatch && row.quantity <= row.reorderLevel);
    }
    if (type === 'expiry') {
      return rows.filter((row) => Number(row.quantity || 0) > 0 && row.daysUntilExpiry <= 90)
        .map((row) => ({ ...row, riskWindow: expiryWindow(row.daysUntilExpiry) }));
    }
    return rows;
  }

  function flattenPurchaseOrders(orders) {
    return orders.flatMap((order) => {
      const items = Array.isArray(order.items) && order.items.length ? order.items : [null];
      return items.map((item) => ({
        poNumber: order.poNumber || order.purchaseOrderId,
        supplierName: order.supplierName,
        supplierContactPerson: order.supplierContactPerson,
        orderDate: order.orderDate,
        status: order.status,
        totalAmount: order.totalAmount,
        issuedBy: order.issuedBy,
        medicineName: item?.medicineName || '',
        quantity: item?.quantity ?? '',
        unitPrice: item?.unitPrice ?? '',
        lineTotal: item?.lineTotal ?? ''
      }));
    });
  }

  async function fetchJson(url) {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.detail || data?.message || `Report request failed (HTTP ${response.status}).`);
    }
    return data;
  }

  function downloadCsv(definition, rows) {
    const csvRows = [
      definition.columns.map(([label]) => csvCell(label)).join(','),
      ...rows.map((row) => definition.columns.map(([, key]) => csvCell(row[key])).join(','))
    ];
    const blob = new Blob(['\uFEFF', csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${definition.fileName}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function csvCell(value) {
    let text = String(value ?? '');
    if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function printReport(definition, rows) {
    const container = document.getElementById('reportPrintContent');
    if (!container) throw new Error('The printable report area is unavailable.');
    container.replaceChildren();

    const heading = document.createElement('header');
    const title = document.createElement('h1');
    title.textContent = definition.title;
    const generated = document.createElement('p');
    generated.textContent = `Generated ${new Date().toLocaleString()} - ${rows.length} record${rows.length === 1 ? '' : 's'}`;
    heading.append(title, generated);

    const table = document.createElement('table');
    const tableHead = document.createElement('thead');
    const headRow = document.createElement('tr');
    definition.columns.forEach(([label]) => {
      const cell = document.createElement('th');
      cell.textContent = label;
      headRow.append(cell);
    });
    tableHead.append(headRow);
    const tableBody = document.createElement('tbody');
    rows.forEach((row) => {
      const tableRow = document.createElement('tr');
      definition.columns.forEach(([, key]) => {
        const cell = document.createElement('td');
        cell.textContent = String(row[key] ?? '');
        tableRow.append(cell);
      });
      tableBody.append(tableRow);
    });
    table.append(tableHead, tableBody);
    container.append(heading, table);

    document.body.classList.add('printing-report');
    window.print();
  }

  function daysUntil(expiryDate) {
    if (!expiryDate) return Number.POSITIVE_INFINITY;
    const [year, month, day] = String(expiryDate).split('-').map(Number);
    if (![year, month, day].every(Number.isFinite)) return Number.POSITIVE_INFINITY;
    const expiry = Date.UTC(year, month - 1, day);
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.floor((expiry - today) / 86400000);
  }

  function expiryWindow(days) {
    if (days < 0) return 'EXPIRED';
    if (days <= 30) return 'WITHIN 30 DAYS';
    if (days <= 60) return 'WITHIN 60 DAYS';
    return 'WITHIN 90 DAYS';
  }

  function clearError() {
    const error = document.getElementById('reportsError');
    if (!error) return;
    error.hidden = true;
    error.textContent = '';
  }

  function showError(message) {
    const error = document.getElementById('reportsError');
    if (!error) return;
    error.textContent = message;
    error.hidden = false;
  }
})();
