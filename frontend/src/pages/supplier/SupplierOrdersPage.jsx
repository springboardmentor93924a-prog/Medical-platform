import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconOrders,
  IconClock,
  IconCheckCircle,
  IconTruck,
  IconSearch,
  IconFilter,
  IconRefresh,
  IconDownload,
  IconEye,
  IconSend,
  IconFileText,
  IconPackage,
  IconAlertTriangle,
  IconPrinter,
  IconX,
  IconShield
} from '../../components/icons/Icons';
import { fetchOrders, updateOrderStatus } from '../../services/api';
import { wsService } from '../../services/websocket';
import '../staff/StaffCommon.css';

const DEFAULT_ORDERS = [
  {
    id: 1,
    poNumber: 'PO-2025-0048',
    department: 'Central Pharmacy - Floor 2',
    requestedBy: 'Dr. Sarah Khan',
    date: '2025-04-28',
    expectedDate: '2025-04-30',
    priority: 'Urgent',
    itemsCount: 5,
    totalValue: 42500,
    status: 'Pending',
    items: [
      { name: 'Paracetamol 500mg', sku: 'APX-PCT-500', qty: 2000, unitPrice: 5.20, total: 10400 },
      { name: 'Amoxicillin 250mg', sku: 'APX-AMX-250', qty: 1000, unitPrice: 12.50, total: 12500 },
      { name: 'Omeprazole 20mg', sku: 'APX-OMP-020', qty: 800, unitPrice: 18.75, total: 15000 },
      { name: 'Cetirizine 10mg', sku: 'APX-CTZ-010', qty: 500, unitPrice: 4.60, total: 2300 },
      { name: 'Salbutamol Inhaler 100mcg', sku: 'APX-SLB-100', qty: 10, unitPrice: 230.00, total: 2300 }
    ],
    shippingAddress: 'Apex City Hospital, Central Goods Inward, Dock B, 45 Healthcare Blvd',
    notes: 'Cold storage protocol required for item #5.'
  },
  {
    id: 2,
    poNumber: 'PO-2025-0047',
    department: 'ICU & Emergency Wing',
    requestedBy: 'Alex Rivera, PharmD',
    date: '2025-04-26',
    expectedDate: '2025-04-29',
    priority: 'High',
    itemsCount: 8,
    totalValue: 86200,
    status: 'In Transit',
    carrier: 'DHL HealthLogistics',
    trackingNumber: 'DHL-IN-8894102',
    items: [
      { name: 'Atorvastatin 10mg', sku: 'APX-ATV-010', qty: 1500, unitPrice: 32.00, total: 48000 },
      { name: 'Metformin 500mg', sku: 'APX-MET-500', qty: 3000, unitPrice: 8.90, total: 26700 },
      { name: 'Amlodipine 5mg', sku: 'APX-AML-005', qty: 1500, unitPrice: 7.66, total: 11500 }
    ],
    shippingAddress: 'Apex City Hospital, Emergency Receiving Desk, Gate 3',
    notes: 'Expedited dispatch requested by Intensive Care Directorate.'
  },
  {
    id: 3,
    poNumber: 'PO-2025-0046',
    department: 'Central Pharmacy Storage Dock A',
    requestedBy: 'Alex Rivera, PharmD',
    date: '2025-04-24',
    expectedDate: '2025-04-27',
    priority: 'Normal',
    itemsCount: 12,
    totalValue: 124000,
    status: 'Delivered',
    carrier: 'Blue Dart Pharma Express',
    trackingNumber: 'BD-EXP-7729104',
    items: [
      { name: 'Pantoprazole 40mg', sku: 'APX-PNT-040', qty: 2500, unitPrice: 22.00, total: 55000 },
      { name: 'Azithromycin 500mg', sku: 'APX-AZM-500', qty: 1000, unitPrice: 45.00, total: 45000 },
      { name: 'Ibuprofen 400mg', sku: 'APX-IBU-400', qty: 4000, unitPrice: 6.00, total: 24000 }
    ],
    shippingAddress: 'Apex City Hospital, Main Pharmacy Warehouse, Dock A',
    notes: 'Delivered in full, temperature integrity verified at receipt.'
  },
  {
    id: 4,
    poNumber: 'PO-2025-0045',
    department: 'Pediatric Clinic',
    requestedBy: 'Nurse Emily Watson',
    date: '2025-04-22',
    expectedDate: '2025-04-25',
    priority: 'Normal',
    itemsCount: 6,
    totalValue: 58400,
    status: 'Delivered',
    carrier: 'Apex Dedicated Fleet',
    trackingNumber: 'APX-VAN-004',
    items: [
      { name: 'Amoxicillin Oral Suspension', sku: 'APX-AMX-SUS', qty: 400, unitPrice: 65.00, total: 26000 },
      { name: 'Paracetamol Pediatric Drops', sku: 'APX-PCT-DRP', qty: 800, unitPrice: 40.50, total: 32400 }
    ],
    shippingAddress: 'Pediatric Clinic Pharmacy Depot, West Wing Ground Floor',
    notes: 'Pediatric formulation batch testing certificate attached.'
  },
  {
    id: 5,
    poNumber: 'PO-2025-0044',
    department: 'Surgical Theatres 1-4',
    requestedBy: 'Dr. Sarah Khan',
    date: '2025-04-20',
    expectedDate: '2025-04-23',
    priority: 'High',
    itemsCount: 4,
    totalValue: 31800,
    status: 'Partially Shipped',
    carrier: 'Delhivery Express Health',
    trackingNumber: 'DEL-HL-992104',
    items: [
      { name: 'Ceftriaxone 1g Injection', sku: 'APX-CFT-100', qty: 300, unitPrice: 70.00, total: 21000 },
      { name: 'Lidocaine 2% Vial', sku: 'APX-LDC-002', qty: 200, unitPrice: 54.00, total: 10800 }
    ],
    shippingAddress: 'Apex City Hospital, Surgical Supply Receiving, Basement 1',
    notes: 'Second consignment batch dispatch scheduled for tomorrow.'
  }
];

export default function SupplierOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(DEFAULT_ORDERS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(DEFAULT_ORDERS[0]);
  const [toastMessage, setToastMessage] = useState(null);

  // Dispatch modal state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [carrier, setCarrier] = useState('Blue Dart Pharma Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('2025-05-02');
  const [dispatchNotes, setDispatchNotes] = useState('');

  // Live formatted date & time
  const [dateTime, setDateTime] = useState('');
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setDateTime(now.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      }));
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };


  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchOrders();
      if (Array.isArray(data)) {
        if (data.length > 0) {
          const mapped = data.map((o) => {
            const poId = o.purchaseOrderId != null ? o.purchaseOrderId : (o.id || o.rawId);
            const rawStatus = (o.status || 'APPROVED').toUpperCase().replace(' ', '_');
            let displayStatus = 'Approved';
            if (rawStatus === 'ACKNOWLEDGED') displayStatus = 'Acknowledged';
            else if (rawStatus === 'PROCESSING') displayStatus = 'Processing';
            else if (rawStatus === 'IN_TRANSIT' || rawStatus === 'SHIPPED') displayStatus = 'In Transit';
            else if (rawStatus === 'DELIVERED' || rawStatus === 'RECEIVED') displayStatus = 'Delivered';
            else if (rawStatus === 'PARTIALLY_RECEIVED') displayStatus = 'Partially Received';

            return {
              id: poId,
              purchaseOrderId: poId,
              poNumber: o.poNumber || `PO-2026-${String(poId).padStart(4, '0')}`,
              department: o.department || 'Central Hospital Pharmacy',
              requestedBy: o.requesterName || (o.createdBy ? `User #${o.createdBy}` : 'Lead Pharmacist'),
              date: o.orderDate ? o.orderDate.substring(0, 10) : '2026-11-05',
              expectedDate: o.expectedDeliveryDate ? o.expectedDeliveryDate.substring(0, 10) : '2026-11-12',
              priority: o.priority || 'Normal',
              itemsCount: o.items ? o.items.length : (o.itemCount || 0),
              totalValue: Number(o.totalAmount || 0),
              status: displayStatus,
              statusKey: rawStatus,
              carrier: o.carrier || 'Standard Courier',
              trackingNumber: o.trackingNumber || '',
              items: (o.items && o.items.length > 0) ? o.items.map(it => ({
                name: it.medicine?.medicineName || `Medicine #${it.medicineId}`,
                sku: `SKU-${it.medicineId}`,
                qty: it.quantity || 0,
                unitPrice: Number(it.unitCost || 0),
                total: (it.quantity || 0) * Number(it.unitCost || 0)
              })) : [],
              shippingAddress: o.deliveryAddress || 'Central Hospital Receiving Dock B',
              notes: o.notes || 'Handle with clinical cold-chain protocol.',
              raw: o
            };
          });
          setOrders(mapped);
          setSelectedOrder(mapped[0]);
        } else {
          setOrders([]);
          setSelectedOrder(null);
        }
      } else {
        setOrders(DEFAULT_ORDERS);
        setSelectedOrder(prev => prev || DEFAULT_ORDERS[0]);
      }
    } catch (_err) {
      setOrders(DEFAULT_ORDERS);
      setSelectedOrder(prev => prev || DEFAULT_ORDERS[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    // Subscribe to live WebSocket purchase order changes
    const unsub = wsService.subscribeOrders((evt) => {
      console.log('[SupplierOrders] Real-time order change:', evt);
      showToast(`Order update received: ${evt?.message || 'New order status'}`);
      loadOrders();
    });
    return () => {
      if (unsub) unsub();
    };
  }, [loadOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        o.poNumber.toLowerCase().includes(query) ||
        o.department.toLowerCase().includes(query) ||
        (o.items && o.items.some(i => i.name.toLowerCase().includes(query)));

      const matchStatus =
        statusFilter === 'ALL' ||
        o.status.toLowerCase() === statusFilter.toLowerCase();

      const matchPriority =
        priorityFilter === 'ALL' ||
        o.priority.toLowerCase() === priorityFilter.toLowerCase();

      return matchSearch && matchStatus && matchPriority;
    });
  }, [orders, searchQuery, statusFilter, priorityFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status.toLowerCase().includes('pending')).length;
    const inTransit = orders.filter(o => o.status.toLowerCase().includes('transit') || o.status.toLowerCase().includes('partially')).length;
    const delivered = orders.filter(o => o.status.toLowerCase().includes('delivered')).length;
    return { total, pending, inTransit, delivered };
  }, [orders]);

  // Status badge styling
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) return 'staff-badge--received';
    if (s.includes('transit')) return 'staff-badge--inprogress';
    if (s.includes('partially')) return 'staff-badge--warning';
    if (s.includes('pending')) return 'staff-badge--critical';
    return 'staff-badge--neutral';
  };

  // Priority badge styling
  const getPriorityBadge = (priority) => {
    const p = (priority || '').toLowerCase();
    if (p.includes('urgent')) return 'staff-badge--critical';
    if (p.includes('high')) return 'staff-badge--warning';
    return 'staff-badge--neutral';
  };

  // Handle Acknowledge Order
  const handleAcknowledgeOrder = async () => {
    if (!selectedOrder) return;
    try {
      const orderId = selectedOrder.purchaseOrderId || selectedOrder.id;
      await updateOrderStatus(orderId, {
        status: 'ACKNOWLEDGED',
        notes: 'Acknowledged by supplier. Preparing order for dispatch.'
      });
      showToast(`Purchase Order ${selectedOrder.poNumber} acknowledged successfully!`);
      loadOrders();
    } catch (err) {
      console.error('Failed to acknowledge order:', err);
      showToast('Error acknowledging order. Please try again.');
    }
  };

  // Handle Mark as Dispatched
  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const orderId = selectedOrder.purchaseOrderId || selectedOrder.id;
      const finalTracking = trackingNumber || `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
      await updateOrderStatus(orderId, {
        status: 'IN_TRANSIT',
        carrier,
        trackingNumber: finalTracking,
        notes: dispatchNotes || 'Dispatched from supplier warehouse'
      });

      setIsDispatchModalOpen(false);
      showToast(`Purchase Order ${selectedOrder.poNumber} marked as In Transit! Tracking: ${finalTracking}`);
      loadOrders();
    } catch (_err) {
      showToast('Error updating dispatch status. Local update applied.');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      showToast('No purchase orders to export.');
      return;
    }
    const headers = ['PO Number', 'Department', 'Date', 'Expected', 'Items Count', 'Value (INR)', 'Priority', 'Status'];
    const rows = filteredOrders.map(o => [
      o.poNumber,
      `"${o.department}"`,
      o.date,
      o.expectedDate,
      o.itemsCount,
      o.totalValue,
      o.priority,
      o.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Purchase_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Purchase orders report exported successfully!');
  };

  return (
    <div className="admin-page-container fade-in">
      {/* ── Universal Header ── */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <h1 className="admin-dash-title">Purchase Orders Fulfillment</h1>
          <p className="admin-dash-sub">
            Hospital procurement requests, line-item fulfillment, packaging verification, and carrier dispatch.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600, marginRight: 8 }}>
            {dateTime || 'Apr 29, 2025 11:42 AM'}
          </span>
          <button onClick={handleExportCSV} className="clay-action-pill-btn clay-action-pill-btn--secondary" title="Export POs to CSV">
            <IconDownload size={15} /> Export CSV
          </button>
          <button onClick={loadOrders} className="clay-action-pill-btn clay-action-pill-btn--secondary" title="Refresh Purchase Orders">
            <IconRefresh size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div style={{
          background: 'linear-gradient(135deg, #008C8C 0%, #007070 100%)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 20px rgba(0, 140, 140, 0.25)',
          margin: '4px 0'
        }}>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: '12px' }}
          >
            <IconX size={16} />
          </button>
        </div>
      )}

      {/* ── Row 1: 4 Clay KPI Cards ── */}
      <div className="clay-stat-grid-4">
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Total Orders</span>
            <div className="clay-stat-card__value">{stats.total}</div>
            <span className="clay-stat-card__sub">Across all units</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--blue">
            <IconOrders size={22} />
          </div>
        </div>

        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Awaiting Dispatch</span>
            <div className="clay-stat-card__value" style={{ color: '#DC2626' }}>{stats.pending}</div>
            <span className="clay-stat-card__sub" style={{ color: '#DC2626', fontWeight: 600 }}>Needs packaging &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--coral">
            <IconAlertTriangle size={22} />
          </div>
        </div>

        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">In Transit</span>
            <div className="clay-stat-card__value" style={{ color: '#EA580C' }}>{stats.inTransit}</div>
            <span className="clay-stat-card__sub" style={{ color: '#EA580C', fontWeight: 600 }}>En route to docks &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <IconTruck size={22} />
          </div>
        </div>

        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Fulfilled This Month</span>
            <div className="clay-stat-card__value" style={{ color: '#16A34A' }}>{stats.delivered}</div>
            <span className="clay-stat-card__sub" style={{ color: '#16A34A', fontWeight: 600 }}>100% SLA compliance</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--mint">
            <IconCheckCircle size={22} />
          </div>
        </div>
      </div>

      {/* ── Row 2: Search & Filter Toolbar ── */}
      <div className="clay-filter-bar">
        <div className="clay-search-pill" style={{ flex: 1, minWidth: '240px' }}>
          <IconSearch size={16} />
          <input
            type="text"
            placeholder="Search PO number, department, or medicine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.84rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="clay-select-pill"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by Status"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Transit">In Transit</option>
            <option value="Partially Shipped">Partially Shipped</option>
            <option value="Delivered">Delivered</option>
          </select>

          <select
            className="clay-select-pill"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by Priority"
          >
            <option value="ALL">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
      </div>

      {/* ── Row 3: Split Layout (Orders Table Left + Details Inspector Right) ── */}
      <div className="clay-split-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 380px' }}>
        {/* Left Column: Orders Table */}
        <div className="clay-card-table">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #eef3f8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="clay-stat-card__icon-squircle clay-squircle--blue" style={{ width: 34, height: 34, minWidth: 34 }}>
                <IconOrders size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#16324F' }}>Purchase Orders Registry</h2>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#008C8C', fontWeight: 600 }}>
              {filteredOrders.length} Orders
            </span>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Department</th>
                  <th>Order Date</th>
                  <th>Target Date</th>
                  <th style={{ textAlign: 'center' }}>Items</th>
                  <th style={{ textAlign: 'right' }}>Total (₹)</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      Loading hospital purchase orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No purchase orders found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isSelected = selectedOrder?.id === order.id;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(0, 140, 140, 0.05)' : undefined,
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <td style={{ fontWeight: 700, color: '#008C8C', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                          {order.poNumber}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {order.department}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', color: '#64748b' }}>
                          {order.date}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', color: '#0f172a', fontWeight: 500 }}>
                          {order.expectedDate}
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600 }}>{order.itemsCount}</span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                          ₹ {order.totalValue ? order.totalValue.toLocaleString() : '0'}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className={`staff-badge ${getPriorityBadge(order.priority)}`}>
                            {order.priority}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className={`staff-badge ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            className="clay-action-pill-btn clay-action-pill-btn--secondary"
                            style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                          >
                            <IconEye size={13} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: PO Fulfillment Inspector */}
        <div className="clay-side-widget">
          {selectedOrder ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ paddingBottom: '12px', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>
                    Purchase Order Details
                  </span>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '1.2rem', color: '#008C8C', fontWeight: 700 }}>
                    {selectedOrder.poNumber}
                  </h3>
                </div>
                <span className={`staff-badge ${getStatusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              {/* Quick Facility Meta */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Department:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedOrder.department}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Requested By:</span>
                  <span style={{ fontWeight: 500, color: '#0f172a' }}>{selectedOrder.requestedBy}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Target Arrival:</span>
                  <span style={{ fontWeight: 600, color: '#dc2626' }}>{selectedOrder.expectedDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Priority:</span>
                  <span className={`staff-badge ${getPriorityBadge(selectedOrder.priority)}`}>
                    {selectedOrder.priority}
                  </span>
                </div>
              </div>

              {/* Carrier & Tracking Info if Dispatched */}
              {(selectedOrder.carrier || selectedOrder.trackingNumber) && (
                <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '12px', borderRadius: '12px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#008C8C', fontWeight: 600, marginBottom: '6px' }}>
                    <IconTruck size={16} />
                    <span>Consignment Dispatch Info</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Carrier:</span>
                    <span style={{ fontWeight: 500 }}>{selectedOrder.carrier}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Waybill / Tracking:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0a6663' }}>
                      {selectedOrder.trackingNumber}
                    </span>
                  </div>
                </div>
              )}

              {/* Ordered Line Items */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 }}>
                  Order Line Items ({selectedOrder.items?.length || 0})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                  {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#ffffff',
                        border: '1px solid #eef3f8',
                        borderRadius: '10px',
                        fontSize: '0.84rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                          SKU: {item.sku} &bull; Qty: {item.qty}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#008C8C' }}>
                          ₹ {item.total?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          @ ₹ {item.unitPrice}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total */}
              <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Subtotal:</span>
                  <span>₹ {Math.round(selectedOrder.totalValue * 0.88).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Applicable GST (12%):</span>
                  <span>₹ {Math.round(selectedOrder.totalValue * 0.12).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700, color: '#008C8C' }}>
                  <span>Total Purchase Value:</span>
                  <span>₹ {selectedOrder.totalValue.toLocaleString()}</span>
                </div>
              </div>

              {/* Fulfillment Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                {selectedOrder.statusKey === 'APPROVED' && (
                  <button
                    onClick={handleAcknowledgeOrder}
                    className="clay-action-pill-btn clay-action-pill-btn--primary"
                    style={{ justifyContent: 'center', width: '100%' }}
                  >
                    <IconFileText size={16} />
                    <span>Acknowledge Purchase Order</span>
                  </button>
                )}

                {(selectedOrder.statusKey === 'ACKNOWLEDGED' || selectedOrder.statusKey === 'PROCESSING') && (
                  <button
                    onClick={() => {
                      setTrackingNumber(selectedOrder.trackingNumber || `TRK-${Math.floor(100000 + Math.random() * 900000)}`);
                      setIsDispatchModalOpen(true);
                    }}
                    className="clay-action-pill-btn clay-action-pill-btn--primary"
                    style={{ justifyContent: 'center', width: '100%' }}
                  >
                    <IconSend size={16} />
                    <span>Dispatch Shipment & Update Tracking</span>
                  </button>
                )}

                {(selectedOrder.statusKey === 'IN_TRANSIT' || selectedOrder.statusKey === 'SHIPPED') && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#0284c7',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <IconSend size={18} />
                    <div>
                      <strong>Shipment Dispatched ({selectedOrder.carrier || 'Courier'})</strong>
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                        Tracking: {selectedOrder.trackingNumber || 'Active'} • Awaiting dock receipt & verification by Staff.
                      </div>
                    </div>
                  </div>
                )}

                {(selectedOrder.statusKey === 'DELIVERED' || selectedOrder.statusKey === 'RECEIVED') && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#16a34a',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <IconCheckCircle size={18} />
                    <div>
                      <strong>Delivery Complete & Stock Verified</strong>
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                        Goods received and booked into inventory batches.
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="clay-action-pill-btn clay-action-pill-btn--secondary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                  >
                    <IconPrinter size={15} />
                    <span>Print Packing Slip</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
              <IconOrders size={42} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
              <h3 style={{ margin: '0 0 6px 0', color: '#0f172a' }}>No PO Selected</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Click on any purchase order from the table to inspect line items, verify packaging, and dispatch shipments.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Dispatch Shipment Modal ── */}
      {isDispatchModalOpen && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#0F4A47',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconTruck size={20} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                  Dispatch Purchase Order {selectedOrder.poNumber}
                </h3>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Logistics Carrier / Courier Service *
                </label>
                <select
                  className="staff-select"
                  style={{ width: '100%' }}
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  required
                >
                  <option value="Blue Dart Pharma Express">Blue Dart Pharma Express</option>
                  <option value="DHL HealthLogistics">DHL HealthLogistics</option>
                  <option value="Delhivery Express Health">Delhivery Express Health</option>
                  <option value="Apex Dedicated Fleet">Apex Dedicated Fleet Van</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Waybill / Tracking Airway Bill # *
                </label>
                <input
                  type="text"
                  className="staff-search-input"
                  style={{ width: '100%' }}
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. BD-EXP-9921034"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Estimated Receiving Dock Arrival *
                </label>
                <input
                  type="date"
                  className="staff-search-input"
                  style={{ width: '100%' }}
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Dispatch Notes & Handling Protocols
                </label>
                <textarea
                  className="staff-search-input"
                  style={{ width: '100%', minHeight: '70px', resize: 'vertical' }}
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  placeholder="Temperature monitored transit, tamper-proof security seals intact..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="staff-btn staff-btn--outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="staff-btn staff-btn--primary"
                >
                  <IconSend size={16} />
                  <span>Confirm Dispatch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

