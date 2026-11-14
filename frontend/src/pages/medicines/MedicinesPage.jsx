import React, { useState, useEffect, useCallback } from 'react';
import { 
  Pill, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  ArrowLeftRight, 
  AlertTriangle,
  Clock,
  Layers,
  Download
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import MedicineFormModal from '../../components/forms/MedicineFormModal';
import StockMovementModal from '../../components/forms/StockMovementModal';
import { medicineService } from '../../services/medicineService';
import { categoryService } from '../../services/categoryService';
import { supplierService } from '../../services/supplierService';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const MedicinesPage = () => {
  const { user, role } = useAuth();
  const { showToast } = useNotification();
  const userRole = (role || user?.role || '').replace('ROLE_', '');
  const isManager = userRole === 'ADMIN' || userRole === 'PHARMACIST';
  const isAdmin = userRole === 'ADMIN';
  const isSupplier = userRole === 'SUPPLIER';

  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Pagination & Filtering
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementMedicine, setMovementMedicine] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMedicine, setDeletingMedicine] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFilters = async () => {
    try {
      if (isSupplier) {
        const catRes = await categoryService.getAll();
        const catData = catRes?.data?.data || catRes?.data || catRes || [];
        setCategories(Array.isArray(catData) ? catData : (catData?.content || []));
      } else {
        const [catRes, supRes] = await Promise.all([
          categoryService.getAll(),
          supplierService.getAll({ page: 0, size: 100 })
        ]);
        const catData = catRes?.data?.data || catRes?.data || catRes || [];
        const supData = supRes?.data?.data || supRes?.data || supRes || [];
        setCategories(Array.isArray(catData) ? catData : (catData?.content || []));
        setSuppliers(Array.isArray(supData) ? supData : (supData?.content || []));
      }
    } catch (err) {
      console.error('Error fetching filter data', err);
    }
  };

  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      if (isSupplier) {
        const params = {
          query: search.trim() || undefined,
          search: search.trim() || undefined,
          categoryId: categoryFilter || undefined,
          status: (statusFilter === 'ACTIVE' || statusFilter === 'DISCONTINUED' || statusFilter === 'ARCHIVED') ? statusFilter : undefined,
        };
        const res = await supplierService.getMyMedicines(params);
        const data = res?.data?.data || res?.data || res || [];
        let list = Array.isArray(data) ? data : (data?.content || []);

        if (search.trim()) {
          const q = search.trim().toLowerCase();
          list = list.filter(m =>
            m.name?.toLowerCase().includes(q) ||
            m.sku?.toLowerCase().includes(q) ||
            m.genericName?.toLowerCase().includes(q) ||
            m.batchNumber?.toLowerCase().includes(q) ||
            (m.manufacturer || m.supplier?.companyName || m.supplierName)?.toLowerCase().includes(q)
          );
        }
        if (categoryFilter) {
          list = list.filter(m => String(m.categoryId) === String(categoryFilter) || String(m.category?.id) === String(categoryFilter));
        }
        if (statusFilter) {
          list = list.filter(m => {
            const isExp = m.expiryDate && new Date(m.expiryDate) < new Date();
            const isOut = m.quantity === 0;
            const minStock = m.minimumStockLevel ?? m.reorderLevel ?? 10;
            const isLow = m.quantity <= minStock && m.quantity > 0;
            if (statusFilter === 'EXPIRED') return isExp;
            if (statusFilter === 'OUT_OF_STOCK') return isOut;
            if (statusFilter === 'LOW_STOCK') return isLow;
            if (statusFilter === 'AVAILABLE') return !isExp && !isOut && !isLow && m.status !== 'DISCONTINUED';
            if (statusFilter === 'ACTIVE') return m.status === 'ACTIVE';
            return m.status === statusFilter;
          });
        }
        setMedicines(list);
        setTotalPages(1);
        setTotalElements(list.length);
      } else {
        const params = {
          page,
          size: 10,
          query: search.trim() || undefined,
          search: search.trim() || undefined,
          categoryId: categoryFilter || undefined,
          status: statusFilter || undefined,
          supplierId: supplierFilter || undefined,
        };

        const res = await medicineService.getAll(params);
        const data = res?.data?.data || res?.data || res;
        setMedicines(data?.content || (Array.isArray(data) ? data : []));
        setTotalPages(data?.totalPages || 1);
        setTotalElements(data?.totalElements || (Array.isArray(data) ? data.length : 0));
      }
    } catch (err) {
      console.error('Error fetching medicines', err);
      const errMsg = err.response?.data?.message || 'Failed to load medicines';
      setFetchError(errMsg);
      showToast('error', errMsg);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter, supplierFilter, isSupplier, showToast]);

  useEffect(() => {
    fetchFilters();
  }, [isSupplier]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchMedicines();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    setSupplierFilter('');
    setPage(0);
  };

  const handleOpenAdd = () => {
    setEditingMedicine(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (med) => {
    setEditingMedicine(med);
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (med) => {
    setDeletingMedicine(med);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingMedicine) return;
    try {
      setIsDeleting(true);
      await medicineService.delete(deletingMedicine.id);
      showToast('success', `${deletingMedicine.name} deleted successfully`);
      setIsDeleteModalOpen(false);
      setDeletingMedicine(null);
      fetchMedicines();
    } catch (err) {
      console.error('Delete error', err);
      showToast('error', err.response?.data?.message || 'Failed to delete medicine');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenMovement = (med) => {
    setMovementMedicine(med);
    setIsMovementModalOpen(true);
  };

  const handleExport = async (format) => {
    try {
      showToast('info', `Preparing ${format.toUpperCase()} export...`);
      const res = await reportService.exportMedicines(format);
      const blob = new Blob([res.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medicines_inventory_${new Date().toISOString().slice(0, 10)}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', 'Export downloaded successfully');
    } catch (err) {
      console.error('Export error', err);
      showToast('error', 'Failed to export report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isSupplier ? 'My Supplied Medicines' : 'Medicine Inventory'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isSupplier
              ? `Review medicines supplied by your organization (${totalElements} total).`
              : `Browse and manage all medical items, stock levels, batches, and reorder thresholds (${totalElements} total).`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isManager && (
            <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
              Add Medicine
            </Button>
          )}
          <Button variant="outline" icon={Download} onClick={() => handleExport('pdf')}>
            Export PDF
          </Button>
          <Button variant="outline" icon={Download} onClick={() => handleExport('excel')}>
            Export Excel
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {fetchError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Unable to load medicines</p>
              <p className="text-xs text-rose-600 mt-0.5">{fetchError}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchMedicines}>
            Retry
          </Button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, generic name, batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(0);
              }}
              className="w-full py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="w-full py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" variant="secondary" className="w-full">
              Apply
            </Button>
            <Button type="button" variant="ghost" onClick={handleResetFilters} title="Reset filters">
              Reset
            </Button>
          </div>
        </form>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" message={isSupplier ? "Loading your supplied medicines..." : "Loading medicines catalog..."} />
          </div>
        ) : medicines.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={isSupplier ? "No supplied medicines found" : "No medicines found"}
              description={
                search || categoryFilter || statusFilter
                  ? "No medicines match the selected filter criteria."
                  : isSupplier
                  ? "No medicines are currently linked to your supplier account."
                  : "No medicines added to inventory yet."
              }
              icon={Pill}
              action={isManager ? { label: "Add Medicine", onClick: handleOpenAdd } : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b">
                {isSupplier ? (
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Medicine Name</th>
                    <th className="py-3.5 px-4 font-semibold">Category</th>
                    <th className="py-3.5 px-4 font-semibold">Manufacturer</th>
                    <th className="py-3.5 px-4 font-semibold">Batch Number</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Available Quantity</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Unit Price</th>
                    <th className="py-3.5 px-4 font-semibold">Manufacturing Date</th>
                    <th className="py-3.5 px-4 font-semibold">Expiry Date</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Medicine Status</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="py-3 px-4">Medicine Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Batch & Expiry</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Unit Price</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {medicines.map((med) => {
                  const minStock = med.minimumStockLevel ?? med.reorderLevel ?? 10;
                  const isLow = med.quantity <= minStock && med.quantity > 0;
                  const isOut = med.quantity === 0;
                  const isExp = med.expiryDate && new Date(med.expiryDate) < new Date();

                  if (isSupplier) {
                    return (
                      <tr key={med.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{med.name}</div>
                          {med.genericName && (
                            <div className="text-xs text-slate-500 italic mt-0.5">{med.genericName}</div>
                          )}
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">SKU: {med.sku || med.batchNumber || '—'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 inline-flex items-center gap-1">
                            {med.category?.name || med.categoryName || 'General'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {med.manufacturer || med.supplier?.companyName || med.supplierName || user?.fullName || 'Registered Supply'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-800">
                          {med.batchNumber || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block font-bold text-sm px-2.5 py-0.5 rounded ${
                            isOut ? 'bg-rose-100 text-rose-800' : isLow ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-900'
                          }`}>
                            {med.quantity ?? 0}
                          </span>
                          <span className="text-xs text-slate-400 ml-1">{med.unitOfMeasure || 'units'}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          ${Number(med.unitPrice || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {med.manufacturingDate ? new Date(med.manufacturingDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span className={isExp ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                              {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          {isExp && <span className="text-[10px] uppercase font-bold text-rose-600">(Expired)</span>}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isExp ? (
                            <Badge variant="danger">Expired</Badge>
                          ) : isOut ? (
                            <Badge variant="danger">Out of Stock</Badge>
                          ) : isLow ? (
                            <Badge variant="warning">Low Stock</Badge>
                          ) : (
                            <Badge variant="success">Available</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={med.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{med.name}</div>
                        <div className="text-xs text-gray-400 font-mono">SKU: {med.sku}</div>
                        {med.genericName && (
                          <div className="text-xs text-gray-500 italic">{med.genericName}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2.5 py-1 rounded-full font-medium">
                          {med.category?.name || med.categoryName || 'Uncategorized'}
                        </span>
                        {(med.supplier?.companyName || med.supplierName) && (
                          <div className="text-xs text-gray-400 mt-1">
                            Supplied: {med.supplier?.companyName || med.supplierName}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-gray-800 font-medium">Batch: {med.batchNumber || '—'}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : 'N/A'}</span>
                          {isExp && <span className="text-rose-600 font-bold ml-1">(Expired)</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{med.quantity}</span>
                          <span className="text-xs text-gray-400">{med.unitOfMeasure || 'units'}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Reorder at: {med.reorderLevel}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        ${med.unitPrice ? Number(med.unitPrice).toFixed(2) : '0.00'}
                      </td>
                      <td className="py-3 px-4">
                        {isExp ? (
                          <Badge variant="danger">Expired</Badge>
                        ) : isOut ? (
                          <Badge variant="danger">Out of Stock</Badge>
                        ) : isLow ? (
                          <Badge variant="warning">Low Stock</Badge>
                        ) : (
                          <Badge variant="success">Available</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Record Movement Button */}
                          {!isSupplier && (
                            <button
                              onClick={() => handleOpenMovement(med)}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Record Movement"
                            >
                              <ArrowLeftRight className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit (Admin & Pharmacist) */}
                          {isManager && (
                            <button
                              onClick={() => handleOpenEdit(med)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit Medicine"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete (Admin only) */}
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenDelete(med)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Delete Medicine"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {isSupplier && (
                            <span className="text-xs text-slate-400 font-medium px-2 py-1 bg-slate-100 rounded">
                              Registered Supply
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Add / Edit Medicine Modal */}
      {isFormModalOpen && (
        <MedicineFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingMedicine(null);
          }}
          onSuccess={() => {
            setIsFormModalOpen(false);
            setEditingMedicine(null);
            fetchMedicines();
          }}
          medicine={editingMedicine}
        />
      )}

      {/* Movement Modal */}
      {isMovementModalOpen && (
        <StockMovementModal
          isOpen={isMovementModalOpen}
          onClose={() => {
            setIsMovementModalOpen(false);
            setMovementMedicine(null);
          }}
          onSuccess={() => {
            setIsMovementModalOpen(false);
            setMovementMedicine(null);
            fetchMedicines();
          }}
          initialMedicine={movementMedicine}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingMedicine(null);
          }}
          title="Confirm Delete Medicine"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to permanently delete{' '}
              <strong className="text-gray-900">{deletingMedicine?.name}</strong> (SKU: {deletingMedicine?.sku})?
              This action cannot be undone.
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
                Delete Medicine
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MedicinesPage;
