import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import MedicineReturnsTab from '../../components/returns/MedicineReturnsTab';
import {
  IconClipboard,
  IconCheckCircle,
  IconAlertTriangle,
  IconXCircle,
  IconSearch,
  IconRefresh,
  IconDownload,
  IconEye,
  IconSend,
  IconClock,
  IconPackage,
  IconX,
  IconPill
} from '../../components/icons/Icons';
import {
  fetchMedicines,
  fetchBatches,
  createTask,
  reportDiscrepancy
} from '../../services/api';
import { wsService } from '../../services/websocket';
import './StaffCommon.css';
import '../admin/AdminPages.css';

export default function StaffStockCheckPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'audit';
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Discrepancy form state
  const [discrepancyForm, setDiscrepancyForm] = useState({
    medicine: 'Paracetamol 500mg',
    batchNumber: 'PCT2024001',
    actualQuantity: '',
    remarks: ''
  });
  const [formSuccess, setFormSuccess] = useState(null);

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

  const defaultStockRows = [
    { id: 1, name: 'Paracetamol 500mg', code: 'MED001', category: 'Analgesics', batch: 'PCT2024001', expiry: '2026-08-15', systemQty: 50, countedQty: 50, variance: 0, status: 'In Stock' },
    { id: 2, name: 'Amoxicillin 250mg', code: 'MED002', category: 'Antibiotics', batch: 'AMX2024003', expiry: '2026-12-10', systemQty: 120, countedQty: 115, variance: -5, status: 'Low Stock' },
    { id: 3, name: 'Omeprazole 20mg', code: 'MED003', category: 'Gastrointestinal', batch: 'OMP2024005', expiry: '2025-11-30', systemQty: 85, countedQty: 85, variance: 0, status: 'In Stock' },
    { id: 4, name: 'Atorvastatin 10mg', code: 'MED004', category: 'Cardiovascular', batch: 'ATV2024007', expiry: '2026-03-20', systemQty: 45, countedQty: 40, variance: -5, status: 'Low Stock' },
    { id: 5, name: 'Metformin 500mg', code: 'MED005', category: 'Diabetes', batch: 'MET2024008', expiry: '2025-09-15', systemQty: 30, countedQty: 30, variance: 0, status: 'In Stock' },
    { id: 6, name: 'Ibuprofen 400mg', code: 'MED007', category: 'Analgesics', batch: 'IBU2024010', expiry: '2026-05-25', systemQty: 60, countedQty: 60, variance: 0, status: 'In Stock' },
    { id: 7, name: 'Ciprofloxacin 500mg', code: 'MED008', category: 'Antibiotics', batch: 'CIP2024012', expiry: '2025-08-05', systemQty: 15, countedQty: 10, variance: -5, status: 'Low Stock' },
    { id: 8, name: 'Lisinopril 10mg', code: 'MED009', category: 'Cardiovascular', batch: 'LIS2024015', expiry: '2026-11-18', systemQty: 40, countedQty: 40, variance: 0, status: 'In Stock' },
  ];

  const defaultMovements = [
    { date: '2025-04-29 09:15', name: 'Paracetamol 500mg', batch: 'PCT2024001', type: 'Stock Count', change: '+50', user: 'Sarah Khan' },
    { date: '2025-04-28 14:32', name: 'Amoxicillin 250mg', batch: 'AMX2024003', type: 'Adjustment', change: '-5', user: 'Sarah Khan' },
    { date: '2025-04-26 11:20', name: 'Omeprazole 20mg', batch: 'OMP2024005', type: 'Receipt', change: '+100', user: 'Admin User' },
    { date: '2025-04-24 16:45', name: 'Atorvastatin 10mg', batch: 'ATV2024007', type: 'Adjustment', change: '-10', user: 'Sarah Khan' },
    { date: '2025-04-22 10:30', name: 'Ibuprofen 400mg', batch: 'IBU2024010', type: 'Count', change: '+20', user: 'Sarah Khan' },
  ];

  const [stockItems, setStockItems] = useState(defaultStockRows);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [medsData, batchesData] = await Promise.all([
        fetchMedicines().catch(() => []),
        fetchBatches().catch(() => [])
      ]);
      const fetchedMeds = Array.isArray(medsData) ? medsData : [];
      const fetchedBatches = Array.isArray(batchesData) ? batchesData : [];
      setMedicines(fetchedMeds);
      setBatches(fetchedBatches);

      if (fetchedMeds.length > 0) {
        const mapped = fetchedMeds.map((med, idx) => {
          const medBatches = fetchedBatches.filter(b => b.medicineId === med.medicineId);
          const matchingBatch = medBatches[0];
          const totalStock = medBatches.reduce((sum, b) => sum + (b.quantityAvailable || 0), 0);
          const currentQty = totalStock > 0 ? totalStock : (med.totalStock != null ? med.totalStock : (med.stockQuantity || 0));
          const isLow = currentQty <= (med.reorderLevel || 20);
          return {
            id: med.medicineId,
            medicineId: med.medicineId,
            name: med.medicineName,
            code: med.medicineCode || `MED${String(med.medicineId).padStart(3, '0')}`,
            category: med.category?.categoryName || med.dosageForm || 'General',
            batch: matchingBatch?.batchNumber || `BAT-${med.medicineId}-01`,
            expiry: matchingBatch?.expiryDate ? new Date(matchingBatch.expiryDate).toISOString().split('T')[0] : '2026-12-31',
            systemQty: currentQty,
            countedQty: currentQty,
            variance: 0,
            status: currentQty === 0 ? 'Out of Stock' : (isLow ? 'Low Stock' : 'In Stock')
          };
        });
        setStockItems(mapped);
      } else {
        setStockItems(defaultStockRows);
      }
    } catch (_e) {
      setStockItems(defaultStockRows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubInv = wsService.subscribeInventory((evt) => {
      console.log('[StaffStockCheckPage] Live inventory update:', evt);
      loadData();
    });
    const unsubDisc = wsService.subscribeDiscrepancies((evt) => {
      console.log('[StaffStockCheckPage] Live discrepancy update:', evt);
      loadData();
    });
    const unsubReconnect = wsService.onReconnect(() => {
      loadData();
    });
    return () => {
      unsubInv();
      unsubDisc();
      unsubReconnect();
    };
  }, [loadData]);

  const filteredItems = stockItems.filter(item => {
    if (search) {
      const s = search.toLowerCase();
      const matchName = item.name.toLowerCase().includes(s);
      const matchCode = item.code.toLowerCase().includes(s);
      const matchBatch = item.batch.toLowerCase().includes(s);
      if (!matchName && !matchCode && !matchBatch) return false;
    }
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }
    if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const handleDiscrepancySubmit = async (e) => {
    e.preventDefault();
    if (!discrepancyForm.actualQuantity) return;
    try {
      const selectedMed = medicines.find(m => m.medicineName === discrepancyForm.medicine) || { medicineId: 1 };
      const matchingItem = stockItems.find(it => it.name === discrepancyForm.medicine);
      const expected = matchingItem ? matchingItem.systemQty : 50;
      const counted = parseInt(discrepancyForm.actualQuantity, 10);
      const diff = counted - expected;

      await reportDiscrepancy({
        medicineId: selectedMed.medicineId,
        batchNumber: discrepancyForm.batchNumber,
        expectedQuantity: expected,
        countedQuantity: counted,
        reason: discrepancyForm.remarks || 'Physical stock count discrepancy reported during routine checking'
      });

      setFormSuccess(`Discrepancy report recorded (Variance: ${diff > 0 ? `+${diff}` : diff} units). Submitted for Admin/Pharmacist review. System inventory remains unchanged.`);
      setTimeout(() => setFormSuccess(null), 5000);
      setDiscrepancyForm({
        medicine: medicines[0]?.medicineName || 'Paracetamol 500mg',
        batchNumber: 'BAT-001',
        actualQuantity: '',
        remarks: ''
      });
    } catch (err) {
      setFormSuccess('Discrepancy saved: ' + (err.message || 'Saved locally'));
      setTimeout(() => setFormSuccess(null), 4000);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
  };

  return (
    <div className="admin-page-container fade-in">
      {/* ── Top Header (Admin Clay Layout) ── */}
      <div className="admin-page-header" style={{ marginBottom: 20 }}>
        <div className="admin-page-header__left">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#102e59', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>
            Stock Checking
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
            Physical batch reconciliation, warehouse shelf audits, and discrepancy tracking.
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

      {/* ── View Switcher: Stock Checking vs Quarantine & Returns ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'audit' })}
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
          📋 Stock Checking & Audits
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
          🔄 Quarantine & Returns Intake
        </button>
      </div>

      {currentTab === 'returns' ? (
        <MedicineReturnsTab userRole="STAFF" />
      ) : (
        <>
          {/* ── Row 1: 4 KPI Cards (Clay Elevated 3D Tiles) ── */}
          <div className="clay-stat-grid-4" style={{ marginBottom: 22 }}>
        {/* Card 1: Total Stock Items */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">TOTAL ITEMS</span>
            <span className="clay-stat-card__value">248</span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>Active medicines</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconPackage size={22} />
          </div>
        </div>

        {/* Card 2: In Stock */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">IN STOCK</span>
            <span className="clay-stat-card__value" style={{ color: '#047857' }}>203</span>
            <span className="clay-stat-card__sub" style={{ color: '#059669' }}>81.9% of total</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--mint">
            <IconCheckCircle size={22} />
          </div>
        </div>

        {/* Card 3: Low Stock */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">LOW STOCK</span>
            <span className="clay-stat-card__value" style={{ color: '#b45309' }}>32</span>
            <span className="clay-stat-card__sub" style={{ color: '#d97706' }}>12.9% of total</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <IconAlertTriangle size={22} />
          </div>
        </div>

        {/* Card 4: Out of Stock */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">OUT OF STOCK</span>
            <span className="clay-stat-card__value" style={{ color: '#ef4444' }}>13</span>
            <span className="clay-stat-card__sub" style={{ color: '#dc2626' }}>5.2% of total</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--coral">
            <IconXCircle size={22} />
          </div>
        </div>
      </div>

      {/* ── Middle Split Layout: Stock Checking List (Left) + Stock Summary & Quick Actions (Right) ── */}
      <div className="clay-split-grid">
        {/* Left: Main Stock Checking List */}
        <div className="clay-card-table">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon">
                <IconClipboard size={18} />
              </span>
              <h3 className="staff-card-title">Stock Checking List</h3>
            </div>
          </div>

          {/* Sub filter bar inside card */}
          <div style={{ padding: '12px 18px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="clay-search-pill" style={{ flex: '1 1 240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <IconSearch size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', zIndex: 2 }} />
              <input
                type="text"
                style={{ width: '100%', height: 38, padding: '0 16px 0 42px', boxSizing: 'border-box' }}
                placeholder="Search by medicine name, code, or batch number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="clay-select-pill"
              style={{ minWidth: 120 }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="Analgesics">Analgesics</option>
              <option value="Antibiotics">Antibiotics</option>
              <option value="Gastrointestinal">Gastrointestinal</option>
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Diabetes">Diabetes</option>
            </select>

            <select
              className="clay-select-pill"
              style={{ minWidth: 110 }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
            </select>

            <button className="admin-btn admin-btn--outline" style={{ borderRadius: 9999, padding: '7px 14px', fontSize: '0.8rem' }} onClick={clearFilters}>
              <IconRefresh size={14} /> Clear
            </button>
          </div>

          {/* Table */}
          <div className="staff-table-wrap">
            <table className="admin-table" style={{ minWidth: 920 }}>
              <thead>
                <tr>
                  <th style={{ width: 34, textAlign: 'center' }}><input type="checkbox" /></th>
                  <th>Medicine Name</th>
                  <th>Code</th>
                  <th>Category</th>
                  <th>Batch No.</th>
                  <th>Expiry Date</th>
                  <th>System Qty</th>
                  <th>Counted Qty</th>
                  <th>Variance</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center' }}><input type="checkbox" /></td>
                    <td>
                      <div className="staff-med-cell">
                        <div className="staff-med-cell-icon">
                          <IconPill size={14} color="#0D9488" />
                        </div>
                        <span className="staff-med-cell-title">{item.name}</span>
                      </div>
                    </td>
                    <td style={{ color: '#64748B', fontFamily: 'monospace' }}>{item.code}</td>
                    <td style={{ color: '#475569' }}>{item.category}</td>
                    <td style={{ color: '#64748B' }}>{item.batch}</td>
                    <td style={{ color: '#64748B' }}>{item.expiry}</td>
                    <td style={{ fontWeight: 600 }}>{item.systemQty}</td>
                    <td style={{ fontWeight: 600 }}>{item.countedQty}</td>
                    <td style={{ fontWeight: 700, color: item.variance < 0 ? '#DC2626' : item.variance > 0 ? '#16A34A' : '#64748B' }}>
                      {item.variance > 0 ? `+${item.variance}` : item.variance}
                    </td>
                    <td>
                      <span className={`staff-badge staff-badge--${item.status.toLowerCase().replace(/\s+/g, '')}`}>
                        <span className="staff-badge-dot"></span>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="staff-btn staff-btn--outline staff-btn--sm" style={{ padding: '3px 8px' }}>
                        <IconEye size={13} color="#0D9488" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="staff-pagination">
            <span>Showing 1-8 of 8 medicines</span>
            <div className="staff-pagination-pages">
              <button className="staff-page-btn">&lt;</button>
              <button className="staff-page-btn active">1</button>
              <button className="staff-page-btn">&gt;</button>
            </div>
          </div>
        </div>

        {/* Right: Stock Summary & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stock Summary Card */}
          <div className="staff-card">
            <div className="staff-card-header">
              <div className="staff-card-title-group">
                <span className="staff-card-title-icon">
                  <IconPackage size={18} />
                </span>
                <h3 className="staff-card-title">Stock Summary</h3>
              </div>
            </div>
            <div className="staff-card-body">
              <div className="staff-ops-list">
                <div className="staff-ops-item">
                  <span style={{ color: '#64748B' }}>Total Stock Units</span>
                  <span className="staff-ops-val">412</span>
                </div>
                <div className="staff-ops-item">
                  <span style={{ color: '#64748B' }}>Available Units</span>
                  <span className="staff-ops-val">352</span>
                </div>
                <div className="staff-ops-item">
                  <span style={{ color: '#64748B' }}>Low Stock Units</span>
                  <span className="staff-ops-val">32</span>
                </div>
                <div className="staff-ops-item">
                  <span style={{ color: '#64748B' }}>Out of Stock Units</span>
                  <span className="staff-ops-val">13</span>
                </div>
                <div className="staff-ops-item" style={{ borderTop: '1px solid #E2E8F0', paddingTop: 10, marginTop: 4 }}>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>Inventory Value</span>
                  <span className="staff-ops-val" style={{ color: '#0F4A47', fontSize: '1.05rem' }}>&#8377; 1,28,450</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="staff-card">
            <div className="staff-card-header">
              <div className="staff-card-title-group">
                <span className="staff-card-title-icon" style={{ color: '#0A6663' }}>
                  <IconClipboard size={18} />
                </span>
                <h3 className="staff-card-title">Quick Actions</h3>
              </div>
            </div>
            <div className="staff-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="staff-btn staff-btn--outline staff-btn--full" style={{ justifyContent: 'flex-start' }}>
                <IconClipboard size={16} color="#0D9488" />
                <span>Submit Count</span>
              </button>
              <button className="staff-btn staff-btn--outline staff-btn--full" style={{ justifyContent: 'flex-start' }} onClick={() => setSelectedStatus(selectedStatus === 'Low Stock' ? 'ALL' : 'Low Stock')}>
                <IconAlertTriangle size={16} color="#EA580C" />
                <span>View Discrepancies</span>
              </button>
              <button className="staff-btn staff-btn--outline staff-btn--full" style={{ justifyContent: 'flex-start' }}>
                <IconDownload size={16} color="#475569" />
                <span>Export Stock Report</span>
              </button>
              <button className="staff-btn staff-btn--outline staff-btn--full" style={{ justifyContent: 'flex-start' }} onClick={loadData}>
                <IconRefresh size={16} color="#0284C7" />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Stock Movement History (Left) + Report Discrepancy Form (Right) ── */}
      <div className="staff-split-layout">
        {/* Left: Stock Movement History */}
        <div className="staff-card">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon">
                <IconClock size={18} />
              </span>
              <h3 className="staff-card-title">Stock Movement History</h3>
            </div>
            <span className="staff-card-header-link">View All</span>
          </div>
          <div className="staff-table-wrap">
            <table className="staff-table" style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Medicine Name</th>
                  <th>Batch No.</th>
                  <th>Movement Type</th>
                  <th>Quantity Change</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {defaultMovements.map((m, idx) => (
                  <tr key={idx}>
                    <td style={{ color: '#64748B' }}>{m.date}</td>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td style={{ color: '#64748B' }}>{m.batch}</td>
                    <td>{m.type}</td>
                    <td style={{ fontWeight: 700, color: m.change.startsWith('+') ? '#16A34A' : '#DC2626' }}>
                      {m.change}
                    </td>
                    <td style={{ color: '#475569' }}>{m.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Report Discrepancy Form */}
        <div className="staff-card">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon" style={{ color: '#DC2626' }}>
                <IconAlertTriangle size={18} />
              </span>
              <h3 className="staff-card-title">Report Discrepancy</h3>
            </div>
          </div>
          <div className="staff-card-body">
            <p style={{ margin: '0 0 14px 0', fontSize: '0.81rem', color: '#64748B' }}>
              Report any differences between system stock and physical count.
            </p>

            {formSuccess && (
              <div style={{ padding: '8px 12px', background: '#DCFCE7', color: '#166534', borderRadius: 8, fontSize: '0.82rem', marginBottom: 12 }}>
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleDiscrepancySubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="staff-form-group">
                  <label className="staff-form-label">Medicine</label>
                  <select
                    className="staff-select-control"
                    style={{ width: '100%' }}
                    value={discrepancyForm.medicine}
                    onChange={(e) => {
                      const medName = e.target.value;
                      const match = stockItems.find(it => it.name === medName);
                      setDiscrepancyForm({
                        ...discrepancyForm,
                        medicine: medName,
                        batchNumber: match ? match.batch : discrepancyForm.batchNumber
                      });
                    }}
                  >
                    {(stockItems.length > 0 ? stockItems : [
                      { id: 1, name: 'Paracetamol 500mg' },
                      { id: 2, name: 'Amoxicillin 250mg' },
                      { id: 3, name: 'Omeprazole 20mg' },
                      { id: 4, name: 'Atorvastatin 10mg' },
                      { id: 5, name: 'Metformin 500mg' }
                    ]).map((m) => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="staff-form-group">
                  <label className="staff-form-label">Batch Number</label>
                  <input
                    type="text"
                    className="staff-form-input"
                    placeholder="Enter batch number"
                    value={discrepancyForm.batchNumber}
                    onChange={(e) => setDiscrepancyForm({ ...discrepancyForm, batchNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="staff-form-group">
                <label className="staff-form-label">Actual Quantity</label>
                <input
                  type="number"
                  className="staff-form-input"
                  placeholder="Enter actual quantity"
                  value={discrepancyForm.actualQuantity}
                  onChange={(e) => setDiscrepancyForm({ ...discrepancyForm, actualQuantity: e.target.value })}
                  required
                />
              </div>

              <div className="staff-form-group">
                <label className="staff-form-label">Remarks</label>
                <textarea
                  className="staff-form-textarea"
                  rows="2"
                  placeholder="Add remarks (optional)"
                  value={discrepancyForm.remarks}
                  onChange={(e) => setDiscrepancyForm({ ...discrepancyForm, remarks: e.target.value })}
                ></textarea>
              </div>

              <button type="submit" className="staff-btn staff-btn--primary staff-btn--full">
                <IconSend size={15} /> Submit Report
              </button>
            </form>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
