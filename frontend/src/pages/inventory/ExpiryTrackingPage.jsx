import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Download, 
  Calendar, 
  CheckCircle2, 
  Pill,
  Filter
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { medicineService } from '../../services/medicineService';
import { stockService } from '../../services/stockService';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const ExpiryTrackingPage = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const canDispose = user?.role === 'ADMIN' || user?.role === 'PHARMACIST' || user?.role === 'STAFF';
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState('near_expiry'); // 'near_expiry' | 'expired'
  const [nearExpiryList, setNearExpiryList] = useState([]);
  const [expiredList, setExpiredList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Disposal Modal
  const [isDisposeModalOpen, setIsDisposeModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [disposeQty, setDisposeQty] = useState(1);
  const [disposeReason, setDisposeReason] = useState('Expired batch disposal per hospital safety protocol');
  const [isDisposing, setIsDisposing] = useState(false);

  useEffect(() => {
    fetchExpiryData();
  }, []);

  const fetchExpiryData = async () => {
    try {
      setLoading(true);
      const [nearRes, expRes] = await Promise.all([
        medicineService.getNearExpiry(60),
        medicineService.getExpired()
      ]);
      const nearData = nearRes?.data?.data || nearRes?.data || nearRes || [];
      const expData = expRes?.data?.data || expRes?.data || expRes || [];
      setNearExpiryList(Array.isArray(nearData) ? nearData : (nearData?.content || []));
      setExpiredList(Array.isArray(expData) ? expData : (expData?.content || []));
    } catch (err) {
      console.error('Error fetching expiry data', err);
      showToast('error', 'Failed to load expiry tracking records');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDispose = (medicine) => {
    setSelectedMedicine(medicine);
    setDisposeQty(medicine.quantity > 0 ? medicine.quantity : 1);
    setIsDisposeModalOpen(true);
  };

  const handleConfirmDisposal = async (e) => {
    e.preventDefault();
    if (!selectedMedicine || disposeQty <= 0) return;

    try {
      setIsDisposing(true);
      await stockService.adjustStock({
        medicineId: selectedMedicine.id,
        quantity: -disposeQty,
        reason: `${disposeReason} (Batch: ${selectedMedicine.batchNumber})`,
        referenceNumber: `DISPOSE-EXP-${Date.now().toString().slice(-6)}`
      });
      showToast('success', `Disposal of ${disposeQty} units recorded successfully`);
      setIsDisposeModalOpen(false);
      setSelectedMedicine(null);
      fetchExpiryData();
    } catch (err) {
      console.error('Disposal error', err);
      showToast('error', err.response?.data?.message || 'Failed to record disposal');
    } finally {
      setIsDisposing(false);
    }
  };

  const handleExport = async (format) => {
    try {
      showToast('info', `Generating ${format.toUpperCase()} Expiry Report...`);
      const res = await reportService.exportExpiry(format);
      const blob = new Blob([res.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medicine_expiry_audit_${new Date().toISOString().slice(0, 10)}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', 'Expiry report exported successfully');
    } catch (err) {
      console.error('Export error', err);
      showToast('error', 'Failed to export expiry report');
    }
  };

  const currentList = activeTab === 'near_expiry' ? nearExpiryList : expiredList;

  const getDaysDiff = (expiryDate) => {
    if (!expiryDate) return null;
    const diffTime = new Date(expiryDate).getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medicine Expiry Monitoring</h1>
          <p className="text-sm text-gray-500 mt-1">
            Automated intelligence tracking shelf-life, batch integrity, and hazardous expired stock.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" icon={Download} onClick={() => handleExport('pdf')}>
            Export PDF
          </Button>
          <Button variant="outline" icon={Download} onClick={() => handleExport('excel')}>
            Export Excel
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab('near_expiry')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'near_expiry'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Approaching Expiry ({nearExpiryList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expired')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'expired'
              ? 'border-rose-500 text-rose-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Hazardous / Expired ({expiredList.length})</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" message="Scanning inventory shelf-life records..." />
          </div>
        ) : currentList.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={activeTab === 'near_expiry' ? 'No near-expiry medicines' : 'No expired medicines recorded'}
              description={activeTab === 'near_expiry' ? 'All active batches have adequate shelf-life remaining.' : 'Excellent inventory hygiene! No expired batches detected in warehouse.'}
              icon={CheckCircle2}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b">
                <tr>
                  <th className="py-3 px-4">Medicine & SKU</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Time Delta</th>
                  <th className="py-3 px-4 text-center">In-Stock Qty</th>
                  <th className="py-3 px-4">Status / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentList.map((med) => {
                  const days = getDaysDiff(med.expiryDate);
                  const isExp = days !== null && days <= 0;

                  return (
                    <tr key={med.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{med.name}</div>
                        <div className="text-xs text-gray-400 font-mono">SKU: {med.sku}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">
                        {med.batchNumber}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                          {med.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-gray-700">
                        {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        {isExp ? (
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                            Expired {Math.abs(days)} days ago
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            {days} days remaining
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-900">
                        {med.quantity}
                      </td>
                      <td className="py-3 px-4">
                        {isExp ? (
                          canDispose ? (
                            <button
                              onClick={() => handleOpenDispose(med)}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded flex items-center gap-1 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Dispose Stock</span>
                            </button>
                          ) : (
                            <Badge variant="danger">Expired</Badge>
                          )
                        ) : (
                          <Badge variant="warning">FEFO Priority</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Disposal Modal */}
      {isDisposeModalOpen && selectedMedicine && (
        <Modal
          isOpen={isDisposeModalOpen}
          onClose={() => setIsDisposeModalOpen(false)}
          title="Safe Quarantine & Stock Disposal"
        >
          <form onSubmit={handleConfirmDisposal} className="space-y-4">
            <div className="p-3 bg-rose-50 rounded-lg text-xs text-rose-800 space-y-1">
              <div><strong>Medicine:</strong> {selectedMedicine.name} (Batch: {selectedMedicine.batchNumber})</div>
              <div><strong>Current Stock:</strong> {selectedMedicine.quantity} units</div>
              <div><strong>Expiry Date:</strong> {selectedMedicine.expiryDate}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Dispose</label>
              <input
                type="number"
                min="1"
                max={selectedMedicine.quantity > 0 ? selectedMedicine.quantity : 1}
                value={disposeQty}
                onChange={(e) => setDisposeQty(parseInt(e.target.value) || 1)}
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Disposal Protocol / Audit Reason</label>
              <textarea
                rows={3}
                required
                value={disposeReason}
                onChange={(e) => setDisposeReason(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDisposeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" loading={isDisposing}>
                Confirm Disposal
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ExpiryTrackingPage;
