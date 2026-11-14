import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Building2, 
  Calendar, 
  PackageCheck, 
  User, 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  Check,
  Ban
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ReceiveStockModal from '../../components/forms/ReceiveStockModal';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const PurchaseOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isAdmin = user?.role === 'ADMIN';
  const isPharmacist = user?.role === 'PHARMACIST';
  const isStaff = user?.role === 'STAFF';
  const isSupplier = user?.role === 'SUPPLIER';

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await purchaseOrderService.getById(id);
      setOrder(res?.data?.data || res?.data || res);
    } catch (err) {
      console.error('Error fetching order detail', err);
      showToast('error', 'Purchase order not found or access denied');
      navigate('/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      await purchaseOrderService.approveOrder(order.id);
      showToast('success', `Purchase order ${order.poNumber} approved successfully`);
      fetchOrderDetails();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to approve order');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Please enter a rejection reason:');
    if (reason === null) return;
    try {
      setIsProcessing(true);
      await purchaseOrderService.rejectOrder(order.id, reason);
      showToast('success', `Purchase order ${order.poNumber} rejected`);
      fetchOrderDetails();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to reject order');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSupplierAccept = async () => {
    const notes = window.prompt('Optional confirmation note or estimated dispatch date:');
    if (notes === null) return;
    try {
      setIsProcessing(true);
      await purchaseOrderService.acceptOrder(order.id, notes);
      showToast('success', `Order ${order.poNumber} accepted! Fulfillment initiated.`);
      fetchOrderDetails();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to accept purchase order');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSupplierReject = async () => {
    const reason = window.prompt('Please enter the reason for declining this purchase order:');
    if (!reason || !reason.trim()) {
      showToast('error', 'A rejection reason is required.');
      return;
    }
    try {
      setIsProcessing(true);
      await purchaseOrderService.rejectOrderBySupplier(order.id, reason);
      showToast('success', `Order ${order.poNumber} rejected.`);
      fetchOrderDetails();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to reject purchase order');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = async (targetStatus, promptMessage) => {
    const remarks = window.prompt(promptMessage || 'Enter dispatch / fulfillment remarks:');
    if (remarks === null) return;
    try {
      setIsProcessing(true);
      await purchaseOrderService.updateStatus(order.id, {
        status: targetStatus,
        notes: remarks
      });
      showToast('success', `Order status updated to ${targetStatus}`);
      fetchOrderDetails();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Status update failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" message="Loading purchase order details..." />
      </div>
    );
  }

  if (!order) return null;

  const currentStatus = order.status || order.orderStatus || 'PENDING';
  const supplierName = order.supplierCompanyName || order.supplierName || order.supplier?.companyName || '—';

  const isPendingAdmin = currentStatus === 'PENDING' || currentStatus === 'DRAFT';
  const isAwaitingSupplier = currentStatus === 'APPROVED' || currentStatus === 'SENT_TO_SUPPLIER' || currentStatus === 'PENDING';
  const isAccepted = currentStatus === 'SUPPLIER_ACCEPTED' || currentStatus === 'ACCEPTED' || currentStatus === 'ORDERED';
  const isShipped = currentStatus === 'SHIPPED';
  const isDelivered = currentStatus === 'DELIVERED';
  const canReceive = (isAdmin || isPharmacist || isStaff) && 
                     (isShipped || isDelivered || isAccepted || currentStatus === 'PARTIALLY_RECEIVED');

  const renderStatusBadge = (status) => {
    switch (status) {
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
        return <Badge variant="primary">Ordered</Badge>;
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
        return <Badge variant="default">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link 
          to="/purchase-orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Purchase Orders</span>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Admin Approval / Rejection */}
          {isAdmin && isPendingAdmin && (
            <>
              <Button
                variant="outline"
                className="text-rose-600 border-rose-300 hover:bg-rose-50"
                onClick={handleReject}
                loading={isProcessing}
              >
                Reject Order
              </Button>
              <Button
                variant="primary"
                onClick={handleApprove}
                loading={isProcessing}
              >
                Approve Order
              </Button>
            </>
          )}

          {/* Supplier Acceptance / Rejection */}
          {isSupplier && isAwaitingSupplier && (
            <>
              <Button
                variant="outline"
                className="text-rose-600 border-rose-300 hover:bg-rose-50"
                icon={Ban}
                onClick={handleSupplierReject}
                loading={isProcessing}
              >
                Reject Order
              </Button>
              <Button
                variant="primary"
                icon={Check}
                onClick={handleSupplierAccept}
                loading={isProcessing}
              >
                Accept Order
              </Button>
            </>
          )}

          {/* Supplier Shipping Updates */}
          {isSupplier && isAccepted && (
            <Button
              variant="primary"
              className="bg-indigo-600 hover:bg-indigo-700"
              icon={Truck}
              onClick={() => handleUpdateStatus('SHIPPED', 'Enter shipment carrier / tracking number:')}
              loading={isProcessing}
            >
              Mark as Shipped
            </Button>
          )}

          {isSupplier && isShipped && (
            <Button
              variant="primary"
              className="bg-teal-600 hover:bg-teal-700"
              icon={CheckCircle}
              onClick={() => handleUpdateStatus('DELIVERED', 'Enter delivery confirmation details:')}
              loading={isProcessing}
            >
              Confirm Delivery
            </Button>
          )}

          {/* Warehouse Receiving Action */}
          {canReceive && (
            <Button
              variant="primary"
              icon={PackageCheck}
              onClick={() => setIsReceiveModalOpen(true)}
            >
              Receive Stock Into Warehouse
            </Button>
          )}
        </div>
      </div>

      {/* Main Order Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono text-gray-400 font-bold">#{order.id}</span>
              <h1 className="text-2xl font-bold text-gray-900">{order.poNumber}</h1>
              {renderStatusBadge(currentStatus)}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Order Date: {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'} • Created by {order.createdByName || 'Hospital Staff'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Total Order Value</span>
            <div className="text-3xl font-extrabold text-emerald-600">
              ${order.totalAmount ? Number(order.totalAmount).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-gray-100">
          {/* Supplier Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Assigned Supplier</span>
            </div>
            <p className="font-semibold text-gray-900 text-base">{supplierName}</p>
            <p className="text-xs text-gray-500">
              Vendor ID: #{order.supplierId || order.supplier?.id || '—'}
            </p>
          </div>

          {/* Delivery & Schedule */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Fulfillment & Delivery</span>
            </div>
            <p className="font-semibold text-gray-900">
              Target: {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'Not scheduled'}
            </p>
            <p className="text-xs text-gray-500">
              Payment Status: <span className="font-semibold text-gray-800">{order.paymentStatus || 'PENDING'}</span>
            </p>
          </div>

          {/* Notes / Special Instructions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Requisition Notes & History</span>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed">
              {order.notes || 'No special fulfillment or shipping instructions specified.'}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Ordered Line Items ({order.items?.length || 0})</h2>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b">
                <tr>
                  <th className="py-3 px-4">Item #</th>
                  <th className="py-3 px-4">Medicine Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Ordered Qty</th>
                  <th className="py-3 px-4 text-center">Received Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Line Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items?.map((item, idx) => {
                  const mName = item.medicineName || item.medicine?.name || '—';
                  const mSku = item.medicineSku || item.medicine?.sku || 'N/A';
                  const mCat = item.medicineCategory || item.medicine?.category?.name || 'General';
                  const reqQty = item.requestedQuantity ?? item.quantityOrdered ?? 0;
                  const recQty = item.receivedQuantity ?? 0;

                  return (
                    <tr key={item.id || idx} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-xs font-mono text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{mName}</div>
                        <div className="text-xs text-gray-400 font-mono">SKU: {mSku}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">{mCat}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-900">
                        {reqQty}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-semibold ${
                          recQty >= reqQty && reqQty > 0 ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {recQty}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-800">
                        ${item.unitPrice ? Number(item.unitPrice).toFixed(2) : '0.00'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        ${item.subtotal ? Number(item.subtotal).toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t font-semibold text-gray-900">
                <tr>
                  <td colSpan={6} className="py-3 px-4 text-right">Order Grand Total:</td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-bold text-base">
                    ${order.totalAmount ? Number(order.totalAmount).toFixed(2) : '0.00'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Receive Stock Modal */}
      {isReceiveModalOpen && (
        <ReceiveStockModal
          isOpen={isReceiveModalOpen}
          onClose={() => setIsReceiveModalOpen(false)}
          onSuccess={() => {
            setIsReceiveModalOpen(false);
            fetchOrderDetails();
          }}
          purchaseOrder={order}
        />
      )}
    </div>
  );
};

export default PurchaseOrderDetailPage;
