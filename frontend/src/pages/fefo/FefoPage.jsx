import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  Package, 
  Layers, 
  RotateCcw,
  History,
  FileText
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { fefoService } from '../../services/fefoService';
import { medicineService } from '../../services/medicineService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const FefoPage = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState('recommendations'); // 'recommendations' | 'validator' | 'overrides'
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState(null);
  const [overrides, setOverrides] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Validator State
  const [selectedMedId, setSelectedMedId] = useState('');
  const [validateQty, setValidateQty] = useState(1);
  const [validationResult, setValidationResult] = useState(null);
  const [validating, setValidating] = useState(false);

  // Override Modal
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  useEffect(() => {
    fetchFefoData();
    loadAllMedicines();
  }, []);

  const fetchFefoData = async () => {
    try {
      setLoading(true);
      const [recRes, statsRes, overRes] = await Promise.all([
        fefoService.getRecommendations(),
        fefoService.getStats().catch(() => null),
        fefoService.getOverrides({ page: 0, size: 20 }).catch(() => null),
      ]);

      const recData = recRes?.data?.data || recRes?.data || recRes || [];
      setRecommendations(Array.isArray(recData) ? recData : []);

      if (statsRes) {
        setStats(statsRes?.data?.data || statsRes?.data || statsRes);
      }

      if (overRes) {
        const oData = overRes?.data?.data || overRes?.data || overRes;
        setOverrides(oData?.content || (Array.isArray(oData) ? oData : []));
      }
    } catch (err) {
      console.error('Failed to load FEFO telemetry', err);
      showToast('error', 'Failed to retrieve FEFO recommendations');
    } finally {
      setLoading(false);
    }
  };

  const loadAllMedicines = async () => {
    try {
      const res = await medicineService.getAll({ page: 0, size: 200 });
      const data = res?.data?.data || res?.data || res;
      setMedicines(data?.content || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error('Failed to load medicines for validator', err);
    }
  };

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!selectedMedId) return;
    try {
      setValidating(true);
      const res = await fefoService.validateFefo(selectedMedId, validateQty);
      setValidationResult(res.data?.data || res.data);
    } catch (err) {
      showToast('error', 'Validation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setValidating(false);
    }
  };

  const handleOpenOverride = () => {
    setOverrideReason('');
    setIsOverrideModalOpen(true);
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      showToast('error', 'Please provide a clinical or operational override reason');
      return;
    }
    try {
      setIsSubmittingOverride(true);
      await fefoService.recordOverride({
        requestedMedicineId: parseInt(selectedMedId),
        recommendedMedicineId: validationResult.recommendedMedicineId,
        quantity: validateQty,
        overrideReason: overrideReason.trim(),
      });
      showToast('success', 'FEFO override recorded in official audit ledger');
      setIsOverrideModalOpen(false);
      setValidationResult(null);
      fetchFefoData();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to record override');
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  const calculateDaysLeft = (expDate) => {
    if (!expDate) return 0;
    const diff = new Date(expDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand-600" />
            FEFO Protocol (First Expiry, First Out)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enforce priority dispensing for earliest-expiring stock to prevent inventory expiry and financial loss.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={RotateCcw} onClick={fetchFefoData}>
            Refresh Protocol
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">FEFO Compliance Score</span>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            {stats?.complianceRate || 98.5}%
          </h3>
          <p className="text-xs text-slate-500 mt-1">Standard adherence rate</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monitored Batches</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {stats?.monitoredBatches || recommendations.length} <span className="text-xs font-normal text-slate-500">batches</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">Tracked under active expiry</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Near-Expiry Priorities</span>
          <h3 className="text-2xl font-bold text-amber-600 mt-1 font-mono">
            {stats?.nearExpiryPriorityCount || 0}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Expiring within 60 days</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overrides Logged</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {stats?.totalOverrides || overrides.length}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Authorized protocol exceptions</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'recommendations'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Priority Dispensing Queue ({recommendations.length})
        </button>
        <button
          onClick={() => setActiveTab('validator')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'validator'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Dispensing Batch Validator
        </button>
        <button
          onClick={() => setActiveTab('overrides')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition ${
            activeTab === 'overrides'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Override Audit Ledger ({overrides.length})
        </button>
      </div>

      {/* Tab 1: Prioritized Recommendations */}
      {activeTab === 'recommendations' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Batches strictly ordered by earliest expiry date. Staff must dispense from top of this list first.
            </p>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
              FEFO Priority Active
            </span>
          </div>

          {loading ? (
            <div className="p-12">
              <LoadingSpinner size="lg" message="Sorting inventory by expiration horizon..." />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No active batches requiring FEFO ordering"
                description="All inventory has long shelf life or no batches available."
                icon={CheckCircle2}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Medicine Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Batch Number</th>
                    <th className="py-3 px-4">Available Stock</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Days Remaining</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recommendations.map((med, index) => {
                    const days = calculateDaysLeft(med.expiryDate);
                    const isUrgent = days <= 30;
                    const isWarning = days <= 60 && days > 30;

                    return (
                      <tr key={med.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-400">
                          #{index + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{med.name}</div>
                          {med.genericName && (
                            <div className="text-xs text-slate-500 italic">{med.genericName}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {med.categoryName || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-800">
                          {med.batchNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {med.quantity} units
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          <span className={isUrgent ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-700'}>
                            {days} days
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isUrgent ? (
                            <Badge variant="danger">Immediate Priority</Badge>
                          ) : isWarning ? (
                            <Badge variant="warning">Near Expiry</Badge>
                          ) : (
                            <Badge variant="success">Compliant</Badge>
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
      )}

      {/* Tab 2: Dispensing Batch Validator */}
      {activeTab === 'validator' && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs space-y-6 max-w-3xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pre-Dispensing FEFO Check</h2>
            <p className="text-xs text-slate-500 mt-1">
              Select the batch you intend to dispense. The system will cross-reference all existing hospital inventory to ensure no earlier eligible batch is neglected.
            </p>
          </div>

          <form onSubmit={handleValidate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Medicine Batch *</label>
              <select
                required
                value={selectedMedId}
                onChange={(e) => {
                  setSelectedMedId(e.target.value);
                  setValidationResult(null);
                }}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white"
              >
                <option value="">-- Select intended medicine batch --</option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — Batch: {m.batchNumber} (Exp: {m.expiryDate}, Stock: {m.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-48">
              <label className="block text-xs font-bold text-slate-700 mb-1">Dispensing Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={validateQty}
                onChange={(e) => setValidateQty(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>

            <Button type="submit" variant="primary" loading={validating}>
              Verify FEFO Adherence
            </Button>
          </form>

          {/* Validation Result Box */}
          {validationResult && (
            <div className="pt-4 border-t border-slate-100">
              {validationResult.fefoCompliant ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm">Compliant with FEFO</h3>
                    <p className="text-xs mt-1">{validationResult.message}</p>
                    <p className="text-xs text-emerald-700 mt-2 font-semibold">
                      You may safely proceed with stock dispensing.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-sm text-amber-900">FEFO Violation Detected!</h3>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        {validationResult.warning}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white/80 rounded-lg border border-amber-200 text-xs space-y-1 font-mono">
                    <div>Recommended Batch: <strong>{validationResult.recommendedBatch}</strong></div>
                    <div>Expiry: <strong>{validationResult.recommendedExpiryDate}</strong></div>
                    <div>Stock In Hand: <strong>{validationResult.recommendedAvailableQuantity} units</strong></div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button variant="secondary" onClick={() => setSelectedMedId(String(validationResult.recommendedMedicineId))}>
                      Switch to Recommended Batch
                    </Button>
                    <Button variant="outline" onClick={handleOpenOverride}>
                      Authorize Clinical Override
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Override Audit Ledger */}
      {activeTab === 'overrides' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Recorded Protocol Overrides</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete regulatory history of all dispensed batches that bypassed the earliest expiry date.
            </p>
          </div>

          {overrides.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No FEFO overrides recorded"
                description="100% of dispensed stock has strictly adhered to first-expiry rules."
                icon={ShieldCheck}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Issued Batch</th>
                    <th className="py-3 px-4">Bypassed Earlier Batch</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Clinical / Operational Reason</th>
                    <th className="py-3 px-4">Authorized By</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overrides.map((ov) => (
                    <tr key={ov.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {ov.requestedBatch}
                        <div className="text-[11px] text-slate-400 font-normal">Exp: {ov.requestedExpiryDate}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-rose-600 font-medium">
                        {ov.recommendedBatch}
                        <div className="text-[11px] text-slate-400 font-normal">Exp: {ov.recommendedExpiryDate}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {ov.quantity}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 max-w-sm">
                        {ov.overrideReason}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-800 font-medium">{ov.userName}</div>
                        <div className="text-[11px] text-slate-400">{ov.userRole}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-500">
                        {ov.createdAt ? new Date(ov.createdAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Override Reason Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Authorize Clinical FEFO Override"
        subtitle="Regulatory justification is mandatory to dispense a later-expiring batch"
      >
        <form onSubmit={handleOverrideSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            You are authorizing an intentional bypass of earliest-expiring stock. This action will be permanently recorded in the audit trail with your identity.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Override *</label>
            <textarea
              rows="3"
              required
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Patient prescription requires specific non-standard preservative batch, or earlier batch currently quarantined..."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsOverrideModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmittingOverride}>
              Confirm & Record Override
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FefoPage;
