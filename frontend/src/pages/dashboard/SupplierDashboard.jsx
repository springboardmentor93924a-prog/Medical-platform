import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Truck, 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Pill, 
  FileText,
  AlertCircle,
  Building2,
  ExternalLink,
  Check,
  Ban
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { supplierService } from '../../services/supplierService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const SupplierDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status update modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchSupplierData();
  }, []);

  const fetchSupplierData = async () => {
    try {
      setLoading(true);
      const [profRes, ordersRes, medsRes] = await Promise.all([
        supplierService.getMyProfile().catch((err) => {
          console.warn('Profile fetch warning', err);
          return null;
        }),
        supplierService.getMyOrders({ page: 0, size: 10 }).catch((err) => {
          console.warn('Orders fetch warning', err);
          return null;
        }),
        supplierService.getMyMedicines().catch((err) => {
          console.warn('Medicines fetch warning', err);
          return null;
        })
      ]);

      const sup = profRes?.data?.data || profRes?.data || profRes;
      if (sup) setProfile(sup);

      const oData = ordersRes?.data?.data || ordersRes?.data || ordersRes;
      const mData = medsRes?.data?.data || medsRes?.data || medsRes;
      setOrders(oData?.content || (Array.isArray(oData) ? oData : []));
      setMedicines(Array.isArray(mData) ? mData : (mData?.content || []));
    } catch (err) {
      console.error('Error fetching supplier dashboard', err);
      showToast('error', 'Failed to load supplier portal data');
    } finally {
      setLoading(false);
    }
  };

  const openStatusUpdate = (order, targetStatus) => {
    setSelectedOrder(order);
    setNewStatus(targetStatus);
    setStatusNotes('');
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !newStatus) return;

    try {
      setIsUpdating(true);
      if (newStatus === 'SUPPLIER_ACCEPTED') {
        await purchaseOrderService.acceptOrder(selectedOrder.id, statusNotes);
        showToast('success', `Purchase order ${selectedOrder.poNumber} accepted!`);
      } else if (newStatus === 'SUPPLIER_REJECTED') {
        if (!statusNotes.trim()) {
          showToast('error', 'Please enter a rejection reason.');
          setIsUpdating(false);
          return;
        }
        await purchaseOrderService.rejectOrderBySupplier(selectedOrder.id, statusNotes);
        showToast('success', `Purchase order ${selectedOrder.poNumber} declined.`);
      } else {
        await purchaseOrderService.updateStatus(selectedOrder.id, {
          status: newStatus,
          notes: statusNotes
        });
        showToast('success', `Purchase order updated to ${newStatus.replace('_', ' ')}`);
      }

      setIsStatusModalOpen(false);
      setSelectedOrder(null);
      fetchSupplierData();
    } catch (err) {
      console.error('Status update error', err);
      showToast('error', err.response?.data?.message || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
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
        return <Badge variant="default">{s.replace(/_/g, ' ')}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" message="Loading supplier portal..." />
      </div>
    );
  }

  // Calculate order metrics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => {
    const s = o.status || o.orderStatus;
    return s === 'PENDING' || s === 'APPROVED' || s === 'SENT_TO_SUPPLIER';
  }).length;
  const inTransitOrders = orders.filter(o => (o.status || o.orderStatus) === 'SHIPPED').length;
  const deliveredOrders = orders.filter(o => {
    const s = o.status || o.orderStatus;
    return s === 'DELIVERED' || s === 'COMPLETED' || s === 'RECEIVED';
  }).length;

  return (
    <div className="space-y-6">
      {/* Supplier Profile / Status Banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{profile?.companyName || user?.fullName}</h1>
              {profile?.status === 'APPROVED' ? (
                <Badge variant="success">Verified Supplier</Badge>
              ) : profile?.status === 'PENDING' ? (
                <Badge variant="warning">Approval Pending</Badge>
              ) : (
                <Badge variant="danger">{profile?.status || 'Inactive'}</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Contact: {profile?.contactPerson || user?.fullName} • {profile?.email || user?.email} • {profile?.phone || 'No phone registered'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/profile">
            <Button variant="outline">
              Business Profile
            </Button>
          </Link>
          <Link to="/purchase-orders">
            <Button variant="primary" icon={FileText}>
              All Purchase Orders
            </Button>
          </Link>
        </div>
      </div>

      {profile?.status === 'PENDING' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900">Account Pending Verification</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Your supplier account is currently undergoing administrative review. Full order fulfillment and billing capabilities will unlock once an Administrator approves your profile.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Orders"
          value={totalOrders}
          icon={ShoppingCart}
          color="blue"
          subtitle="All-time purchase orders"
        />
        <StatCard
          title="Action Required"
          value={pendingOrders}
          icon={Clock}
          color="amber"
          subtitle="Orders awaiting dispatch / accept"
        />
        <StatCard
          title="In Transit / Shipped"
          value={inTransitOrders}
          icon={Truck}
          color="indigo"
          subtitle="Out for hospital delivery"
        />
        <StatCard
          title="Fulfilled & Delivered"
          value={deliveredOrders}
          icon={CheckCircle}
          color="emerald"
          subtitle="Successfully delivered"
        />
      </div>

      {/* Assigned Purchase Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Purchase Orders Assigned to You</h2>
            <p className="text-sm text-gray-500">Review requests from hospital pharmacists, accept or decline orders, and update shipment status</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            title="No orders assigned yet"
            description="When hospital staff or pharmacists generate a purchase order for your catalog, it will appear here."
            icon={ShoppingCart}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b">
                <tr>
                  <th className="py-3 px-4">PO Details</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Items / Total</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((po) => {
                  const s = po.status || po.orderStatus || 'PENDING';
                  const isAwaitingSupplier = s === 'APPROVED' || s === 'SENT_TO_SUPPLIER' || s === 'PENDING';
                  const isAccepted = s === 'SUPPLIER_ACCEPTED' || s === 'ACCEPTED' || s === 'ORDERED';
                  const isShipped = s === 'SHIPPED';

                  return (
                    <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span className="text-xs font-mono text-gray-400">#{po.id}</span>
                          <span>{po.poNumber}</span>
                        </div>
                        <div className="text-xs text-gray-400">Created by {po.createdByName || 'Staff'}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {po.orderDate ? new Date(po.orderDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-emerald-700">
                          ${po.totalAmount ? Number(po.totalAmount).toFixed(2) : '0.00'}
                        </div>
                        <div className="text-xs text-gray-400">{po.items?.length || 0} line items</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'Not specified'}
                      </td>
                      <td className="py-3 px-4">
                        {renderStatusBadge(s)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <Link to={`/purchase-orders/${po.id}`}>
                            <button 
                              className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1 transition"
                              title="View Full PO Details"
                            >
                              <span>Details</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </Link>

                          {/* Accept / Reject actions */}
                          {isAwaitingSupplier && (
                            <>
                              <button
                                onClick={() => openStatusUpdate(po, 'SUPPLIER_ACCEPTED')}
                                className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs transition"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => openStatusUpdate(po, 'SUPPLIER_REJECTED')}
                                className="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Shipping updates */}
                          {isAccepted && (
                            <button
                              onClick={() => openStatusUpdate(po, 'SHIPPED')}
                              className="px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition"
                            >
                              Mark Shipped
                            </button>
                          )}

                          {isShipped && (
                            <button
                              onClick={() => openStatusUpdate(po, 'DELIVERED')}
                              className="px-2.5 py-1 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded transition"
                            >
                              Confirm Delivery
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
      </div>

      {/* Supplied Medicines Catalog */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your Supplied Medicine Portfolio</h2>
            <p className="text-sm text-gray-500">Medicines currently sourced from your company</p>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">
            {medicines.length} Products Linked
          </span>
        </div>

        {medicines.length === 0 ? (
          <EmptyState
            title="No medicines linked yet"
            description="Medicines assigned to your supplier company will be displayed here."
            icon={Pill}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b">
                <tr>
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-4 text-center">Available Stock</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {medicines.map((med) => (
                  <tr key={med.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {med.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">
                      {med.sku}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                        {med.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">
                      {med.batchNumber}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-800">
                      {med.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-emerald-700">
                      ${Number(med.unitPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Transition Modal */}
      {isStatusModalOpen && selectedOrder && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setSelectedOrder(null);
          }}
          title={
            newStatus === 'SUPPLIER_ACCEPTED' ? 'Accept Purchase Order' :
            newStatus === 'SUPPLIER_REJECTED' ? 'Decline Purchase Order' :
            newStatus === 'SHIPPED' ? 'Dispatch Shipment' :
            newStatus === 'DELIVERED' ? 'Confirm Order Delivery' :
            'Update Order Status'
          }
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
              <div><span className="text-gray-400">PO Number:</span> <span className="font-semibold text-gray-900">{selectedOrder.poNumber}</span></div>
              <div><span className="text-gray-400">Total Amount:</span> <span className="font-bold text-emerald-600">${Number(selectedOrder.totalAmount || 0).toFixed(2)}</span></div>
            </div>

            {newStatus === 'SUPPLIER_REJECTED' ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Reason for Decline <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Specify why you are declining this order (e.g. stock out, lead time excessive)..."
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fulfillment Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Carrier name, tracking ID, or dispatch remarks..."
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsStatusModalOpen(false);
                  setSelectedOrder(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={newStatus === 'SUPPLIER_REJECTED' ? 'danger' : 'primary'}
                loading={isUpdating}
              >
                {newStatus === 'SUPPLIER_ACCEPTED' ? 'Confirm Acceptance' :
                 newStatus === 'SUPPLIER_REJECTED' ? 'Confirm Decline' :
                 'Save Status'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SupplierDashboard;
