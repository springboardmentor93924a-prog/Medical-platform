import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  DollarSign, 
  Package, 
  Clock, 
  FileText,
  RotateCcw
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { wastageService } from '../../services/wastageService';
import { medicineService } from '../../services/medicineService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const WastagePage = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const isAdmin = user?.role === 'ADMIN';

  const [reports, setReports] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Report Form State
  const [reportForm, setReportForm] = useState({
    medicineId: '',
    quantityWasted: 1,
    reason: 'EXPIRED',
    description: '',
  });

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: 10,
        status: statusFilter || undefined,
      };

      const [res, statsRes] = await Promise.all([
        isAdmin ? wastageService.getAllReports(params) : wastageService.getMyReports(params),
        wastageService.getStats().catch(() => null),
      ]);

      const data = res?.data?.data || res?.data || res;
      setReports(data?.content || (Array.isArray(data) ? data : []));
      setTotalPages(data?.totalPages || 1);

      if (statsRes) {
        setStats(statsRes?.data?.data || statsRes?.data || statsRes);
      }
    } catch (err) {
      console.error('Error fetching wastage reports', err);
      showToast('error', 'Failed to load wastage records');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, isAdmin, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const loadMedicines = async () => {
    try {
      const res = await medicineService.getAll({ page: 0, size: 200 });
      const data = res?.data?.data || res?.data || res;
      setMedicines(data?.content || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error('Failed to load medicines for wastage form', err);
    }
  };

  const handleOpenReportModal = () => {
    loadMedicines();
    setReportForm({
      medicineId: '',
      quantityWasted: 1,
      reason: 'EXPIRED',
      description: '',
    });
    setIsReportModalOpen(true);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportForm.medicineId) {
      showToast('error', 'Please select a medicine');
      return;
    }
    try {
      setIsSubmitting(true);
      await wastageService.reportWastage(reportForm);
      showToast('success', 'Wastage report submitted for administrator review');
      setIsReportModalOpen(false);
      fetchReports();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to submit wastage report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReviewModal = (report, action) => {
    setSelectedReport(report);
    setReviewAction(action);
    setReviewNotes('');
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    try {
      setIsSubmitting(true);
      await wastageService.reviewWastage(selectedReport.id, {
        action: reviewAction,
        reviewNotes: reviewNotes.trim() || undefined,
      });
      showToast('success', `Wastage report #${selectedReport.id} ${reviewAction.toLowerCase()}d successfully`);
      setIsReviewModalOpen(false);
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to review wastage report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReports = reports.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.medicineName?.toLowerCase().includes(term) ||
      r.batchNumber?.toLowerCase().includes(term) ||
      r.reason?.toLowerCase().includes(term) ||
      r.reportedByName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-rose-600" />
            Wastage & Loss Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track damaged, broken, or expired pharmaceutical stock with financial loss accountability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" icon={Plus} onClick={handleOpenReportModal}>
            Report Wastage
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Loss (Approved)</span>
          <h3 className="text-2xl font-bold text-rose-600 mt-1 font-mono">
            ${stats?.totalFinancialLoss ? Number(stats.totalFinancialLoss).toFixed(2) : '0.00'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Direct financial loss to inventory</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Units Disposed</span>
          <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {stats?.totalQuantityWasted || 0} <span className="text-xs font-normal text-slate-500">units</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">Deducted via official disposal</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Reviews</span>
          <h3 className="text-2xl font-bold text-amber-600 mt-1 font-mono">
            {stats?.totalPendingReports || 0}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Awaiting admin review</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Approved Reports</span>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            {stats?.totalApprovedReports || 0}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Approved & recorded in ledger</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by medicine, batch, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="w-full sm:w-48 py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">All Review Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved (Deducted)</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <Button variant="ghost" onClick={fetchReports} title="Refresh">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" message="Loading wastage records..." />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No wastage reports found"
              description="No reports match your selected criteria. All medicine inventory is currently accounted for."
              icon={Trash2}
              action={{ label: "Report Wastage", onClick: handleOpenReportModal }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Medicine & Batch</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Quantity Wasted</th>
                  <th className="py-3 px-4">Financial Loss</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reported By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{report.medicineName}</div>
                      <div className="text-xs text-slate-400 font-mono">Batch: {report.batchNumber}</div>
                      {report.description && (
                        <div className="text-xs text-slate-500 italic mt-0.5 truncate max-w-xs" title={report.description}>
                          {report.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        {report.categoryName || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {report.quantityWasted} units
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-rose-600">
                      ${report.totalLoss ? Number(report.totalLoss).toFixed(2) : '0.00'}
                      <div className="text-[10px] text-slate-400 font-normal">
                        (${Number(report.unitPrice).toFixed(2)} / unit)
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">
                        {report.reason?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {report.status === 'APPROVED' && <Badge variant="success">Approved</Badge>}
                      {report.status === 'PENDING' && <Badge variant="warning">Pending Review</Badge>}
                      {report.status === 'REJECTED' && <Badge variant="danger">Rejected</Badge>}
                      {report.reviewNotes && (
                        <div className="text-[11px] text-slate-400 mt-0.5" title={report.reviewNotes}>
                          Note: {report.reviewNotes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-slate-800 font-medium">{report.reportedByName}</div>
                      <div className="text-[11px] text-slate-400">
                        {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isAdmin && report.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenReviewModal(report, 'APPROVE')}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition"
                            title="Approve & Deduct Stock"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenReviewModal(report, 'REJECT')}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition"
                            title="Reject Report"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {report.status === 'APPROVED' ? 'Stock Deducted' : 'Closed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Medicine Wastage or Loss"
        subtitle="Submit expired, damaged, or contaminated items for administrative review"
      >
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Medicine *</label>
            <select
              required
              value={reportForm.medicineId}
              onChange={(e) => setReportForm({ ...reportForm, medicineId: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
            >
              <option value="">-- Choose a medicine --</option>
              {medicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (Batch: {m.batchNumber}) — Avail: {m.quantity} units (${Number(m.unitPrice).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quantity Wasted *</label>
              <input
                type="number"
                min="1"
                required
                value={reportForm.quantityWasted}
                onChange={(e) => setReportForm({ ...reportForm, quantityWasted: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Wastage Reason *</label>
              <select
                required
                value={reportForm.reason}
                onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
              >
                <option value="EXPIRED">Expired Medicine</option>
                <option value="DAMAGED">Damaged in Handling</option>
                <option value="BROKEN_PACKAGING">Broken Packaging</option>
                <option value="MISSING_STOCK">Missing / Unaccounted</option>
                <option value="CONTAMINATION">Contamination / Temperature Breach</option>
                <option value="OTHER">Other Authorized Reason</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Incident Notes</label>
            <textarea
              rows="3"
              value={reportForm.description}
              onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
              placeholder="Provide context regarding the damage, contamination, or batch discovery..."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsReportModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Confirmation Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={reviewAction === 'APPROVE' ? 'Approve Wastage & Deduct Stock' : 'Reject Wastage Report'}
        subtitle={`Report #${selectedReport?.id} — ${selectedReport?.medicineName}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className={`p-4 rounded-xl text-xs ${reviewAction === 'APPROVE' ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-rose-50 border border-rose-200 text-rose-900'}`}>
            {reviewAction === 'APPROVE' ? (
              <p>
                <strong>Important:</strong> Approving this report will permanently deduct <strong>{selectedReport?.quantityWasted} units</strong> from available medicine inventory and record an official disposal stock movement. This action cannot be reversed.
              </p>
            ) : (
              <p>
                Rejecting this report will retain inventory quantities intact and record your rejection reason in the audit ledger.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Review Notes / Reason</label>
            <textarea
              rows="3"
              required={reviewAction === 'REJECT'}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={reviewAction === 'APPROVE' ? 'Optional review comments...' : 'Provide explicit reason for rejecting this report...'}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant={reviewAction === 'APPROVE' ? 'primary' : 'danger'} 
              loading={isSubmitting}
            >
              Confirm {reviewAction === 'APPROVE' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WastagePage;
