import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  PackageCheck, 
  Truck,
  Download,
  Calendar,
  Building2,
  Pill,
  Tag,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import PurchaseOrderFormModal from '../../components/forms/PurchaseOrderFormModal';
import ReceiveStockModal from '../../components/forms/ReceiveStockModal';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { supplierService } from '../../services/supplierService';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export const PurchaseOrdersPage = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const isAdmin = user?.role === 'ADMIN';
  const isPharmacist = user?.role === 'PHARMACIST';
  const isSupplier = user?.role === 'SUPPLIER';
  const isStaff = user?.role === 'STAFF';
  const canCreatePO = isAdmin || isPharmacist;

  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filtering
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receivingPo, setReceivingPo] = useState(null);

  // Status Action Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchSuppliers = async () => {
    if (isSupplier) return;
    try {
      const res = await supplierService.getAll({ page: 0, size: 100 });
      const supData = res?.data?.data || res?.data || res || [];
      setSuppliers(Array.isArray(supData) ? supData : (supData?.content || []));
    } catch (err) {
      console.error('Error fetching suppliers list', err);
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: 10,
        status: statusFilter || undefined,
        supplierId: supplierFilter || undefined
      };
      const res = isSupplier
        ? await supplierService.getMyOrders(params)
        : await purchaseOrderService.getAll(params);
      const data = res?.data?.data || res?.data || res;
      const list = data?.content || (Array.isArray(data) ? data : []);
      setOrders(list);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || list.length);
    } catch (err) {
      console.error('Error fetching purchase orders', err);
      showToast('error', 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, supplierFilter, isSupplier, showToast]);

  useEffect(() => {
    if (!isSupplier) {
      fetchSuppliers();
    }
  }, [isSupplier]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenReceive = (po) => {
    setReceivingPo(po);
    setIsReceiveModalOpen(true);
  };

  const handleOpenActionModal = (po, action) => {
    setSelectedPo(po);
    setTargetStatus(action);
    setActionReason('');
    setIsStatusModalOpen(true);
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!selectedPo || !targetStatus) return;

    try {
      setIsUpdatingStatus(true);
      if (targetStatus === 'APPROVED') {
        await purchaseOrderService.approveOrder(selectedPo.id);
        showToast('success', `Purchase Order ${selectedPo.poNumber} approved successfully`);
      } else if (targetStatus === 'REJECTED') {
        await purchaseOrderService.rejectOrder(selectedPo.id, actionReason);
        showToast('success', `Purchase Order ${selectedPo.poNumber} rejected by admin`);
      } else if (targetStatus === 'SUPPLIER_ACCEPTED') {
        await purchaseOrderService.acceptOrder(selectedPo.id, actionReason);
        showToast('success', `Purchase Order ${selectedPo.poNumber} accepted! Fulfillment initiated.`);
      } else if (targetStatus === 'SUPPLIER_REJECTED') {
        if (!actionReason.trim()) {
          showToast('error', 'Please provide a reason for rejecting this purchase order.');
          setIsUpdatingStatus(false);
          return;
        }
        await purchaseOrderService.rejectOrderBySupplier(selectedPo.id, actionReason);
        showToast('success', `Purchase Order ${selectedPo.poNumber} rejected.`);
      } else if (targetStatus === 'SHIPPED') {
        await purchaseOrderService.updateStatus(selectedPo.id, {
          status: 'SHIPPED',
          notes: actionReason || 'Stock dispatched by supplier'
        });
        showToast('success', `Purchase Order ${selectedPo.poNumber} marked as Shipped`);
      } else if (targetStatus === 'DELIVERED') {
        await purchaseOrderService.updateStatus(selectedPo.id, {
          status: 'DELIVERED',
          notes: actionReason || 'Delivery confirmed at destination'
        });
        showToast('success', `Purchase Order ${selectedPo.poNumber} delivery confirmed`);
      } else {
        await purchaseOrderService.updateStatus(selectedPo.id, {
          status: targetStatus,
          notes: actionReason
        });
        showToast('success', `Purchase Order status updated to ${targetStatus}`);
      }

      setIsStatusModalOpen(false);
      setSelectedPo(null);
      fetchOrders();
    } catch (err) {
      console.error('Order status action error', err);
      showToast('error', err.response?.data?.message || 'Failed to update order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleExport = async (format) => {
    try {
      showToast('info', `Preparing ${format.toUpperCase()} export...`);
      const res = await reportService.exportPurchaseOrders(format);
      const blob = new Blob([res.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `purchase_orders_${new Date().toISOString().slice(0, 10)}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', 'Export downloaded successfully');
    } catch (err) {
      console.error('Export error', err);
      showToast('error', 'Failed to export purchase orders');
    }
  };

  const renderStatusBadge = (status) => {
    const s = status || 'PENDING';
    switch (s) {
      case 'PENDING':
        return <Badge variant="warning">Pending Approval</Badge>;
      case 'APPROVED':
        return <Badge variant="info">Admin Approved</Badge>;
      case 'SENT_TO_SUPPLIER':
        return <Badge variant="info">Sent to Supplier</Badge>;
      case 'ACCEPTED':
      case 'SUPPLIER_ACCEPTED':
        return <Badge variant="success">Supplier Accepted</Badge>;
      case 'ORDERED':
        return <Badge variant="primary">Confirmed / Ordered</Badge>;
      case 'SHIPPED':
        return <Badge variant="primary">In Transit / Shipped</Badge>;
      case 'DELIVERED':
        return <Badge variant="success">Delivered</Badge>;
      case 'PARTIALLY_RECEIVED':
        return <Badge variant="warning">Partially Received</Badge>;
      case 'RECEIVED':
      case 'COMPLETED':
        return <Badge variant="success">Stock Received</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Admin Rejected</Badge>;
      case 'SUPPLIER_REJECTED':
        return <Badge variant="danger">Supplier Rejected</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="default">{s.replace(/_/g, ' ')}</Badge>;
    }
  };

  // Filter orders by local search if provided
  const displayedOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const poNum = (o.poNumber || '').toLowerCase();
    const supName = (o.supplierCompanyName || o.supplierName || o.supplier?.companyName || '').toLowerCase();
    const medName = (o.medicineName || o.items?.[0]?.medicineName || '').toLowerCase();
    return poNum.includes(query) || supName.includes(query) || medName.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isSupplier ? 'Assigned Purchase Orders' : 'Purchase Orders & Requisitions'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isSupplier 
              ? 'Review hospital requisitions, accept or reject purchase orders, and track fulfillment dispatch.'
              : `Manage pharmaceutical procurement cycles and inventory replenishment (${totalElements} total records).`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canCreatePO && (
            <Button 
              variant="primary" 
              icon={Plus} 
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Purchase Order
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

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="w-full md:w-72 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search PO #, supplier, or medicine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-56">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="w-full py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Admin Approved</option>
            <option value="SUPPLIER_ACCEPTED">Supplier Accepted</option>
            <option value="SUPPLIER_REJECTED">Supplier Rejected</option>
            <option value="SHIPPED">Shipped / In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="COMPLETED">Completed / Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Supplier Filter (Admin/Pharmacist/Staff only) */}
        {!isSupplier && (
          <div className="w-full sm:w-64">
            <select
              value={supplierFilter}
              onChange={(e) => {
                setSupplierFilter(e.target.value);
                setPage(0);
              }}
              className="w-full py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.companyName}</option>
              ))}
            </select>
          </div>
        )}

        <div className="md:ml-auto text-xs text-gray-500 whitespace-nowrap">
          Showing {displayedOrders.length} of {totalElements} orders
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" message="Loading purchase orders..." />
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No purchase orders found"
              description="No purchase orders match the selected filters or search terms."
              icon={ShoppingCart}
              action={canCreatePO ? { label: "Create Order", onClick: () => setIsCreateModalOpen(true) } : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b">
                <tr>
                  <th className="py-3 px-4">PO Details</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Medicine & Category</th>
                  <th className="py-3 px-4">Qty & Rate</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedOrders.map((po) => {
                  const currentStatus = po.status || po.orderStatus || 'PENDING';
                  const supplierName = po.supplierCompanyName || po.supplierName || po.supplier?.companyName || '—';
                  const medicineName = po.medicineName || po.items?.[0]?.medicineName || po.items?.[0]?.medicine?.name || '—';
                  const medicineCat = po.medicineCategory || po.items?.[0]?.medicineCategory || po.items?.[0]?.medicine?.category?.name || 'General';
                  const qty = po.requestedQuantity || po.items?.reduce((s, i) => s + (i.requestedQuantity || 0), 0) || 0;
                  const unitPrice = po.unitPrice || po.items?.[0]?.unitPrice || '0.00';
                  const total = po.totalAmount ? Number(po.totalAmount).toFixed(2) : '0.00';

                  const isPendingApproval = currentStatus === 'PENDING' || currentStatus === 'DRAFT';
                  const isReadyForSupplier = currentStatus === 'APPROVED' || currentStatus === 'SENT_TO_SUPPLIER' || currentStatus === 'PENDING';
                  const isAcceptedBySupplier = currentStatus === 'SUPPLIER_ACCEPTED' || currentStatus === 'ACCEPTED' || currentStatus === 'ORDERED';
                  const isShipped = currentStatus === 'SHIPPED';
                  const canReceive = (isAdmin || isPharmacist || isStaff) && 
                                     (isShipped || currentStatus === 'DELIVERED' || isAcceptedBySupplier || currentStatus === 'PARTIALLY_RECEIVED');

                  return (
                    <tr key={po.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* PO Number & ID */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span className="text-xs font-mono text-gray-400">#{po.id}</span>
                          <span>{po.poNumber}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {po.orderDate ? new Date(po.orderDate).toLocaleDateString() : 'N/A'} • by {po.createdByName || 'Hospital Staff'}
                        </div>
                      </td>

                      {/* Supplier Name */}
                      <td className="py-3 px-4 font-medium text-gray-800">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-semibold">{supplierName}</span>
                        </div>
                      </td>

                      {/* Medicine Name & Category */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[160px]">{medicineName}</span>
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Tag className="w-3 h-3" />
                          <span>{medicineCat}</span>
                        </div>
                      </td>

                      {/* Qty & Unit Price */}
                      <td className="py-3 px-4 text-xs">
                        <div className="font-semibold text-gray-900">{qty} units</div>
                        <div className="text-gray-400">@ ${Number(unitPrice).toFixed(2)}/unit</div>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-emerald-700 text-sm">
                          ${total}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {po.paymentStatus || 'PENDING'}
                        </div>
                      </td>

                      {/* Expected Delivery */}
                      <td className="py-3 px-4 text-xs text-gray-600">
                        {po.expectedDeliveryDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>{new Date(po.expectedDeliveryDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Not scheduled</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        {renderStatusBadge(currentStatus)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* View Details Link */}
                          <Link to={`/purchase-orders/${po.id}`}>
                            <button
                              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="View Full Order Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>

                          {/* Admin Approval / Rejection */}
                          {isAdmin && isPendingApproval && (
                            <>
                              <button
                                onClick={() => handleOpenActionModal(po, 'APPROVED')}
                                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                                title="Approve PO as Administrator"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleOpenActionModal(po, 'REJECTED')}
                                className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                                title="Reject PO"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Supplier Actions: Accept or Reject Order */}
                          {isSupplier && isReadyForSupplier && (
                            <>
                              <button
                                onClick={() => handleOpenActionModal(po, 'SUPPLIER_ACCEPTED')}
                                className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
                                title="Accept and confirm supply order"
                              >
                                Accept Order
                              </button>
                              <button
                                onClick={() => handleOpenActionModal(po, 'SUPPLIER_REJECTED')}
                                className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                                title="Reject purchase order with reason"
                              >
                                Reject Order
                              </button>
                            </>
                          )}

                          {/* Supplier Shipping Updates */}
                          {isSupplier && isAcceptedBySupplier && (
                            <button
                              onClick={() => handleOpenActionModal(po, 'SHIPPED')}
                              className="px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition"
                            >
                              Mark Shipped
                            </button>
                          )}

                          {isSupplier && isShipped && (
                            <button
                              onClick={() => handleOpenActionModal(po, 'DELIVERED')}
                              className="px-2.5 py-1 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition"
                            >
                              Confirm Delivery
                            </button>
                          )}

                          {/* Warehouse Receiving Action */}
                          {canReceive && (
                            <button
                              onClick={() => handleOpenReceive(po)}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg flex items-center gap-1 shadow-xs transition"
                              title="Accept shipment and increment warehouse stock"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Receive Stock</span>
                            </button>
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
              Page {page + 1} of {totalPages}
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
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <PurchaseOrderFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchOrders();
          }}
        />
      )}

      {/* Receive Stock Modal */}
      {isReceiveModalOpen && (
        <ReceiveStockModal
          isOpen={isReceiveModalOpen}
          onClose={() => setIsReceiveModalOpen(false)}
          onSuccess={() => {
            setIsReceiveModalOpen(false);
            fetchOrders();
          }}
          purchaseOrder={receivingPo}
        />
      )}

      {/* Order Status Action Modal (Accept, Reject, Ship, Deliver) */}
      {isStatusModalOpen && selectedPo && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setSelectedPo(null);
          }}
          title={
            targetStatus === 'SUPPLIER_ACCEPTED' ? 'Accept Purchase Order' :
            targetStatus === 'SUPPLIER_REJECTED' ? 'Reject Purchase Order' :
            targetStatus === 'APPROVED' ? 'Approve Purchase Order' :
            targetStatus === 'REJECTED' ? 'Reject Purchase Order (Admin)' :
            targetStatus === 'SHIPPED' ? 'Mark Order as Shipped' :
            targetStatus === 'DELIVERED' ? 'Confirm Delivery at Destination' :
            'Update Purchase Order Status'
          }
        >
          <form onSubmit={handleConfirmAction} className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">PO Number:</span>
                <span className="font-bold text-gray-900">{selectedPo.poNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Supplier:</span>
                <span className="font-semibold text-gray-800">{selectedPo.supplierCompanyName || selectedPo.supplierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Value:</span>
                <span className="font-bold text-emerald-600">${Number(selectedPo.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            {targetStatus === 'SUPPLIER_REJECTED' || targetStatus === 'REJECTED' ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Specify why this purchase order is being declined (e.g. stock out, pricing mismatch, delayed fulfillment)..."
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Notes / Dispatch Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter any fulfillment notes, tracking reference, or delivery details..."
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setSelectedPo(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={targetStatus.includes('REJECT') ? 'danger' : 'primary'}
                loading={isUpdatingStatus}
              >
                {targetStatus === 'SUPPLIER_ACCEPTED' ? 'Confirm Acceptance' :
                 targetStatus === 'SUPPLIER_REJECTED' ? 'Confirm Rejection' :
                 targetStatus === 'APPROVED' ? 'Confirm Approval' :
                 targetStatus === 'REJECTED' ? 'Confirm Rejection' :
                 'Confirm Update'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PurchaseOrdersPage;
