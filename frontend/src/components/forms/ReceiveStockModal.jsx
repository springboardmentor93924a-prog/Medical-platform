import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { useNotification } from '../../context/NotificationContext';

export const ReceiveStockModal = ({ isOpen, onClose, purchaseOrder = null, onSuccess }) => {
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useNotification();

  useEffect(() => {
    if (purchaseOrder && purchaseOrder.items) {
      setItems(
        purchaseOrder.items.map((i) => ({
          itemId: i.id,
          medicineName: i.medicine?.name || 'Medicine Item',
          batchNumber: i.medicine?.batchNumber || '-',
          requestedQuantity: i.requestedQuantity,
          previouslyReceived: i.receivedQuantity || 0,
          remaining: Math.max(0, i.requestedQuantity - (i.receivedQuantity || 0)),
          receivedQuantity: Math.max(0, i.requestedQuantity - (i.receivedQuantity || 0)),
        }))
      );
      setNotes('');
    }
  }, [purchaseOrder, isOpen]);

  const handleQtyChange = (itemId, val) => {
    const num = val === '' ? '' : Math.max(0, Number(val));
    setItems((prev) =>
      prev.map((i) => (i.itemId === itemId ? { ...i, receivedQuantity: num } : i))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const totalToReceive = items.reduce((acc, i) => acc + (Number(i.receivedQuantity) || 0), 0);
    if (totalToReceive <= 0) {
      addToast('Please specify a received quantity greater than 0 for at least one item.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const payload = items.map((i) => ({
        itemId: i.itemId,
        receivedQuantity: Number(i.receivedQuantity) || 0,
      }));

      await purchaseOrderService.receiveStock(purchaseOrder.id, payload, notes);
      addToast('Stock received and medicine inventory updated successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to receive stock', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receive Stock — Order ${purchaseOrder?.poNumber || ''}`}
      subtitle="Inspect incoming shipment and record received pharmaceutical quantities into live inventory"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Medicine & Batch</th>
                <th className="px-3 py-3 text-center">Ordered</th>
                <th className="px-3 py-3 text-center">Prev. Received</th>
                <th className="px-4 py-3 text-center">Receive Now</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((i) => (
                <tr key={i.itemId} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-800">{i.medicineName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Batch: {i.batchNumber}</p>
                  </td>
                  <td className="px-3 py-3 text-center font-medium text-slate-700">{i.requestedQuantity}</td>
                  <td className="px-3 py-3 text-center text-slate-500">{i.previouslyReceived}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max={i.requestedQuantity - i.previouslyReceived}
                      value={i.receivedQuantity}
                      onChange={(e) => handleQtyChange(i.itemId, e.target.value)}
                      className="w-24 px-2 py-1 text-center font-bold text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Receipt / Verification Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Shipment verified against delivery challan #9882. Goods in good condition."
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="success" isLoading={isLoading}>
            Confirm Goods Receipt & Update Inventory
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ReceiveStockModal;
