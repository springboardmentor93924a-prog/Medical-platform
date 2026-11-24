import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconHistory,
  IconCheckCircle,
  IconClock,
  IconSearch,
  IconFilter,
  IconDownload,
  IconPrinter,
  IconFileText,
  IconShieldCheck,
  IconEye,
  IconDollar,
  IconTruck,
  IconRefresh,
  IconX
} from '../../components/icons/Icons';
import '../staff/StaffCommon.css';

const DEFAULT_HISTORY = [
  {
    id: 1,
    grnNumber: 'GRN-2025-0891',
    poNumber: 'PO-2025-0046',
    deliveredDate: '2025-04-27 11:32',
    facility: 'Central Pharmacy Storage Dock A',
    receivedBy: 'Alex Rivera, PharmD (ID: PH-401)',
    carrier: 'Blue Dart Pharma Express',
    trackingNumber: 'BD-EXP-7729104',
    packages: 12,
    totalValue: 124000,
    inspectionResult: 'Accepted 100% (QA Pass)',
    temperatureAtArrival: '4.1°C (Within 2-8°C Spec)',
    dockNotes: 'All seal serial numbers matched packing manifest. Zero damaged boxes.',
    lineItems: [
      { name: 'Pantoprazole 40mg', qty: 2500, price: 22.00, total: 55000 },
      { name: 'Azithromycin 500mg', qty: 1000, price: 45.00, total: 45000 },
      { name: 'Ibuprofen 400mg', qty: 4000, price: 6.00, total: 24000 }
    ]
  },
  {
    id: 2,
    grnNumber: 'GRN-2025-0884',
    poNumber: 'PO-2025-0045',
    deliveredDate: '2025-04-25 13:45',
    facility: 'Pediatric Outpatient Wing',
    receivedBy: 'Nurse Emily Watson (ID: ST-108)',
    carrier: 'Apex Dedicated Fleet',
    trackingNumber: 'APX-VAN-004',
    packages: 6,
    totalValue: 58400,
    inspectionResult: 'Accepted 100% (QA Pass)',
    temperatureAtArrival: 'Ambient Controlled (21.2°C)',
    dockNotes: 'Checked batch expiry dates; all valid until 2027.',
    lineItems: [
      { name: 'Amoxicillin Oral Suspension', qty: 400, price: 65.00, total: 26000 },
      { name: 'Paracetamol Drops 15ml', qty: 800, price: 40.50, total: 32400 }
    ]
  },
  {
    id: 3,
    grnNumber: 'GRN-2025-0870',
    poNumber: 'PO-2025-0042',
    deliveredDate: '2025-04-18 10:15',
    facility: 'Emergency & Trauma Center Dock C',
    receivedBy: 'Dr. Sarah Khan (ID: AD-001)',
    carrier: 'DHL HealthLogistics',
    trackingNumber: 'DHL-IN-8812903',
    packages: 8,
    totalValue: 94500,
    inspectionResult: 'Accepted 100% (QA Pass)',
    temperatureAtArrival: '3.8°C (Cold Chain Verified)',
    dockNotes: 'Direct intake into ICU cold storage units.',
    lineItems: [
      { name: 'Adrenaline 1mg/ml Ampoules', qty: 500, price: 45.00, total: 22500 },
      { name: 'Atropine 0.6mg Injections', qty: 400, price: 35.00, total: 14000 },
      { name: 'Hydrocortisone 100mg Vials', qty: 800, price: 72.50, total: 58000 }
    ]
  },
  {
    id: 4,
    grnNumber: 'GRN-2025-0862',
    poNumber: 'PO-2025-0039',
    deliveredDate: '2025-04-12 14:20',
    facility: 'Main Pharmacy Warehouse, Dock A',
    receivedBy: 'Alex Rivera, PharmD (ID: PH-401)',
    carrier: 'Delhivery Express Health',
    trackingNumber: 'DEL-HL-4491028',
    packages: 15,
    totalValue: 168200,
    inspectionResult: 'Accepted 100% (QA Pass)',
    temperatureAtArrival: 'Standard Room Temp (22.0°C)',
    dockNotes: 'Bulk carton pallet unpacked and verified against batch certificates.',
    lineItems: [
      { name: 'Metformin 500mg ER', qty: 5000, price: 8.90, total: 44500 },
      { name: 'Atorvastatin 10mg', qty: 2500, price: 32.00, total: 80000 },
      { name: 'Amlodipine 5mg', qty: 5700, price: 7.66, total: 43700 }
    ]
  },
  {
    id: 5,
    grnNumber: 'GRN-2025-0850',
    poNumber: 'PO-2025-0036',
    deliveredDate: '2025-04-05 09:50',
    facility: 'Surgical Supply Receiving Dock B',
    receivedBy: 'Nurse Emily Watson (ID: ST-108)',
    carrier: 'Blue Dart Pharma Express',
    trackingNumber: 'BD-EXP-6629104',
    packages: 5,
    totalValue: 74200,
    inspectionResult: 'Accepted 100% (QA Pass)',
    temperatureAtArrival: 'Standard (20.5°C)',
    dockNotes: 'All sterile barrier packaging inspected without breach.',
    lineItems: [
      { name: 'Ceftriaxone 1g Injections', qty: 700, price: 70.00, total: 49000 },
      { name: 'Lidocaine 2% Vials', qty: 466, price: 54.00, total: 25200 }
    ]
  }
];

export default function SupplierHistoryPage() {
  const navigate = useNavigate();
  const [historyRecords, setHistoryRecords] = useState(DEFAULT_HISTORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('ALL');
  const [facilityFilter, setFacilityFilter] = useState('ALL');
  const [selectedReceipt, setSelectedReceipt] = useState(DEFAULT_HISTORY[0]);
  const [toastMessage, setToastMessage] = useState(null);

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


  // Filtered records
  const filteredRecords = useMemo(() => {
    return historyRecords.filter((h) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        h.grnNumber.toLowerCase().includes(query) ||
        h.poNumber.toLowerCase().includes(query) ||
        h.receivedBy.toLowerCase().includes(query) ||
        h.facility.toLowerCase().includes(query);

      const matchFacility =
        facilityFilter === 'ALL' ||
        h.facility.toLowerCase().includes(facilityFilter.toLowerCase());

      return matchSearch && matchFacility;
    });
  }, [historyRecords, searchQuery, facilityFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalCompleted = historyRecords.length;
    const totalDispatchedNum = historyRecords.reduce((sum, h) => sum + (Number(h.invoicedValue) || 0), 0);
    const lifetimeDispatched = '$' + totalDispatchedNum.toLocaleString();
    const onTimeRate = historyRecords.length > 0 ? '100%' : '0%';
    const avgTransitDays = historyRecords.length > 0 ? '1.8 Days' : '0 Days';
    return { totalCompleted, lifetimeDispatched, onTimeRate, avgTransitDays };
  }, [historyRecords]);

  // CSV Export
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      showToast('No historical delivery records to export.');
      return;
    }
    const headers = ['GRN Number', 'PO Number', 'Delivery Date', 'Receiving Dock', 'Received By', 'Packages', 'Invoiced Value (INR)', 'QA Result'];
    const rows = filteredRecords.map(r => [
      r.grnNumber,
      r.poNumber,
      r.deliveredDate,
      `"${r.facility}"`,
      `"${r.receivedBy}"`,
      r.packages,
      r.totalValue,
      `"${r.inspectionResult}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Delivery_History_Fulfillment_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Delivery fulfillment archive exported successfully!');
  };

  return (
    <div className="admin-page-container fade-in">
      {/* ── Universal Header ── */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <h1 className="admin-dash-title">Delivery History & Fulfillment Archive</h1>
          <p className="admin-dash-sub">
            Electronic Goods Receipt Notes (GRN), hospital receiving dock verifications, and historical supply manifests.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600, marginRight: 8 }}>
            {dateTime || 'Apr 29, 2025 11:42 AM'}
          </span>
          <button
            onClick={handleExportCSV}
            className="clay-action-pill-btn clay-action-pill-btn--secondary"
            title="Export Delivery Archive to CSV"
          >
            <IconDownload size={15} /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="clay-action-pill-btn clay-action-pill-btn--secondary"
            title="Print Fulfillment Report"
          >
            <IconPrinter size={15} /> Print Log
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
            <span className="clay-stat-card__label">Completed Deliveries</span>
            <div className="clay-stat-card__value">{stats.totalCompleted}</div>
            <span className="clay-stat-card__sub">100% QA acceptance</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconCheckCircle size={22} />
          </div>
        </div>

        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Dispatched Value</span>
            <div className="clay-stat-card__value">{stats.lifetimeDispatched}</div>
            <span className="clay-stat-card__sub">Fulfilled hospital POs</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--mint">
            <IconDollar size={22} />
          </div>
        </div>

        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">On-Time Rate</span>
            <div className="clay-stat-card__value" style={{ color: '#16a34a' }}>{stats.onTimeRate}</div>
            <span className="clay-stat-card__sub" style={{ color: '#16a34a', fontWeight: 600 }}>Exceeds SLA target</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--blue">
            <IconShieldCheck size={22} />
          </div>
        </div>

        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Avg Delivery Time</span>
            <div className="clay-stat-card__value">{stats.avgTransitDays}</div>
            <span className="clay-stat-card__sub">Order to dock handover</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <IconClock size={22} />
          </div>
        </div>
      </div>

      {/* ── Row 2: Search & Filter Bar ── */}
      <div className="clay-filter-bar">
        <div className="clay-search-pill" style={{ flex: 1, minWidth: '240px' }}>
          <IconSearch size={16} />
          <input
            type="text"
            placeholder="Search GRN receipt #, PO #, receiving staff, or dock..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.84rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="clay-select-pill"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            aria-label="Filter by Time Period"
          >
            <option value="ALL">All Time</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">This Fiscal Year</option>
          </select>

          <select
            className="clay-select-pill"
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            aria-label="Filter by Receiving Dock"
          >
            <option value="ALL">All Receiving Facilities</option>
            <option value="Central Pharmacy">Central Pharmacy Dock A</option>
            <option value="Pediatric">Pediatric Outpatient</option>
            <option value="Emergency">Emergency & Trauma</option>
            <option value="Surgical">Surgical Supply Dock</option>
          </select>
        </div>
      </div>

      {/* ── Row 3: Split Layout (Archive Table + Electronic GRN Receipt) ── */}
      <div className="clay-split-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 380px' }}>
        {/* Left Column: Historical Deliveries Table */}
        <div className="clay-card-table">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #eef3f8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="clay-stat-card__icon-squircle clay-squircle--teal" style={{ width: 34, height: 34, minWidth: 34 }}>
                <IconHistory size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#16324F' }}>Completed Goods Inward Receipts</h2>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#008C8C', fontWeight: 600 }}>
              {filteredRecords.length} Receipts
            </span>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>GRN Receipt #</th>
                  <th>PO Reference</th>
                  <th>Delivery Date & Time</th>
                  <th>Receiving Dock</th>
                  <th>Received By</th>
                  <th style={{ textAlign: 'center' }}>Pkgs</th>
                  <th style={{ textAlign: 'right' }}>Invoiced (₹)</th>
                  <th>QA Inspection</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No delivery receipts found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item) => {
                    const isSelected = selectedReceipt?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedReceipt(item)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(0, 140, 140, 0.05)' : undefined,
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <td style={{ fontWeight: 700, color: '#008C8C', whiteSpace: 'nowrap' }}>
                          {item.grnNumber}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#16324F', whiteSpace: 'nowrap' }}>
                          {item.poNumber}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.82rem' }}>
                          {item.deliveredDate}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.facility}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 500, color: '#0f172a' }}>
                          {item.receivedBy}
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600 }}>{item.packages}</span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#008C8C', whiteSpace: 'nowrap' }}>
                          ₹ {item.totalValue ? item.totalValue.toLocaleString() : '0'}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className="staff-badge staff-badge--received">
                            {item.inspectionResult}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReceipt(item);
                            }}
                            className="clay-action-pill-btn clay-action-pill-btn--secondary"
                            style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                          >
                            <IconEye size={13} /> View GRN
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

        {/* Right Column: Goods Receipt Note (GRN) Inspector */}
        <div className="clay-side-widget">
          {selectedReceipt ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ paddingBottom: '12px', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>
                    Goods Receipt Note (GRN)
                  </span>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '1.2rem', color: '#008C8C', fontWeight: 700 }}>
                    {selectedReceipt.grnNumber}
                  </h3>
                </div>
                <span className="staff-badge staff-badge--received">
                  Verified & Signed
                </span>
              </div>

              {/* Digital Dock Acknowledgment Stamp */}
              <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '12px', borderRadius: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#008C8C', fontWeight: 600, marginBottom: '6px' }}>
                  <IconShieldCheck size={16} />
                  <span>Hospital Dock Receiving Stamp</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Received By:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedReceipt.receivedBy}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Handover Timestamp:</span>
                  <span style={{ fontWeight: 500 }}>{selectedReceipt.deliveredDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Dock Location:</span>
                  <span style={{ fontWeight: 500 }}>{selectedReceipt.facility}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Arrival Temperature:</span>
                  <span style={{ fontWeight: 600, color: '#065f46' }}>{selectedReceipt.temperatureAtArrival}</span>
                </div>
              </div>

              {/* Courier & Carrier Manifest */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>PO Reference:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#008C8C' }}>{selectedReceipt.poNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Carrier Service:</span>
                  <span style={{ fontWeight: 500 }}>{selectedReceipt.carrier}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Waybill / Airbill:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedReceipt.trackingNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Consignment Boxes:</span>
                  <span style={{ fontWeight: 600 }}>{selectedReceipt.packages} sealed cartons</span>
                </div>
              </div>

              {/* Line Items Acknowledged */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 }}>
                  Delivered Items Invoiced
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedReceipt.lineItems?.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: '#ffffff',
                        border: '1px solid #eef3f8',
                        borderRadius: '10px',
                        fontSize: '0.84rem'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Verified Qty: {item.qty} units
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#008C8C' }}>
                          ₹ {item.total?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          @ ₹ {item.price}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 700, color: '#008C8C' }}>
                  <span>Settled Invoice Value:</span>
                  <span>₹ {selectedReceipt.totalValue?.toLocaleString()}</span>
                </div>
                <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#64748b' }}>
                  Inspection: <strong style={{ color: '#16a34a' }}>{selectedReceipt.inspectionResult}</strong> &bull; {selectedReceipt.dockNotes}
                </div>
              </div>

              {/* Receipt Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #edf2f7', paddingTop: '10px' }}>
                <button
                  onClick={() => window.print()}
                  className="clay-action-pill-btn clay-action-pill-btn--secondary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                >
                  <IconPrinter size={15} />
                  <span>Print GRN</span>
                </button>

                <button
                  onClick={() => {
                    showToast(`Electronic GRN certificate for ${selectedReceipt.grnNumber} downloaded.`);
                  }}
                  className="clay-action-pill-btn clay-action-pill-btn--primary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                >
                  <IconDownload size={15} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
              <IconHistory size={42} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
              <h3 style={{ margin: '0 0 6px 0', color: '#0f172a' }}>No Receipt Selected</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Select a completed goods receipt from the table to view dock inspector certification, temperature logs, and settled invoice values.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

