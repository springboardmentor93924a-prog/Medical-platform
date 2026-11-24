import React, { useState, useEffect, useCallback } from 'react';
import {
  IconTruck,
  IconCheckCircle,
  IconPackage,
  IconAlertTriangle,
  IconSearch,
  IconRefresh,
  IconDownload,
  IconEye,
  IconClock,
  IconInfo,
  IconX
} from '../../components/icons/Icons';
import {
  fetchOrders,
  fetchSuppliers,
  receiveGoodsFromOrder
} from '../../services/api';
import { wsService } from '../../services/websocket';
import './StaffCommon.css';
import '../admin/AdminPages.css';

export default function StaffReceivePage() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [dateRange, setDateRange] = useState('30');

  // Verify modal or toast
  const [feedback, setFeedback] = useState(null);

  // Header DateTime
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
    const t = setInterval(updateDateTime, 30000);
    return () => clearInterval(t);
  }, []);

  const defaultDeliveries = [
    {
      id: 1,
      poNumber: 'PO-2025-0048',
      supplier: 'Cipla Healthcare Ltd.',
      orderDate: '2025-04-28',
      expectedDate: '2025-04-30',
      status: 'Pending',
      receivedQty: '0 / 120',
      items: [
        { name: 'Paracetamol 500mg', batch: 'CPL2025001', ordered: 50, received: 0, status: 'Pending' },
        { name: 'Amoxicillin 250mg', batch: 'CPL2025002', ordered: 30, received: 0, status: 'Pending' },
        { name: 'Omeprazole 20mg', batch: 'CPL2025003', ordered: 20, received: 0, status: 'Pending' },
        { name: 'Atorvastatin 10mg', batch: 'CPL2025004', ordered: 15, received: 0, status: 'Pending' },
        { name: 'Metformin 500mg', batch: 'CPL2025005', ordered: 5, received: 0, status: 'Pending' },
      ]
    },
    {
      id: 2,
      poNumber: 'PO-2025-0047',
      supplier: 'Sun Pharma Ltd.',
      orderDate: '2025-04-26',
      expectedDate: '2025-04-29',
      status: 'In Progress',
      receivedQty: '45 / 80',
      items: [
        { name: 'Azithromycin 500mg', batch: 'SUN2025001', ordered: 50, received: 45, status: 'Received' },
        { name: 'Pantoprazole 40mg', batch: 'SUN2025002', ordered: 30, received: 0, status: 'Pending' }
      ]
    },
    {
      id: 3,
      poNumber: 'PO-2025-0046',
      supplier: 'Alkem Laboratories',
      orderDate: '2025-04-24',
      expectedDate: '2025-04-27',
      status: 'Received',
      receivedQty: '120 / 120',
      items: [
        { name: 'Clavam 625', batch: 'ALK2025001', ordered: 120, received: 120, status: 'Received' }
      ]
    },
    {
      id: 4,
      poNumber: 'PO-2025-0045',
      supplier: 'Mankind Pharma',
      orderDate: '2025-04-22',
      expectedDate: '2025-04-25',
      status: 'Received',
      receivedQty: '60 / 60',
      items: [
        { name: 'Moxikind-CV', batch: 'MAN2025001', ordered: 60, received: 60, status: 'Received' }
      ]
    },
    {
      id: 5,
      poNumber: 'PO-2025-0044',
      supplier: 'Zydus Healthcare',
      orderDate: '2025-04-20',
      expectedDate: '2025-04-23',
      status: 'Partially Received',
      receivedQty: '30 / 50',
      items: [
        { name: 'Deriphyllin 150mg', batch: 'ZYD2025001', ordered: 50, received: 30, status: 'Pending' }
      ]
    }
  ];

  const defaultReceipts = [
    { date: '2025-04-26 14:32', po: 'PO-2025-0046', supplier: 'Alkem Laboratories', items: '8 items', status: 'Completed' },
    { date: '2025-04-24 11:20', po: 'PO-2025-0045', supplier: 'Mankind Pharma', items: '6 items', status: 'Completed' },
    { date: '2025-04-22 16:45', po: 'PO-2025-0043', supplier: 'Zydus Healthcare', items: '4 items', status: 'Completed' },
    { date: '2025-04-20 10:15', po: 'PO-2025-0041', supplier: 'Sun Pharma Ltd.', items: '10 items', status: 'Completed' },
  ];

  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Verification Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyItems, setVerifyItems] = useState([]);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, supData] = await Promise.all([
        fetchOrders().catch(() => []),
        fetchSuppliers().catch(() => [])
      ]);
      const fetchedOrders = Array.isArray(ordersData) ? ordersData : [];
      setOrders(fetchedOrders);
      setSuppliers(Array.isArray(supData) ? supData : []);

      if (fetchedOrders.length > 0) {
        const mapped = fetchedOrders.map((o) => {
          const s = (o.status || 'PENDING_APPROVAL').toUpperCase();
          let displayStatus = 'Pending';
          if (s.includes('PENDING')) displayStatus = 'Awaiting Admin Approval';
          else if (s === 'APPROVED' || (s.includes('APPROV') && !s.includes('PENDING'))) displayStatus = 'Pending';
          else if (s.includes('ORDER') || s.includes('TRANSIT')) displayStatus = 'In Progress';
          else if (s.includes('PARTIAL')) displayStatus = 'Partially Received';
          else if (s.includes('DELIVER') || s.includes('RECEIV')) displayStatus = 'Received';
          else if (s.includes('REJECT')) displayStatus = 'Rejected';

          const rawItems = Array.isArray(o.items) ? o.items : [];
          const totalOrdered = rawItems.reduce((acc, it) => acc + (it.quantity || 0), 0);
          const totalReceived = rawItems.reduce((acc, it) => acc + (it.receivedQuantity || 0), 0);

          const items = rawItems.map((it, idx) => ({
            id: it.purchaseOrderItemId || idx + 1,
            purchaseOrderItemId: it.purchaseOrderItemId,
            medicineId: it.medicineId,
            name: it.medicine?.medicineName || it.medicineName || `Medicine #${it.medicineId || idx + 1}`,
            batch: it.batchNumber || `BAT-2026-${String(o.purchaseOrderId || o.id).padStart(3, '0')}-${idx + 1}`,
            ordered: it.quantity || 0,
            received: it.receivedQuantity || 0,
            expiryDate: it.expiryDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
            unitPrice: it.unitCost || it.unitPrice || 10,
            status: (it.receivedQuantity || 0) >= (it.quantity || 0) ? 'Received' : 'Pending'
          }));

          return {
            id: o.purchaseOrderId || o.id,
            rawId: o.purchaseOrderId || o.id,
            poNumber: o.orderNumber || `PO-2025-${String(o.purchaseOrderId || o.id).padStart(4, '0')}`,
            supplier: o.supplier?.supplierName || o.supplierName || 'Global MedTech',
            orderDate: o.orderDate ? new Date(o.orderDate).toISOString().split('T')[0] : '2026-10-30',
            expectedDate: o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toISOString().split('T')[0] : '2026-11-05',
            status: displayStatus,
            statusKey: s,
            receivedQty: `${totalReceived} / ${totalOrdered || 1}`,
            items: items.length > 0 ? items : [
              { id: 1, name: 'Paracetamol 500mg', batch: `BAT-${o.id || 1}-1`, ordered: 50, received: 0, status: 'Pending', expiryDate: '2027-11-01', unitPrice: 12.0 }
            ],
            raw: o
          };
        });
        setDeliveries(mapped);
        setSelectedDelivery((prev) => {
          if (!prev) return mapped[0];
          const found = mapped.find((m) => m.id === prev.id);
          return found || mapped[0];
        });
      } else {
        setDeliveries([]);
        setSelectedDelivery(null);
      }
    } catch (_e) {
      setDeliveries([]);
      setSelectedDelivery(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubDeliveries = wsService.subscribeDeliveries((evt) => {
      console.log('[StaffReceivePage] Live delivery update:', evt);
      loadData();
    });
    const unsubOrders = wsService.subscribeOrders((evt) => {
      console.log('[StaffReceivePage] Live order update:', evt);
      loadData();
    });
    const unsubReconnect = wsService.onReconnect(() => {
      loadData();
    });
    return () => {
      unsubDeliveries();
      unsubOrders();
      unsubReconnect();
    };
  }, [loadData]);

  const filteredDeliveries = deliveries.filter(d => {
    if (search) {
      const s = search.toLowerCase();
      const matchPO = d.poNumber.toLowerCase().includes(s);
      const matchSup = d.supplier.toLowerCase().includes(s);
      if (!matchPO && !matchSup) return false;
    }
    if (selectedStatus !== 'ALL' && d.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const openVerifyModal = () => {
    if (!selectedDelivery) return;
    if (selectedDelivery.statusKey === 'PENDING_APPROVAL') {
      setFeedback({
        type: 'warning',
        text: `Order ${selectedDelivery.poNumber} is awaiting Admin approval and cannot be received yet.`
      });
      setTimeout(() => setFeedback(null), 3500);
      return;
    }
    if (selectedDelivery.statusKey === 'REJECTED') {
      setFeedback({
        type: 'error',
        text: `Order ${selectedDelivery.poNumber} was rejected by Admin.`
      });
      setTimeout(() => setFeedback(null), 3500);
      return;
    }
    if (selectedDelivery.status === 'Received' || selectedDelivery.statusKey === 'DELIVERED') {
      setFeedback({
        type: 'info',
        text: `Shipment ${selectedDelivery.poNumber} has already been fully received and verified.`
      });
      setTimeout(() => setFeedback(null), 3500);
      return;
    }
    const prepItems = (selectedDelivery.items || []).map((it) => ({
      purchaseOrderItemId: it.purchaseOrderItemId,
      medicineId: it.medicineId,
      name: it.name,
      ordered: it.ordered,
      receivedQuantity: it.ordered - it.received > 0 ? it.ordered - it.received : it.ordered,
      batchNumber: it.batch || `BAT-${Date.now().toString().slice(-6)}`,
      expiryDate: it.expiryDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      unitPrice: it.unitPrice || 10,
    }));
    setVerifyItems(prepItems);
    setVerifyNotes('Physical inspection complete. Cold chain intact, tamper seals verified.');
    setShowVerifyModal(true);
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    setSubmittingVerify(true);
    try {
      const user = JSON.parse(localStorage.getItem('medistock_user') || '{}');
      const payload = {
        receivedBy: user.fullName || user.username || 'Staff Pharmacist',
        notes: verifyNotes,
        items: verifyItems.map((it) => ({
          purchaseOrderItemId: it.purchaseOrderItemId,
          medicineId: it.medicineId,
          receivedQuantity: parseInt(it.receivedQuantity, 10) || 0,
          batchNumber: it.batchNumber,
          expiryDate: it.expiryDate,
          unitPrice: it.unitPrice
        }))
      };

      await receiveGoodsFromOrder(selectedDelivery.rawId, payload);
      setFeedback({
        type: 'success',
        text: `Shipment ${selectedDelivery.poNumber} verified! Goods receipt created and inventory updated.`
      });
      setShowVerifyModal(false);
      loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to submit goods receipt'
      });
    } finally {
      setSubmittingVerify(false);
      setTimeout(() => setFeedback(null), 4500);
    }
  };

  // KPI calculations
  const pendingDeliveriesCount = deliveries.filter(d => d.status === 'Pending' || d.status === 'In Progress').length;
  const receivedDeliveriesCount = deliveries.filter(d => d.status === 'Received').length;
  const totalItemsCount = deliveries.reduce((acc, d) => {
    return acc + (d.items || []).reduce((sum, it) => sum + (it.received || 0), 0);
  }, 0);
  const partiallyReceivedCount = deliveries.filter(d => d.status === 'Partially Received').length;

  const getStatusClass = (status) => {
    const s = status.toLowerCase();
    if (s.includes('pending')) return 'staff-badge--pending';
    if (s.includes('progress')) return 'staff-badge--inprogress';
    if (s.includes('partially')) return 'staff-badge--partially';
    return 'staff-badge--received';
  };

  return (
    <div className="admin-page-container fade-in">
      {/* ── Top Header (Admin Clay Layout) ── */}
      <div className="admin-page-header" style={{ marginBottom: 20 }}>
        <div className="admin-page-header__left">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#102e59', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>
            Receive Medicines
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
            Physical intake verification, batch expiry checking, and vendor shipment reconciliation.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 600, background: '#ffffff', padding: '8px 16px', borderRadius: 20, border: '1px solid #dce8f2', boxShadow: '0 2px 6px rgba(16,46,89,0.04)' }}>
            {dateTime || 'Apr 29, 2025 11:42 AM'} • <span style={{ color: '#10b981' }}>● Online</span>
          </span>
          <button
            className="admin-btn admin-btn--outline"
            style={{ borderRadius: 9999, padding: '10px 18px', background: '#ffffff' }}
            onClick={loadData}
          >
            <IconRefresh size={14} /> Refresh Data
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{
          padding: '12px 18px',
          background: '#DCFCE7',
          color: '#166534',
          borderRadius: 10,
          border: '1px solid #BBF7D0',
          fontWeight: 500,
          fontSize: '0.86rem',
          marginBottom: 16
        }}>
          {feedback.text}
        </div>
      )}

      {/* ── Row 1: 4 KPI Cards (Clay Elevated 3D Tiles) ── */}
      <div className="clay-stat-grid-4" style={{ marginBottom: 22 }}>
        {/* Card 1: Pending Deliveries */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">PENDING DELIVERIES</span>
            <span className="clay-stat-card__value">{pendingDeliveriesCount}</span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>Awaiting verification</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconTruck size={22} />
          </div>
        </div>

        {/* Card 2: Today's Receipts */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">TODAY'S RECEIPTS</span>
            <span className="clay-stat-card__value" style={{ color: '#047857' }}>{receivedDeliveriesCount}</span>
            <span className="clay-stat-card__sub" style={{ color: '#059669' }}>Completed intake</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--mint">
            <IconCheckCircle size={22} />
          </div>
        </div>

        {/* Card 3: Total Items Received */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">ITEMS VERIFIED</span>
            <span className="clay-stat-card__value">{totalItemsCount}</span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>Stock units recorded</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--purple">
            <IconPackage size={22} />
          </div>
        </div>

        {/* Card 4: Pending Verification */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">INCOMPLETE SHIPMENTS</span>
            <span className="clay-stat-card__value" style={{ color: '#ef4444' }}>{partiallyReceivedCount}</span>
            <span className="clay-stat-card__sub" style={{ color: '#dc2626' }}>Requires attention</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--coral">
            <IconAlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* ── Middle Split Layout: Assigned Deliveries (Left) + Delivery Details & Verification (Right) ── */}
      <div className="clay-split-grid">
        {/* Left: Assigned Deliveries */}
        <div className="clay-card-table">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon">
                <IconTruck size={18} />
              </span>
              <h3 className="staff-card-title">Assigned Deliveries</h3>
            </div>
          </div>

          {/* Sub filter bar */}
          <div style={{ padding: '12px 18px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="clay-search-pill" style={{ flex: '1 1 240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <IconSearch size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', zIndex: 2 }} />
              <input
                type="text"
                style={{ width: '100%', height: 38, padding: '0 16px 0 42px', boxSizing: 'border-box' }}
                placeholder="Search by PO number, supplier, or medicine..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="clay-select-pill"
              style={{ minWidth: 120 }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Received">Received</option>
              <option value="Partially Received">Partially Received</option>
            </select>

            <select
              className="clay-select-pill"
              style={{ minWidth: 120 }}
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="30">Last 30 Days</option>
              <option value="60">Last 60 Days</option>
              <option value="90">Last 90 Days</option>
            </select>

            <button className="admin-btn admin-btn--outline" style={{ borderRadius: 9999, padding: '7px 14px', fontSize: '0.8rem' }} onClick={loadData}>
              <IconRefresh size={14} /> Refresh
            </button>
          </div>

          {/* Table */}
          <div className="staff-table-wrap">
            <table className="admin-table" style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th style={{ width: 34, textAlign: 'center' }}><input type="checkbox" /></th>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Order Date</th>
                  <th>Expected Date</th>
                  <th>Status</th>
                  <th>Received Qty</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.map((delivery) => {
                  const isCurrent = selectedDelivery && selectedDelivery.id === delivery.id;
                  return (
                    <tr
                      key={delivery.id}
                      onClick={() => setSelectedDelivery(delivery)}
                      className={isCurrent ? 'staff-row--selected' : ''}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" />
                      </td>
                      <td style={{ fontWeight: 600, color: '#0F4A47', fontFamily: 'monospace' }}>
                        {delivery.poNumber}
                      </td>
                      <td>{delivery.supplier}</td>
                      <td style={{ color: '#64748B' }}>{delivery.orderDate}</td>
                      <td style={{ color: '#64748B' }}>{delivery.expectedDate}</td>
                      <td>
                        <span className={`staff-badge ${getStatusClass(delivery.status)}`}>
                          <span className="staff-badge-dot"></span>
                          {delivery.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{delivery.receivedQty}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="staff-btn staff-btn--outline staff-btn--sm"
                          style={{ padding: '3px 8px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDelivery(delivery);
                          }}
                        >
                          <IconEye size={13} color="#0D9488" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="staff-pagination">
            <span>Showing 1-5 of 5 deliveries</span>
            <div className="staff-pagination-pages">
              <button className="staff-page-btn">&lt;</button>
              <button className="staff-page-btn active">1</button>
              <button className="staff-page-btn">&gt;</button>
            </div>
          </div>
        </div>

        {/* Right: Delivery Details & Items Inspector */}
        {selectedDelivery && (
          <div className="staff-card" style={{ position: 'sticky', top: 20 }}>
            <div className="staff-card-header">
              <div className="staff-card-title-group">
                <span className="staff-card-title-icon">
                  <IconTruck size={18} />
                </span>
                <h3 className="staff-card-title">Delivery Details</h3>
              </div>
            </div>

            <div className="staff-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>PO Number</span>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{selectedDelivery.poNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Supplier</span>
                  <span style={{ fontWeight: 600 }}>{selectedDelivery.supplier}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Order Date</span>
                  <span style={{ fontWeight: 600 }}>{selectedDelivery.orderDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Expected Date</span>
                  <span style={{ fontWeight: 600 }}>{selectedDelivery.expectedDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Status</span>
                  <span className={`staff-badge ${getStatusClass(selectedDelivery.status)}`}>
                    <span className="staff-badge-dot"></span>
                    {selectedDelivery.status}
                  </span>
                </div>
              </div>

              {/* Items in Delivery */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F4A47', marginBottom: 10 }}>
                  Items in Delivery ({selectedDelivery.items.length})
                </div>

                <div className="staff-table-wrap">
                  <table className="staff-table" style={{ fontSize: '0.77rem' }}>
                    <thead>
                      <tr>
                        <th>Medicine Name</th>
                        <th>Batch No.</th>
                        <th>Qty Ordered</th>
                        <th>Qty Received</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDelivery.items.map((it, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{it.name}</td>
                          <td style={{ color: '#64748B' }}>{it.batch}</td>
                          <td style={{ fontWeight: 600 }}>{it.ordered}</td>
                          <td style={{ fontWeight: 600 }}>{it.received}</td>
                          <td>
                            <span className={`staff-badge ${getStatusClass(it.status)}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                              {it.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Verify Receipt button */}
              {selectedDelivery.statusKey === 'PENDING_APPROVAL' ? (
                <button
                  className="staff-btn staff-btn--secondary staff-btn--full"
                  style={{ marginTop: 8, opacity: 0.7, cursor: 'not-allowed' }}
                  disabled
                >
                  <IconClock size={16} /> Awaiting Admin Approval
                </button>
              ) : selectedDelivery.statusKey === 'REJECTED' ? (
                <button
                  className="staff-btn staff-btn--danger staff-btn--full"
                  style={{ marginTop: 8, opacity: 0.7, cursor: 'not-allowed' }}
                  disabled
                >
                  <IconX size={16} /> Order Rejected by Admin
                </button>
              ) : (
                <button
                  className="staff-btn staff-btn--primary staff-btn--full"
                  style={{ marginTop: 8 }}
                  onClick={openVerifyModal}
                  disabled={selectedDelivery.status === 'Received' || selectedDelivery.statusKey === 'DELIVERED'}
                >
                  <IconCheckCircle size={16} /> {selectedDelivery.status === 'Received' || selectedDelivery.statusKey === 'DELIVERED' ? 'Shipment Fully Received' : 'Verify & Receive Shipment'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom 3-Column Section ── */}
      <div className="staff-3col-layout">
        {/* Col 1: Recent Receipts */}
        <div className="staff-card">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon">
                <IconPackage size={18} />
              </span>
              <h3 className="staff-card-title">Recent Receipts</h3>
            </div>
            <span className="staff-card-header-link">View All</span>
          </div>
          <div className="staff-table-wrap">
            <table className="staff-table" style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Items Received</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {defaultReceipts.map((r, idx) => (
                  <tr key={idx}>
                    <td style={{ color: '#64748B' }}>{r.date}</td>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{r.po}</td>
                    <td>{r.supplier}</td>
                    <td style={{ fontWeight: 600 }}>{r.items}</td>
                    <td>
                      <span className="staff-badge staff-badge--completed">
                        <span className="staff-badge-dot"></span> Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Col 2: Quick Actions */}
        <div className="staff-card">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon" style={{ color: '#0A6663' }}>
                <IconTruck size={18} />
              </span>
              <h3 className="staff-card-title">Quick Actions</h3>
            </div>
          </div>
          <div className="staff-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="staff-btn staff-btn--outline staff-btn--full" style={{ justifyContent: 'flex-start' }} onClick={() => setSelectedStatus('Pending')}>
              <IconTruck size={16} color="#0D9488" />
              <span>View Pending Deliveries</span>
            </button>
            <button className="staff-btn staff-btn--outline staff-btn--full" style={{ justifyContent: 'flex-start' }} onClick={() => setSelectedStatus('Received')}>
              <IconClock size={16} color="#0284C7" />
              <span>View Receipt History</span>
            </button>
            <button className="staff-btn staff-btn--outline staff-btn--full" style={{ justifyContent: 'flex-start' }}>
              <IconDownload size={16} color="#475569" />
              <span>Export Delivery Report</span>
            </button>
            <button className="staff-btn staff-btn--outline staff-btn--full" style={{ justifyContent: 'flex-start' }} onClick={loadData}>
              <IconRefresh size={16} color="#059669" />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Col 3: Important Information Checklist */}
        <div className="staff-card">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon" style={{ color: '#2563EB' }}>
                <IconInfo size={18} />
              </span>
              <h3 className="staff-card-title">Important Information</h3>
            </div>
          </div>
          <div className="staff-card-body">
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: '#334155', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Verify received quantities against the delivery note.</li>
              <li>Check batch numbers and expiry dates.</li>
              <li>Report any discrepancies immediately.</li>
              <li>Inventory will be updated after verification and approval.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* ── Goods Verification Modal ── */}
      {showVerifyModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: 650 }}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#e0f7f6', display: 'grid', placeItems: 'center', color: '#0F4A47' }}>
                  <IconTruck size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#0F4A47' }}>
                    Verify Shipment: {selectedDelivery?.poNumber}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Supplier: {selectedDelivery?.supplier}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowVerifyModal(false)} className="admin-modal-close">✕</button>
            </div>

            <form onSubmit={handleVerifySubmit}>
              <div className="admin-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: '0.8125rem', marginBottom: 14 }}>
                  Verify delivered quantities, batch numbers, and expiry dates against the physical shipment. Submitting this form will record a goods receipt, update system inventory, and log the stock movement.
                </div>

                <table style={{ width: '100%', fontSize: '0.78125rem', borderCollapse: 'collapse', marginBottom: 14 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '6px 8px' }}>Medicine</th>
                      <th style={{ padding: '6px 8px', width: 70 }}>Ordered</th>
                      <th style={{ padding: '6px 8px', width: 90 }}>Recv Qty *</th>
                      <th style={{ padding: '6px 8px' }}>Batch No. *</th>
                      <th style={{ padding: '6px 8px' }}>Expiry Date *</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifyItems.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{it.name}</td>
                        <td style={{ padding: '6px 8px', color: '#64748B' }}>{it.ordered}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <input
                            type="number"
                            min="1"
                            required
                            value={it.receivedQuantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              setVerifyItems(prev => prev.map((item, i) => i === idx ? { ...item, receivedQuantity: val } : item));
                            }}
                            style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: '0.78rem' }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input
                            type="text"
                            required
                            value={it.batchNumber}
                            onChange={(e) => {
                              const val = e.target.value;
                              setVerifyItems(prev => prev.map((item, i) => i === idx ? { ...item, batchNumber: val } : item));
                            }}
                            style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: '0.78rem' }}
                          />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input
                            type="date"
                            required
                            value={it.expiryDate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setVerifyItems(prev => prev.map((item, i) => i === idx ? { ...item, expiryDate: val } : item));
                            }}
                            style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: '0.78rem' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div>
                  <label className="field-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                    Verification Inspection Notes (Damage, shortages, temperature log):
                  </label>
                  <textarea
                    rows="2"
                    className="staff-form-textarea"
                    value={verifyNotes}
                    onChange={(e) => setVerifyNotes(e.target.value)}
                    style={{ width: '100%', marginTop: 4, padding: 8, fontSize: '0.8rem' }}
                    placeholder="Enter packaging and delivery verification notes..."
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" onClick={() => setShowVerifyModal(false)} className="staff-btn staff-btn--outline staff-btn--sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVerify}
                  className="staff-btn staff-btn--primary staff-btn--sm"
                  style={{ background: '#0F4A47', borderColor: '#0F4A47' }}
                >
                  <IconCheckCircle size={15} />
                  {submittingVerify ? 'Updating Inventory...' : 'Confirm Goods Receipt & Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
