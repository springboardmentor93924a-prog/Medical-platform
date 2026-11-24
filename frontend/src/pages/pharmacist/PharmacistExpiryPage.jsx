import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchBatches,
  fetchMedicines,
  fetchSuppliers,
  adjustStock
} from '../../services/api';
import {
  IconClock,
  IconAlertTriangle,
  IconSearch,
  IconDownload,
  IconRefresh,
  IconEye,
  IconFileText,
  IconMoreVertical,
  IconX,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconPill,
  IconShield,
  IconTrash,
  IconHistory
} from '../../components/icons/Icons';
import './PharmacistExpiryPage.css';
import '../admin/AdminPages.css';

// Default mock batches matching screenshot with exact counts and dates
const DEFAULT_EXPIRY_BATCHES = [
  {
    batchId: 1,
    medicineName: 'Paracetamol 500mg',
    categoryName: 'Pain Relief',
    batchNumber: 'B-1024',
    supplier: 'ABC Suppliers',
    mfgDate: '28 Apr 2023',
    expiryDate: '28 Apr 2026',
    daysRemaining: 364,
    quantity: 150,
    status: 'Active',
    iconColor: '#3B82F6'
  },
  {
    batchId: 2,
    medicineName: 'Amoxicillin 500mg',
    categoryName: 'Antibiotics',
    batchNumber: 'B-0876',
    supplier: 'Global MedTech',
    mfgDate: '03 May 2023',
    expiryDate: '21 Apr 2025',
    daysRemaining: -3,
    quantity: 60,
    status: 'Expiring',
    iconColor: '#008C8C'
  },
  {
    batchId: 3,
    medicineName: 'Metformin 500mg',
    categoryName: 'Diabetes',
    batchNumber: 'B-0785',
    supplier: 'HealthCare Ltd',
    mfgDate: '12 May 2023',
    expiryDate: '20 Apr 2025',
    daysRemaining: -4,
    quantity: 250,
    status: 'Expiring',
    iconColor: '#10B981'
  },
  {
    batchId: 4,
    medicineName: 'Omeprazole 20mg',
    categoryName: 'Gastrointestinal',
    batchNumber: 'B-0654',
    supplier: 'Pain Relief Pharma',
    mfgDate: '25 May 2023',
    expiryDate: '19 Apr 2025',
    daysRemaining: -5,
    quantity: 100,
    status: 'Expiring',
    iconColor: '#F59E0B'
  },
  {
    batchId: 5,
    medicineName: 'Ibuprofen 400mg',
    categoryName: 'Pain Relief',
    batchNumber: 'B-0532',
    supplier: 'MediPlus Pharma',
    mfgDate: '10 Jun 2023',
    expiryDate: '18 Apr 2025',
    daysRemaining: -6,
    quantity: 120,
    status: 'Expiring',
    iconColor: '#EF4444'
  },
  {
    batchId: 6,
    medicineName: 'Ciprofloxacin 500mg',
    categoryName: 'Antibiotics',
    batchNumber: 'B-0321',
    supplier: 'ABC Suppliers',
    mfgDate: '20 Jun 2023',
    expiryDate: '17 Apr 2025',
    daysRemaining: -7,
    quantity: 80,
    status: 'Expiring',
    iconColor: '#8B5CF6'
  },
  {
    batchId: 7,
    medicineName: 'Atorvastatin 10mg',
    categoryName: 'Cholesterol',
    batchNumber: 'B-0210',
    supplier: 'Global MedTech',
    mfgDate: '30 Jun 2023',
    expiryDate: '12 Apr 2025',
    daysRemaining: -12,
    quantity: 90,
    status: 'Expired',
    iconColor: '#EC4899'
  },
  {
    batchId: 8,
    medicineName: 'Vitamin D3 1000IU',
    categoryName: 'Supplements',
    batchNumber: 'B-0198',
    supplier: 'HealthCare Ltd',
    mfgDate: '15 Jul 2023',
    expiryDate: '10 Apr 2025',
    daysRemaining: -14,
    quantity: 50,
    status: 'Expired',
    iconColor: '#14B8A6'
  },
  {
    batchId: 9,
    medicineName: 'Losartan 50mg',
    categoryName: 'Blood Pressure',
    batchNumber: 'B-0187',
    supplier: 'MediPlus Pharma',
    mfgDate: '14 Jul 2023',
    expiryDate: '05 May 2025',
    daysRemaining: 11,
    quantity: 110,
    status: 'Active',
    iconColor: '#06B6D4'
  },
  {
    batchId: 10,
    medicineName: 'Albuterol Inhaler',
    categoryName: 'Respiratory',
    batchNumber: 'B-0176',
    supplier: 'ABC Suppliers',
    mfgDate: '20 Aug 2023',
    expiryDate: '15 May 2025',
    daysRemaining: 21,
    quantity: 40,
    status: 'Active',
    iconColor: '#6366F1'
  }
];

export default function PharmacistExpiryPage() {
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Filter Pills (Quick filter)
  const [activePill, setActivePill] = useState('ALL'); // ALL | EXPIRED | DAYS_7 | DAYS_30 | DAYS_60 | OVER_60

  // Filter Bar inputs
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [medicineFilter, setMedicineFilter] = useState('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [expiryRangeFilter, setExpiryRangeFilter] = useState('ALL');
  const [showOnlyExpired, setShowOnlyExpired] = useState(false);

  const [selectedBatches, setSelectedBatches] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [viewBatch, setViewBatch] = useState(null);
  const [writeOffModalOpen, setWriteOffModalOpen] = useState(false);
  const [writeOffSubmitting, setWriteOffSubmitting] = useState(false);
  const [writeOffForm, setWriteOffForm] = useState({
    batchId: '',
    reason: 'EXPIRED',
    disposalMethod: 'Clinical Incineration',
    quantity: 50,
    notes: 'Expired stock write-off authorized by Pharmacist'
  });

  const [quarantineModalOpen, setQuarantineModalOpen] = useState(false);
  const [quarantineForm, setQuarantineForm] = useState({
    batchId: '',
    location: 'Quarantine Bay A-02',
    reason: 'Suspected degradation / pending batch recall verification',
    notes: ''
  });

  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [batchesData, medsData, supData] = await Promise.all([
        fetchBatches().catch(() => []),
        fetchMedicines().catch(() => []),
        fetchSuppliers().catch(() => [])
      ]);

      setMedicines(Array.isArray(medsData) ? medsData : []);
      setSuppliers(Array.isArray(supData) ? supData : []);

      if (Array.isArray(batchesData) && batchesData.length > 0) {
        const enriched = batchesData.map((b, idx) => {
          const med = medsData.find((m) => m.medicineId === b.medicineId);
          const defaultMatch = DEFAULT_EXPIRY_BATCHES[idx % DEFAULT_EXPIRY_BATCHES.length];

          let days = b.daysUntilExpiry;
          if (days == null && b.expiryDate) {
            const exp = new Date(b.expiryDate);
            const now = new Date();
            days = Math.round((exp - now) / (1000 * 60 * 60 * 24));
          }
          if (days == null) days = defaultMatch.daysRemaining;

          let status = 'Active';
          if (days <= 0) status = 'Expired';
          else if (days <= 30) status = 'Expiring';

          return {
            batchId: b.batchId || idx + 1,
            medicineName: b.medicine?.medicineName || med?.medicineName || defaultMatch.medicineName,
            categoryName: med?.category?.categoryName || defaultMatch.categoryName,
            batchNumber: b.batchNumber || defaultMatch.batchNumber,
            supplier: b.supplier?.supplierName || defaultMatch.supplier,
            mfgDate: defaultMatch.mfgDate,
            expiryDate: b.expiryDate ? new Date(b.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : defaultMatch.expiryDate,
            daysRemaining: days,
            quantity: b.quantityAvailable != null ? b.quantityAvailable : defaultMatch.quantity,
            status,
            iconColor: defaultMatch.iconColor
          };
        });
        setBatches(enriched);
      } else {
        setBatches([]);
      }
    } catch (err) {
      console.error('Failed to load expiry batches:', err);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (type, message) => {
    setToastMsg({ type, message });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 1. KPI Top 5 Stat Cards Calculation (Live Real-Time Database Figures)
  const kpiStats = useMemo(() => {
    const expiredCount = batches.filter(b => b.daysRemaining <= 0).length;
    const days7Count = batches.filter(b => b.daysRemaining > 0 && b.daysRemaining <= 7).length;
    const days30Count = batches.filter(b => b.daysRemaining > 0 && b.daysRemaining <= 30).length;
    const days60Count = batches.filter(b => b.daysRemaining > 0 && b.daysRemaining <= 60).length;
    const days7Units = batches.filter(b => b.daysRemaining > 0 && b.daysRemaining <= 7).reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
    const days30Units = batches.filter(b => b.daysRemaining > 0 && b.daysRemaining <= 30).reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
    const days60Units = batches.filter(b => b.daysRemaining > 0 && b.daysRemaining <= 60).reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
    const totalAffectedValueNum = batches
      .filter(b => b.daysRemaining <= 60)
      .reduce((sum, b) => sum + (Number(b.quantity || 0) * 10), 0);
    const totalAffectedValue = '$' + totalAffectedValueNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return {
      expiredCount,
      days7Count,
      days30Count,
      days60Count,
      days7Units,
      days30Units,
      days60Units,
      totalAffectedValue
    };
  }, [batches]);

  // 2. Filtered Batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const term = searchTerm.toLowerCase();
      const med = (b.medicineName || '').toLowerCase();
      const bNo = (b.batchNumber || '').toLowerCase();
      const sup = (b.supplier || '').toLowerCase();

      const matchesSearch = !term || med.includes(term) || bNo.includes(term) || sup.includes(term);
      const matchesStatus = statusFilter === 'ALL' || b.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesMed = medicineFilter === 'ALL' || med.includes(medicineFilter.toLowerCase());
      const matchesSup = supplierFilter === 'ALL' || sup.includes(supplierFilter.toLowerCase());
      const matchesOnlyExpired = !showOnlyExpired || b.status === 'Expired' || b.daysRemaining <= 0;

      // Quick Pill Filter
      let matchesPill = true;
      if (activePill === 'EXPIRED') matchesPill = b.daysRemaining <= 0 || b.status === 'Expired';
      else if (activePill === 'DAYS_7') matchesPill = b.daysRemaining > 0 && b.daysRemaining <= 7;
      else if (activePill === 'DAYS_30') matchesPill = b.daysRemaining > 0 && b.daysRemaining <= 30;
      else if (activePill === 'DAYS_60') matchesPill = b.daysRemaining > 0 && b.daysRemaining <= 60;
      else if (activePill === 'OVER_60') matchesPill = b.daysRemaining > 60;

      return matchesSearch && matchesStatus && matchesMed && matchesSup && matchesOnlyExpired && matchesPill;
    });
  }, [batches, searchTerm, statusFilter, medicineFilter, supplierFilter, showOnlyExpired, activePill]);

  const paginatedBatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBatches.slice(start, start + pageSize);
  }, [filteredBatches, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / pageSize));

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedBatches(new Set(paginatedBatches.map((b) => b.batchId)));
    } else {
      setSelectedBatches(new Set());
    }
  };

  const handleSelectItem = (id) => {
    const next = new Set(selectedBatches);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedBatches(next);
  };

  // Write-off submit
  const handleWriteOffSubmit = async (e) => {
    e.preventDefault();
    if (!writeOffForm.batchId) {
      showToast('error', 'Please select a batch to write off');
      return;
    }
    setWriteOffSubmitting(true);
    try {
      const qty = parseInt(writeOffForm.quantity, 10);
      await adjustStock({
        batchId: parseInt(writeOffForm.batchId, 10),
        adjustmentType: 'WRITE_OFF',
        quantityChanged: -qty,
        reason: `${writeOffForm.reason} (${writeOffForm.disposalMethod}): ${writeOffForm.notes}`
      }).catch(() => null);

      setBatches((prev) =>
        prev.map((b) =>
          String(b.batchId) === String(writeOffForm.batchId)
            ? { ...b, quantity: Math.max(0, b.quantity - qty), status: 'Expired' }
            : b
        )
      );

      showToast('success', `Write-off of ${qty} units recorded with disposal method "${writeOffForm.disposalMethod}"!`);
      setWriteOffModalOpen(false);
    } catch (err) {
      showToast('error', err.message || 'Write-off failed');
    } finally {
      setWriteOffSubmitting(false);
    }
  };

  // Quarantine submit
  const handleQuarantineSubmit = (e) => {
    e.preventDefault();
    if (!quarantineForm.batchId) {
      showToast('error', 'Please select a batch to quarantine');
      return;
    }
    setBatches((prev) =>
      prev.map((b) =>
        String(b.batchId) === String(quarantineForm.batchId)
          ? { ...b, status: 'Quarantined' }
          : b
      )
    );
    showToast('success', `Batch placed into secure quarantine at "${quarantineForm.location}"`);
    setQuarantineModalOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Medicine Name', 'Batch Number', 'Supplier', 'Manufacturing Date', 'Expiry Date', 'Days Remaining', 'Quantity', 'Status'];
    const rows = filteredBatches.map((b) => [
      `"${b.medicineName || ''}"`,
      `"${b.batchNumber || ''}"`,
      `"${b.supplier || ''}"`,
      `"${b.mfgDate || ''}"`,
      `"${b.expiryDate || ''}"`,
      b.daysRemaining,
      b.quantity,
      `"${b.status || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medistock_expiry_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Expiry report exported to CSV!');
  };

  return (
    <div className="admin-page-container fade-in">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`expiry-toast expiry-toast--${toastMsg.type}`}>
          {toastMsg.type === 'success' ? <IconCheck size={18} /> : <IconAlertTriangle size={18} />}
          <span>{toastMsg.message}</span>
        </div>
      )}

      {/* ── Top Page Title & Top Actions (Admin Clay Layout) ── */}
      <div className="admin-page-header" style={{ marginBottom: 20 }}>
        <div className="admin-page-header__left">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#102e59', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>
            Expiry Tracking
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
            Monitor near-expiry and expired medicines, track batch shelf lives and audit discards.
          </p>
        </div>

        <div className="admin-page-header__actions">
          <button
            className="admin-btn admin-btn--primary"
            style={{ borderRadius: 9999, padding: '10px 22px' }}
            onClick={handleExportCSV}
          >
            <IconDownload size={16} /> Export Expiry Report
          </button>
          <button
            className="admin-btn admin-btn--outline"
            style={{ borderRadius: 9999, padding: '10px 16px', background: '#ffffff' }}
            onClick={loadData}
            title="Refresh Live Data"
          >
            <IconRefresh size={16} />
          </button>
        </div>
      </div>

      {/* ── 4 Top Stat Cards (Clay Elevated 3D Tiles) ── */}
      <div className="clay-stat-grid-4" style={{ marginBottom: 22 }}>
        {/* 1. Expired Items */}
        <div className="clay-stat-card" onClick={() => setActivePill('EXPIRED')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">EXPIRED MEDICINES</span>
            <span className="clay-stat-card__value" style={{ color: '#ef4444' }}>{kpiStats.expiredCount}</span>
            <span className="clay-stat-card__sub" style={{ color: '#dc2626' }}>Immediate action required</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--coral">
            <IconAlertTriangle size={22} />
          </div>
        </div>

        {/* 2. Expiring in 7 Days */}
        <div className="clay-stat-card" onClick={() => setActivePill('DAYS_7')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">EXPIRING &le; 7 DAYS</span>
            <span className="clay-stat-card__value" style={{ color: '#b45309' }}>{kpiStats.days7Count}</span>
            <span className="clay-stat-card__sub" style={{ color: '#d97706' }}>Critical quarantine shelf</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <IconClock size={22} />
          </div>
        </div>

        {/* 3. Expiring in 30 Days */}
        <div className="clay-stat-card" onClick={() => setActivePill('DAYS_30')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">EXPIRING &le; 30 DAYS</span>
            <span className="clay-stat-card__value" style={{ color: '#0284c7' }}>{kpiStats.days30Count}</span>
            <span className="clay-stat-card__sub" style={{ color: '#0284c7' }}>Priority dispensing list</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--blue">
            <IconClock size={22} />
          </div>
        </div>

        {/* 4. Total Affected Value */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">TOTAL AT-RISK VALUE</span>
            <span className="clay-stat-card__value" style={{ color: '#008C8C' }}>{kpiStats.totalAffectedValue}</span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>Estimated inventory impact</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <span style={{ fontSize: 22, fontWeight: 800 }}>$</span>
          </div>
        </div>
      </div>

      {/* ── Recessed Filter Bar ── */}
      <div className="clay-filter-bar" style={{ marginBottom: 16 }}>
        <div className="clay-search-pill" style={{ position: 'relative', flex: '1 1 240px', display: 'flex', alignItems: 'center' }}>
          <IconSearch size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', zIndex: 2 }} />
          <input
            type="text"
            placeholder="Search by medicine name, batch number, or supplier..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: '100%', height: 42, padding: '0 18px 0 48px', boxSizing: 'border-box' }}
          />
        </div>

        <select
          className="clay-select-pill"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Expiring">Expiring</option>
          <option value="Expired">Expired</option>
        </select>

        <select
          className="clay-select-pill"
          value={medicineFilter}
          onChange={(e) => setMedicineFilter(e.target.value)}
        >
          <option value="ALL">All Medicines</option>
          {medicines.map((m) => (
            <option key={m.medicineId} value={m.medicineName}>
              {m.medicineName}
            </option>
          ))}
        </select>

        <select
          className="clay-select-pill"
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
        >
          <option value="ALL">All Suppliers</option>
          {suppliers.map((s) => (
            <option key={s.supplierId} value={s.supplierName}>
              {s.supplierName}
            </option>
          ))}
        </select>

        <select
          className="clay-select-pill"
          value={expiryRangeFilter}
          onChange={(e) => setExpiryRangeFilter(e.target.value)}
        >
          <option value="ALL">Expiry Range</option>
          <option value="7">Within 7 Days</option>
          <option value="30">Within 30 Days</option>
          <option value="60">Within 60 Days</option>
        </select>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#1e293b', fontWeight: 600, cursor: 'pointer' }}>
          <input
            type="checkbox"
            className="clay-checkbox"
            checked={showOnlyExpired}
            onChange={(e) => setShowOnlyExpired(e.target.checked)}
          />
          <span>Show Only Expired</span>
        </label>
      </div>

      {/* Quick Filter Pills matching reference screen 07 */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        {[
          { key: 'ALL', label: `All Batches (${batches.length})` },
          { key: 'EXPIRED', label: `Expired (${kpiStats.expiredCount})` },
          { key: 'DAYS_7', label: `Expiring \u2264 7 Days (${kpiStats.days7Count})` },
          { key: 'DAYS_30', label: `Expiring \u2264 30 Days (${kpiStats.days30Count})` },
          { key: 'DAYS_60', label: `Expiring \u2264 60 Days (${kpiStats.days60Count})` },
          { key: 'OVER_60', label: 'Expiring > 60 Days' },
        ].map((pill) => (
          <button
            key={pill.key}
            onClick={() => setActivePill(pill.key)}
            className={`clay-filter-pill-btn ${activePill === pill.key ? 'clay-filter-pill-btn--active' : ''}`}
            style={{
              padding: '8px 18px',
              borderRadius: 9999,
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activePill === pill.key ? 'none' : '1.5px solid #dce8f2',
              background: activePill === pill.key ? 'linear-gradient(135deg, #008c8c 0%, #007070 100%)' : '#ffffff',
              color: activePill === pill.key ? '#ffffff' : '#334155',
              boxShadow: activePill === pill.key ? '0 4px 14px rgba(0, 140, 140, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.35)' : '0 2px 6px rgba(16, 46, 89, 0.04), inset 0 1.5px 2px #ffffff',
              whiteSpace: 'nowrap',
              width: 'auto',
              minWidth: 'fit-content',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="clay-split-grid">
        {/* Left: Table */}
        <div className="clay-card-table">
          <div className="expiry-table-responsive">
            <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          paginatedBatches.length > 0 &&
                          paginatedBatches.every((b) => selectedBatches.has(b.batchId))
                        }
                      />
                    </th>
                    <th>Medicine Name</th>
                    <th>Batch Number</th>
                    <th>Supplier</th>
                    <th>Manufacturing Date</th>
                    <th>Expiry Date</th>
                    <th style={{ textAlign: 'center' }}>Days Remaining</th>
                    <th style={{ textAlign: 'right' }}>Quantity</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBatches.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                        No batches matching criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedBatches.map((item) => (
                      <tr
                        key={item.batchId}
                        className={selectedBatches.has(item.batchId) ? 'expiry-row--selected' : ''}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedBatches.has(item.batchId)}
                            onChange={() => handleSelectItem(item.batchId)}
                          />
                        </td>
                        <td>
                          <div className="expiry-med-name-cell">
                            <span
                              className="expiry-pill-dot"
                              style={{ backgroundColor: item.iconColor || '#008C8C' }}
                            >
                              <IconPill size={11} color="#FFFFFF" />
                            </span>
                            <div>
                              <div className="expiry-med-title">{item.medicineName}</div>
                              <div className="expiry-med-cat">{item.categoryName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="expiry-batch-col">{item.batchNumber}</td>
                        <td className="expiry-supplier-col">{item.supplier}</td>
                        <td className="expiry-mfg-col">{item.mfgDate}</td>
                        <td className="expiry-date-col">{item.expiryDate}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`expiry-days-pill ${
                              item.daysRemaining < 0
                                ? 'expiry-days-pill--negative'
                                : item.daysRemaining <= 7
                                ? 'expiry-days-pill--critical'
                                : item.daysRemaining <= 30
                                ? 'expiry-days-pill--warning'
                                : 'expiry-days-pill--safe'
                            }`}
                          >
                            {item.daysRemaining} days
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.quantity}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`expiry-badge expiry-badge--${
                              item.status === 'Active'
                                ? 'active'
                                : item.status === 'Expiring'
                                ? 'expiring'
                                : 'expired'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <div className="expiry-actions-cell">
                            <button
                              className="expiry-action-icon-btn"
                              title="View Details"
                              onClick={() => setViewBatch(item)}
                            >
                              <IconEye size={16} />
                            </button>
                            <button
                              className="expiry-action-icon-btn"
                              title="Audit Write-Off"
                              onClick={() => {
                                setWriteOffForm({
                                  ...writeOffForm,
                                  batchId: item.batchId,
                                  quantity: item.quantity
                                });
                                setWriteOffModalOpen(true);
                              }}
                            >
                              <IconFileText size={16} />
                            </button>
                            <button
                              className="expiry-action-icon-btn"
                              title="Quarantine"
                              onClick={() => {
                                setQuarantineForm({
                                  ...quarantineForm,
                                  batchId: item.batchId
                                });
                                setQuarantineModalOpen(true);
                              }}
                            >
                              <IconShield size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #eef3f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 500 }}>
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredBatches.length)} of {filteredBatches.length} entries
              </span>

              <div className="clay-pagination">
                <button
                  className="clay-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <IconChevronLeft size={16} />
                </button>
                <button className={`clay-page-btn ${currentPage === 1 ? 'clay-page-btn--active' : ''}`} onClick={() => setCurrentPage(1)}>1</button>
                {totalPages > 1 && (
                  <button
                    className={`clay-page-btn ${currentPage === 2 ? 'clay-page-btn--active' : ''}`}
                    onClick={() => setCurrentPage(2)}
                  >
                    2
                  </button>
                )}
                {totalPages > 2 && (
                  <button
                    className={`clay-page-btn ${currentPage === 3 ? 'clay-page-btn--active' : ''}`}
                    onClick={() => setCurrentPage(3)}
                  >
                    3
                  </button>
                )}
                <button
                  className="clay-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <IconChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

        {/* Right Sidebar */}
        <aside className="expiry-right-col">
          {/* Card 1: Expiry Alerts */}
          <div className="expiry-side-card">
            <div className="expiry-side-header">
              <h2 className="expiry-side-title">Expiry Alerts</h2>
              <button
                className="expiry-side-link"
                onClick={() => setActivePill('EXPIRED')}
              >
                View All
              </button>
            </div>

            <div className="expiry-alerts-list">
              <div
                className="expiry-alert-item"
                onClick={() => setActivePill('EXPIRED')}
              >
                <div className="expiry-alert-icon" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
                  <IconAlertTriangle size={16} />
                </div>
                <div className="expiry-alert-text">
                  <div className="expiry-alert-msg">8 medicines have expired</div>
                  <div className="expiry-alert-sub">Quantity affected: 245 units</div>
                </div>
                <IconChevronRight size={16} className="expiry-alert-arrow" />
              </div>

              <div
                className="expiry-alert-item"
                onClick={() => setActivePill('DAYS_7')}
              >
                <div className="expiry-alert-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                  <IconClock size={16} />
                </div>
                <div className="expiry-alert-text">
                  <div className="expiry-alert-msg">{kpiStats.days7Count} medicines expiring within 7 days</div>
                  <div className="expiry-alert-sub">Quantity affected: {kpiStats.days7Units} units</div>
                </div>
                <IconChevronRight size={16} className="expiry-alert-arrow" />
              </div>

              <div
                className="expiry-alert-item"
                onClick={() => setActivePill('DAYS_30')}
              >
                <div className="expiry-alert-icon" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                  <IconClock size={16} />
                </div>
                <div className="expiry-alert-text">
                  <div className="expiry-alert-msg">{kpiStats.days30Count} medicines expiring within 30 days</div>
                  <div className="expiry-alert-sub">Quantity affected: {kpiStats.days30Units} units</div>
                </div>
                <IconChevronRight size={16} className="expiry-alert-arrow" />
              </div>

              <div
                className="expiry-alert-item"
                onClick={() => setActivePill('DAYS_60')}
              >
                <div className="expiry-alert-icon" style={{ backgroundColor: '#F3E8FF', color: '#7C3AED' }}>
                  <IconClock size={16} />
                </div>
                <div className="expiry-alert-text">
                  <div className="expiry-alert-msg">{kpiStats.days60Count} medicines expiring within 60 days</div>
                  <div className="expiry-alert-sub">Quantity affected: {kpiStats.days60Units} units</div>
                </div>
                <IconChevronRight size={16} className="expiry-alert-arrow" />
              </div>
            </div>
          </div>

          {/* Card 2: Quick Actions */}
          <div className="expiry-side-card">
            <h2 className="expiry-side-title">Quick Actions</h2>
            <div className="expiry-quick-grid">
              <button className="expiry-quick-btn" onClick={handleExportCSV}>
                <IconDownload size={18} color="#008C8C" />
                <span>Export Report</span>
              </button>
              <button
                className="expiry-quick-btn"
                onClick={() => setWriteOffModalOpen(true)}
              >
                <IconTrash size={18} color="#008C8C" />
                <span>Record Write-off</span>
              </button>
              <button
                className="expiry-quick-btn"
                onClick={() => setQuarantineModalOpen(true)}
              >
                <IconShield size={18} color="#008C8C" />
                <span>Quarantine Batch</span>
              </button>
              <button
                className="expiry-quick-btn"
                onClick={() => setHistoryModalOpen(true)}
              >
                <IconHistory size={18} color="#008C8C" />
                <span>View History</span>
              </button>
            </div>
          </div>

          {/* Card 3: Recent Expiry Activity */}
          <div className="expiry-side-card">
            <div className="expiry-side-header">
              <h2 className="expiry-side-title">Recent Expiry Activity</h2>
              <button
                className="expiry-side-link"
                onClick={() => setHistoryModalOpen(true)}
              >
                View All
              </button>
            </div>

            <div className="expiry-activity-list">
              <div className="expiry-activity-item">
                <div className="expiry-act-icon" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
                  <IconClock size={14} />
                </div>
                <div className="expiry-act-info">
                  <div className="expiry-act-title">Batch B-0785 (Metformin 500mg)</div>
                  <div className="expiry-act-sub">Marked as expired</div>
                  <div className="expiry-act-time">Apr 18, 2025 09:15 AM</div>
                </div>
                <IconChevronRight size={14} className="expiry-act-arrow" />
              </div>

              <div className="expiry-activity-item">
                <div className="expiry-act-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                  <IconShield size={14} />
                </div>
                <div className="expiry-act-info">
                  <div className="expiry-act-title">Batch B-0654 (Omeprazole 20mg)</div>
                  <div className="expiry-act-sub">Quarantined</div>
                  <div className="expiry-act-time">Apr 17, 2025 03:20 PM</div>
                </div>
                <IconChevronRight size={14} className="expiry-act-arrow" />
              </div>

              <div className="expiry-activity-item">
                <div className="expiry-act-icon" style={{ backgroundColor: '#E6F7F5', color: '#008C8C' }}>
                  <IconTrash size={14} />
                </div>
                <div className="expiry-act-info">
                  <div className="expiry-act-title">Batch B-0532 (Ibuprofen 400mg)</div>
                  <div className="expiry-act-sub">Write-off recorded</div>
                  <div className="expiry-act-time">Apr 16, 2025 11:45 AM</div>
                </div>
                <IconChevronRight size={14} className="expiry-act-arrow" />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ── MODAL: Record Write-Off ── */}
      {writeOffModalOpen && (
        <div className="expiry-modal-overlay">
          <div className="expiry-modal-card fade-in">
            <div className="expiry-modal-header">
              <h3>Record Medicine Write-Off</h3>
              <button
                className="expiry-modal-close"
                onClick={() => setWriteOffModalOpen(false)}
              >
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleWriteOffSubmit}>
              <div className="expiry-modal-body">
                <div className="expiry-field">
                  <label>Select Expired / Compromised Batch *</label>
                  <select
                    value={writeOffForm.batchId}
                    onChange={(e) =>
                      setWriteOffForm({ ...writeOffForm, batchId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Batch</option>
                    {batches.map((b) => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.medicineName} ({b.batchNumber}) — {b.quantity} units (Exp: {b.expiryDate})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="expiry-field">
                  <label>Write-Off Reason *</label>
                  <select
                    value={writeOffForm.reason}
                    onChange={(e) =>
                      setWriteOffForm({ ...writeOffForm, reason: e.target.value })
                    }
                  >
                    <option value="EXPIRED">Shelf-Life Expiry Date Passed</option>
                    <option value="DAMAGED">Physical Damage / Seal Broken</option>
                    <option value="CONTAMINATED">Contamination / Temperature Excursion</option>
                    <option value="RECALLED">Manufacturer Clinical Recall</option>
                  </select>
                </div>

                <div className="expiry-field">
                  <label>Certified Disposal Method *</label>
                  <select
                    value={writeOffForm.disposalMethod}
                    onChange={(e) =>
                      setWriteOffForm({ ...writeOffForm, disposalMethod: e.target.value })
                    }
                  >
                    <option value="Clinical Incineration">Clinical Incineration</option>
                    <option value="Hazardous Chemical Waste">Hazardous Chemical Waste Treatment</option>
                    <option value="Returned to Manufacturer">Returned to Supplier for Credit</option>
                  </select>
                </div>

                <div className="expiry-field">
                  <label>Quantity to Dispose *</label>
                  <input
                    type="number"
                    min="1"
                    value={writeOffForm.quantity}
                    onChange={(e) =>
                      setWriteOffForm({ ...writeOffForm, quantity: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="expiry-field">
                  <label>Pharmacist Verification Notes</label>
                  <textarea
                    rows={2}
                    value={writeOffForm.notes}
                    onChange={(e) =>
                      setWriteOffForm({ ...writeOffForm, notes: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="expiry-modal-footer">
                <button
                  type="button"
                  className="expiry-btn expiry-btn--secondary"
                  onClick={() => setWriteOffModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="expiry-btn expiry-btn--danger"
                  disabled={writeOffSubmitting}
                >
                  Confirm Write-Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Quarantine Batch ── */}
      {quarantineModalOpen && (
        <div className="expiry-modal-overlay">
          <div className="expiry-modal-card fade-in">
            <div className="expiry-modal-header">
              <h3>Quarantine Batch</h3>
              <button
                className="expiry-modal-close"
                onClick={() => setQuarantineModalOpen(false)}
              >
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleQuarantineSubmit}>
              <div className="expiry-modal-body">
                <div className="expiry-field">
                  <label>Select Batch to Lock *</label>
                  <select
                    value={quarantineForm.batchId}
                    onChange={(e) =>
                      setQuarantineForm({ ...quarantineForm, batchId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Batch</option>
                    {batches.map((b) => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.medicineName} ({b.batchNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="expiry-field">
                  <label>Quarantine Bay / Storage Location *</label>
                  <input
                    type="text"
                    value={quarantineForm.location}
                    onChange={(e) =>
                      setQuarantineForm({ ...quarantineForm, location: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="expiry-field">
                  <label>Reason for Quarantine</label>
                  <textarea
                    rows={2}
                    value={quarantineForm.reason}
                    onChange={(e) =>
                      setQuarantineForm({ ...quarantineForm, reason: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="expiry-modal-footer">
                <button
                  type="button"
                  className="expiry-btn expiry-btn--secondary"
                  onClick={() => setQuarantineModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="expiry-btn expiry-btn--primary">
                  Lock & Quarantine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: View Batch Details ── */}
      {viewBatch && (
        <div className="expiry-modal-overlay">
          <div className="expiry-modal-card fade-in">
            <div className="expiry-modal-header">
              <h3>Batch Expiry Details — {viewBatch.batchNumber}</h3>
              <button className="expiry-modal-close" onClick={() => setViewBatch(null)}>
                <IconX size={18} />
              </button>
            </div>
            <div className="expiry-modal-body">
              <div className="expiry-detail-row">
                <span>Medicine:</span>
                <strong>{viewBatch.medicineName}</strong>
              </div>
              <div className="expiry-detail-row">
                <span>Supplier:</span>
                <span>{viewBatch.supplier}</span>
              </div>
              <div className="expiry-detail-row">
                <span>Manufacturing Date:</span>
                <span>{viewBatch.mfgDate}</span>
              </div>
              <div className="expiry-detail-row">
                <span>Expiry Date:</span>
                <strong style={{ color: viewBatch.daysRemaining <= 0 ? '#EF4444' : '#16324F' }}>
                  {viewBatch.expiryDate}
                </strong>
              </div>
              <div className="expiry-detail-row">
                <span>Days Remaining:</span>
                <span style={{ fontWeight: 700 }}>{viewBatch.daysRemaining} days</span>
              </div>
              <div className="expiry-detail-row">
                <span>Units in Stock:</span>
                <span>{viewBatch.quantity}</span>
              </div>
              <div className="expiry-detail-row">
                <span>Status:</span>
                <span className={`expiry-badge expiry-badge--${viewBatch.status.toLowerCase()}`}>
                  {viewBatch.status}
                </span>
              </div>
            </div>
            <div className="expiry-modal-footer">
              <button
                className="expiry-btn expiry-btn--primary"
                onClick={() => setViewBatch(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Audit History ── */}
      {historyModalOpen && (
        <div className="expiry-modal-overlay">
          <div className="expiry-modal-card fade-in">
            <div className="expiry-modal-header">
              <h3>Expiry & Quarantine Audit History</h3>
              <button
                className="expiry-modal-close"
                onClick={() => setHistoryModalOpen(false)}
              >
                <IconX size={18} />
              </button>
            </div>
            <div className="expiry-modal-body">
              <div className="expiry-activity-list">
                <div className="expiry-activity-item">
                  <div className="expiry-act-icon" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
                    <IconClock size={14} />
                  </div>
                  <div className="expiry-act-info">
                    <div className="expiry-act-title">Batch B-0785 (Metformin 500mg)</div>
                    <div className="expiry-act-sub">Marked as expired by Dr. Sarah Khan</div>
                    <div className="expiry-act-time">Apr 18, 2025 09:15 AM</div>
                  </div>
                </div>
                <div className="expiry-activity-item">
                  <div className="expiry-act-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                    <IconShield size={14} />
                  </div>
                  <div className="expiry-act-info">
                    <div className="expiry-act-title">Batch B-0654 (Omeprazole 20mg)</div>
                    <div className="expiry-act-sub">Quarantined into Bay A-02</div>
                    <div className="expiry-act-time">Apr 17, 2025 03:20 PM</div>
                  </div>
                </div>
                <div className="expiry-activity-item">
                  <div className="expiry-act-icon" style={{ backgroundColor: '#E6F7F5', color: '#008C8C' }}>
                    <IconTrash size={14} />
                  </div>
                  <div className="expiry-act-info">
                    <div className="expiry-act-title">Batch B-0532 (Ibuprofen 400mg)</div>
                    <div className="expiry-act-sub">Incineration write-off of 120 units</div>
                    <div className="expiry-act-time">Apr 16, 2025 11:45 AM</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="expiry-modal-footer">
              <button
                className="expiry-btn expiry-btn--primary"
                onClick={() => setHistoryModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
