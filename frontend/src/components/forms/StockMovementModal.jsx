import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { stockService } from '../../services/stockService';
import { medicineService } from '../../services/medicineService';
import { useNotification } from '../../context/NotificationContext';

export const StockMovementModal = ({ isOpen, onClose, preselectedMedicine = null, onSuccess }) => {
  const [medicines, setMedicines] = useState([]);
  const [medicineId, setMedicineId] = useState('');
  const [movementType, setMovementType] = useState('STOCK_OUT');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useNotification();

  useEffect(() => {
    if (isOpen) {
      medicineService.getMedicines({ size: 100 }).then((res) => {
        if (res.success) setMedicines(res.data?.content || []);
      });

      if (preselectedMedicine) {
        setMedicineId(preselectedMedicine.id);
      } else {
        setMedicineId('');
      }
      setMovementType('STOCK_OUT');
      setQuantity(1);
      setReason('');
      setReferenceNumber('TX-' + Date.now().toString().slice(-6));
    }
  }, [isOpen, preselectedMedicine]);

  const selectedMedObj = medicines.find((m) => m.id === Number(medicineId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!medicineId) {
      addToast('Please select a medicine', 'error');
      return;
    }

    if (quantity <= 0) {
      addToast('Quantity must be greater than zero', 'error');
      return;
    }

    if (movementType === 'STOCK_OUT' && selectedMedObj && selectedMedObj.quantity < quantity) {
      addToast(
        `Insufficient stock for ${selectedMedObj.name}. Available: ${selectedMedObj.quantity}, requested: ${quantity}`,
        'error'
      );
      return;
    }

    setIsLoading(true);
    try {
      await stockService.recordMovement({
        medicineId: Number(medicineId),
        movementType,
        quantity: Number(quantity),
        reason,
        referenceNumber,
      });
      addToast('Stock movement recorded successfully', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to record movement', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Stock Movement"
      subtitle="Track stock-in, dispensing, disposal, or inventory reconciliation"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Medicine *</label>
          <select
            required
            value={medicineId}
            onChange={(e) => setMedicineId(e.target.value)}
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
          >
            <option value="">Select Medicine Item</option>
            {medicines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} (Batch: {m.batchNumber}) — In Stock: {m.quantity}
              </option>
            ))}
          </select>
          {selectedMedObj && (
            <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Current Stock on Hand: <strong className="text-slate-900">{selectedMedObj.quantity} units</strong></span>
              <span>Min. Level: <strong>{selectedMedObj.minimumStockLevel}</strong></span>
              <span>Expires: <strong>{selectedMedObj.expiryDate}</strong></span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Movement Type *</label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
            >
              <option value="STOCK_OUT">Stock-Out (Dispense / Ward Issue)</option>
              <option value="STOCK_IN">Stock-In (Replenishment)</option>
              <option value="ADJUSTMENT">Stock Adjustment (Reconciliation)</option>
              <option value="RETURN">Return to Supplier</option>
              <option value="DISPOSAL">Disposal (Expired / Damaged)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {movementType === 'ADJUSTMENT' ? 'New Reconciled Stock Quantity *' : 'Quantity *'}
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reference Number</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. DISP-2026-901"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Prescription Note *</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Ward 4 emergency dispensing"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Record Movement
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default StockMovementModal;
