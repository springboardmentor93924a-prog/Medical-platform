import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MedicineReturnsTab from '../../components/returns/MedicineReturnsTab';
import {
  IconTruck,
  IconClock,
  IconCheckCircle,
  IconAlertTriangle,
  IconSearch,
  IconFilter,
  IconRefresh,
  IconDownload,
  IconPlus,
  IconEye,
  IconSend,
  IconMapPin,
  IconPhone,
  IconPackage,
  IconShieldCheck,
  IconX
} from '../../components/icons/Icons';
import { fetchOrders } from '../../services/api';
import '../staff/StaffCommon.css';

const DEFAULT_DELIVERIES = [
  {
    id: 1,
    waybill: 'WB-BD-994201',
    poNumber: 'PO-2025-0047',
    destination: 'Apex City Hospital, Dock B (Central Pharmacy)',
    carrier: 'Blue Dart Pharma Express',
    trackingNumber: 'BD-EXP-8894102',
    dispatchDate: '2025-04-28 09:30',
    expectedArrival: '2025-04-29 15:00',
    eta: '2025-04-29 (Tomorrow 14:00)',
    status: 'In Transit',
    itemsCount: 8,
    temperature: '2°C - 8°C (Cold Chain Validated)',
    tempCondition: '4.2°C (Cold Chain Compliant)',
    driverName: 'Vikram Singh',
    driverPhone: '+91 98451 22345',
    vehiclePlate: 'MH-02-CP-8104',
    currentLocation: 'Hub Outer Ring Road, 18km from Hospital',
    steps: [
      { label: 'Consignment Created', time: 'Apr 28, 08:30 AM', done: true },
      { label: 'Carrier Picked Up & Scanned', time: 'Apr 28, 09:30 AM', done: true },
      { label: 'In Transit (En Route)', time: 'Apr 29, 06:15 AM', done: true },
      { label: 'Out for Final Hospital Delivery', time: 'Expected 01:00 PM', done: false },
      { label: 'Goods Inward Dock Sign-off', time: 'Pending arrival', done: false }
    ]
  },
  {
    id: 2,
    waybill: 'WB-DHL-771802',
    poNumber: 'PO-2025-0048',
    destination: 'Emergency & Trauma Center Receiving Desk',
    carrier: 'DHL HealthLogistics',
    trackingNumber: 'DHL-HL-7718029',
    dispatchDate: '2025-04-29 08:00',
    expectedArrival: '2025-04-30 11:30',
    eta: '2025-04-30 (In 2 Days)',
    status: 'Out for Delivery',
    itemsCount: 5,
    temperature: 'Ambient Controlled (15°C - 25°C)',
    tempCondition: 'Ambient Controlled (20.5°C)',
    driverName: 'Suresh Patel',
    driverPhone: '+91 97123 99881',
    vehiclePlate: 'DL-04-TG-3301',
    currentLocation: 'Healthcare Blvd, approaching Gate 2',
    steps: [
      { label: 'Consignment Created', time: 'Apr 29, 07:00 AM', done: true },
      { label: 'Carrier Picked Up & Scanned', time: 'Apr 29, 08:00 AM', done: true },
      { label: 'In Transit (En Route)', time: 'Apr 29, 09:30 AM', done: true },
      { label: 'Out for Final Hospital Delivery', time: 'Apr 29, 11:00 AM', done: true },
      { label: 'Goods Inward Dock Sign-off', time: 'In progress', done: false }
    ]
  },
  {
    id: 3,
    waybill: 'WB-APX-004819',
    poNumber: 'PO-2025-0049',
    destination: 'Surgical ICU Storage, Floor 4',
    carrier: 'Apex Dedicated Fleet',
    trackingNumber: 'APX-VAN-0048',
    dispatchDate: '2025-04-29 11:00',
    expectedArrival: '2025-04-29 16:30',
    eta: '2025-04-29 (Today)',
    status: 'Awaiting Pickup',
    itemsCount: 6,
    temperature: 'Validated Cool (5.0°C)',
    tempCondition: 'Validated Cool (5.0°C)',
    driverName: 'Anil Verma',
    driverPhone: '+91 99001 44552',
    vehiclePlate: 'KA-05-MD-1109',
    currentLocation: 'Apex Central Warehouse Loading Bay 3',
    steps: [
      { label: 'Consignment Created', time: 'Apr 29, 10:45 AM', done: true },
      { label: 'Carrier Picked Up & Scanned', time: 'Pending Bay Departure', done: false },
      { label: 'In Transit (En Route)', time: 'Pending', done: false },
      { label: 'Out for Final Hospital Delivery', time: 'Pending', done: false },
      { label: 'Goods Inward Dock Sign-off', time: 'Pending', done: false }
    ]
  },
  {
    id: 4,
    waybill: 'WB-DEL-550192',
    poNumber: 'PO-2025-0046',
    destination: 'Main Pharmacy Warehouse, Dock A',
    carrier: 'Delhivery Express Health',
    trackingNumber: 'DEL-HL-5501924',
    dispatchDate: '2025-04-26 14:00',
    expectedArrival: '2025-04-27 12:00',
    eta: '2025-04-27',
    status: 'Delivered',
    itemsCount: 12,
    temperature: '2°C - 8°C (Cold Chain Validated)',
    tempCondition: 'Compliant (Verified on Receipt)',
    driverName: 'Rajesh Nair',
    driverPhone: '+91 98800 11223',
    vehiclePlate: 'KA-01-MJ-5512',
    currentLocation: 'Delivered & Dock Signed by Alex Rivera, PharmD',
    steps: [
      { label: 'Consignment Created', time: 'Apr 26, 11:00 AM', done: true },
      { label: 'Carrier Picked Up & Scanned', time: 'Apr 26, 02:00 PM', done: true },
      { label: 'In Transit (En Route)', time: 'Apr 26, 08:30 PM', done: true },
      { label: 'Out for Final Hospital Delivery', time: 'Apr 27, 09:45 AM', done: true },
      { label: 'Goods Inward Dock Sign-off', time: 'Apr 27, 11:32 AM', done: true }
    ]
  },
  {
    id: 5,
    waybill: 'WB-BD-994188',
    poNumber: 'PO-2025-0045',
    destination: 'Pediatric Clinic Pharmacy Depot',
    carrier: 'Blue Dart Pharma Express',
    trackingNumber: 'BD-EXP-7729104',
    dispatchDate: '2025-04-24 10:00',
    expectedArrival: '2025-04-25 14:00',
    eta: '2025-04-25',
    status: 'Delivered',
    itemsCount: 6,
    temperature: 'Ambient Controlled (15°C - 25°C)',
    tempCondition: 'Compliant (Verified)',
    driverName: 'Mohan Lal',
    driverPhone: '+91 98450 77665',
    vehiclePlate: 'MH-12-PQ-9081',
    currentLocation: 'Delivered & Dock Signed by Emily Watson',
    steps: [
      { label: 'Consignment Created', time: 'Apr 24, 09:00 AM', done: true },
      { label: 'Carrier Picked Up & Scanned', time: 'Apr 24, 10:00 AM', done: true },
      { label: 'In Transit (En Route)', time: 'Apr 24, 04:00 PM', done: true },
      { label: 'Out for Final Hospital Delivery', time: 'Apr 25, 10:00 AM', done: true },
      { label: 'Goods Inward Dock Sign-off', time: 'Apr 25, 01:45 PM', done: true }
    ]
  }
];

export default function SupplierDeliveriesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'dispatches';
  const [deliveries, setDeliveries] = useState(DEFAULT_DELIVERIES);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [carrierFilter, setCarrierFilter] = useState('ALL');
  const [selectedDelivery, setSelectedDelivery] = useState(DEFAULT_DELIVERIES[0]);
  const [toastMessage, setToastMessage] = useState(null);

  // New shipment modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newShipment, setNewShipment] = useState({
    poNumber: 'PO-2025-0049',
    destination: 'Central Pharmacy - Receiving Dock B',
    carrier: 'Blue Dart Pharma Express',
    trackingNumber: '',
    itemsCount: 4,
    tempCondition: '2°C - 8°C Cold Chain Validated',
    driverName: 'Ramesh Kumar',
    driverPhone: '+91 98765 43210',
    vehiclePlate: 'DL-01-AX-9942',
    eta: '2025-05-02 14:00'
  });

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

  const loadDeliveries = useCallback(async () => {
    try {
      const data = await fetchOrders().catch(() => []);
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((o, idx) => ({
          id: o.purchaseOrderId || o.id || idx + 1,
          waybill: `WB-${o.orderNumber || idx + 100}`,
          poNumber: o.orderNumber || `PO-2025-${idx + 1}`,
          destination: 'Apex City Hospital, Dock B',
          carrier: o.carrier || 'Blue Dart Pharma Express',
          trackingNumber: o.trackingNumber || `TRK-88${idx}`,
          dispatchDate: o.orderDate || '2026-11-01',
          eta: o.expectedDeliveryDate || '2026-11-05',
          status: o.status || 'In Transit',
          temperature: '2°C - 8°C (Cold Chain Validated)',
          itemsCount: (o.items && o.items.length) || 1,
          currentLocation: 'Hospital Goods Inward',
          steps: [
            { label: 'Consignment Created', time: 'Day 1', done: true },
            { label: 'Carrier Picked Up', time: 'Day 1', done: true },
            { label: 'In Transit', time: 'Day 2', done: true },
            { label: 'Out for Delivery', time: 'Day 3', done: o.status === 'DELIVERED' },
            { label: 'Dock Sign-off', time: 'Day 3', done: o.status === 'DELIVERED' }
          ]
        }));
        setDeliveries(mapped);
        setSelectedDelivery(mapped[0]);
      } else {
        setDeliveries(DEFAULT_DELIVERIES);
        setSelectedDelivery(prev => prev || DEFAULT_DELIVERIES[0]);
      }
    } catch (_e) {
      setDeliveries(DEFAULT_DELIVERIES);
      setSelectedDelivery(prev => prev || DEFAULT_DELIVERIES[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  // Filtered deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        d.waybill.toLowerCase().includes(query) ||
        d.poNumber.toLowerCase().includes(query) ||
        d.trackingNumber.toLowerCase().includes(query) ||
        d.destination.toLowerCase().includes(query);

      const matchStatus =
        statusFilter === 'ALL' ||
        d.status.toLowerCase() === statusFilter.toLowerCase();

      const matchCarrier =
        carrierFilter === 'ALL' ||
        d.carrier.toLowerCase().includes(carrierFilter.toLowerCase());

      return matchSearch && matchStatus && matchCarrier;
    });
  }, [deliveries, searchQuery, statusFilter, carrierFilter]);

  // Statistics
  const stats = useMemo(() => {
    const awaiting = deliveries.filter(d => d.status === 'Awaiting Pickup').length;
    const inTransit = deliveries.filter(d => d.status === 'In Transit').length;
    const outForDelivery = deliveries.filter(d => d.status === 'Out for Delivery').length;
    const delivered = deliveries.filter(d => d.status === 'Delivered').length;
    return { awaiting, inTransit, outForDelivery, delivered };
  }, [deliveries]);

  // Status badge styling
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) return 'staff-badge--received';
    if (s.includes('out')) return 'staff-badge--inprogress';
    if (s.includes('transit')) return 'staff-badge--inprogress';
    if (s.includes('awaiting')) return 'staff-badge--warning';
    return 'staff-badge--neutral';
  };

  // Update Status of selected delivery
  const handleUpdateStatus = (newStatus) => {
    if (!selectedDelivery) return;

    const updatedDeliveries = deliveries.map((d) => {
      if (d.id === selectedDelivery.id) {
        const updatedSteps = d.steps.map((st, idx) => {
          if (newStatus === 'Out for Delivery' && idx <= 3) return { ...st, done: true };
          if (newStatus === 'Delivered') return { ...st, done: true, time: 'Completed Now' };
          if (newStatus === 'In Transit' && idx <= 2) return { ...st, done: true };
          return st;
        });

        return {
          ...d,
          status: newStatus,
          steps: updatedSteps,
          currentLocation:
            newStatus === 'Delivered'
              ? 'Delivered & Dock Signed at Receiving Dock'
              : newStatus === 'Out for Delivery'
              ? 'Arriving at hospital receiving bay'
              : 'En route on express transit highway'
        };
      }
      return d;
    });

    setDeliveries(updatedDeliveries);
    setSelectedDelivery(prev => ({
      ...prev,
      status: newStatus,
      currentLocation:
        newStatus === 'Delivered'
          ? 'Delivered & Dock Signed at Receiving Dock'
          : newStatus === 'Out for Delivery'
          ? 'Arriving at hospital receiving bay'
          : 'En route on express transit highway'
    }));

    showToast(`Consignment ${selectedDelivery.waybill} status updated to: ${newStatus}`);
  };

  // Create new dispatch consignment
  const handleCreateShipment = (e) => {
    e.preventDefault();
    const trackingGenerated = newShipment.trackingNumber || `TRK-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const waybillGenerated = `WB-${newShipment.carrier.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const created = {
      id: Date.now(),
      waybill: waybillGenerated,
      poNumber: newShipment.poNumber,
      destination: newShipment.destination,
      carrier: newShipment.carrier,
      trackingNumber: trackingGenerated,
      dispatchDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
      expectedArrival: newShipment.eta,
      status: 'Awaiting Pickup',
      itemsCount: parseInt(newShipment.itemsCount, 10) || 4,
      tempCondition: newShipment.tempCondition,
      driverName: newShipment.driverName,
      driverPhone: newShipment.driverPhone,
      vehiclePlate: newShipment.vehiclePlate,
      currentLocation: 'Apex Central Warehouse Loading Bay 2',
      steps: [
        { label: 'Consignment Created', time: 'Just now', done: true },
        { label: 'Carrier Picked Up & Scanned', time: 'Pending Bay Departure', done: false },
        { label: 'In Transit (En Route)', time: 'Pending', done: false },
        { label: 'Out for Final Hospital Delivery', time: 'Pending', done: false },
        { label: 'Goods Inward Dock Sign-off', time: 'Pending', done: false }
      ]
    };

    setDeliveries([created, ...deliveries]);
    setSelectedDelivery(created);
    setIsNewModalOpen(false);
    showToast(`New shipment consignment ${created.waybill} created successfully!`);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredDeliveries.length === 0) {
      showToast('No deliveries to export.');
      return;
    }
    const headers = ['Waybill', 'PO Number', 'Carrier', 'Tracking No', 'Destination', 'Status', 'Dispatch Date', 'ETA'];
    const rows = filteredDeliveries.map(d => [
      d.waybill,
      d.poNumber,
      `"${d.carrier}"`,
      d.trackingNumber,
      `"${d.destination}"`,
      d.status,
      d.dispatchDate,
      d.expectedArrival
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hospital_Deliveries_Manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Delivery manifest exported to CSV!');
  };

  return (
    <div className="admin-page-container fade-in">
      {/* ── Universal Header ── */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <h1 className="admin-dash-title">Update Deliveries & Dispatch</h1>
          <p className="admin-dash-sub">
            Live hospital courier dispatches, carrier tracking, temperature compliance, and dock delivery status.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600, marginRight: 8 }}>
            {dateTime || 'Apr 29, 2025 11:42 AM'}
          </span>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="clay-action-pill-btn clay-action-pill-btn--primary"
            title="Create New Delivery Consignment"
          >
            <IconPlus size={15} /> New Dispatch
          </button>
          <button
            onClick={handleExportCSV}
            className="clay-action-pill-btn clay-action-pill-btn--secondary"
            title="Export Deliveries to CSV"
          >
            <IconDownload size={15} /> Export Manifest
          </button>
          <button
            onClick={() => {
              setDeliveries(defaultDeliveries);
              showToast('Deliveries synced with live logistics feed.');
            }}
            className="clay-action-pill-btn clay-action-pill-btn--secondary"
            title="Refresh Logistics Data"
          >
            <IconRefresh size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* ── View Switcher: Dispatches vs Returns RMA ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'dispatches' })}
          style={{
            padding: '10px 22px',
            borderRadius: 24,
            border: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            background: currentTab !== 'returns' ? '#008C8C' : '#ffffff',
            color: currentTab !== 'returns' ? '#ffffff' : '#475569',
            boxShadow: currentTab !== 'returns' ? '0 4px 14px rgba(0, 140, 140, 0.35)' : '0 2px 6px rgba(16,46,89,0.06)',
            transition: 'all 0.2s'
          }}
        >
          🚚 Active Dispatches & Couriers
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'returns' })}
          style={{
            padding: '10px 22px',
            borderRadius: 24,
            border: 'none',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            background: currentTab === 'returns' ? '#008C8C' : '#ffffff',
            color: currentTab === 'returns' ? '#ffffff' : '#475569',
            boxShadow: currentTab === 'returns' ? '0 4px 14px rgba(0, 140, 140, 0.35)' : '0 2px 6px rgba(16,46,89,0.06)',
            transition: 'all 0.2s'
          }}
        >
          ↩️ Return Authorizations (RMA)
        </button>
      </div>

      {currentTab === 'returns' ? (
        <MedicineReturnsTab userRole="SUPPLIER" />
      ) : (
        <>
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
            <span className="clay-stat-card__label">Awaiting Pickup</span>
            <div className="clay-stat-card__value" style={{ color: '#EA580C' }}>{stats.awaiting}</div>
            <span className="clay-stat-card__sub" style={{ color: '#EA580C', fontWeight: 600 }}>Packed at loading dock</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <IconClock size={22} />
          </div>
        </div>

        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">En Route / In Transit</span>
            <div className="clay-stat-card__value" style={{ color: '#0284C7' }}>{stats.inTransit}</div>
            <span className="clay-stat-card__sub">Carrier GPS monitored</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--blue">
            <IconTruck size={22} />
          </div>
        </div>

        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Out for Delivery</span>
            <div className="clay-stat-card__value">{stats.outForDelivery}</div>
            <span className="clay-stat-card__sub">Approaching hospital dock</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconMapPin size={22} />
          </div>
        </div>

        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Delivered This Week</span>
            <div className="clay-stat-card__value" style={{ color: '#16A34A' }}>{stats.delivered}</div>
            <span className="clay-stat-card__sub" style={{ color: '#16A34A', fontWeight: 600 }}>100% on-time rate</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--mint">
            <IconCheckCircle size={22} />
          </div>
        </div>
      </div>

      {/* ── Row 2: Search & Filter Bar ── */}
      <div className="clay-filter-bar">
        <div className="clay-search-pill" style={{ flex: 1, minWidth: '240px' }}>
          <IconSearch size={16} />
          <input
            type="text"
            placeholder="Search waybill #, PO #, destination dock, or carrier..."
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
            aria-label="Filter by Delivery Status"
          >
            <option value="ALL">All Delivery Statuses</option>
            <option value="Awaiting Pickup">Awaiting Pickup</option>
            <option value="In Transit">In Transit</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
          </select>

          <select
            className="clay-select-pill"
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            aria-label="Filter by Carrier"
          >
            <option value="ALL">All Carriers</option>
            <option value="Blue Dart">Blue Dart</option>
            <option value="DHL">DHL Health</option>
            <option value="Delhivery">Delhivery</option>
            <option value="Apex Dedicated">Apex Fleet</option>
          </select>
        </div>
      </div>

      {/* ── Row 3: Split Layout (Shipments Table + Live Tracking Inspector) ── */}
      <div className="clay-split-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 380px' }}>
        {/* Left Column: Active Consignments Table */}
        <div className="clay-card-table">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #eef3f8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="clay-stat-card__icon-squircle clay-squircle--blue" style={{ width: 34, height: 34, minWidth: 34 }}>
                <IconTruck size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#16324F' }}>Hospital Consignments Manifest</h2>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#008C8C', fontWeight: 600 }}>
              {filteredDeliveries.length} Shipments
            </span>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Waybill / Tracking</th>
                  <th>Linked PO</th>
                  <th>Hospital Destination</th>
                  <th>Carrier Service</th>
                  <th>Temperature Protocol</th>
                  <th>Dispatch Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No consignments found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDeliveries.map((del) => {
                    const isSelected = selectedDelivery?.id === del.id;
                    return (
                      <tr
                        key={del.id}
                        onClick={() => setSelectedDelivery(del)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(0, 140, 140, 0.05)' : undefined,
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <td style={{ fontWeight: 700, color: '#008C8C', whiteSpace: 'nowrap' }}>
                          <div>{del.waybill}</div>
                          <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>
                            {del.trackingNumber}
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#16324F', whiteSpace: 'nowrap' }}>
                          {del.poNumber}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {del.destination}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {del.carrier}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#ecfdf5',
                            color: '#065f46',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            <IconShieldCheck size={13} />
                            <span>{del.tempCondition}</span>
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.82rem' }}>
                          {del.dispatchDate}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className={`staff-badge ${getStatusBadge(del.status)}`}>
                            {del.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDelivery(del);
                            }}
                            className="clay-action-pill-btn clay-action-pill-btn--secondary"
                            style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                          >
                            <IconEye size={13} /> Track
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

        {/* Right Column: Live Tracking & Status Updater */}
        <div className="clay-side-widget">
          {selectedDelivery ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ paddingBottom: '12px', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>
                    Live Logistics Inspector
                  </span>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '1.2rem', color: '#008C8C', fontWeight: 700 }}>
                    {selectedDelivery.waybill}
                  </h3>
                </div>
                <span className={`staff-badge ${getStatusBadge(selectedDelivery.status)}`}>
                  {selectedDelivery.status}
                </span>
              </div>

              {/* Current Location Banner */}
              <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '12px', borderRadius: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#008C8C', fontWeight: 600, marginBottom: '4px' }}>
                  <IconMapPin size={16} />
                  <span>Current GPS Location</span>
                </div>
                <div style={{ color: '#0f172a', fontWeight: 600 }}>
                  {selectedDelivery.currentLocation}
                </div>
                <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                  Target Arrival: <strong style={{ color: '#dc2626' }}>{selectedDelivery.expectedArrival}</strong>
                </div>
              </div>

              {/* Tracking Timeline */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 }}>
                  Logistics Milestones
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '8px' }}>
                  {selectedDelivery.steps.map((st, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: st.done ? '#008C8C' : '#e2e8f0',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: '2px'
                      }}>
                        {st.done ? '✓' : idx + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: st.done ? '#0f172a' : '#94a3b8' }}>
                          {st.label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {st.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Driver & Courier Details */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Carrier Service:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedDelivery.carrier}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Driver Assigned:</span>
                  <span style={{ fontWeight: 500, color: '#0f172a' }}>{selectedDelivery.driverName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Driver Contact:</span>
                  <span style={{ color: '#008C8C', fontWeight: 600 }}>{selectedDelivery.driverPhone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Vehicle Plate:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedDelivery.vehiclePlate}</span>
                </div>
              </div>

              {/* Interactive Status Update Actions */}
              <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '12px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 }}>
                  Quick Status Transition
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => handleUpdateStatus('In Transit')}
                    disabled={selectedDelivery.status === 'In Transit'}
                    className="clay-action-pill-btn clay-action-pill-btn--secondary"
                    style={{
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      opacity: selectedDelivery.status === 'In Transit' ? 0.6 : 1
                    }}
                  >
                    <IconTruck size={14} />
                    <span>In Transit</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus('Out for Delivery')}
                    disabled={selectedDelivery.status === 'Out for Delivery'}
                    className="clay-action-pill-btn clay-action-pill-btn--secondary"
                    style={{
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      opacity: selectedDelivery.status === 'Out for Delivery' ? 0.6 : 1
                    }}
                  >
                    <IconMapPin size={14} />
                    <span>Out for Delivery</span>
                  </button>
                </div>

                <button
                  onClick={() => handleUpdateStatus('Delivered')}
                  disabled={selectedDelivery.status === 'Delivered'}
                  className="clay-action-pill-btn clay-action-pill-btn--primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: '8px',
                    background: selectedDelivery.status === 'Delivered' ? '#16a34a' : undefined
                  }}
                >
                  <IconCheckCircle size={16} />
                  <span>{selectedDelivery.status === 'Delivered' ? 'Delivery Handover Completed' : 'Confirm Dock Delivery Sign-off'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
              <IconTruck size={42} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
              <h3 style={{ margin: '0 0 6px 0', color: '#0f172a' }}>No Consignment Selected</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Select a consignment from the table to view real-time tracking, courier milestones, and update delivery status.
              </p>
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {/* ── New Dispatch Modal ── */}
      {isNewModalOpen && (
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
            maxWidth: '540px',
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
                  Create Dispatch Consignment
                </h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Linked Purchase Order *
                  </label>
                  <input
                    type="text"
                    className="staff-search-input"
                    style={{ width: '100%' }}
                    value={newShipment.poNumber}
                    onChange={(e) => setNewShipment({ ...newShipment, poNumber: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Carrier Logistics Partner *
                  </label>
                  <select
                    className="staff-select"
                    style={{ width: '100%' }}
                    value={newShipment.carrier}
                    onChange={(e) => setNewShipment({ ...newShipment, carrier: e.target.value })}
                  >
                    <option value="Blue Dart Pharma Express">Blue Dart Pharma Express</option>
                    <option value="DHL HealthLogistics">DHL HealthLogistics</option>
                    <option value="Delhivery Express Health">Delhivery Express Health</option>
                    <option value="Apex Dedicated Fleet">Apex Dedicated Fleet</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Hospital Receiving Destination *
                </label>
                <input
                  type="text"
                  className="staff-search-input"
                  style={{ width: '100%' }}
                  value={newShipment.destination}
                  onChange={(e) => setNewShipment({ ...newShipment, destination: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Driver Name & Contact
                  </label>
                  <input
                    type="text"
                    className="staff-search-input"
                    style={{ width: '100%' }}
                    value={newShipment.driverName}
                    onChange={(e) => setNewShipment({ ...newShipment, driverName: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Vehicle Plate Number
                  </label>
                  <input
                    type="text"
                    className="staff-search-input"
                    style={{ width: '100%' }}
                    value={newShipment.vehiclePlate}
                    onChange={(e) => setNewShipment({ ...newShipment, vehiclePlate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Temperature Protocol Validated *
                </label>
                <input
                  type="text"
                  className="staff-search-input"
                  style={{ width: '100%' }}
                  value={newShipment.tempCondition}
                  onChange={(e) => setNewShipment({ ...newShipment, tempCondition: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="staff-btn staff-btn--outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="staff-btn staff-btn--primary"
                >
                  <IconSend size={16} />
                  <span>Generate Dispatch Consignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

