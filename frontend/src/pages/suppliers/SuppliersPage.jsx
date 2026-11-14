import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  CheckCircle, 
  XCircle, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin,
  Pill,
  ExternalLink,
  ShieldAlert,
  Eye
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import SupplierFormModal from '../../components/forms/SupplierFormModal';
import { supplierService } from '../../services/supplierService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const SuppliersPage = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'ADMIN' || user?.role === 'PHARMACIST';

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status Change Modal (Admin approve/reject)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTargetSupplier, setStatusTargetSupplier] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Supplier Details Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailSupplier, setDetailSupplier] = useState(null);
  const [suppliedMedicines, setSuppliedMedicines] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);

  const handleOpenDetail = async (sup) => {
    setDetailSupplier(sup);
    setIsDetailModalOpen(true);
    setLoadingMedicines(true);
    try {
      const res = await supplierService.getSuppliedMedicines(sup.id);
      const data = res?.data?.data || res?.data || res;
      setSuppliedMedicines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching supplied medicines', err);
      setSuppliedMedicines([]);
    } finally {
      setLoadingMedicines(false);
    }
  };

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: 10,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      };
      const res = await supplierService.getAll(params);
      const data = res?.data?.data || res?.data || res;
      const list = Array.isArray(data) ? data : (data?.content || []);
      setSuppliers(list);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || list.length);
    } catch (err) {
      console.error('Error fetching suppliers', err);
      showToast('error', 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, showToast]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchSuppliers();
  };

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setEditingSupplier(sup);
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (sup) => {
    setDeletingSupplier(sup);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSupplier) return;
    try {
      setIsDeleting(true);
      await supplierService.delete(deletingSupplier.id);
      showToast('success', `Supplier "${deletingSupplier.companyName}" deleted`);
      setIsDeleteModalOpen(false);
      setDeletingSupplier(null);
      fetchSuppliers();
    } catch (err) {
      console.error('Delete supplier error', err);
      showToast('error', err.response?.data?.message || 'Failed to delete supplier');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenStatusModal = (sup, nextStatus) => {
    setStatusTargetSupplier(sup);
    setSelectedStatus(nextStatus);
    setRejectionReason('');
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async (e) => {
    e.preventDefault();
    if (!statusTargetSupplier || !selectedStatus) return;

    try {
      setIsSubmittingStatus(true);
      await supplierService.updateStatus(statusTargetSupplier.id, {
        status: selectedStatus,
        reason: rejectionReason
      });
      showToast('success', `Supplier status changed to ${selectedStatus}`);
      setIsStatusModalOpen(false);
      setStatusTargetSupplier(null);
      fetchSuppliers();
    } catch (err) {
      console.error('Status change error', err);
      showToast('error', err.response?.data?.message || 'Failed to update supplier status');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Directory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage pharmaceutical distributors, partner contracts, and vendor verification ({totalElements} total).
          </p>
        </div>
        {isManager && (
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Add Supplier
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company name, contact person, email, license..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="w-full py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending Review</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" message="Loading suppliers..." />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No suppliers found"
              description="No suppliers match your criteria. Register a new vendor to link pharmaceutical orders."
              icon={Building2}
              action={isManager ? { label: "Add Supplier", onClick: handleOpenAdd } : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b">
                <tr>
                  <th className="py-3 px-4">Company & License</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {suppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{sup.companyName}</div>
                      <div className="text-xs text-gray-400 font-mono">
                        License: {sup.licenseNumber || sup.businessRegistrationNumber || 'Not specified'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {sup.contactPerson || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>{sup.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{sup.phone || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{sup.address || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {sup.status === 'APPROVED' && <Badge variant="success">Approved</Badge>}
                      {sup.status === 'PENDING' && <Badge variant="warning">Pending Review</Badge>}
                      {sup.status === 'REJECTED' && <Badge variant="danger">Rejected</Badge>}
                      {sup.status === 'SUSPENDED' && <Badge variant="secondary">Suspended</Badge>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Admin Approval Controls */}
                        {isAdmin && sup.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleOpenStatusModal(sup, 'APPROVED')}
                              className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded flex items-center gap-1"
                              title="Approve Supplier"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleOpenStatusModal(sup, 'REJECTED')}
                              className="px-2 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded flex items-center gap-1"
                              title="Reject Supplier"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {/* Admin Suspension Toggle */}
                        {isAdmin && sup.status === 'APPROVED' && (
                          <button
                            onClick={() => handleOpenStatusModal(sup, 'SUSPENDED')}
                            className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                            title="Suspend Supplier"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}

                        {isAdmin && sup.status === 'SUSPENDED' && (
                          <button
                            onClick={() => handleOpenStatusModal(sup, 'APPROVED')}
                            className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded"
                            title="Reinstate Supplier"
                          >
                            Reactivate
                          </button>
                        )}

                        {/* View Supplier Details */}
                        <button
                          onClick={() => handleOpenDetail(sup)}
                          className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="View Details & Supplied Medicines"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Supplier */}
                        {isManager && (
                          <button
                            onClick={() => handleOpenEdit(sup)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit Supplier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Supplier */}
                        {isAdmin && (
                          <button
                            onClick={() => handleOpenDelete(sup)}
                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete Supplier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Showing page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Supplier Modal */}
      {isFormModalOpen && (
        <SupplierFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingSupplier(null);
          }}
          onSuccess={() => {
            setIsFormModalOpen(false);
            setEditingSupplier(null);
            fetchSuppliers();
          }}
          supplier={editingSupplier}
        />
      )}

      {/* Admin Approve / Reject / Suspend Modal */}
      {isStatusModalOpen && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setStatusTargetSupplier(null);
          }}
          title={`${selectedStatus} Supplier: ${statusTargetSupplier?.companyName}`}
          size="sm"
        >
          <form onSubmit={handleConfirmStatusChange} className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to transition this supplier account status to{' '}
              <strong className="text-gray-900">{selectedStatus}</strong>?
            </p>

            {(selectedStatus === 'REJECTED' || selectedStatus === 'SUSPENDED') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason / Notes
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  required
                  placeholder="Explain reason for rejection or suspension..."
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsStatusModalOpen(false)}
                disabled={isSubmittingStatus}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={selectedStatus === 'APPROVED' ? 'primary' : 'danger'}
                loading={isSubmittingStatus}
              >
                Confirm {selectedStatus}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingSupplier(null);
          }}
          title="Delete Supplier"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to permanently delete supplier{' '}
              <strong className="text-gray-900">{deletingSupplier?.companyName}</strong>?
              This action cannot be undone and will affect purchase order history.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                loading={isDeleting}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Supplier Details Modal */}
      {isDetailModalOpen && detailSupplier && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setDetailSupplier(null);
            setSuppliedMedicines([]);
          }}
          title={`Supplier Details: ${detailSupplier.companyName}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{detailSupplier.companyName}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Person</label>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{detailSupplier.contactPerson || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Official Email</label>
                <p className="text-sm text-slate-800 mt-0.5">{detailSupplier.email}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                <p className="text-sm text-slate-800 mt-0.5">{detailSupplier.phone || '—'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">License / Reg Number</label>
                <p className="text-sm font-mono text-slate-800 mt-0.5">{detailSupplier.licenseNumber || detailSupplier.businessRegistrationNumber || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                <div className="mt-0.5">
                  {detailSupplier.status === 'APPROVED' && <Badge variant="success">Approved</Badge>}
                  {detailSupplier.status === 'PENDING' && <Badge variant="warning">Pending Review</Badge>}
                  {detailSupplier.status === 'REJECTED' && <Badge variant="danger">Rejected</Badge>}
                  {detailSupplier.status === 'SUSPENDED' && <Badge variant="secondary">Suspended</Badge>}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Physical Address</label>
                <p className="text-sm text-slate-800 mt-0.5">{detailSupplier.address || '—'}</p>
              </div>
              {detailSupplier.notes && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Administrative Notes</label>
                  <p className="text-sm text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 mt-1">{detailSupplier.notes}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <Pill className="w-4 h-4 text-emerald-600" />
                Supplied Medicines Catalog ({suppliedMedicines.length})
              </h4>
              {loadingMedicines ? (
                <div className="py-6">
                  <LoadingSpinner size="md" message="Loading supplied medicines..." />
                </div>
              ) : suppliedMedicines.length === 0 ? (
                <p className="text-xs text-slate-500 italic bg-white p-4 rounded-xl border border-slate-100 text-center">
                  No active medicines currently registered under this supplier.
                </p>
              ) : (
                <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Medicine</th>
                        <th className="py-2 px-3">Batch / SKU</th>
                        <th className="py-2 px-3">In Stock</th>
                        <th className="py-2 px-3">Unit Price</th>
                        <th className="py-2 px-3">Expiry Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {suppliedMedicines.map((med) => (
                        <tr key={med.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-900">{med.name}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">{med.batchNumber || med.sku}</td>
                          <td className="py-2 px-3 font-bold">{med.quantity}</td>
                          <td className="py-2 px-3">${Number(med.unitPrice || 0).toFixed(2)}</td>
                          <td className="py-2 px-3 text-slate-600">{med.expiryDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setDetailSupplier(null);
                  setSuppliedMedicines([]);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SuppliersPage;
