(() => {
  const apiBase = window.location.protocol.startsWith('http')
    ? `${window.location.origin}/api/admin/pos`
    : 'http://localhost:8080/api/admin/pos';

  const cart = new Map();
  let availableMedicines = [];
  let submitting = false;
  let searchTimer = null;

  window.addEventListener('beforeprint', () => {
    document.body.classList.add('pos-printing');
  });
  window.addEventListener('afterprint', () => {
    document.body.classList.remove('pos-printing');
  });

  document.addEventListener('DOMContentLoaded', () => {
    const search = document.getElementById('posMedicineSearch');
    const results = document.getElementById('posMedicineResults');
    const cartItems = document.getElementById('posCartItems');
    const discountInput = document.getElementById('posDiscountAmount');
    const checkoutForm = document.getElementById('posCheckoutForm');
    const quickFillBtn = document.getElementById('posQuickFillBtn');
    const receiptModal = document.getElementById('posReceiptModal');
    const closeReceiptBtn = document.getElementById('posCloseReceiptModalBtn');

    if (!search || !results || !cartItems || !discountInput || !checkoutForm) return;

    // Quick fill customer information
    if (quickFillBtn) {
      quickFillBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('posCustomerName');
        const phoneInput = document.getElementById('posCustomerPhone');
        const paymentInput = document.getElementById('posPaymentMethod');
        if (nameInput) nameInput.value = 'Rahul Sharma';
        if (phoneInput) phoneInput.value = '+91 98765 43210';
        if (paymentInput) paymentInput.value = 'CASH';
        clearError();
        nameInput?.focus();
      });
    }

    // Search / filter medicines
    search.addEventListener('input', () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        const query = search.value.trim().toLowerCase();
        filterAndRenderMedicines(query);
      }, 120);
    });

    // Clicking a medicine in available medicines list
    results.addEventListener('click', (event) => {
      const button = event.target.closest('[data-pos-medicine-id]');
      if (!button) return;
      try {
        const medicine = JSON.parse(button.dataset.medicine);
        addMedicine(medicine);
      } catch {
        const id = Number(button.dataset.posMedicineId);
        const medicine = availableMedicines.find(m => m.medicineId === id);
        if (medicine) addMedicine(medicine);
      }
    });

    // Cart items interactions: quantity change, increment, decrement, remove
    cartItems.addEventListener('input', (event) => {
      const input = event.target.closest('[data-pos-quantity]');
      if (!input) return;
      const item = cart.get(Number(input.dataset.posQuantity));
      if (!item) return;
      const quantity = Number.parseInt(input.value, 10);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > item.availableQuantity) {
        input.setCustomValidity(`Enter a quantity from 1 to ${item.availableQuantity}.`);
        input.reportValidity();
        return;
      }
      input.setCustomValidity('');
      item.quantity = quantity;
      updateTotals();
    });

    cartItems.addEventListener('click', (event) => {
      const removeBtn = event.target.closest('[data-pos-remove]');
      if (removeBtn) {
        cart.delete(Number(removeBtn.dataset.posRemove));
        renderCart();
        return;
      }

      const stepBtn = event.target.closest('[data-pos-step]');
      if (stepBtn) {
        const id = Number(stepBtn.dataset.medId);
        const item = cart.get(id);
        if (!item) return;
        const delta = Number(stepBtn.dataset.posStep);
        const newQty = item.quantity + delta;
        if (newQty >= 1 && newQty <= item.availableQuantity) {
          item.quantity = newQty;
          renderCart();
        } else if (newQty < 1) {
          cart.delete(id);
          renderCart();
        }
      }
    });

    // Discount change
    discountInput.addEventListener('input', updateTotals);

    // Form submission
    checkoutForm.addEventListener('submit', submitSale);

    // Receipt Modal controls
    if (receiptModal) {
      receiptModal.addEventListener('click', (e) => {
        if (e.target === receiptModal || e.target.closest('#posCloseReceiptModalBtn') || e.target.closest('[data-close-pos-receipt]')) {
          closeReceiptModal();
        }
        const printBtn = e.target.closest('[data-print-pos-receipt]');
        if (printBtn) {
          window.print();
        }
      });
    }

    if (closeReceiptBtn) {
      closeReceiptBtn.addEventListener('click', closeReceiptModal);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && receiptModal && !receiptModal.hidden) {
        closeReceiptModal();
      }
    });

    // Initial load
    loadAvailableMedicines();
    renderCart();
  });

  async function loadAvailableMedicines() {
    const results = document.getElementById('posMedicineResults');
    const countLabel = document.getElementById('posAvailableCount');
    if (!results) return;

    if (countLabel) countLabel.textContent = 'Loading stock...';
    try {
      const response = await fetch(`${apiBase}/medicines?search=`);
      const data = await readResponse(response);
      availableMedicines = Array.isArray(data) ? data : [];
      const query = document.getElementById('posMedicineSearch')?.value.trim().toLowerCase() || '';
      filterAndRenderMedicines(query);
    } catch (err) {
      if (countLabel) countLabel.textContent = 'Error loading stock';
      results.innerHTML = `<p class="pos-empty-state" style="color: #fb7185;">Could not load medicines (${escapeHtml(err.message)}).</p>`;
    }
  }

  function filterAndRenderMedicines(query) {
    const results = document.getElementById('posMedicineResults');
    const countLabel = document.getElementById('posAvailableCount');
    if (!results) return;

    const filtered = query
      ? availableMedicines.filter(m =>
          (m.medicineName && m.medicineName.toLowerCase().includes(query)) ||
          (m.genericName && m.genericName.toLowerCase().includes(query)) ||
          (m.dosage && m.dosage.toLowerCase().includes(query)) ||
          String(m.medicineId).includes(query)
        )
      : availableMedicines;

    if (countLabel) {
      countLabel.textContent = `${filtered.length} medicine${filtered.length === 1 ? '' : 's'} available`;
    }

    results.replaceChildren();
    if (!filtered.length) {
      results.innerHTML = `<p class="pos-empty-state">${query ? 'No matching in-stock medicines found.' : 'No sellable medicines currently in stock.'}</p>`;
      return;
    }

    for (const medicine of filtered) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pos-medicine-result';
      button.dataset.posMedicineId = medicine.medicineId;
      button.dataset.medicine = JSON.stringify(medicine);
      button.title = `Click to add ${escapeHtml(medicine.medicineName)} to bill`;
      button.innerHTML = `
        <span class="pos-result-name">
          ${escapeHtml(medicine.medicineName)}
          <small>${escapeHtml(medicine.genericName || medicine.dosage || 'Available')}</small>
        </span>
        <span class="pos-result-stock" style="display: flex; align-items: center; gap: 6px;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span>
          ${medicine.availableQuantity} in stock
        </span>
        <strong style="display: flex; align-items: center; gap: 8px;">
          <span>${formatCurrency(medicine.sellingPrice)}</span>
          <span style="font-size: 0.75rem; padding: 3px 8px; border-radius: 5px; background: rgba(37,99,235,0.22); color: #60a5fa; border: 1px solid rgba(37,99,235,0.4);">+ Add</span>
        </strong>
      `;
      results.append(button);
    }
  }

  function addMedicine(medicine) {
    const id = Number(medicine.medicineId);
    if (!Number.isInteger(id) || !Number.isInteger(Number(medicine.availableQuantity)) || Number(medicine.availableQuantity) < 1) {
      showError('This medicine is not currently available for sale.');
      return;
    }
    const existing = cart.get(id);
    if (existing) {
      if (existing.quantity >= existing.availableQuantity) {
        showError(`Only ${existing.availableQuantity} units of "${existing.medicineName}" are available.`);
        return;
      }
      existing.quantity += 1;
    } else {
      cart.set(id, {
        ...medicine,
        medicineId: id,
        quantity: 1,
        availableQuantity: Number(medicine.availableQuantity)
      });
    }
    clearError();
    renderCart();
  }

  function renderCart() {
    const cartItems = document.getElementById('posCartItems');
    const cartCount = document.getElementById('posCartItemCount');
    if (!cartItems) return;

    if (cartCount) {
      const totalUnits = [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);
      cartCount.textContent = `${cart.size} item${cart.size === 1 ? '' : 's'} (${totalUnits} unit${totalUnits === 1 ? '' : 's'})`;
    }

    cartItems.replaceChildren();
    if (!cart.size) {
      cartItems.innerHTML = '<p class="pos-empty-state">No items added to current bill. Click any medicine above to add.</p>';
      updateTotals();
      return;
    }

    for (const item of cart.values()) {
      const row = document.createElement('div');
      row.className = 'pos-cart-item';
      row.innerHTML = `
        <div class="pos-cart-item-info">
          <strong>${escapeHtml(item.medicineName)}</strong>
          <span>${formatCurrency(item.sellingPrice)} per unit &middot; max ${item.availableQuantity}</span>
        </div>
        <div style="display: inline-flex; align-items: center; border: 1px solid var(--border-subtle); border-radius: 6px; overflow: hidden; background: var(--bg-secondary);">
          <button type="button" data-pos-step="-1" data-med-id="${item.medicineId}" style="width: 24px; height: 32px; border: 0; background: transparent; color: var(--text-muted); cursor: pointer; font-size: 1rem; line-height: 1;">-</button>
          <input type="number" min="1" max="${item.availableQuantity}" value="${item.quantity}" aria-label="Quantity for ${escapeHtml(item.medicineName)}" data-pos-quantity="${item.medicineId}" style="width: 36px; height: 32px; border: 0; background: transparent; text-align: center; padding: 0; font-size: 0.85rem; color: var(--text-main);">
          <button type="button" data-pos-step="1" data-med-id="${item.medicineId}" style="width: 24px; height: 32px; border: 0; background: transparent; color: var(--text-muted); cursor: pointer; font-size: 1rem; line-height: 1;">+</button>
        </div>
        <strong class="pos-line-total">${formatCurrency(Number(item.sellingPrice) * item.quantity)}</strong>
        <button class="pos-remove-item" type="button" data-pos-remove="${item.medicineId}" aria-label="Remove ${escapeHtml(item.medicineName)}" title="Remove item">&times;</button>
      `;
      cartItems.append(row);
    }
    updateTotals();
  }

  function updateTotals() {
    const subtotal = [...cart.values()].reduce((sum, item) => sum + Number(item.sellingPrice) * item.quantity, 0);
    const discountInput = document.getElementById('posDiscountAmount');
    const discount = Number(discountInput?.value || 0);
    const subtotalElement = document.getElementById('posSubtotal');
    const totalElement = document.getElementById('posGrandTotal');
    const submitButton = document.getElementById('posConfirmSaleBtn');

    for (const item of cart.values()) {
      const lineTotal = document.querySelector(`[data-pos-quantity="${item.medicineId}"]`)
        ?.closest('.pos-cart-item')
        ?.querySelector('.pos-line-total');
      if (lineTotal) lineTotal.textContent = formatCurrency(Number(item.sellingPrice) * item.quantity);
    }

    if (subtotalElement) subtotalElement.textContent = formatCurrency(subtotal);
    if (totalElement) totalElement.textContent = formatCurrency(Math.max(0, subtotal - discount));
    if (discountInput) discountInput.max = subtotal.toFixed(2);

    if (submitButton) {
      submitButton.disabled = submitting;
    }
  }

  async function submitSale(event) {
    event.preventDefault();
    if (submitting) return;

    if (cart.size === 0) {
      showError('⚠️ Please add at least one medicine from the available list before confirming the sale.');
      document.getElementById('posMedicineSearch')?.focus();
      return;
    }

    const customerName = document.getElementById('posCustomerName').value.trim();
    if (!customerName) {
      showError('⚠️ Customer Name is required. Click "⚡ Quick Fill Info" to auto-fill.');
      document.getElementById('posCustomerName').focus();
      return;
    }

    const customerPhone = document.getElementById('posCustomerPhone').value.trim();
    if (!customerPhone) {
      showError('⚠️ Customer Phone is required.');
      document.getElementById('posCustomerPhone').focus();
      return;
    }

    const paymentMethod = document.getElementById('posPaymentMethod').value;
    const discount = Number(document.getElementById('posDiscountAmount').value || 0);
    const estimatedSubtotal = [...cart.values()].reduce((sum, item) => sum + Number(item.sellingPrice) * item.quantity, 0);

    if (!Number.isFinite(discount) || discount < 0 || discount > estimatedSubtotal) {
      showError('⚠️ Discount must be between zero and the invoice subtotal.');
      return;
    }

    submitting = true;
    clearError();
    const button = document.getElementById('posConfirmSaleBtn');
    if (button) {
      button.disabled = true;
      button.textContent = 'Processing Sale & Saving...';
    }

    try {
      const response = await fetch(`${apiBase}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName,
          customerPhone: customerPhone,
          paymentMethod: paymentMethod,
          discountAmount: discount.toFixed(2),
          items: [...cart.values()].map((item) => ({ medicineId: item.medicineId, quantity: item.quantity }))
        })
      });

      const sale = await readResponse(response);

      // Render Print Area
      renderReceipt(sale);

      // Show on-screen Receipt Modal
      showReceiptModal(sale);

      // Trigger Browser Print Dialog
      setTimeout(() => {
        window.print();
      }, 350);

      // Reset form and cart
      cart.clear();
      event.target.reset();
      document.getElementById('posDiscountAmount').value = '0.00';
      renderCart();

      // Refresh available stock
      await loadAvailableMedicines();

      // Refresh Sales History if available
      if (window.loadSalesHistory) {
        window.loadSalesHistory();
      }
    } catch (error) {
      showError(error.message || 'Sale could not be saved. No receipt was printed.');
    } finally {
      submitting = false;
      if (button) {
        button.disabled = false;
        button.innerHTML = '<span aria-hidden="true">&#8377;</span> Confirm Sale &amp; Print';
      }
      updateTotals();
    }
  }

  function showReceiptModal(sale) {
    const modal = document.getElementById('posReceiptModal');
    const content = document.getElementById('posReceiptModalContent');
    if (!modal || !content) return;

    const items = Array.isArray(sale.items) ? sale.items : [];
    const itemRows = items.map(item => `
      <tr>
        <td style="padding: 9px 12px; border-bottom: 1px solid var(--border-subtle);">
          <strong style="color: var(--text-main); font-size: 0.88rem;">${escapeHtml(item.medicineName)}</strong>
          <small style="display: block; color: var(--text-dim); font-size: 0.74rem;">Batch: ${escapeHtml(item.batchNumber || 'STANDARD')}</small>
        </td>
        <td style="padding: 9px 12px; border-bottom: 1px solid var(--border-subtle); text-align: center; color: var(--text-main); font-weight: 600;">${item.quantity}</td>
        <td style="padding: 9px 12px; border-bottom: 1px solid var(--border-subtle); text-align: right; color: var(--text-muted);">${formatCurrency(item.unitPrice)}</td>
        <td style="padding: 9px 12px; border-bottom: 1px solid var(--border-subtle); text-align: right; color: var(--text-main); font-weight: 700;">${formatCurrency(item.lineTotal)}</td>
      </tr>
    `).join('');

    const saleDate = sale.saleDate ? new Date(sale.saleDate).toLocaleString() : new Date().toLocaleString();

    content.innerHTML = `
      <div style="padding: 6px 0 16px;">
        <div style="background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 10px 14px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px; color: #10b981; font-weight: 600; font-size: 0.88rem;">
            <span>✓ Sale Confirmed &amp; Added to Sales History</span>
          </div>
          <span style="background: #10b981; color: #fff; font-size: 0.72rem; font-weight: 700; padding: 3px 8px; border-radius: 4px;">PAID</span>
        </div>

        <div class="sales-detail-summary">
          <div><span>Invoice Number</span><strong style="color: #60a5fa; font-size: 0.95rem;">${escapeHtml(sale.invoiceNumber)}</strong></div>
          <div><span>Date &amp; Time</span><strong>${escapeHtml(saleDate)}</strong></div>
          <div><span>Customer Name</span><strong>${escapeHtml(sale.customerName)}</strong></div>
          <div><span>Customer Phone</span><strong>${escapeHtml(sale.customerPhone)}</strong></div>
          <div><span>Cashier</span><strong>${escapeHtml(sale.cashier || 'MediStock Admin')}</strong></div>
          <div><span>Payment Mode</span><strong style="text-transform: uppercase;">${escapeHtml(sale.paymentMethod)}</strong></div>
        </div>

        <div class="sales-detail-items-scroll" style="margin-top: 16px;">
          <table class="sales-detail-items" style="width: 100%;">
            <thead>
              <tr style="background: rgba(255,255,255,0.02);">
                <th style="padding: 10px 12px;">Medicine / Batch</th>
                <th style="padding: 10px 12px; text-align: center;">Qty</th>
                <th style="padding: 10px 12px; text-align: right;">Price</th>
                <th style="padding: 10px 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
        </div>

        <div class="sales-detail-totals" style="margin-top: 16px;">
          <p><span>Subtotal:</span><strong>${formatCurrency(sale.subtotal)}</strong></p>
          <p><span>Discount:</span><strong style="color: #fb7185;">- ${formatCurrency(sale.discountAmount)}</strong></p>
          <p class="sales-detail-grand"><span>Grand Total Paid:</span><strong style="color: #10b981; font-size: 1.15rem;">${formatCurrency(sale.totalAmount)}</strong></p>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; border-top: 1px solid var(--border-subtle); padding-top: 16px;">
          <button type="button" class="users-secondary-btn" data-close-pos-receipt style="min-height: 38px; padding: 0 16px;">
            ✕ Close &amp; New Sale
          </button>
          <button type="button" class="sales-detail-print-btn" data-print-pos-receipt style="display: inline-flex; align-items: center; gap: 7px; min-height: 38px; padding: 0 18px; background: #2563eb; color: #fff; border: 0; border-radius: 8px; font-weight: 600; cursor: pointer;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 14h12v8H6z"></path></svg>
            Print Receipt
          </button>
        </div>
      </div>
    `;

    modal.hidden = false;
    modal.classList.add('is-open');
    document.body.classList.add('pos-modal-open');
  }

  function closeReceiptModal() {
    const modal = document.getElementById('posReceiptModal');
    if (!modal) return;
    modal.hidden = true;
    modal.classList.remove('is-open');
    document.body.classList.remove('pos-modal-open');
  }

  function renderReceipt(sale) {
    const receipt = document.getElementById('posReceiptPrintArea');
    if (!receipt || !sale || !Array.isArray(sale.items)) return;
    const rows = sale.items.map((item) => `
      <tr>
        <td>${escapeHtml(item.medicineName)}<small>Batch: ${escapeHtml(item.batchNumber || 'STANDARD')}</small></td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
        <td style="text-align: right;">${formatCurrency(item.lineTotal)}</td>
      </tr>
    `).join('');
    const saleDate = sale.saleDate ? new Date(sale.saleDate).toLocaleString() : new Date().toLocaleString();
    receipt.innerHTML = `
      <div class="pos-receipt">
        <header>
          <h1>MediStock Pharmacy</h1>
          <p>Official Sales Receipt / Tax Invoice</p>
        </header>
        <div class="pos-receipt-meta">
          <p><strong>Invoice:</strong> ${escapeHtml(sale.invoiceNumber)}</p>
          <p><strong>Date:</strong> ${escapeHtml(saleDate)}</p>
          <p><strong>Customer:</strong> ${escapeHtml(sale.customerName)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(sale.customerPhone)}</p>
          <p><strong>Payment:</strong> ${escapeHtml(sale.paymentMethod)} (PAID)</p>
          <p><strong>Cashier:</strong> ${escapeHtml(sale.cashier || 'MediStock Admin')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Medicine / Batch</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="pos-receipt-totals">
          <p><span>Subtotal:</span><strong>${formatCurrency(sale.subtotal)}</strong></p>
          <p><span>Discount:</span><strong>- ${formatCurrency(sale.discountAmount)}</strong></p>
          <p class="pos-receipt-grand"><span>Total Paid:</span><strong>${formatCurrency(sale.totalAmount)}</strong></p>
        </div>
        <footer>
          <p>Thank you for choosing MediStock Pharmacy!</p>
          <p>Please retain this receipt for your medical records.</p>
        </footer>
      </div>
    `;
  }

  async function readResponse(response) {
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.detail || data?.message || data?.error || `Request failed (HTTP ${response.status}).`);
    return data;
  }

  function showError(message) {
    const errorElement = document.getElementById('posErrorMessage');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.hidden = false;
    }
  }

  function clearError() {
    const errorElement = document.getElementById('posErrorMessage');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.hidden = true;
    }
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

  window.refreshPosMedicines = async function refreshPosMedicines() {
    await loadAvailableMedicines();
  };
})();
