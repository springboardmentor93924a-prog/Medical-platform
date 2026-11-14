import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { supplierService } from '../../services/supplierService';
import { medicineService } from '../../services/medicineService';
import { useNotification } from '../../context/NotificationContext';

export const PurchaseOrderFormModal = ({ isOpen, onClose, onSuccess }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [allMedicines, setAllMedicines] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    { medicineId: '', requestedQuantity: 50, unitPrice: 0.0, subtotal: 0.0 },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useNotification();

  useEffect(() => {
    if (isOpen) {
      supplierService.getSuppliers().then((res) => {
        const supList = res?.data?.data || res?.data || [];
        const arr = Array.isArray(supList) ? supList : (supList.content || []);
        setSuppliers(arr.filter((s) => s.status === 'APPROVED' || !s.status));
      }).catch(err => console.error('Failed to load suppliers in PO modal', err));

      medicineService.getMedicines({ size: 100 }).then((res) => {
        const medData = res?.data?.data || res?.data || [];
        const arr = medData?.content || (Array.isArray(medData) ? medData : []);
        setAllMedicines(arr);
      }).catch(err => console.error('Failed to load medicines in PO modal', err));

      setSelectedSupplierId('');
      setExpectedDeliveryDate('');
      setNotes('');
      setItems([{ medicineId: '', requestedQuantity: 50, unitPrice: 0.0, subtotal: 0.0 }]);
    }
  }, [isOpen]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { medicineId: '', requestedQuantity: 10, unitPrice: 0.0, subtotal: 0.0 },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) {
      addToast('A purchase order must include at least one medicine item.', 'warning');
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      if (field === 'medicineId') {
        const med = allMedicines.find((m) => m.id === Number(value));
        if (med) {
          item.unitPrice = Number(med.unitPrice) || 0;
        }
      }

      const qty = Number(item.requestedQuantity) || 0;
      const price = Number(item.unitPrice) || 0;
      item.subtotal = qty * price;

      updated[index] = item;
      return updated;
    });
  };

  const grandTotal = items.reduce((acc, item) => acc + (item.subtotal || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSupplierId) {
      addToast('Please select a supplier', 'error');
      return;
    }

    const invalidItems = items.some((i) => !i.medicineId || i.requestedQuantity <= 0 || i.unitPrice <= 0);
    if (invalidItems) {
      addToast('Please ensure all items have a selected medicine, valid quantity, and positive price', 'error');
      return;
    }

    setIsLoading(true);
    const payload = {
      supplierId: Number(selectedSupplierId),
      expectedDeliveryDate: expectedDeliveryDate || null,
      notes,
      items: items.map((i) => ({
        medicineId: Number(i.medicineId),
        requestedQuantity: Number(i.requestedQuantity),
        unitPrice: Number(i.unitPrice),
      })),
    };

    try {
      await purchaseOrderService.createOrder(payload);
      addToast('Purchase order created successfully', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create purchase order', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Order"
      subtitle="Issue a new pharmaceutical requisition order to an authorized supplier"
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Supplier *</label>
            <select
              required
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
            >
              <option value="">Select Approved Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.companyName} ({s.contactPerson})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Expected Delivery Date</label>
            <input
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        {/* Order Line Items */}
        <div className="border border-slate-200/90 rounded-2xl p-4 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Order Items Requisition</h4>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem} icon={Plus}>
              Add Line Item
            </Button>
          </div>

          <div className="space-y-2.5">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2.5 items-center bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs"
              >
                <div className="col-span-12 sm:col-span-5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Medicine *</label>
                  <select
                    required
                    value={item.medicineId}
                    onChange={(e) => handleItemChange(index, 'medicineId', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">Select Medicine</option>
                    {allMedicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Batch: {m.batchNumber}) — Current Stock: {m.quantity}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.requestedQuantity}
                    onChange={(e) => handleItemChange(index, 'requestedQuantity', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="col-span-3 sm:col-span-2 text-right">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subtotal</label>
                  <span className="text-xs font-bold text-slate-800">
                    ${(item.subtotal || 0).toFixed(2)}
                  </span>
                </div>

                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Grand Total Bar */}
          <div className="flex items-center justify-between pt-2 px-2 text-sm font-bold text-slate-900 border-t border-slate-200">
            <span className="flex items-center gap-1.5 text-xs text-slate-500 uppercase font-semibold">
              <Calculator className="w-4 h-4 text-brand-600" /> Automatic Calculated Order Total:
            </span>
            <span className="text-lg text-brand-600 font-extrabold">${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Order Notes / Specifications</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special storage or transportation instructions"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Submit Purchase Order (${grandTotal.toFixed(2)})
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PurchaseOrderFormModal;
