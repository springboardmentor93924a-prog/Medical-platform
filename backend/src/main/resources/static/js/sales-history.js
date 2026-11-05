(() => {
  const apiUrl = 'http://localhost:8080/api/admin/pos/sales';
  let sales = [];
  let requestNumber = 0;

  document.addEventListener('DOMContentLoaded', () => {
    const search = document.getElementById('salesHistorySearch');
    const refresh = document.getElementById('salesHistoryRefreshBtn');
    const body = document.getElementById('salesHistoryTableBody');
    const modal = document.getElementById('salesDetailModal');

    if (!search || !refresh || !body || !modal) return;

    search.addEventListener('input', renderSales);
    refresh.addEventListener('click', () => loadSalesHistory());
    body.addEventListener('click', (event) => {
      const invoiceLink = event.target.closest('[data-sale-id]');
      if (invoiceLink) showSaleDetails(invoiceLink.dataset.saleId);
    });
    modal.addEventListener('click', (event) => {
      if (event.target === modal || event.target.closest('[data-close-sales-detail]')) closeSaleDetails();
      const printButton = event.target.closest('[data-print-sales-detail]');
      if (printButton) window.print();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !modal.hidden) closeSaleDetails();
    });
    window.addEventListener('beforeprint', () => {
      if (!modal.hidden) document.body.classList.add('sales-detail-printing');
    });
    window.addEventListener('afterprint', () => document.body.classList.remove('sales-detail-printing'));
    loadSalesHistory();
  });

  window.loadSalesHistory = loadSalesHistory;

  async function loadSalesHistory() {
    const body = document.getElementById('salesHistoryTableBody');
    const error = document.getElementById('salesHistoryError');
    const refresh = document.getElementById('salesHistoryRefreshBtn');
    if (!body || !error) return;

    const requestId = ++requestNumber;
    error.hidden = true;
    error.textContent = '';
    body.innerHTML = '<tr><td colspan="6" class="sales-history-empty">Loading sales from the database...</td></tr>';
    if (refresh) refresh.disabled = true;

    try {
      const response = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
      const result = await readResponse(response);
      if (requestId !== requestNumber) return;
      if (!Array.isArray(result)) throw new Error('The sales API returned an unexpected response.');
      sales = result;
      renderSales();
    } catch (loadError) {
      if (requestId !== requestNumber) return;
      sales = [];
      body.innerHTML = '<tr><td colspan="6" class="sales-history-empty">Sales could not be loaded from the database.</td></tr>';
      error.textContent = loadError.message || 'Unable to load sales history. Please try again.';
      error.hidden = false;
      updateFooter(0, 0);
    } finally {
      if (requestId === requestNumber && refresh) refresh.disabled = false;
    }
  }

  function renderSales() {
    const body = document.getElementById('salesHistoryTableBody');
    if (!body) return;
    const query = document.getElementById('salesHistorySearch')?.value.trim().toLocaleLowerCase() || '';
    const visibleSales = sales.filter((sale) => [
      sale.invoiceNumber, sale.customerName, sale.customerPhone, sale.cashier
    ].some((value) => String(value || '').toLocaleLowerCase().includes(query)));

    body.replaceChildren();
    if (!visibleSales.length) {
      body.innerHTML = `<tr><td colspan="6" class="sales-history-empty">${sales.length ? 'No sales match your search.' : 'No completed sales are recorded in the database yet.'}</td></tr>`;
      updateFooter(0, sales.length);
      return;
    }

    for (const sale of visibleSales) {
      const row = document.createElement('tr');
      const paymentMode = String(sale.paymentMethod || 'UNKNOWN').toUpperCase();
      row.innerHTML = `
        <td><button type="button" class="sales-invoice-link" data-sale-id="${escapeHtml(sale.saleId)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M8 13h8M8 17h8"></path></svg>
          ${escapeHtml(sale.invoiceNumber || `Sale ${sale.saleId}`)}
        </button></td>
        <td class="sales-history-date">${escapeHtml(formatDate(sale.saleDate))}</td>
        <td><span class="sales-history-customer">${escapeHtml(sale.customerName || 'Walk-in customer')}</span><small class="sales-history-phone">${escapeHtml(sale.customerPhone || '')}</small></td>
        <td class="sales-history-cashier">${escapeHtml(sale.cashier || 'MediStock Admin')}</td>
        <td><span class="sales-payment-badge payment-${escapeHtml(paymentMode.toLowerCase())}">${escapeHtml(paymentMode)}</span></td>
        <td class="sales-history-total">${formatCurrency(sale.totalAmount)}${Number(sale.discountAmount || 0) > 0 ? `<small>Disc: -${formatCurrency(sale.discountAmount)}</small>` : ''}</td>`;
      body.append(row);
    }
    updateFooter(visibleSales.length, sales.length);
  }

  async function showSaleDetails(id) {
    const modal = document.getElementById('salesDetailModal');
    const content = document.getElementById('salesDetailContent');
    const title = document.getElementById('salesDetailTitle');
    if (!modal || !content || !title) return;

    content.innerHTML = '<p class="sales-detail-loading">Loading invoice details...</p>';
    modal.hidden = false;
    modal.classList.add('is-open');
    document.body.classList.add('sales-detail-open');
    try {
      const response = await fetch(`${apiUrl}/${encodeURIComponent(id)}`, { headers: { Accept: 'application/json' } });
      const sale = await readResponse(response);
      title.textContent = `Invoice ${sale.invoiceNumber || ''}`;
      renderSaleDetails(sale);
    } catch (error) {
      content.innerHTML = `<p class="sales-detail-error">${escapeHtml(error.message || 'Unable to load this invoice.')}</p>`;
    }
  }

  function renderSaleDetails(sale) {
    const content = document.getElementById('salesDetailContent');
    if (!content) return;
    const items = Array.isArray(sale.items) ? sale.items : [];
    const itemRows = items.map((item) => `<tr><td>${escapeHtml(item.medicineName)}<small>Batch ${escapeHtml(item.batchNumber)}</small></td><td>${escapeHtml(item.quantity)}</td><td>${formatCurrency(item.unitPrice)}</td><td>${formatCurrency(item.lineTotal)}</td></tr>`).join('');
    content.innerHTML = `
      <div class="sales-detail-summary">
        <div><span>Invoice number</span><strong>${escapeHtml(sale.invoiceNumber)}</strong></div>
        <div><span>Date &amp; time</span><strong>${escapeHtml(formatDate(sale.saleDate))}</strong></div>
        <div><span>Customer</span><strong>${escapeHtml(sale.customerName || 'Walk-in customer')}</strong></div>
        <div><span>Phone</span><strong>${escapeHtml(sale.customerPhone || '—')}</strong></div>
        <div><span>Sold by</span><strong>${escapeHtml(sale.cashier || 'MediStock Admin')}</strong></div>
        <div><span>Payment mode</span><strong>${escapeHtml(sale.paymentMethod || '—')}</strong></div>
      </div>
      <div class="sales-detail-items-scroll"><table class="sales-detail-items">
        <thead><tr><th>Medicine / Batch</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead>
        <tbody>${itemRows || '<tr><td colspan="4">No line items recorded for this invoice.</td></tr>'}</tbody>
      </table></div>
      <div class="sales-detail-totals">
        <p><span>Subtotal</span><strong>${formatCurrency(sale.subtotal)}</strong></p>
        <p><span>Discount</span><strong>- ${formatCurrency(sale.discountAmount)}</strong></p>
        <p class="sales-detail-grand"><span>Total paid</span><strong>${formatCurrency(sale.totalAmount)}</strong></p>
      </div>
      <div class="sales-detail-actions"><button type="button" class="sales-detail-print-btn" data-print-sales-detail>Print Invoice</button></div>`;
  }

  function closeSaleDetails() {
    const modal = document.getElementById('salesDetailModal');
    if (!modal) return;
    modal.hidden = true;
    modal.classList.remove('is-open');
    document.body.classList.remove('sales-detail-open', 'sales-detail-printing');
  }

  function updateFooter(visible, total) {
    const footer = document.getElementById('salesHistoryFooter');
    if (footer) footer.textContent = `Showing ${visible} of ${total} ${total === 1 ? 'sale' : 'sales'}`;
  }

  async function readResponse(response) {
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.detail || data?.message || data?.error || `Request failed (HTTP ${response.status}).`);
    return data;
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    }).format(date);
  }

  function formatCurrency(value) {
    const amount = Number(value);
    return `₹${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }
})();
