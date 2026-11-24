import { useState, useEffect, useCallback } from 'react';
import {
  fetchBatches
} from '../../services/api';
import {
  IconClock,
  IconSearch,
  IconEdit,
  IconTrash,
  IconDownload,
  IconShield,
  IconCheckCircle
} from '../../components/icons/Icons';
import { exportToCsv } from '../../utils/csvExport';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import './AdminPages.css';

// Seed batches matching screen_07 reference
const SEED_EXPIRY_ITEMS = [
  { id: 1, batch: 'EXP-2026-X1', name: 'Ceftriaxone 1g', expiry: '15 Dec 2026', daysLeft: 18, riskQty: 45, status: 'Critical', statusType: 'critical' },
  { id: 2, batch: 'EXP-2026-X2', name: 'Insulin Glargine 100U', expiry: '28 Dec 2026', daysLeft: 45, riskQty: 80, status: 'Warning', statusType: 'warning' },
  { id: 3, batch: 'EXP-2026-X3', name: 'Amoxicillin 500mg', expiry: '14 Feb 2027', daysLeft: 210, riskQty: 210, status: 'Good', statusType: 'good' },
  { id: 4, batch: 'EXP-2026-X4', name: 'Omeprazole 20mg', expiry: '14 Feb 2027', daysLeft: 210, riskQty: 210, status: 'Good', statusType: 'good' },
  { id: 5, batch: 'EXP-2026-X5', name: 'Paracetamol 500mg', expiry: '18 Jan 2027', daysLeft: 74, riskQty: 150, status: 'Warning', statusType: 'warning' },
  { id: 6, batch: 'EXP-2026-X6', name: 'Metformin 850mg', expiry: '22 Mar 2027', daysLeft: 245, riskQty: 320, status: 'Good', statusType: 'good' },
];

const MINI_CHART_DATA = [
  { month: 'Nov', count: 12 },
  { month: 'Dec', count: 48 },
  { month: 'Jan', count: 19 },
  { month: 'Feb', count: 35 }
];

export default function AdminExpiryPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [horizonFilter, setHorizonFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [bannerMsg, setBannerMsg] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const batches = await fetchBatches().catch(() => []);
      if (Array.isArray(batches) && batches.length > 0) {
        const today = new Date();
        const mapped = batches.map((b, idx) => {
          const expDate = new Date(b.expiryDate || '2027-02-14');
          const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
          let status = 'Good';
          let statusType = 'good';
          if (diffDays <= 30) {
            status = 'Critical';
            statusType = 'critical';
          } else if (diffDays <= 90) {
            status = 'Warning';
            statusType = 'warning';
          }

          return {
            id: b.batchId || idx + 1,
            batch: b.batchNumber || `EXP-2026-X${idx + 1}`,
            name: b.medicine?.medicineName || `Medicine #${b.medicineId}`,
            expiry: b.expiryDate || '15 Dec 2026',
            daysLeft: Math.max(diffDays, 1),
            riskQty: b.quantityAvailable || 45,
            status,
            statusType,
            raw: b
          };
        });
        setItems(mapped);
      } else {
        setItems([]);
      }
    } catch (_e) {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = !q || item.name.toLowerCase().includes(q) || item.batch.toLowerCase().includes(q);
    let matchHorizon = true;
    if (horizonFilter === '30') matchHorizon = item.daysLeft <= 30;
    else if (horizonFilter === '60') matchHorizon = item.daysLeft <= 60;
    else if (horizonFilter === '90') matchHorizon = item.daysLeft <= 90;
    return matchSearch && matchHorizon;
  });

  const expiredCount = items.filter(i => i.daysLeft <= 0).length;
  const expiring30Count = items.filter(i => i.daysLeft > 0 && i.daysLeft <= 30).length;
  const expiring60_90 = items.filter(i => i.daysLeft > 30 && i.daysLeft <= 90).length;
  const safeCount = items.filter(i => i.daysLeft > 90).length;

  function handleInitiateQuarantine() {
    const criticals = items.filter(i => i.daysLeft <= 30);
    setBannerMsg(`Quarantine protocol initiated: ${criticals.length} batches transferred to segregated quarantine zone.`);
  }

  function handleExport() {
    exportToCsv('MediStock_Expiry_Tracking_Report', items, [
      { key: 'batch', label: 'Batch Code' },
      { key: 'name', label: 'Medicine Name' },
      { key: 'expiry', label: 'Expiry Date' },
      { key: 'daysLeft', label: 'Days Remaining' },
      { key: 'riskQty', label: 'Quantity at Risk' },
      { key: 'status', label: 'Status' }
    ]);
  }

  return (
    <div className="admin-page-container">
      {/* ── Page Header Matching Screen 07 ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16324F', margin: 0 }}>Expiry Tracking</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '4px 0 0 0' }}>Monitor expiration timelines, quarantine near-expiry batches, and prevent medical waste.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={handleInitiateQuarantine}
            style={{
              height: 42,
              padding: '0 20px',
              borderRadius: 24,
              border: 'none',
              background: '#f87171',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 6px 18px rgba(248, 113, 113, 0.35)',
              cursor: 'pointer'
            }}
          >
            Initiate Quarantine
          </button>

          <button
            onClick={handleExport}
            className="clay-btn-pastel"
            style={{
              height: 42,
              padding: '0 18px',
              borderRadius: 24,
              border: '1px solid #dce8f2',
              background: '#ffffff',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.84rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(16, 46, 89, 0.05), inset 0 1px 1px #ffffff',
              cursor: 'pointer'
            }}
          >
            <IconDownload size={16} /> Export Expiry Report
          </button>
        </div>
      </div>

      {bannerMsg && (
        <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '12px 18px', borderRadius: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(153, 27, 27, 0.08)' }}>
          <span style={{ fontWeight: 600 }}>🛡️ {bannerMsg}</span>
          <button onClick={() => setBannerMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* ── 4 Stat Cards Matching Screen 07 ── */}
      <div className="clay-stat-grid-4">
        {/* Expired Batches */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Expired Batches</span>
            <span className="clay-stat-card__value" style={{ color: '#047857' }}>{expiredCount}</span>
            <span className="clay-stat-card__sub" style={{ color: '#059669' }}>Zero Wastage</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--mint">
            <IconCheckCircle size={24} />
          </div>
        </div>

        {/* Expiring <= 30 Days */}
        <div className="clay-stat-card" style={{ cursor: 'pointer' }} onClick={() => setHorizonFilter('30')}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Expiring ≤ 30 Days</span>
            <span className="clay-stat-card__value" style={{ color: '#dc2626' }}>{expiring30Count}</span>
            <span className="clay-stat-card__sub" style={{ color: '#dc2626' }}>Immediate Action</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--coral">
            <span style={{ fontSize: 24 }}>⚠️</span>
          </div>
        </div>

        {/* Expiring 60-90 Days */}
        <div className="clay-stat-card" style={{ cursor: 'pointer' }} onClick={() => setHorizonFilter('90')}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Expiring 60-90 Days</span>
            <span className="clay-stat-card__value" style={{ color: '#b45309' }}>{expiring60_90}</span>
            <span className="clay-stat-card__sub" style={{ color: '#d97706' }}>Under Monitoring</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <span style={{ fontSize: 24 }}>⏳</span>
          </div>
        </div>

        {/* Safe Batches */}
        <div className="clay-stat-card" style={{ cursor: 'pointer' }} onClick={() => setHorizonFilter('')}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Safe Batches</span>
            <span className="clay-stat-card__value" style={{ color: '#047857' }}>{safeCount}</span>
            <span className="clay-stat-card__sub" style={{ color: '#059669' }}>Optimal Shelf Life</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--mint">
            <IconShield size={24} />
          </div>
        </div>
      </div>

      {/* ── Inset Filter Bar ── */}
      <div className="clay-filter-bar">
        <div className="clay-search-pill" style={{ position: 'relative', flex: '1 1 280px', display: 'flex', alignItems: 'center' }}>
          <IconSearch size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', zIndex: 2 }} />
          <input
            type="text"
            placeholder="Search batch or medicine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: 42, padding: '0 18px 0 48px', boxSizing: 'border-box' }}
          />
        </div>

        <select
          value={horizonFilter}
          onChange={(e) => setHorizonFilter(e.target.value)}
          className="clay-select-pill"
        >
          <option value="">Expiry Horizon: All</option>
          <option value="30">Next 30 Days</option>
          <option value="60">Next 60 Days</option>
          <option value="90">Next 90 Days</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="clay-select-pill"
        >
          <option value="">Category: All</option>
          <option value="Antibiotics">Antibiotics</option>
          <option value="Diabetes">Diabetes</option>
          <option value="Pain Relief">Pain Relief</option>
        </select>

        {(search || horizonFilter || categoryFilter) && (
          <button
            onClick={() => { setSearch(''); setHorizonFilter(''); setCategoryFilter(''); }}
            style={{
              padding: '0 16px',
              height: 42,
              borderRadius: 20,
              border: '1px solid #dce8f2',
              background: '#ffffff',
              color: '#64748b',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* ── Split Layout Matching Screen 07 ── */}
      <div className="clay-split-grid">
        {/* Left Column: Expiry Batch Table */}
        <div className="clay-card-table">
          <div className="clay-card-table__header">
            <h3 className="clay-card-table__title">Expiry Batch Table</h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Tracking {filtered.length} Batches</span>
          </div>

          <div className="admin-dash__table-wrapper">
            <table className="admin-dash__table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th>Batch Code</th>
                  <th>Medicine Name</th>
                  <th>Expiry Date</th>
                  <th>Days Remaining</th>
                  <th>Quantity at Risk</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700, color: '#16324F' }}>{item.batch}</td>
                    <td style={{ fontWeight: 600, color: '#16324F' }}>{item.name}</td>
                    <td style={{ color: '#475569', fontSize: '0.82rem' }}>{item.expiry}</td>
                    <td>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background:
                            item.status === 'Critical' ? '#fee2e2' :
                            item.status === 'Warning' ? '#fef3c7' : '#BAF3E6',
                          color:
                            item.status === 'Critical' ? '#dc2626' :
                            item.status === 'Warning' ? '#b45309' : '#047857'
                        }}
                      >
                        {item.daysLeft} Days Left
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#16324F' }}>{item.riskQty} units</td>
                    <td>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 8,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background:
                            item.status === 'Critical' ? '#fee2e2' :
                            item.status === 'Warning' ? '#fef3c7' : '#d1fae5',
                          color:
                            item.status === 'Critical' ? '#dc2626' :
                            item.status === 'Warning' ? '#b45309' : '#047857'
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => alert(`Reviewing batch ${item.batch} audit log...`)}
                          className="clay-action-pill-btn"
                          title="View Audit"
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setItems(prev => prev.filter(i => i.id !== item.id));
                            setBannerMsg(`Batch ${item.batch} quarantined.`);
                          }}
                          className="clay-action-pill-btn clay-action-pill-btn--danger"
                          title="Quarantine Batch"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Centered Pagination Matching Screen 07 */}
          <div className="clay-pagination" style={{ borderTop: '1px solid #eef3f8' }}>
            <button className="clay-page-btn" disabled>|&lt;</button>
            <button className="clay-page-btn" disabled>&lt;</button>
            <button className="clay-page-btn clay-page-btn--active">1</button>
            <button className="clay-page-btn">&gt;</button>
            <button className="clay-page-btn">&gt;|</button>
          </div>
        </div>

        {/* Right Column: Expiry Timeline & Quarantine Status Matching Screen 07 */}
        <div className="clay-side-widget">
          <div>
            <h3 className="clay-side-widget__title">Expiry Timeline & Quarantine Status</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: '#64748B' }}>Horizon batch distribution</p>
          </div>

          {/* Mini Bar Chart matching Screen 07 */}
          <div style={{ width: '100%', height: 110 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MINI_CHART_DATA} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quarantined Batch Summary matching Screen 07 */}
          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 14, border: '1px solid #edf2f7' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16324F', marginBottom: 8 }}>Quarantined Batch Summary</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#64748B', marginBottom: 4 }}>
              <span>Next Expiry</span>
              <strong style={{ color: '#16324F' }}>45</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#64748B' }}>
              <span>Quarantine</span>
              <strong style={{ color: '#16324F' }}>342</strong>
            </div>
          </div>

          {/* Bottom Action Pills Matching Screen 07 */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={() => handleInitiateQuarantine()}
              className="clay-btn-pastel"
              style={{
                flex: 1,
                height: 38,
                borderRadius: 16,
                border: '1px solid #dce8f2',
                background: '#ffffff',
                color: '#334155',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Quick Action
            </button>
            <button
              onClick={() => alert('Initiating Hospital Physical Count...')}
              style={{
                flex: 1,
                height: 38,
                borderRadius: 16,
                border: 'none',
                background: '#008C8C',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0, 140, 140, 0.3)'
              }}
            >
              Physical Count
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
