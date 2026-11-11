/**
 * MEDISTOCK - Expiry Risk & Shelf-Life Telemetry
 * Real-time expiration monitoring, risk categorization, and audit export.
 * All information loaded dynamically from MySQL database via REST API.
 */

(() => {
  const apiBase = window.location.protocol.startsWith('http')
    ? `${window.location.origin}/api/admin`
    : 'http://localhost:8080/api/admin';

  let allBatches = [];
  let activeFilter = 'all';
  let searchQuery = '';
  let loadRequest = 0;

  document.addEventListener('DOMContentLoaded', () => {
    initExpiryListeners();
  });

  window.loadExpiryTelemetry = loadExpiryTelemetry;

  function initExpiryListeners() {
    // Filter pills
    const pills = document.querySelectorAll('#expiryFilterPills .expiry-pill');
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        setFilter(pill.dataset.filter || 'all');
      });
    });

    // Stat cards click to filter
    document.querySelector('.card-already-expired')?.addEventListener('click', () => setFilter('expired'));
    document.querySelector('.card-near-expiry')?.addEventListener('click', () => setFilter('near30'));
    document.querySelector('.card-60-days')?.addEventListener('click', () => setFilter('days60'));
    document.querySelector('.card-90-days')?.addEventListener('click', () => setFilter('days90'));

    // Search input
    const searchInput = document.getElementById('expirySearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = (e.target.value || '').trim().toLowerCase();
        renderExpiryTable();
      });
    }

    // Export button
    const exportBtn = document.getElementById('exportExpiryAuditBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportExpiryAudit);
    }
  }

  function setFilter(filterKey) {
    activeFilter = filterKey;
    const pills = document.querySelectorAll('#expiryFilterPills .expiry-pill');
    pills.forEach((p) => {
      if ((p.dataset.filter || 'all') === filterKey) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });
    renderExpiryTable();
  }

  async function loadExpiryTelemetry() {
    const tableBody = document.getElementById('expiryTableBody');
    const errorEl = document.getElementById('expiryError');
    if (!tableBody) return;

    const requestId = ++loadRequest;
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }

    tableBody.innerHTML = '<tr><td colspan="7" class="expiry-empty">Loading expiry telemetry from database...</td></tr>';

    try {
      const response = await fetch(`${apiBase}/medicines`, {
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to load medicines from database (HTTP ${response.status}).`);
      }

      const medicines = await response.json();
      if (requestId !== loadRequest) return;

      // Extract and normalize all batches from medicines catalog
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      allBatches = (Array.isArray(medicines) ? medicines : [])
        .filter((item) => item.expiryDate)
        .map((item) => {
          const expDate = new Date(item.expiryDate);
          expDate.setHours(0, 0, 0, 0);
          const diffTime = expDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let status = 'SATISFACTORY';
          let statusLabel = 'SATISFACTORY (> 90 DAYS)';
          let riskClass = 'risk-satisfactory';
          let daysColor = '#94a3b8';
          let daysText = `${diffDays} days`;

          if (diffDays < 0) {
            status = 'EXPIRED';
            statusLabel = 'EXPIRED';
            riskClass = 'risk-expired';
            daysColor = '#ef4444';
            daysText = `${Math.abs(diffDays)} days ago`;
          } else if (diffDays < 30) {
            status = 'CRITICAL';
            statusLabel = 'CRITICAL (< 30 DAYS)';
            riskClass = 'risk-critical';
            daysColor = '#f97316';
            daysText = `${diffDays} days`;
          } else if (diffDays < 60) {
            status = 'WARNING';
            statusLabel = 'WARNING (< 60 DAYS)';
            riskClass = 'risk-warning';
            daysColor = '#eab308';
            daysText = `${diffDays} days`;
          } else if (diffDays < 90) {
            status = 'ATTENTION';
            statusLabel = 'ATTENTION (< 90 DAYS)';
            riskClass = 'risk-attention';
            daysColor = '#3b82f6';
            daysText = `${diffDays} days`;
          }

          return {
            medicineId: item.medicineId,
            medicineName: item.medicineName || 'Unnamed Medicine',
            medicineCode: item.medicineCode || `MED-${item.medicineId}`,
            batchNumber: item.batchNumber || 'N/A',
            expiryDate: item.expiryDate,
            expDateObj: expDate,
            diffDays,
            daysRemainingText: daysText,
            daysColor,
            status,
            statusLabel,
            riskClass,
            quantity: item.quantity != null ? item.quantity : 0,
            rackLocation: item.rackLocation || 'Unassigned',
            supplierName: item.supplierName || 'General Supplier'
          };
        });

      // Sort by earliest expiration first
      allBatches.sort((a, b) => a.diffDays - b.diffDays);

      updateStatCards();
      renderExpiryTable();
    } catch (err) {
      if (requestId !== loadRequest) return;
      tableBody.innerHTML = '<tr><td colspan="7" class="expiry-empty">Could not load expiry telemetry from the database.</td></tr>';
      if (errorEl) {
        errorEl.textContent = err.message || 'Unable to connect to database.';
        errorEl.hidden = false;
      }
    }
  }

  function updateStatCards() {
    let expiredCount = 0;
    let near30Count = 0;
    let days60Count = 0;
    let days90Count = 0;

    allBatches.forEach((batch) => {
      if (batch.diffDays < 0) {
        expiredCount++;
      } else {
        if (batch.diffDays < 30) near30Count++;
        if (batch.diffDays < 60) days60Count++;
        if (batch.diffDays < 90) days90Count++;
      }
    });

    const elExpired = document.getElementById('statAlreadyExpired');
    const elNear30 = document.getElementById('statNearExpiry');
    const el60 = document.getElementById('stat60Days');
    const el90 = document.getElementById('stat90Days');

    if (elExpired) elExpired.textContent = expiredCount;
    if (elNear30) elNear30.textContent = near30Count;
    if (el60) el60.textContent = days60Count;
    if (el90) el90.textContent = days90Count;
  }

  function renderExpiryTable() {
    const tableBody = document.getElementById('expiryTableBody');
    const footer = document.getElementById('expiryTableFooter');
    if (!tableBody) return;

    const filtered = allBatches.filter((batch) => {
      // 1. Filter pills
      let matchesFilter = true;
      if (activeFilter === 'expired') {
        matchesFilter = batch.diffDays < 0;
      } else if (activeFilter === 'near30') {
        matchesFilter = batch.diffDays >= 0 && batch.diffDays < 30;
      } else if (activeFilter === 'days60') {
        matchesFilter = batch.diffDays >= 0 && batch.diffDays < 60;
      } else if (activeFilter === 'days90') {
        matchesFilter = batch.diffDays >= 0 && batch.diffDays < 90;
      } else if (activeFilter === 'risk90') {
        matchesFilter = batch.diffDays < 90; // All risks including expired
      }

      // 2. Search query
      let matchesSearch = true;
      if (searchQuery) {
        const text = [
          batch.medicineName,
          batch.medicineCode,
          batch.batchNumber,
          batch.rackLocation
        ].join(' ').toLowerCase();
        matchesSearch = text.includes(searchQuery);
      }

      return matchesFilter && matchesSearch;
    });

    tableBody.replaceChildren();

    if (!filtered.length) {
      tableBody.innerHTML = `<tr><td colspan="7" class="expiry-empty">${allBatches.length ? 'No batches match the selected filter.' : 'No medicine batches recorded in the database.'}</td></tr>`;
      if (footer) footer.textContent = `Showing 0 of ${allBatches.length} medicine batches`;
      return;
    }

    filtered.forEach((batch) => {
      const row = document.createElement('tr');
      const formattedDate = formatReadableDate(batch.expDateObj);

      row.innerHTML = `
        <td>
          <div class="expiry-med-name">${escapeHtml(batch.medicineName)}</div>
          <div class="expiry-med-code">${escapeHtml(batch.medicineCode)}</div>
        </td>
        <td>
          <span class="expiry-batch-badge">${escapeHtml(batch.batchNumber)}</span>
        </td>
        <td class="expiry-date-cell">${formattedDate}</td>
        <td class="expiry-days-cell">
          <span style="color: ${batch.daysColor}; font-weight: ${batch.diffDays < 60 ? '700' : '600'};">${batch.daysRemainingText}</span>
        </td>
        <td class="expiry-stock-cell">${batch.quantity} units</td>
        <td class="expiry-rack-cell">${escapeHtml(batch.rackLocation)}</td>
        <td>
          <span class="expiry-risk-badge ${batch.riskClass}">${batch.statusLabel}</span>
        </td>
      `;
      tableBody.append(row);
    });

    if (footer) {
      footer.textContent = `Showing ${filtered.length} of ${allBatches.length} medicine batches from database`;
    }
  }

  function formatReadableDate(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return 'N/A';
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = dateObj.toLocaleString('en-US', { month: 'short' });
    const year = dateObj.getFullYear();
    return `${day} ${month} ${year}`;
  }

  function exportExpiryAudit() {
    if (!allBatches.length) {
      alert('No expiry data available in the database to export.');
      return;
    }

    const headers = [
      'Medicine Name',
      'Medicine Code',
      'Batch Number',
      'Expiration Date',
      'Days Remaining',
      'Current Stock (Units)',
      'Rack Location',
      'Supplier',
      'Expiry Risk Status'
    ];

    const rows = allBatches.map((b) => [
      csvEscape(b.medicineName),
      csvEscape(b.medicineCode),
      csvEscape(b.batchNumber),
      csvEscape(b.expiryDate),
      csvEscape(b.daysRemainingText),
      b.quantity,
      csvEscape(b.rackLocation),
      csvEscape(b.supplierName),
      csvEscape(b.statusLabel)
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `medistock-expiry-audit-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function csvEscape(val) {
    const s = String(val == null ? '' : val).replace(/"/g, '""');
    return `"${s}"`;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
