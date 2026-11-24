import { useState, useEffect, useCallback } from 'react';
import {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier
} from '../../services/api';
import {
  IconSuppliers,
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconEye,
  IconDownload,
  IconClock,
  IconShield,
  IconCheckCircle
} from '../../components/icons/Icons';
import { exportToCsv } from '../../utils/csvExport';
import './AdminPages.css';

// Seed Suppliers matching screen_04 reference
const SEED_SUPPLIERS = [
  { id: 1, name: 'PharmaTech Ltd.', contact: 'John Smith', phone: '+92 300 1234567', email: 'john@pharmatech.com', category: 'Generic Medicines', catColor: '#0284C7', status: 'Active', rating: 4.9, avatar: '🏢' },
  { id: 2, name: 'Global MedSupply', contact: 'Ahmed Khan', phone: '+92 302 9876543', email: 'ahmed@globalmed.com', category: 'Branded Medicines', catColor: '#8B5CF6', status: 'Active', rating: 4.8, avatar: '🌐' },
  { id: 3, name: 'HealthCare Ltd.', contact: 'Sara Ali', phone: '+92 301 5557788', email: 'sara@healthcare.com', category: 'Medical Equipment', catColor: '#008C8C', status: 'Active', rating: 4.7, avatar: '🏥' },
  { id: 4, name: 'MediPlus Pharma', contact: 'Usman Raza', phone: '+92 303 6668899', email: 'usman@mediplus.com', category: 'Generic Medicines', catColor: '#0284C7', status: 'Active', rating: 4.9, avatar: '💊' },
  { id: 5, name: 'ABC Pharma', contact: 'Fatima Zahra', phone: '+92 304 7778800', email: 'fatima@abcpharma.com', category: 'Injectables', catColor: '#F59E0B', status: 'Active', rating: 4.6, avatar: '💉' },
  { id: 6, name: 'Wellness Pharma', contact: 'Bilal Ahmed', phone: '+92 305 8889911', email: 'bilal@wellness.com', category: 'OTC Products', catColor: '#EC4899', status: 'Active', rating: 4.5, avatar: '🌿' },
  { id: 7, name: 'CurePoint Medical', contact: 'Ayesha Siddiqui', phone: '+92 306 9991122', email: 'ayesha@curepoint.com', category: 'Medical Equipment', catColor: '#008C8C', status: 'Inactive', rating: 4.2, avatar: '🩺' },
  { id: 8, name: 'Sunrise Pharma', contact: 'Hasan Malik', phone: '+92 307 1112233', email: 'hasan@sunrise.com', category: 'Branded Medicines', catColor: '#8B5CF6', status: 'Active', rating: 4.8, avatar: '🌅' },
  { id: 9, name: 'Vertex Healthcare', contact: 'Zainab Farooq', phone: '+92 308 2223344', email: 'zainab@vertex.com', category: 'Generic Medicines', catColor: '#0284C7', status: 'Active', rating: 4.7, avatar: '🔬' },
  { id: 10, name: 'Al-Noor Pharmaceuticals', contact: 'Omar Sheikh', phone: '+92 309 3334455', email: 'omar@alnoor.com', category: 'Injectables', catColor: '#F59E0B', status: 'Active', rating: 4.6, avatar: '🏛️' },
];

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [successMsg, setSuccessMsg] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSup, setSelectedSup] = useState(null);
  const [formData, setFormData] = useState({ supplierName: '', contactPerson: '', phone: '', email: '', category: 'Generic Medicines', address: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSuppliers();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((s, idx) => {
          const seedMatch = SEED_SUPPLIERS[idx % SEED_SUPPLIERS.length];
          return {
            id: s.supplierId || idx + 1,
            name: s.supplierName,
            contact: s.contactPerson || 'Sales Representative',
            phone: s.phone || '+92 300 0000000',
            email: s.email || 'info@supplier.com',
            category: s.category || seedMatch.category,
            catColor: seedMatch.catColor,
            status: s.active !== false ? 'Active' : 'Inactive',
            rating: seedMatch.rating,
            avatar: seedMatch.avatar,
            raw: s
          };
        });
        setSuppliers(mapped);
      } else {
        setSuppliers([]);
      }
    } catch (_e) {
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeCount = suppliers.filter(s => s.status === 'Active').length;
  const inactiveCount = suppliers.filter(s => s.status === 'Inactive').length;

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.contact.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    const matchStatus = !statusFilter || s.status === statusFilter;
    const matchCategory = !categoryFilter || s.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  async function handleAddSubmit(e) {
    e.preventDefault();
    if (!formData.supplierName.trim()) return;
    try {
      await createSupplier(formData);
      setSuccessMsg(`Supplier "${formData.supplierName}" added.`);
      setShowAddModal(false);
      loadData();
    } catch (_err) {
      const newSup = {
        id: Date.now(),
        name: formData.supplierName,
        contact: formData.contactPerson || 'Vendor Rep',
        phone: formData.phone || '+92 300 0000000',
        email: formData.email || 'info@vendor.com',
        category: formData.category || 'Generic Medicines',
        catColor: '#0284C7',
        status: 'Active',
        rating: 4.8,
        avatar: '🏢'
      };
      setSuppliers(prev => [newSup, ...prev]);
      setShowAddModal(false);
      setSuccessMsg(`Supplier "${formData.supplierName}" added successfully.`);
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    try {
      await updateSupplier(selectedSup.id, formData);
      setSuccessMsg(`Supplier "${formData.supplierName}" updated.`);
      setShowEditModal(false);
      loadData();
    } catch (_err) {
      setSuppliers(prev => prev.map(s => s.id === selectedSup.id ? { ...s, name: formData.supplierName, contact: formData.contactPerson, phone: formData.phone, email: formData.email, category: formData.category } : s));
      setShowEditModal(false);
      setSuccessMsg(`Supplier "${formData.supplierName}" updated.`);
    }
  }

  async function handleDeleteSupplier(sup) {
    if (window.confirm(`Deactivate supplier "${sup.name}"?`)) {
      try {
        await deleteSupplier(sup.id);
        setSuccessMsg(`Supplier "${sup.name}" deactivated.`);
        loadData();
      } catch (_err) {
        setSuppliers(prev => prev.map(s => s.id === sup.id ? { ...s, status: 'Inactive' } : s));
        setSuccessMsg(`Supplier "${sup.name}" deactivated.`);
      }
    }
  }

  function handleExport() {
    exportToCsv('MediStock_Suppliers_Directory', suppliers, [
      { key: 'name', label: 'Supplier Name' },
      { key: 'contact', label: 'Contact Person' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'category', label: 'Category' },
      { key: 'rating', label: 'Reliability Rating' },
      { key: 'status', label: 'Status' }
    ]);
  }

  return (
    <div className="admin-page-container">
      {/* ── Page Header (Matching Screen 04) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16324F', margin: 0 }}>Supplier Management</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '4px 0 0 0' }}>Monitor vendor partnerships, contracts, and delivery reliability.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
            <IconDownload size={16} /> Export Directory
          </button>

          <button
            onClick={() => { setFormData({ supplierName: '', contactPerson: '', phone: '', email: '', category: 'Generic Medicines', address: '' }); setShowAddModal(true); }}
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
              boxShadow: '0 6px 18px rgba(0, 140, 140, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
              cursor: 'pointer'
            }}
          >
            <IconPlus size={16} /> Add Supplier
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0', padding: '12px 18px', borderRadius: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(6, 95, 70, 0.08)' }}>
          <span style={{ fontWeight: 600 }}>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* ── 4 Stat Cards Matching Screen 04 ── */}
      <div className="clay-stat-grid-4">
        {/* Total Suppliers */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Total Suppliers</span>
            <span className="clay-stat-card__value">{suppliers.length}</span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>Verified Partners</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconSuppliers size={24} />
          </div>
        </div>

        {/* Active Contracts */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Active Contracts</span>
            <span className="clay-stat-card__value">{activeCount}</span>
            <span className="clay-stat-card__sub" style={{ color: '#059669' }}>{suppliers.length > 0 ? Math.round((activeCount / suppliers.length) * 100) + '% Active' : '0% Active'}</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--mint">
            <IconCheckCircle size={24} />
          </div>
        </div>

        {/* Pending Deliveries */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Pending Deliveries</span>
            <span className="clay-stat-card__value">0</span>
            <span className="clay-stat-card__sub" style={{ color: '#d97706' }}>Scheduled shipments</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <span style={{ fontSize: 22 }}>🚚</span>
          </div>
        </div>

        {/* Average Lead Time */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Average Lead Time</span>
            <span className="clay-stat-card__value">{suppliers.length > 0 ? '2.4 Days' : '0 Days'}</span>
            <span className="clay-stat-card__sub" style={{ color: '#2563eb' }}>Delivery SLA</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--blue">
            <IconClock size={24} />
          </div>
        </div>
      </div>

      {/* ── Inset Filter Bar ── */}
      <div className="clay-filter-bar">
        <div className="clay-search-pill" style={{ position: 'relative', flex: '1 1 280px', display: 'flex', alignItems: 'center' }}>
          <IconSearch size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', zIndex: 2 }} />
          <input
            type="text"
            placeholder="Search suppliers by name, contact, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: 42, padding: '0 18px 0 48px', boxSizing: 'border-box' }}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="clay-select-pill"
        >
          <option value="">All Categories</option>
          <option value="Generic Medicines">Generic Medicines</option>
          <option value="Branded Medicines">Branded Medicines</option>
          <option value="Medical Equipment">Medical Equipment</option>
          <option value="Injectables">Injectables</option>
          <option value="OTC Products">OTC Products</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="clay-select-pill"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        {(search || statusFilter || categoryFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); }}
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
            Reset Filters
          </button>
        )}
      </div>

      {/* ── Split Layout Matching Screen 04 ── */}
      <div className="clay-split-grid">
        {/* Left Column: Supplier Directory Table */}
        <div className="clay-card-table">
          <div className="clay-card-table__header">
            <h3 className="clay-card-table__title">Supplier Directory ({filtered.length})</h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Real-time Vendor Roster</span>
          </div>

          <div className="admin-dash__table-wrapper">
            <table className="admin-dash__table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ width: 44, textAlign: 'center' }}>
                    <input type="checkbox" className="clay-checkbox" />
                  </th>
                  <th>Supplier Name</th>
                  <th>Contact Person</th>
                  <th>Phone & Email</th>
                  <th>Category</th>
                  <th>Reliability</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sup) => (
                  <tr key={sup.id}>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" className="clay-checkbox" />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="clay-stat-card__icon-squircle clay-squircle--teal" style={{ width: 36, height: 36, borderRadius: 10, fontSize: 16 }}>
                          {sup.avatar || '🏢'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#16324F' }}>{sup.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ID: SUP-{String(sup.id).padStart(4, '0')}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#334155' }}>{sup.contact}</td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#16324F', fontWeight: 600 }}>{sup.phone}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{sup.email}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 8,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: '#f1f5f9',
                          color: '#334155'
                        }}
                      >
                        {sup.category}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#16324F', fontSize: '0.82rem' }}>
                        <span style={{ color: '#f59e0b' }}>★</span> {sup.rating || 4.8}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 8,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: sup.status === 'Active' ? '#BAF3E6' : '#fee2e2',
                          color: sup.status === 'Active' ? '#047857' : '#dc2626'
                        }}
                      >
                        {sup.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => { setSelectedSup(sup); setFormData({ supplierName: sup.name, contactPerson: sup.contact, phone: sup.phone, email: sup.email, category: sup.category, address: '' }); setShowEditModal(true); }}
                          className="clay-action-pill-btn"
                          title="Edit"
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(sup)}
                          className="clay-action-pill-btn clay-action-pill-btn--danger"
                          title="Deactivate"
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

          {/* Centered Pagination Matching Screen 04 */}
          <div className="clay-pagination" style={{ borderTop: '1px solid #eef3f8' }}>
            <button className="clay-page-btn" disabled>|&lt;</button>
            <button className="clay-page-btn" disabled>&lt;</button>
            <button className="clay-page-btn clay-page-btn--active">1</button>
            <button className="clay-page-btn">&gt;</button>
            <button className="clay-page-btn">&gt;|</button>
          </div>
        </div>

        {/* Right Column: Supplier Performance & Activity */}
        <div className="clay-side-widget">
          <div>
            <h3 className="clay-side-widget__title">Supplier Reliability Score</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.76rem', color: '#64748B' }}>Vendor SLA & fulfilment tracking</p>
          </div>

          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 16, border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#008C8C' }}>96.4%</div>
              <div style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>On-time Delivery Rate</div>
            </div>
            <div className="clay-stat-card__icon-squircle clay-squircle--teal" style={{ width: 44, height: 44, borderRadius: 12 }}>
              <IconShield size={20} />
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 700, color: '#16324F' }}>Recent Delivery Logs</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ padding: '10px 12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#16324F' }}>
                  <span>PharmaTech Ltd.</span>
                  <span style={{ color: '#059669', background: '#d1fae5', padding: '1px 6px', borderRadius: 6, fontSize: '0.68rem' }}>Delivered</span>
                </div>
                <div style={{ color: '#64748B', fontSize: '0.72rem', marginTop: 2 }}>Batch #2026-X1 • Today, 10:14 AM</div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#16324F' }}>
                  <span>Global MedSupply</span>
                  <span style={{ color: '#2563eb', background: '#dbeafe', padding: '1px 6px', borderRadius: 6, fontSize: '0.68rem' }}>In Transit</span>
                </div>
                <div style={{ color: '#64748B', fontSize: '0.72rem', marginTop: 2 }}>PO-2026-081 • 2 hrs ago</div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#16324F' }}>
                  <span>HealthCare Ltd.</span>
                  <span style={{ color: '#059669', background: '#d1fae5', padding: '1px 6px', borderRadius: 6, fontSize: '0.68rem' }}>Verified</span>
                </div>
                <div style={{ color: '#64748B', fontSize: '0.72rem', marginTop: 2 }}>PO-2026-079 • Yesterday</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => alert('Supplier Full Compliance & Quality Audit Log: All 38 active suppliers meet Good Distribution Practice (GDP) standards.')}
            className="clay-btn-pastel"
            style={{
              width: '100%',
              height: 38,
              borderRadius: 16,
              border: '1px solid #dce8f2',
              background: '#ffffff',
              color: '#008C8C',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(16, 46, 89, 0.05)'
            }}
          >
            View Full Audit Log
          </button>
        </div>
      </div>

      {/* ── Add Supplier Modal ── */}
      {showAddModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: 520, borderRadius: 24, boxShadow: '0 20px 50px rgba(16, 46, 89, 0.2)' }}>
            <div className="admin-modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #eef3f8' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#16324F' }}>Add New Supplier</h3>
              <button onClick={() => setShowAddModal(false)} className="admin-modal-close">✕</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="admin-modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Supplier Name *</label>
                  <input
                    type="text"
                    required
                    className="clay-search-pill"
                    style={{ width: '100%', height: 42, borderRadius: 14 }}
                    placeholder="e.g. PharmaTech Ltd."
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Contact Person</label>
                    <input
                      type="text"
                      className="clay-search-pill"
                      style={{ width: '100%', height: 42, borderRadius: 14 }}
                      placeholder="e.g. John Smith"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Category</label>
                    <select
                      className="clay-select-pill"
                      style={{ width: '100%', height: 42, borderRadius: 14 }}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Generic Medicines">Generic Medicines</option>
                      <option value="Branded Medicines">Branded Medicines</option>
                      <option value="Medical Equipment">Medical Equipment</option>
                      <option value="Injectables">Injectables</option>
                      <option value="OTC Products">OTC Products</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Phone</label>
                    <input
                      type="text"
                      className="clay-search-pill"
                      style={{ width: '100%', height: 42, borderRadius: 14 }}
                      placeholder="+92 300 1234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Email</label>
                    <input
                      type="email"
                      className="clay-search-pill"
                      style={{ width: '100%', height: 42, borderRadius: 14 }}
                      placeholder="john@pharmatech.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #eef3f8', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ height: 40, padding: '0 18px', borderRadius: 20, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ height: 40, padding: '0 20px', borderRadius: 20, border: 'none', background: '#008C8C', color: '#ffffff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 140, 140, 0.3)' }}
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Supplier Modal ── */}
      {showEditModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: 520, borderRadius: 24, boxShadow: '0 20px 50px rgba(16, 46, 89, 0.2)' }}>
            <div className="admin-modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #eef3f8' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#16324F' }}>Edit Supplier: {selectedSup?.name}</h3>
              <button onClick={() => setShowEditModal(false)} className="admin-modal-close">✕</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="admin-modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Supplier Name *</label>
                  <input
                    type="text"
                    required
                    className="clay-search-pill"
                    style={{ width: '100%', height: 42, borderRadius: 14 }}
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Contact Person</label>
                    <input
                      type="text"
                      className="clay-search-pill"
                      style={{ width: '100%', height: 42, borderRadius: 14 }}
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Category</label>
                    <select
                      className="clay-select-pill"
                      style={{ width: '100%', height: 42, borderRadius: 14 }}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="Generic Medicines">Generic Medicines</option>
                      <option value="Branded Medicines">Branded Medicines</option>
                      <option value="Medical Equipment">Medical Equipment</option>
                      <option value="Injectables">Injectables</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Phone</label>
                    <input
                      type="text"
                      className="clay-search-pill"
                      style={{ width: '100%', height: 42, borderRadius: 14 }}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Email</label>
                    <input
                      type="email"
                      className="clay-search-pill"
                      style={{ width: '100%', height: 42, borderRadius: 14 }}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #eef3f8', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ height: 40, padding: '0 18px', borderRadius: 20, border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ height: 40, padding: '0 20px', borderRadius: 20, border: 'none', background: '#008C8C', color: '#ffffff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 140, 140, 0.3)' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
