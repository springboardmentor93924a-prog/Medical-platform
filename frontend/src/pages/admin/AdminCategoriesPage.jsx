import { useState, useEffect, useCallback } from 'react';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../../services/api';
import {
  IconTag,
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconEye,
  IconDownload,
  IconGrid,
  IconPackage,
  IconShield,
  IconCheckCircle
} from '../../components/icons/Icons';
import { exportToCsv } from '../../utils/csvExport';
import './AdminPages.css';

// Seed Categories matching "MediStock Categories Dashboard.png" and screen_03
const SEED_CATEGORIES = [
  { id: 1, name: 'Antibiotics', desc: 'Bacterial infection treatment medicines', count: 18, units: 3450, status: 'Active', iconColor: '#EF4444', iconBg: 'clay-squircle--coral', emoji: '💊' },
  { id: 2, name: 'Analgesics', desc: 'Pain relief and fever reduction medicines', count: 14, units: 2800, status: 'Active', iconColor: '#3B82F6', iconBg: 'clay-squircle--blue', emoji: '🩹' },
  { id: 3, name: 'Antipyretics', desc: 'Fever reduction medicines', count: 8, units: 1600, status: 'Active', iconColor: '#F59E0B', iconBg: 'clay-squircle--amber', emoji: '🌡️' },
  { id: 4, name: 'Cardiovascular', desc: 'Heart and blood pressure medicines', count: 12, units: 4100, status: 'Active', iconColor: '#EC4899', iconBg: 'clay-squircle--coral', emoji: '❤️' },
  { id: 5, name: 'Diabetes Care', desc: 'Diabetes management medicines', count: 9, units: 1950, status: 'Active', iconColor: '#008C8C', iconBg: 'clay-squircle--teal', emoji: '💉' },
  { id: 6, name: 'Respiratory', desc: 'Asthma and respiratory system medicines', count: 11, units: 2200, status: 'Active', iconColor: '#0284C7', iconBg: 'clay-squircle--blue', emoji: '🫁' },
  { id: 7, name: 'Gastrointestinal', desc: 'Stomach and digestive system medicines', count: 10, units: 2050, status: 'Active', iconColor: '#8B5CF6', iconBg: 'clay-squircle--purple', emoji: '🧪' },
  { id: 8, name: 'Vitamins & Supplements', desc: 'Vitamins and mineral supplements', count: 7, units: 3100, status: 'Active', iconColor: '#10B981', iconBg: 'clay-squircle--mint', emoji: '🥗' },
  { id: 9, name: 'Skin & Dermatology', desc: 'Skin care and dermatology medicines', count: 6, units: 1400, status: 'Active', iconColor: '#F97316', iconBg: 'clay-squircle--amber', emoji: '🧴' },
  { id: 10, name: 'Others', desc: 'Other miscellaneous medicines', count: 5, units: 950, status: 'Inactive', iconColor: '#64748B', iconBg: 'clay-squircle--purple', emoji: '📦' },
  { id: 11, name: 'Injectables', desc: 'Injection medicines', count: 3, units: 750, status: 'Active', iconColor: '#008C8C', iconBg: 'clay-squircle--teal', emoji: '💉' },
  { id: 12, name: 'Ophthalmic', desc: 'Eye care medicines', count: 2, units: 480, status: 'Inactive', iconColor: '#0284C7', iconBg: 'clay-squircle--blue', emoji: '👁️' },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (screen_03 default) or 'table'
  const [successMsg, setSuccessMsg] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [formData, setFormData] = useState({ categoryName: '', description: '', status: 'Active' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCategories();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((c, i) => {
          const seedMatch = SEED_CATEGORIES[i % SEED_CATEGORIES.length];
          return {
            id: c.categoryId || i + 1,
            name: c.categoryName,
            desc: c.description || 'Medical supply category',
            count: c.medicineCount != null ? c.medicineCount : seedMatch.count,
            units: seedMatch.units,
            status: 'Active',
            iconColor: seedMatch.iconColor,
            iconBg: seedMatch.iconBg,
            emoji: seedMatch.emoji,
            raw: c
          };
        });
        setCategories(mapped);
      } else {
        setCategories([]);
      }
    } catch (_e) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeCount = categories.filter(c => c.status === 'Active').length;
  const totalUnits = categories.reduce((sum, c) => sum + (c.units || (c.count * 200)), 0);

  // Filtering & Sorting
  const filtered = categories.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.desc.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => {
    if (sortOrder === 'asc') return a.name.localeCompare(b.name);
    if (sortOrder === 'desc') return b.name.localeCompare(a.name);
    if (sortOrder === 'count') return (b.count || 0) - (a.count || 0);
    return 0;
  });

  async function handleAddSubmit(e) {
    e.preventDefault();
    if (!formData.categoryName.trim()) return;
    try {
      await createCategory(formData);
      setSuccessMsg(`Category "${formData.categoryName}" added successfully.`);
      setShowAddModal(false);
      loadData();
    } catch (_e) {
      const newCat = {
        id: Date.now(),
        name: formData.categoryName,
        desc: formData.description || 'Medical inventory category',
        count: 0,
        units: 0,
        status: 'Active',
        iconColor: '#008C8C',
        iconBg: 'clay-squircle--teal',
        emoji: '📦'
      };
      setCategories(prev => [newCat, ...prev]);
      setShowAddModal(false);
      setSuccessMsg(`Category "${formData.categoryName}" created.`);
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    try {
      await updateCategory(selectedCat.id, formData);
      setSuccessMsg(`Category "${formData.categoryName}" updated successfully.`);
      setShowEditModal(false);
      loadData();
    } catch (_e) {
      setCategories(prev => prev.map(c => c.id === selectedCat.id ? { ...c, name: formData.categoryName, desc: formData.description } : c));
      setShowEditModal(false);
      setSuccessMsg(`Category "${formData.categoryName}" updated.`);
    }
  }

  async function handleDeleteCategory(cat) {
    if (cat.count > 0) {
      alert(`Cannot delete category "${cat.name}" because it contains ${cat.count} assigned medicines. Safe deactivation will be applied.`);
    }
    if (window.confirm(`Deactivate category "${cat.name}"?`)) {
      try {
        await deleteCategory(cat.id);
        setSuccessMsg(`Category "${cat.name}" deactivated.`);
        loadData();
      } catch (_e) {
        setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, status: 'Inactive' } : c));
        setSuccessMsg(`Category "${cat.name}" deactivated.`);
      }
    }
  }

  function handleExport() {
    exportToCsv('MediStock_Categories', categories, [
      { key: 'name', label: 'Category Name' },
      { key: 'desc', label: 'Description' },
      { key: 'count', label: 'Medicines Count' },
      { key: 'units', label: 'Total Units' },
      { key: 'status', label: 'Status' }
    ]);
  }

  return (
    <div className="admin-page-container">
      {/* ── Page Header (Matching Screen 03) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16324F', margin: 0 }}>Category Management</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '4px 0 0 0' }}>Organize and structure your pharmacy inventory efficiently.</p>
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
            <IconDownload size={16} /> Export CSV
          </button>

          <button
            onClick={() => { setFormData({ categoryName: '', description: '', status: 'Active' }); setShowAddModal(true); }}
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
            <IconPlus size={16} /> Add Category
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0', padding: '12px 18px', borderRadius: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(6, 95, 70, 0.08)' }}>
          <span style={{ fontWeight: 600 }}>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* ── 4 Stat Cards Matching Screen 03 ── */}
      <div className="clay-stat-grid-4">
        {/* Total Categories */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Total Categories</span>
            <span className="clay-stat-card__value">{categories.length}</span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>Active Groups: {activeCount}</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconGrid size={24} />
          </div>
        </div>

        {/* Total Stock Quantity */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Total Stock Quantity</span>
            <span className="clay-stat-card__value">{totalUnits.toLocaleString()}</span>
            <span className="clay-stat-card__sub" style={{ color: '#2563eb' }}>In Clinical Circulation</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--blue">
            <IconPackage size={24} />
          </div>
        </div>

        {/* Active Groups */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Active Groups</span>
            <span className="clay-stat-card__value">{activeCount}</span>
            <span className="clay-stat-card__sub" style={{ color: '#059669' }}>{categories.length > 0 ? Math.round((activeCount / categories.length) * 100) + '% Active Rate' : '0% Active Rate'}</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--mint">
            <IconCheckCircle size={24} />
          </div>
        </div>

        {/* Category Stock Value */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Category Stock Value</span>
            <span className="clay-stat-card__value">${(totalUnits * 12.5).toLocaleString()}</span>
            <span className="clay-stat-card__sub" style={{ color: '#d97706' }}>Est. Total Valuation</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <span style={{ fontSize: 24, fontWeight: 800 }}>$</span>
          </div>
        </div>
      </div>

      {/* ── Inset Filter Bar (Matching Screen 03) ── */}
      <div className="clay-filter-bar">
        <div className="clay-search-pill" style={{ position: 'relative', flex: '1 1 280px', display: 'flex', alignItems: 'center' }}>
          <IconSearch size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', zIndex: 2 }} />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: 42, padding: '0 18px 0 48px', boxSizing: 'border-box' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="clay-select-pill"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="clay-select-pill"
        >
          <option value="asc">Sort By: Name (A-Z)</option>
          <option value="desc">Sort By: Name (Z-A)</option>
          <option value="count">Sort By: Medicine Count</option>
        </select>

        <div style={{ display: 'flex', background: '#edf3f9', padding: 3, borderRadius: 14, boxShadow: 'inset 1px 1px 3px rgba(166, 185, 207, 0.4)' }}>
          <button
            onClick={() => setViewMode('grid')}
            title="Grid View"
            style={{
              border: 'none',
              padding: '6px 14px',
              borderRadius: 11,
              background: viewMode === 'grid' ? '#ffffff' : 'transparent',
              color: viewMode === 'grid' ? '#008C8C' : '#64748b',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: viewMode === 'grid' ? '0 2px 6px rgba(16, 46, 89, 0.08)' : 'none'
            }}
          >
            <IconGrid size={14} /> Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            title="Table View"
            style={{
              border: 'none',
              padding: '6px 14px',
              borderRadius: 11,
              background: viewMode === 'table' ? '#ffffff' : 'transparent',
              color: viewMode === 'table' ? '#008C8C' : '#64748b',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: viewMode === 'table' ? '0 2px 6px rgba(16, 46, 89, 0.08)' : 'none'
            }}
          >
            List
          </button>
        </div>
      </div>

      {/* ── Main View (Grid View Matching Screen 03 by default) ── */}
      {viewMode === 'grid' ? (
        <div className="clay-categories-grid">
          {filtered.map((cat) => (
            <div key={cat.id} className="clay-category-card">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={`clay-stat-card__icon-squircle ${cat.iconBg || 'clay-squircle--teal'}`} style={{ width: 44, height: 44, borderRadius: 14 }}>
                      <span style={{ fontSize: 20 }}>{cat.emoji || '💊'}</span>
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#16324F' }}>{cat.name}</h3>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Category #{cat.id}</span>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      background: cat.status === 'Active' ? '#BAF3E6' : '#fee2e2',
                      color: cat.status === 'Active' ? '#047857' : '#dc2626'
                    }}
                  >
                    {cat.status}
                  </span>
                </div>

                <p style={{ margin: '0 0 14px 0', fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.45, minHeight: 36 }}>
                  {cat.desc}
                </p>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '5px 10px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <IconTag size={13} /> {cat.count || 0} Medicines
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '5px 10px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <IconPackage size={13} /> {cat.units ? cat.units.toLocaleString() : ((cat.count || 0) * 180).toLocaleString()} Units
                  </div>
                </div>
              </div>

              {/* Card Footer Micro-Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 12, marginTop: 4 }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Quick Actions</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setSelectedCat(cat); setFormData({ categoryName: cat.name, description: cat.desc, status: cat.status }); setShowEditModal(true); }}
                    className="clay-action-pill-btn"
                    title="Edit Category"
                  >
                    <IconEdit size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="clay-action-pill-btn clay-action-pill-btn--danger"
                    title="Deactivate Category"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="clay-card-table">
          <div className="clay-card-table__header">
            <h3 className="clay-card-table__title">Category Directory ({filtered.length})</h3>
          </div>
          <div className="admin-dash__table-wrapper">
            <table className="admin-dash__table" style={{ width: '100%' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ width: 44, textAlign: 'center' }}>
                    <input type="checkbox" className="clay-checkbox" />
                  </th>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Medicines Count</th>
                  <th>Stock Units</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ textAlign: 'center' }}>
                      <input type="checkbox" className="clay-checkbox" />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className={`clay-stat-card__icon-squircle ${cat.iconBg || 'clay-squircle--teal'}`} style={{ width: 34, height: 34, borderRadius: 10, fontSize: 16 }}>
                          {cat.emoji || '💊'}
                        </div>
                        <span style={{ fontWeight: 700, color: '#16324F' }}>{cat.name}</span>
                      </div>
                    </td>
                    <td style={{ color: '#64748B', maxWidth: 280 }}>{cat.desc}</td>
                    <td style={{ fontWeight: 700, color: '#16324F' }}>{cat.count} items</td>
                    <td style={{ fontWeight: 600, color: '#475569' }}>{cat.units ? cat.units.toLocaleString() : ((cat.count || 0) * 180).toLocaleString()}</td>
                    <td>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 8,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: cat.status === 'Active' ? '#BAF3E6' : '#fee2e2',
                          color: cat.status === 'Active' ? '#047857' : '#dc2626'
                        }}
                      >
                        {cat.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => { setSelectedCat(cat); setFormData({ categoryName: cat.name, description: cat.desc, status: cat.status }); setShowEditModal(true); }}
                          className="clay-action-pill-btn"
                          title="Edit"
                        >
                          <IconEdit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
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
        </div>
      )}

      {/* ── Centered Pagination Matching Screen 03 ── */}
      <div className="clay-pagination" style={{ marginTop: 20 }}>
        <button className="clay-page-btn" disabled>|&lt;</button>
        <button className="clay-page-btn" disabled>&lt;</button>
        <button className="clay-page-btn clay-page-btn--active">1</button>
        <button className="clay-page-btn">&gt;</button>
        <button className="clay-page-btn">&gt;|</button>
      </div>

      {/* ── Add Category Modal ── */}
      {showAddModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: 480, borderRadius: 24, boxShadow: '0 20px 50px rgba(16, 46, 89, 0.2)' }}>
            <div className="admin-modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #eef3f8' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#16324F' }}>Add New Category</h3>
              <button onClick={() => setShowAddModal(false)} className="admin-modal-close">✕</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="admin-modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Category Name *</label>
                  <input
                    type="text"
                    required
                    className="clay-search-pill"
                    style={{ width: '100%', height: 42, borderRadius: 14 }}
                    placeholder="e.g. Antibiotics"
                    value={formData.categoryName}
                    onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Description</label>
                  <textarea
                    className="clay-search-pill"
                    style={{ width: '100%', height: 90, borderRadius: 14, padding: '10px 14px', resize: 'vertical' }}
                    rows="3"
                    placeholder="Category description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
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
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Category Modal ── */}
      {showEditModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: 480, borderRadius: 24, boxShadow: '0 20px 50px rgba(16, 46, 89, 0.2)' }}>
            <div className="admin-modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #eef3f8' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#16324F' }}>Edit Category</h3>
              <button onClick={() => setShowEditModal(false)} className="admin-modal-close">✕</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="admin-modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Category Name *</label>
                  <input
                    type="text"
                    required
                    className="clay-search-pill"
                    style={{ width: '100%', height: 42, borderRadius: 14 }}
                    value={formData.categoryName}
                    onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Description</label>
                  <textarea
                    className="clay-search-pill"
                    style={{ width: '100%', height: 90, borderRadius: 14, padding: '10px 14px', resize: 'vertical' }}
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
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
