import React, { useState, useEffect, useCallback } from 'react';
import {
  IconClock,
  IconCalendar,
  IconAlertTriangle,
  IconXCircle,
  IconSearch,
  IconRefresh,
  IconDownload,
  IconFileText,
  IconEye,
  IconX
} from '../../components/icons/Icons';
import {
  fetchBatches,
  fetchExpiringBatches
} from '../../services/api';
import './StaffCommon.css';
import '../admin/AdminPages.css';

export default function StaffExpiryPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active filter tab
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, EXPIRED, 7, 30, 60, 90
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  const defaultBatches = [
    { id: 1, name: 'Paracetamol 500mg', batch: 'PCT2024001', expiry: '2025-04-28', daysRemaining: -1, qty: 50, status: 'Expired', category: 'Analgesics' },
    { id: 2, name: 'Amoxicillin 250mg', batch: 'AMX2024003', expiry: '2025-05-05', daysRemaining: 6, qty: 120, status: 'Expiring Soon', category: 'Antibiotics' },
    { id: 3, name: 'Omeprazole 20mg', batch: 'OMP2024005', expiry: '2025-05-12', daysRemaining: 13, qty: 85, status: 'Expiring Soon', category: 'Gastrointestinal' },
    { id: 4, name: 'Atorvastatin 10mg', batch: 'ATV2024007', expiry: '2025-05-20', daysRemaining: 21, qty: 40, status: 'Expiring Soon', category: 'Cardiovascular' },
    { id: 5, name: 'Metformin 500mg', batch: 'MET2024008', expiry: '2025-06-15', daysRemaining: 47, qty: 30, status: 'Normal', category: 'Diabetes' },
    { id: 6, name: 'Ibuprofen 400mg', batch: 'IBU2024010', expiry: '2025-07-10', daysRemaining: 72, qty: 60, status: 'Normal', category: 'Analgesics' },
    { id: 7, name: 'Ciprofloxacin 500mg', batch: 'CIP2024012', expiry: '2025-08-05', daysRemaining: 98, qty: 15, status: 'Normal', category: 'Antibiotics' },
    { id: 8, name: 'Lisinopril 10mg', batch: 'LIS2024015', expiry: '2025-09-18', daysRemaining: 142, qty: 40, status: 'Normal', category: 'Cardiovascular' }
  ];

  const nearExpiryList = [
    { name: 'Amoxicillin 250mg', batch: 'AMX2024003', expiry: '2025-05-05', days: 6, status: 'Expiring Soon' },
    { name: 'Omeprazole 20mg', batch: 'OMP2024005', expiry: '2025-05-12', days: 13, status: 'Expiring Soon' },
    { name: 'Atorvastatin 10mg', batch: 'ATV2024007', expiry: '2025-05-20', days: 21, status: 'Expiring Soon' },
    { name: 'Metformin 500mg', batch: 'MET2024008', expiry: '2025-06-15', days: 47, status: 'Watch' },
  ];

  const expiredList = [
    { name: 'Paracetamol 500mg', batch: 'PCT2024001', expiry: '2025-04-28', qty: 50 },
    { name: 'Ibuprofen 400mg', batch: 'IBU2024002', expiry: '2025-04-20', qty: 30 },
    { name: 'Ciprofloxacin 500mg', batch: 'CIP2024006', expiry: '2025-04-15', qty: 20 },
    { name: 'Ranitidine 150mg', batch: 'RAN2024009', expiry: '2025-04-10', qty: 15 },
  ];

  const [items, setItems] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchBatches().catch(() => []);
      if (Array.isArray(data) && data.length > 0) {
        setBatches(data);
        const today = new Date();
        const mapped = data.map((b, i) => {
          const expDate = new Date(b.expiryDate || '2026-12-31');
          const daysRemaining = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
          let status = 'Normal';
          if (daysRemaining <= 0) status = 'Expired';
          else if (daysRemaining <= 30) status = 'Expiring Soon';

          return {
            id: b.batchId || i + 1,
            name: b.medicine?.medicineName || `Medicine #${b.medicineId}`,
            batch: b.batchNumber,
            expiry: b.expiryDate,
            daysRemaining,
            qty: b.quantityAvailable != null ? b.quantityAvailable : 0,
            status,
            category: b.medicine?.category?.categoryName || b.medicine?.dosageForm || 'General'
          };
        });
        setItems(mapped);
      } else {
        setItems([]);
      }
    } catch (_e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab and filter logic
  const filtered = items.filter(b => {
    if (activeTab === 'EXPIRED' && b.daysRemaining >= 0) return false;
    if (activeTab === '7' && (b.daysRemaining < 0 || b.daysRemaining > 7)) return false;
    if (activeTab === '30' && (b.daysRemaining < 0 || b.daysRemaining > 30)) return false;
    if (activeTab === '60' && (b.daysRemaining < 0 || b.daysRemaining > 60)) return false;
    if (activeTab === '90' && (b.daysRemaining < 0 || b.daysRemaining > 90)) return false;

    if (search) {
      const s = search.toLowerCase();
      const matchName = b.name.toLowerCase().includes(s);
      const matchBatch = b.batch.toLowerCase().includes(s);
      if (!matchName && !matchBatch) return false;
    }
    if (categoryFilter !== 'ALL' && b.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;

    return true;
  });

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('ALL');
    setSupplierFilter('ALL');
    setStatusFilter('ALL');
    setActiveTab('ALL');
  };

  const expiredCount = items.filter(b => b.daysRemaining <= 0).length;
  const days7Count = items.filter(b => b.daysRemaining > 0 && b.daysRemaining <= 7).length;
  const days30Count = items.filter(b => b.daysRemaining > 0 && b.daysRemaining <= 30).length;
  const days60Count = items.filter(b => b.daysRemaining > 0 && b.daysRemaining <= 60).length;
  const days90Count = items.filter(b => b.daysRemaining > 0 && b.daysRemaining <= 90).length;

  return (
    <div className="admin-page-container fade-in">
      {/* ── Top Header ── */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <h1 className="admin-dash-title">Expiry Checking</h1>
          <p className="admin-dash-sub">
            Monitor expiring and expired medicines, view alerts, and manage expiry-related tasks.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600, marginRight: 8 }}>
            {dateTime || 'Apr 29, 2025 11:42 AM'}
          </span>
          <button className="clay-action-pill-btn clay-action-pill-btn--secondary" onClick={loadData}>
            <IconRefresh size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Row 1: 5 Clay Stat Cards ── */}
      <div className="clay-stat-grid-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        <div className="clay-stat-card" onClick={() => setActiveTab('EXPIRED')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Expired Batches</span>
            <div className="clay-stat-card__value" style={{ color: '#DC2626' }}>{expiredCount}</div>
            <span className="clay-stat-card__sub" style={{ color: '#DC2626', fontWeight: 600 }}>Quarantine alert &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--coral">
            <IconAlertTriangle size={22} />
          </div>
        </div>

        <div className="clay-stat-card" onClick={() => setActiveTab('7')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Expiring &le; 7 Days</span>
            <div className="clay-stat-card__value" style={{ color: '#EA580C' }}>{days7Count}</div>
            <span className="clay-stat-card__sub" style={{ color: '#EA580C', fontWeight: 600 }}>Urgent action &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <IconClock size={22} />
          </div>
        </div>

        <div className="clay-stat-card" onClick={() => setActiveTab('30')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Expiring &le; 30 Days</span>
            <div className="clay-stat-card__value" style={{ color: '#D97706' }}>{days30Count}</div>
            <span className="clay-stat-card__sub" style={{ color: '#D97706', fontWeight: 600 }}>Review stock &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <IconCalendar size={22} />
          </div>
        </div>

        <div className="clay-stat-card" onClick={() => setActiveTab('60')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Expiring &le; 60 Days</span>
            <div className="clay-stat-card__value">{days60Count}</div>
            <span className="clay-stat-card__sub">Rotation list &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconClock size={22} />
          </div>
        </div>

        <div className="clay-stat-card" onClick={() => setActiveTab('90')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Expiring &le; 90 Days</span>
            <div className="clay-stat-card__value">{days90Count}</div>
            <span className="clay-stat-card__sub">Scheduled review &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--blue">
            <IconCalendar size={22} />
          </div>
        </div>
      </div>

      {/* ── Main Section: Expiry Alerts (Left) + Expiry Trend & Filters (Right) ── */}
      <div className="clay-split-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
        {/* Left: Expiry Alerts Table Card */}
        <div className="clay-card-table">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #eef3f8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="clay-stat-card__icon-squircle clay-squircle--coral" style={{ width: 34, height: 34, minWidth: 34 }}>
                <IconAlertTriangle size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#16324F' }}>Expiry Alerts</h3>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#008C8C', fontWeight: 600 }}>Showing {filtered.length} batches</span>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 8, padding: '12px 20px', background: 'rgba(248, 250, 252, 0.7)', borderBottom: '1px solid #edf2f7', flexWrap: 'wrap' }}>
            {[
              { key: 'ALL', label: `All (${items.length})` },
              { key: 'EXPIRED', label: `Expired (${expiredCount})` },
              { key: '7', label: `\u2264 7 Days (${days7Count})` },
              { key: '30', label: `\u2264 30 Days (${days30Count})` },
              { key: '60', label: `\u2264 60 Days (${days60Count})` },
              { key: '90', label: `\u2264 90 Days (${days90Count})` }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`clay-filter-pill-btn ${activeTab === tab.key ? 'clay-filter-pill-btn--active' : ''}`}
                style={{
                  padding: '7px 16px',
                  borderRadius: 9999,
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: activeTab === tab.key ? 'none' : '1.5px solid #dce8f2',
                  background: activeTab === tab.key ? 'linear-gradient(135deg, #008C8C 0%, #007070 100%)' : '#FFFFFF',
                  color: activeTab === tab.key ? '#FFFFFF' : '#475569',
                  boxShadow: activeTab === tab.key ? '0 4px 12px rgba(0, 140, 140, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.35)' : '0 2px 5px rgba(0,0,0,0.04), inset 0 1px 1px #fff',
                  width: 'auto',
                  minWidth: 'fit-content',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 34, textAlign: 'center' }}><input type="checkbox" className="clay-checkbox" /></th>
                  <th>Medicine Name</th>
                  <th>Batch No.</th>
                  <th>Expiry Date</th>
                  <th>Days Remaining</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center' }}><input type="checkbox" className="clay-checkbox" /></td>
                    <td style={{ fontWeight: 600, color: '#16324F' }}>{item.name}</td>
                    <td style={{ color: '#64748B', fontFamily: 'monospace', fontWeight: 600 }}>{item.batch}</td>
                    <td style={{ color: '#64748B' }}>{item.expiry}</td>
                    <td style={{ fontWeight: 700, color: item.daysRemaining < 0 ? '#DC2626' : item.daysRemaining <= 30 ? '#EA580C' : '#16A34A' }}>
                      {item.daysRemaining}
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.qty}</td>
                    <td>
                      <span className={`staff-badge staff-badge--${item.status.toLowerCase().replace(/\s+/g, '')}`}>
                        <span className="staff-badge-dot"></span>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="clay-action-pill-btn clay-action-pill-btn--secondary" style={{ padding: '3px 10px', fontSize: '0.78rem' }}>
                        <IconEye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="clay-pagination" style={{ margin: '14px 16px' }}>
            <span>Showing 1-8 of 120 medicines</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="clay-page-btn">&lt;</button>
              <button className="clay-page-btn clay-page-btn--active">1</button>
              <button className="clay-page-btn">2</button>
              <button className="clay-page-btn">3</button>
              <button className="clay-page-btn">&gt;</button>
            </div>
          </div>
        </div>

        {/* Right: Expiry Trend Donut Chart & Quick Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Donut Trend Card */}
          <div className="clay-side-widget">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div className="clay-stat-card__icon-squircle clay-squircle--teal" style={{ width: 32, height: 32, minWidth: 32 }}>
                <IconCalendar size={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#16324F' }}>Expiry Trend</h3>
            </div>
            <div className="staff-card-body" style={{ padding: 0 }}>
              <div className="staff-donut-container">
                <div className="staff-donut-chart-wrap">
                  <svg viewBox="0 0 100 100" width="100%" height="100%">
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="13" />
                    {/* Expired 4.2% - Red */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#DC2626" strokeWidth="13" strokeDasharray="10 229" strokeDashoffset="0" />
                    {/* <= 7 Days 10.1% - Orange */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#EA580C" strokeWidth="13" strokeDasharray="24 215" strokeDashoffset="-10" />
                    {/* <= 30 Days 23.5% - Amber */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#D97706" strokeWidth="13" strokeDasharray="56 183" strokeDashoffset="-34" />
                    {/* <= 60 Days 38.7% - Teal */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0D9488" strokeWidth="13" strokeDasharray="92 147" strokeDashoffset="-90" />
                    {/* <= 90 Days 61.3% - Blue */}
                    <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0284C7" strokeWidth="13" strokeDasharray="57 182" strokeDashoffset="-182" />
                  </svg>
                  <div className="staff-donut-center-label">
                    <div className="staff-donut-center-sub">Total Expiring</div>
                    <div className="staff-donut-center-num">119</div>
                    <div className="staff-donut-center-sub" style={{ textTransform: 'lowercase' }}>batches</div>
                  </div>
                </div>

                <div className="staff-donut-legend">
                  <div className="staff-donut-legend-item">
                    <div className="staff-donut-legend-left">
                      <span className="staff-donut-legend-color" style={{ background: '#DC2626' }}></span>
                      <span>Expired</span>
                    </div>
                    <span className="staff-donut-legend-val">5 (4.2%)</span>
                  </div>
                  <div className="staff-donut-legend-item">
                    <div className="staff-donut-legend-left">
                      <span className="staff-donut-legend-color" style={{ background: '#EA580C' }}></span>
                      <span>&le; 7 Days</span>
                    </div>
                    <span className="staff-donut-legend-val">12 (10.1%)</span>
                  </div>
                  <div className="staff-donut-legend-item">
                    <div className="staff-donut-legend-left">
                      <span className="staff-donut-legend-color" style={{ background: '#D97706' }}></span>
                      <span>&le; 30 Days</span>
                    </div>
                    <span className="staff-donut-legend-val">28 (23.5%)</span>
                  </div>
                  <div className="staff-donut-legend-item">
                    <div className="staff-donut-legend-left">
                      <span className="staff-donut-legend-color" style={{ background: '#0D9488' }}></span>
                      <span>&le; 60 Days</span>
                    </div>
                    <span className="staff-donut-legend-val">46 (38.7%)</span>
                  </div>
                  <div className="staff-donut-legend-item">
                    <div className="staff-donut-legend-left">
                      <span className="staff-donut-legend-color" style={{ background: '#0284C7' }}></span>
                      <span>&le; 90 Days</span>
                    </div>
                    <span className="staff-donut-legend-val">73 (61.3%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="clay-side-widget">
            <h3 style={{ margin: '0 0 14px', fontSize: '0.96rem', fontWeight: 700, color: '#16324F' }}>Quick Filters</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select
                className="clay-select-pill"
                style={{ width: '100%' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="Analgesics">Analgesics</option>
                <option value="Antibiotics">Antibiotics</option>
                <option value="Gastrointestinal">Gastrointestinal</option>
                <option value="Cardiovascular">Cardiovascular</option>
              </select>

              <select
                className="clay-select-pill"
                style={{ width: '100%' }}
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <option value="ALL">All Suppliers</option>
                <option value="Cipla">Cipla Healthcare Ltd.</option>
                <option value="Sun">Sun Pharma Ltd.</option>
              </select>

              <select
                className="clay-select-pill"
                style={{ width: '100%' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="Expired">Expired</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Normal">Normal</option>
              </select>

              <div className="clay-search-pill" style={{ width: '100%', boxSizing: 'border-box' }}>
                <IconSearch size={15} />
                <input
                  type="text"
                  placeholder="Search medicine, batch..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="clay-action-pill-btn clay-action-pill-btn--primary" style={{ flex: 1, justifyContent: 'center' }}>
                  <IconSearch size={14} /> Search
                </button>
                <button className="clay-action-pill-btn clay-action-pill-btn--secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={clearFilters}>
                  <IconRefresh size={14} /> Clear
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="clay-side-widget">
            <h3 style={{ margin: '0 0 14px', fontSize: '0.96rem', fontWeight: 700, color: '#16324F' }}>Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="clay-action-pill-btn clay-action-pill-btn--secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <IconFileText size={16} />
                <span>View Expiry Report</span>
              </button>
              <button className="clay-action-pill-btn clay-action-pill-btn--secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <IconDownload size={16} />
                <span>Export to Excel</span>
              </button>
              <button className="clay-action-pill-btn clay-action-pill-btn--secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <IconDownload size={16} />
                <span>Export to PDF</span>
              </button>
              <button className="clay-action-pill-btn clay-action-pill-btn--secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={loadData}>
                <IconRefresh size={16} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Near Expiry Medicines (Left) + Expired Medicines (Right) ── */}
      <div className="clay-split-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', marginTop: 16 }}>
        {/* Near Expiry Medicines */}
        <div className="clay-card-table">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid #eef3f8' }}>
            <div className="clay-stat-card__icon-squircle clay-squircle--amber" style={{ width: 32, height: 32, minWidth: 32 }}>
              <IconClock size={16} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#16324F' }}>Near Expiry Medicines</h3>
          </div>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Batch No.</th>
                  <th>Expiry Date</th>
                  <th>Days Left</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {nearExpiryList.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: '#16324F' }}>{item.name}</td>
                    <td style={{ color: '#64748B', fontFamily: 'monospace', fontWeight: 600 }}>{item.batch}</td>
                    <td style={{ color: '#64748B' }}>{item.expiry}</td>
                    <td style={{ fontWeight: 700, color: '#EA580C' }}>{item.days}</td>
                    <td>
                      <span className="staff-badge staff-badge--expiring">
                        <span className="staff-badge-dot"></span> {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expired Medicines */}
        <div className="clay-card-table">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid #eef3f8' }}>
            <div className="clay-stat-card__icon-squircle clay-squircle--coral" style={{ width: 32, height: 32, minWidth: 32 }}>
              <IconAlertTriangle size={16} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#16324F' }}>Expired Medicines</h3>
          </div>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Batch No.</th>
                  <th>Expiry Date</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {expiredList.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: '#16324F' }}>{item.name}</td>
                    <td style={{ color: '#64748B', fontFamily: 'monospace', fontWeight: 600 }}>{item.batch}</td>
                    <td style={{ color: '#DC2626', fontWeight: 600 }}>{item.expiry}</td>
                    <td style={{ fontWeight: 700, color: '#16324F' }}>{item.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
