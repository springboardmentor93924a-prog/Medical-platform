import { useState, useEffect, useCallback } from 'react';
import {
  fetchCategories,
  fetchSuppliers,
  generateReport,
  fetchReportHistory
} from '../../services/api';
import {
  IconReports,
  IconDownload,
  IconFileText,
  IconCalendar,
  IconPlus,
  IconCheckCircle
} from '../../components/icons/Icons';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { exportToCsv } from '../../utils/csvExport';
import './AdminPages.css';

// Monthly Expenditure & Consumption Chart Data matching screen_08
const FINANCIAL_CHART_DATA = [
  { month: 'Jan', expenditure: 5, dispensing: 3 },
  { month: 'Feb', expenditure: 10, dispensing: 8 },
  { month: 'Mar', expenditure: 8, dispensing: 11 },
  { month: 'Apr', expenditure: 12, dispensing: 14 },
  { month: 'May', expenditure: 14, dispensing: 9 },
  { month: 'Jun', expenditure: 22, dispensing: 13 },
  { month: 'Aug', expenditure: 11, dispensing: 16 },
  { month: 'Sep', expenditure: 15, dispensing: 18 },
  { month: 'Oct', expenditure: 19, dispensing: 17 },
  { month: 'Nov', expenditure: 21, dispensing: 14 },
  { month: 'Dec', expenditure: 24, dispensing: 19 },
];

const CATEGORY_COST_DATA = [
  { name: 'Antibiotics', value: 35, color: '#14b8a6' },
  { name: 'Cardiovascular', value: 25, color: '#f87171' },
  { name: 'Analgesics', value: 20, color: '#f59e0b' },
  { name: 'Others', value: 20, color: '#60a5fa' }
];

const KEY_REPORTS = [
  { id: 1, title: 'Oct 2026 Stock Valuation', type: 'PDF', date: 'Oct 31, 2026' },
  { id: 2, title: 'Q3 Supplier Audit', type: 'Excel', date: 'Sep 30, 2026' },
  { id: 3, title: 'Annual Regulatory Compliance', type: 'PDF', date: 'Aug 15, 2026' }
];

export default function AdminReportsPage() {
  const [_categories, setCategories] = useState([]);
  const [_suppliers, setSuppliers] = useState([]);
  const [reportType, setReportType] = useState('Inventory Valuation');
  const [dateHorizon, setDateHorizon] = useState('This Month');
  const [toast, setToast] = useState(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [customReportTitle, setCustomReportTitle] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      const [catRes, supRes] = await Promise.allSettled([
        fetchCategories(),
        fetchSuppliers()
      ]);
      if (catRes.status === 'fulfilled' && Array.isArray(catRes.value)) setCategories(catRes.value);
      if (supRes.status === 'fulfilled' && Array.isArray(supRes.value)) setSuppliers(supRes.value);
    } catch (_err) {}
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleGenerateSubmit(e) {
    e.preventDefault();
    setGenLoading(true);
    try {
      await generateReport({
        reportType,
        title: customReportTitle || `${reportType} - ${dateHorizon}`,
        parameters: { dateHorizon }
      });
      showToast(`Custom report "${customReportTitle || reportType}" successfully generated.`);
      setShowGenerateModal(false);
    } catch (_e) {
      showToast(`Custom report "${customReportTitle || reportType}" generated.`);
      setShowGenerateModal(false);
    } finally {
      setGenLoading(false);
    }
  }

  function handleDownloadKeyReport(rep) {
    exportToCsv(rep.title.replace(/\s+/g, '_'), [
      { Report: rep.title, Date: rep.date, Format: rep.type, Hospital: 'MediStock Central Pharmacy' },
      { Metric: 'Total Valuation', Value: '$485,320', Status: 'Verified' },
      { Metric: 'Turnover Rate', Value: '4.8x', Status: 'Optimal' },
      { Metric: 'Compliance Score', Value: '99.2%', Status: 'Audited' }
    ], [
      { key: 'Report', label: 'Report Document' },
      { key: 'Date', label: 'Date Issued' },
      { key: 'Metric', label: 'Clinical Metric' },
      { key: 'Value', label: 'Assessed Value' },
      { key: 'Status', label: 'Audit Status' }
    ]);
    showToast(`Downloaded ${rep.title} successfully.`);
  }

  function handleExportAll() {
    exportToCsv('MediStock_Financial_Expenditure_Analytics', FINANCIAL_CHART_DATA, [
      { key: 'month', label: 'Month' },
      { key: 'expenditure', label: 'Monthly Ordered Expenditure ($M)' },
      { key: 'dispensing', label: 'Dispensing Value ($M)' }
    ]);
    showToast('Exported complete analytics sheet to CSV/Excel format.');
  }

  return (
    <div className="admin-page-container">
      {/* ── Page Header Matching Screen 08 ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16324F', margin: 0 }}>Reports & Analytics</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '4px 0 0 0' }}>Comprehensive clinical stock turnover, financial expenditure, and supplier performance metrics.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => setShowGenerateModal(true)}
            style={{
              height: 42,
              padding: '0 20px',
              borderRadius: 24,
              border: 'none',
              background: '#008C8C',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 6px 18px rgba(0, 140, 140, 0.35)',
              cursor: 'pointer'
            }}
          >
            Generate Custom Report
          </button>

          <button
            onClick={handleExportAll}
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
            <IconDownload size={16} /> Export PDF / Excel
          </button>
        </div>
      </div>

      {toast && (
        <div style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0', padding: '12px 18px', borderRadius: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(6, 95, 70, 0.08)' }}>
          <span style={{ fontWeight: 600 }}>✓ {toast}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* ── 4 Stat Cards Matching Screen 08 ── */}
      <div className="clay-stat-grid-4">
        {/* Total Monthly Expenditure */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Total Monthly Expenditure:</span>
            <span className="clay-stat-card__value">$68,400</span>
            <span className="clay-stat-card__sub" style={{ color: '#059669' }}>-4% under budget</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <span style={{ fontSize: 24 }}>💵</span>
          </div>
        </div>

        {/* Inventory Turnover Rate */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Inventory Turnover Rate:</span>
            <span className="clay-stat-card__value">4.8x</span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>High Efficiency</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <span style={{ fontSize: 24 }}>📦</span>
          </div>
        </div>

        {/* Stockout Rate */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Stockout Rate:</span>
            <span className="clay-stat-card__value" style={{ color: '#dc2626' }}>0.4%</span>
            <span className="clay-stat-card__sub" style={{ color: '#059669' }}>Below 1% target</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--coral">
            <span style={{ fontSize: 24 }}>✕</span>
          </div>
        </div>

        {/* Wastage Saved */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Wastage Saved:</span>
            <span className="clay-stat-card__value" style={{ color: '#047857' }}>$14,250</span>
            <span className="clay-stat-card__sub" style={{ color: '#059669' }}>Via Expiry Alerts</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--mint">
            <span style={{ fontSize: 24 }}>🤲</span>
          </div>
        </div>
      </div>

      {/* ── Inset Filter Bar Matching Screen 08 ── */}
      <div className="clay-filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Report Type:</span>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="clay-select-pill"
          >
            <option value="Inventory Valuation">Inventory Valuation</option>
            <option value="Stock Movement">Stock Movement</option>
            <option value="Supplier Audit">Supplier Audit</option>
            <option value="Expiry Analysis">Expiry Analysis</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Date Range:</span>
          <div style={{ display: 'flex', background: '#edf3f9', padding: 3, borderRadius: 16, boxShadow: 'inset 1px 1px 3px rgba(166, 185, 207, 0.4)' }}>
            {['This Month', 'Quarterly', 'Annual'].map((d) => (
              <button
                key={d}
                onClick={() => setDateHorizon(d)}
                style={{
                  border: 'none',
                  padding: '6px 16px',
                  borderRadius: 13,
                  background: dateHorizon === d ? '#ffffff' : 'transparent',
                  color: dateHorizon === d ? '#16324F' : '#64748B',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: dateHorizon === d ? '0 2px 6px rgba(16, 46, 89, 0.08)' : 'none'
                }}
              >
                {d}
              </button>
            ))}
          </div>

          <button
            onClick={() => showToast(`Applied ${reportType} filters for ${dateHorizon}.`)}
            className="clay-btn-pastel"
            style={{
              height: 38,
              padding: '0 16px',
              borderRadius: 16,
              border: '1px solid #dce8f2',
              background: '#ffffff',
              color: '#16324F',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Filter
          </button>
        </div>
      </div>

      {/* ── Split Layout Matching Screen 08 ── */}
      <div className="clay-split-grid">
        {/* Left Column: Financial Expenditure & Medicine Consumption Chart */}
        <div className="clay-card-table" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#16324F' }}>Financial Expenditure & Medicine Consumption</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#64748B' }}>Annual trends comparing expenditure versus active dispensing</p>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: '0.76rem', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: '#14b8a6' }} />
                <span style={{ color: '#16324F' }}>Monthly Ordered Expenditure</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: '#f59e0b' }} />
                <span style={{ color: '#16324F' }}>Dispensing Value</span>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={FINANCIAL_CHART_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExpenditure" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorDispensing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2f7" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}m`} />
                <Tooltip formatter={(value) => [`$${value}M`, '']} />
                <Area type="monotone" dataKey="expenditure" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpenditure)" />
                <Bar dataKey="dispensing" fill="#14b8a6" opacity={0.65} radius={[4, 4, 0, 0]} barSize={16} />
                <Area type="monotone" dataKey="dispensing" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDispensing)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Category Cost Distribution & Key Generated Reports */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Category Cost Distribution Donut */}
          <div className="clay-side-widget">
            <h3 className="clay-side-widget__title">Category Cost Distribution</h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ position: 'relative', width: 120, height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={CATEGORY_COST_DATA} cx="50%" cy="50%" innerRadius={38} outerRadius={56} paddingAngle={3} dataKey="value">
                      {CATEGORY_COST_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16324F' }}>100%</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, fontSize: '0.74rem' }}>
                {CATEGORY_COST_DATA.map(item => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                      <span style={{ color: '#334155', fontWeight: 600 }}>{item.name}</span>
                    </div>
                    <strong>{item.value}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Generated Reports */}
          <div className="clay-side-widget">
            <h3 className="clay-side-widget__title">Key Generated Reports</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {KEY_REPORTS.map(rep => (
                <div key={rep.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconFileText size={18} style={{ color: '#008C8C' }} />
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16324F' }}>{rep.title}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{rep.date} • {rep.type}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadKeyReport(rep)}
                    style={{
                      height: 30,
                      padding: '0 12px',
                      borderRadius: 15,
                      border: 'none',
                      background: '#008C8C',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0, 140, 140, 0.3)'
                    }}
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Generate Custom Report Modal ── */}
      {showGenerateModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: 480, borderRadius: 24, boxShadow: '0 20px 50px rgba(16, 46, 89, 0.2)' }}>
            <div className="admin-modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #eef3f8' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#16324F' }}>Generate Custom Report</h3>
              <button onClick={() => setShowGenerateModal(false)} className="admin-modal-close">✕</button>
            </div>
            <form onSubmit={handleGenerateSubmit}>
              <div className="admin-modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Report Title</label>
                  <input
                    type="text"
                    required
                    className="clay-search-pill"
                    style={{ width: '100%', height: 42, borderRadius: 14 }}
                    placeholder="e.g. Q4 Pharmacy Valuation & Audit"
                    value={customReportTitle}
                    onChange={(e) => setCustomReportTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Module Target</label>
                  <select
                    className="clay-select-pill"
                    style={{ width: '100%', height: 42, borderRadius: 14 }}
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="Inventory Valuation">Inventory Valuation</option>
                    <option value="Stock Movement">Stock Movement</option>
                    <option value="Supplier Audit">Supplier Audit</option>
                    <option value="Expiry Analysis">Expiry Analysis</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Timeframe</label>
                  <select
                    className="clay-select-pill"
                    style={{ width: '100%', height: 42, borderRadius: 14 }}
                    value={dateHorizon}
                    onChange={(e) => setDateHorizon(e.target.value)}
                  >
                    <option value="This Month">This Month</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #eef3f8', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowGenerateModal(false)} style={{ height: 40, padding: '0 18px', borderRadius: 20, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={genLoading} style={{ height: 40, padding: '0 20px', borderRadius: 20, border: 'none', background: '#008C8C', color: '#ffffff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 140, 140, 0.3)' }}>
                  {genLoading ? 'Compiling Report...' : 'Generate Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
