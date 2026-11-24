import React, { useState, useEffect, useCallback } from 'react';
import {
  IconSearch,
  IconPill,
  IconRefresh,
  IconX,
  IconPackage,
  IconHistory,
  IconClock,
  IconTag,
  IconEye,
  IconCheckCircle,
  IconAlertTriangle
} from '../../components/icons/Icons';
import {
  fetchMedicines,
  fetchBatches,
  fetchCategories,
  fetchSuppliers
} from '../../services/api';
import './StaffCommon.css';
import '../admin/AdminPages.css';

export default function StaffSearchPage() {
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search filters
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Selected item for the right-hand inspector panel
  const [selectedMed, setSelectedMed] = useState(null);

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

  const defaultResults = [
    {
      id: 1,
      name: 'Paracetamol 500mg',
      form: 'Tablet',
      code: 'MED001',
      category: 'Analgesics',
      availableQty: 50,
      totalQty: 50,
      unitPrice: 5.20,
      status: 'Active',
      manufacturer: 'Cipla Ltd.',
      supplier: 'Cipla Healthcare Ltd.',
      reorderLevel: 20,
      batches: [
        { batchNo: 'PCT2024001', expiry: '2026-08-15', qty: 30, status: 'Active' },
        { batchNo: 'PCT2024002', expiry: '2026-12-10', qty: 20, status: 'Active' }
      ]
    },
    {
      id: 2,
      name: 'Paracetamol 650mg',
      form: 'Tablet',
      code: 'MED011',
      category: 'Analgesics',
      availableQty: 24,
      totalQty: 30,
      unitPrice: 6.10,
      status: 'Low Stock',
      manufacturer: 'Cipla Ltd.',
      supplier: 'Cipla Healthcare Ltd.',
      reorderLevel: 25,
      batches: [
        { batchNo: 'PCT2024011', expiry: '2026-09-20', qty: 24, status: 'Active' }
      ]
    },
    {
      id: 3,
      name: 'Paracetamol 120mg/5ml',
      form: 'Syrup',
      code: 'MED021',
      category: 'Analgesics',
      availableQty: 0,
      totalQty: 50,
      unitPrice: 12.50,
      status: 'Out of Stock',
      manufacturer: 'Abbott Healthcare',
      supplier: 'MedPlus Wholesale',
      reorderLevel: 15,
      batches: []
    },
    {
      id: 4,
      name: 'Paracetamol 250mg',
      form: 'Suspension',
      code: 'MED031',
      category: 'Analgesics',
      availableQty: 12,
      totalQty: 25,
      unitPrice: 8.75,
      status: 'Active',
      manufacturer: 'GlaxoSmithKline',
      supplier: 'Cipla Healthcare Ltd.',
      reorderLevel: 10,
      batches: [
        { batchNo: 'PCT2024031', expiry: '2026-04-12', qty: 12, status: 'Active' }
      ]
    },
    {
      id: 5,
      name: 'Amoxicillin + Clavulanic Acid',
      form: 'Tablet',
      code: 'MED045',
      category: 'Antibiotics',
      availableQty: 36,
      totalQty: 60,
      unitPrice: 18.20,
      status: 'Active',
      manufacturer: 'Sun Pharma Ltd.',
      supplier: 'Apollo Supply Chain',
      reorderLevel: 20,
      batches: [
        { batchNo: 'AMX2024045', expiry: '2026-11-05', qty: 36, status: 'Active' }
      ]
    },
    {
      id: 6,
      name: 'Omeprazole 20mg',
      form: 'Capsule',
      code: 'MED056',
      category: 'Gastrointestinal',
      availableQty: 8,
      totalQty: 40,
      unitPrice: 14.30,
      status: 'Low Stock',
      manufacturer: 'Dr. Reddy Labs',
      supplier: 'Apex Pharma',
      reorderLevel: 15,
      batches: [
        { batchNo: 'OMP2024056', expiry: '2025-11-30', qty: 8, status: 'Active' }
      ]
    },
    {
      id: 7,
      name: 'Ibuprofen 400mg',
      form: 'Tablet',
      code: 'MED067',
      category: 'Analgesics',
      availableQty: 42,
      totalQty: 80,
      unitPrice: 11.20,
      status: 'Active',
      manufacturer: 'Torrent Pharma',
      supplier: 'Cipla Healthcare Ltd.',
      reorderLevel: 20,
      batches: [
        { batchNo: 'IBU2024067', expiry: '2026-05-25', qty: 42, status: 'Active' }
      ]
    },
    {
      id: 8,
      name: 'Ciprofloxacin 500mg',
      form: 'Tablet',
      code: 'MED078',
      category: 'Antibiotics',
      availableQty: 6,
      totalQty: 50,
      unitPrice: 22.40,
      status: 'Low Stock',
      manufacturer: 'Bayer Pharmaceuticals',
      supplier: 'MedPlus Wholesale',
      reorderLevel: 15,
      batches: [
        { batchNo: 'CIP2024078', expiry: '2025-08-05', qty: 6, status: 'Active' }
      ]
    }
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [medsData, batchesData, catsData, supData] = await Promise.all([
        fetchMedicines().catch(() => []),
        fetchBatches().catch(() => []),
        fetchCategories().catch(() => []),
        fetchSuppliers().catch(() => [])
      ]);
      setBatches(Array.isArray(batchesData) ? batchesData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
      setSuppliers(Array.isArray(supData) ? supData : []);

      if (Array.isArray(medsData) && medsData.length > 0) {
        // Enriched list
        const enriched = medsData.map((m, idx) => {
          const medBatches = (Array.isArray(batchesData) ? batchesData : []).filter(b => b.medicineId === m.medicineId);
          const availableQty = medBatches.reduce((a, b) => a + (b.quantityAvailable || 0), 0);
          let status = 'Active';
          if (availableQty === 0) status = 'Out of Stock';
          else if (availableQty <= 15) status = 'Low Stock';

          return {
            id: m.medicineId || idx + 1,
            name: m.medicineName || 'Medicine',
            form: m.dosageForm || 'Tablet',
            code: m.medicineCode || `MED00${idx + 1}`,
            category: m.category?.categoryName || m.categoryName || 'Analgesics',
            availableQty,
            totalQty: availableQty + 20,
            unitPrice: Number(m.unitPrice || 10).toFixed(2),
            status,
            manufacturer: m.manufacturer || 'Cipla Ltd.',
            supplier: m.supplier?.supplierName || 'Cipla Healthcare Ltd.',
            reorderLevel: 20,
            batches: medBatches.map(b => ({
              batchNo: b.batchNumber,
              expiry: b.expiryDate,
              qty: b.quantityAvailable,
              status: 'Active'
            }))
          };
        });
        setMedicines(enriched);
        setSelectedMed(enriched[0]);
      } else {
        setMedicines([]);
        setSelectedMed(null);
      }
    } catch (_e) {
      setMedicines([]);
      setSelectedMed(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtering
  const filteredMeds = medicines.filter(m => {
    if (query) {
      const q = query.toLowerCase();
      const matchName = (m.name || '').toLowerCase().includes(q);
      const matchCode = (m.code || '').toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    if (selectedCategory !== 'ALL' && m.category !== selectedCategory) {
      return false;
    }
    if (selectedSupplier !== 'ALL' && m.supplier !== selectedSupplier) {
      return false;
    }
    if (selectedStatus !== 'ALL' && m.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const clearFilters = () => {
    setQuery('');
    setSelectedCategory('ALL');
    setSelectedSupplier('ALL');
    setSelectedStatus('ALL');
  };

  const currentSelection = selectedMed || filteredMeds[0] || defaultResults[0];

  return (
    <div className="admin-page-container fade-in">
      {/* ── Top Header (Admin Clay Layout) ── */}
      <div className="admin-page-header" style={{ marginBottom: 20 }}>
        <div className="admin-page-header__left">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#102e59', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>
            Search Medicines
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
            Find and view medicine details, batch numbers, stock availability and shelf locations.
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
            <IconRefresh size={15} /> Refresh Data
          </button>
        </div>
      </div>

      {/* ── Search & Filter Panel ── */}
      <div className="staff-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: '0.86rem', fontWeight: 700, color: '#0F4A47' }}>
          <IconSearch size={16} />
          <span>Search &amp; Filter</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Query input */}
          <div className="staff-search-input-wrap" style={{ flex: '1 1 240px' }}>
            <IconSearch size={16} />
            <input
              type="text"
              className="staff-search-input"
              placeholder="Search by name or code..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className="staff-search-clear" onClick={() => setQuery('')}>
                <IconX size={14} />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Category</span>
            <select
              className="staff-select-control"
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
          </div>

          {/* Supplier Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Supplier</span>
            <select
              className="staff-select-control"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="ALL">All Suppliers</option>
              <option value="Cipla Healthcare Ltd.">Cipla Healthcare Ltd.</option>
              <option value="MedPlus Wholesale">MedPlus Wholesale</option>
              <option value="Apollo Supply Chain">Apollo Supply Chain</option>
              <option value="Apex Pharma">Apex Pharma</option>
            </select>
          </div>

          {/* Stock Status Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Stock Status</span>
            <select
              className="staff-select-control"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <button className="staff-btn staff-btn--primary">
              <IconSearch size={15} /> Search
            </button>
            <button className="staff-btn staff-btn--outline" onClick={clearFilters}>
              <IconRefresh size={15} /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* ── 2-Column Split: Results Table (Left) + Inspector Panel (Right) ── */}
      <div className="clay-split-grid">
        {/* Left: Search Results Table */}
        <div className="clay-card-table">
          <div className="staff-card-header">
            <h3 className="staff-card-title">
              Search Results ({filteredMeds.length} medicines found)
            </h3>
            <button className="admin-btn admin-btn--outline" style={{ borderRadius: 9999, padding: '6px 14px', fontSize: '0.8rem' }} onClick={loadData}>
              <IconRefresh size={14} /> Refresh
            </button>
          </div>
          <div className="staff-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 34, textAlign: 'center' }}>
                    <input type="checkbox" />
                  </th>
                  <th>Medicine Name</th>
                  <th>Code</th>
                  <th>Category</th>
                  <th>Available Qty</th>
                  <th>Unit Price (₹)</th>
                  <th>Stock Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeds.map((med) => {
                  const isCurrent = currentSelection && currentSelection.id === med.id;
                  return (
                    <tr
                      key={med.id}
                      onClick={() => setSelectedMed(med)}
                      style={{ cursor: 'pointer' }}
                      className={isCurrent ? 'staff-row--selected' : ''}
                    >
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" />
                      </td>
                      <td>
                        <div className="staff-med-cell">
                          <div className="staff-med-cell-icon" style={{ background: isCurrent ? '#CCFBF1' : '#F1F5F9' }}>
                            <IconPill size={15} color="#0D9488" />
                          </div>
                          <div>
                            <div className="staff-med-cell-title">{med.name}</div>
                            <div className="staff-med-cell-sub">{med.form}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#64748B', fontFamily: 'monospace' }}>{med.code}</td>
                      <td style={{ color: '#475569' }}>{med.category}</td>
                      <td style={{ fontWeight: 600, color: med.availableQty === 0 ? '#DC2626' : med.availableQty <= 10 ? '#D97706' : '#1E293B' }}>
                        {med.availableQty}
                      </td>
                      <td style={{ fontWeight: 600 }}>&#8377; {med.unitPrice}</td>
                      <td>
                        <span className={`staff-badge staff-badge--${med.status.toLowerCase().replace(/\s+/g, '')}`}>
                          <span className="staff-badge-dot"></span>
                          {med.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="staff-btn staff-btn--outline staff-btn--sm"
                          style={{ padding: '4px 8px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMed(med);
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

          <div style={{ padding: '16px 20px', borderTop: '1px solid #eef3f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 500 }}>
              Showing 1-{filteredMeds.length} of {filteredMeds.length} medicines
            </span>
            <div className="clay-pagination">
              <button className="clay-page-btn">&lt;</button>
              <button className="clay-page-btn clay-page-btn--active">1</button>
              <button className="clay-page-btn">&gt;</button>
            </div>
          </div>
        </div>

        {/* Right: Live Inspector Panel */}
        {currentSelection && (
          <div className="clay-side-widget" style={{ position: 'sticky', top: 20 }}>
            <div className="staff-card-header">
              <div className="staff-card-title-group">
                <span className="staff-card-title-icon">
                  <IconPill size={18} />
                </span>
                <h3 className="staff-card-title">Medicine Details</h3>
              </div>
            </div>

            <div className="staff-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Header profile of the medicine */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconPill size={22} color="#0284C7" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0F172A' }}>
                      {currentSelection.name}
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{currentSelection.form}</span>
                  </div>
                </div>
                <span className={`staff-badge staff-badge--${currentSelection.status.toLowerCase().replace(/\s+/g, '')}`}>
                  <span className="staff-badge-dot"></span>
                  {currentSelection.status}
                </span>
              </div>

              {/* Specs Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 6 }}>
                  <span style={{ color: '#64748B' }}>Code</span>
                  <span style={{ fontWeight: 600 }}>{currentSelection.code}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 6 }}>
                  <span style={{ color: '#64748B' }}>Category</span>
                  <span style={{ fontWeight: 600 }}>{currentSelection.category}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 6 }}>
                  <span style={{ color: '#64748B' }}>Unit Price</span>
                  <span style={{ fontWeight: 600 }}>&#8377; {currentSelection.unitPrice}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 6 }}>
                  <span style={{ color: '#64748B' }}>Manufacturer</span>
                  <span style={{ fontWeight: 600 }}>{currentSelection.manufacturer}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 6 }}>
                  <span style={{ color: '#64748B' }}>Supplier</span>
                  <span style={{ fontWeight: 600 }}>{currentSelection.supplier}</span>
                </div>
              </div>

              {/* Stock Information Section */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: '0.84rem', fontWeight: 700, color: '#0F4A47' }}>
                  <IconPackage size={16} />
                  <span>Stock Information</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Total Quantity</span>
                    <span style={{ fontWeight: 600 }}>{currentSelection.totalQty} units</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Available Quantity</span>
                    <span style={{ fontWeight: 600 }}>{currentSelection.availableQty} units</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Reorder Level</span>
                    <span style={{ fontWeight: 600 }}>{currentSelection.reorderLevel} units</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Stock Status</span>
                    <span style={{ color: '#16A34A', fontWeight: 600 }}>&diams; {currentSelection.status}</span>
                  </div>
                </div>
              </div>

              {/* Batches Section */}
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', fontWeight: 700, color: '#0F4A47' }}>
                    <IconPackage size={16} />
                    <span>Batches</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#0D9488', fontWeight: 600, cursor: 'pointer' }}>View All</span>
                </div>

                <div className="staff-table-wrap">
                  <table className="staff-table" style={{ fontSize: '0.77rem' }}>
                    <thead>
                      <tr>
                        <th>Batch No.</th>
                        <th>Expiry Date</th>
                        <th>Quantity</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(currentSelection.batches && currentSelection.batches.length > 0) ? (
                        currentSelection.batches.map((b, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{b.batchNo}</td>
                            <td style={{ color: '#64748B' }}>{b.expiry}</td>
                            <td style={{ fontWeight: 600 }}>{b.qty}</td>
                            <td>
                              <span className="staff-badge staff-badge--active" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                Active
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: '#94A3B8', padding: '12px 0' }}>
                            No active batches
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* View Stock History button */}
              <button className="staff-btn staff-btn--outline staff-btn--full" style={{ marginTop: 4 }}>
                <IconHistory size={15} /> View Stock History
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
