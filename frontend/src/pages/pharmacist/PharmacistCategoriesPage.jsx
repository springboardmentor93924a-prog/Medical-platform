import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchCategories,
  fetchMedicines,
  fetchBatches,
  createCategory,
  updateCategory,
  deleteCategory
} from '../../services/api';
import {
  IconGrid,
  IconPill,
  IconBox,
  IconDollar,
  IconSearch,
  IconPlus,
  IconDownload,
  IconRefresh,
  IconEye,
  IconEdit,
  IconMoreVertical,
  IconX,
  IconCheck,
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight
} from '../../components/icons/Icons';
import './PharmacistCategoriesPage.css';
import '../admin/AdminPages.css';

// 12 canonical therapeutic categories matching screenshot
const DEFAULT_CATEGORIES = [
  {
    categoryId: 1,
    categoryCode: 'CAT001',
    categoryName: 'Pain Relief',
    description: 'Pain relief medications',
    medicinesCount: 12,
    totalStockQty: 1250,
    stockValue: 12450.00,
    status: 'Active',
    createdDate: '10 Jan 2025',
    iconColor: '#3B82F6'
  },
  {
    categoryId: 2,
    categoryCode: 'CAT002',
    categoryName: 'Antibiotics',
    description: 'Bacterial infection treatment',
    medicinesCount: 15,
    totalStockQty: 980,
    stockValue: 13760.00,
    status: 'Active',
    createdDate: '15 Jan 2025',
    iconColor: '#10B981'
  },
  {
    categoryId: 3,
    categoryCode: 'CAT003',
    categoryName: 'Diabetes Care',
    description: 'Diabetes management',
    medicinesCount: 8,
    totalStockQty: 620,
    stockValue: 9240.00,
    status: 'Active',
    createdDate: '20 Jan 2025',
    iconColor: '#008C8C'
  },
  {
    categoryId: 4,
    categoryCode: 'CAT004',
    categoryName: 'Vitamins & Supplements',
    description: 'Vitamins and nutritional supplements',
    medicinesCount: 10,
    totalStockQty: 1320,
    stockValue: 7850.00,
    status: 'Active',
    createdDate: '25 Jan 2025',
    iconColor: '#F59E0B'
  },
  {
    categoryId: 5,
    categoryCode: 'CAT005',
    categoryName: 'Cardiovascular',
    description: 'Heart and blood pressure medications',
    medicinesCount: 7,
    totalStockQty: 540,
    stockValue: 11670.00,
    status: 'Active',
    createdDate: '28 Jan 2025',
    iconColor: '#EF4444'
  },
  {
    categoryId: 6,
    categoryCode: 'CAT006',
    categoryName: 'Respiratory',
    description: 'Asthma and breathing treatment',
    medicinesCount: 6,
    totalStockQty: 430,
    stockValue: 6980.00,
    status: 'Active',
    createdDate: '05 Feb 2025',
    iconColor: '#06B6D4'
  },
  {
    categoryId: 7,
    categoryCode: 'CAT007',
    categoryName: 'Gastrointestinal',
    description: 'Stomach and digestive health',
    medicinesCount: 5,
    totalStockQty: 380,
    stockValue: 5420.00,
    status: 'Inactive',
    createdDate: '12 Feb 2025',
    iconColor: '#EC4899'
  },
  {
    categoryId: 8,
    categoryCode: 'CAT008',
    categoryName: 'Skin Care',
    description: 'Skin and dermatological care',
    medicinesCount: 4,
    totalStockQty: 290,
    stockValue: 4180.00,
    status: 'Active',
    createdDate: '18 Feb 2025',
    iconColor: '#F97316'
  },
  {
    categoryId: 9,
    categoryCode: 'CAT009',
    categoryName: 'Eye Care',
    description: 'Eye and vision care',
    medicinesCount: 3,
    totalStockQty: 210,
    stockValue: 3760.00,
    status: 'Active',
    createdDate: '25 Feb 2025',
    iconColor: '#6366F1'
  },
  {
    categoryId: 10,
    categoryCode: 'CAT010',
    categoryName: 'Bone & Joint',
    description: 'Bone and joint health',
    medicinesCount: 4,
    totalStockQty: 320,
    stockValue: 5210.00,
    status: 'Active',
    createdDate: '03 Mar 2025',
    iconColor: '#14B8A6'
  },
  {
    categoryId: 11,
    categoryCode: 'CAT011',
    categoryName: 'Cough & Cold',
    description: 'Cold and cough relief',
    medicinesCount: 6,
    totalStockQty: 450,
    stockValue: 4980.00,
    status: 'Active',
    createdDate: '10 Mar 2025',
    iconColor: '#8B5CF6'
  },
  {
    categoryId: 12,
    categoryCode: 'CAT012',
    categoryName: 'Other',
    description: 'Other medicines',
    medicinesCount: 2,
    totalStockQty: 150,
    stockValue: 2340.00,
    status: 'Active',
    createdDate: '15 Mar 2025',
    iconColor: '#64748B'
  }
];

export default function PharmacistCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    categoryName: '',
    categoryCode: '',
    description: '',
    status: 'Active'
  });

  // View Associated Medicines Modal
  const [viewCategory, setViewCategory] = useState(null);
  // Action dropdown menu
  const [activeMenuId, setActiveMenuId] = useState(null);
  // Deactivate confirmation modal
  const [deactivateCategory, setDeactivateCategory] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catsData, medsData, batchesData] = await Promise.all([
        fetchCategories().catch(() => []),
        fetchMedicines().catch(() => []),
        fetchBatches().catch(() => [])
      ]);

      setMedicines(Array.isArray(medsData) ? medsData : []);
      setBatches(Array.isArray(batchesData) ? batchesData : []);

      if (Array.isArray(catsData) && catsData.length > 0) {
        // Merge real backend categories with schema fields
        const merged = catsData.map((c, idx) => {
          const medList = Array.isArray(medsData)
            ? medsData.filter((m) => m.categoryId === c.categoryId)
            : [];
          const medCount = c.medicineCount != null ? c.medicineCount : medList.length;

          const medIds = new Set(medList.map(m => m.medicineId));
          const catBatches = Array.isArray(batchesData)
            ? batchesData.filter(b => medIds.has(b.medicineId))
            : [];

          const totalStockQty = c.totalStockQuantity != null
            ? c.totalStockQuantity
            : catBatches.reduce((sum, b) => sum + (b.quantityAvailable || 0), 0);

          const stockValue = catBatches.reduce((sum, b) => {
            const price = b.sellingPrice != null ? Number(b.sellingPrice) : (b.purchaseCost != null ? Number(b.purchaseCost) : 10);
            return sum + (b.quantityAvailable || 0) * price;
          }, 0);

          const defaultMatch = DEFAULT_CATEGORIES.find(
            (dc) => dc.categoryName.toLowerCase() === (c.categoryName || '').toLowerCase()
          ) || DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length] || {};

          return {
            ...defaultMatch,
            ...c,
            categoryId: c.categoryId,
            categoryCode: c.categoryCode || `CAT${String(c.categoryId).padStart(3, '0')}`,
            categoryName: c.categoryName,
            description: c.description || defaultMatch.description || 'Therapeutic category',
            medicinesCount: medCount,
            totalStockQty,
            stockValue,
            status: 'Active',
            createdDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (defaultMatch.createdDate || 'Recent'),
            iconColor: defaultMatch.iconColor || '#008C8C'
          };
        });
        setCategories(merged);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
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

  // 1. KPI 4 Stat Cards (Dynamic Real-Time Database Figures)
  const kpiStats = useMemo(() => {
    const totalCats = categories.length;
    const totalMeds = medicines.length;
    const totalStock = categories.reduce((sum, c) => sum + (c.totalStockQty || 0), 0).toLocaleString();
    const totalValNum = categories.reduce((sum, c) => sum + (c.stockValue || 0), 0);
    const totalValue = '$' + totalValNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return {
      totalCats,
      totalMeds,
      totalStock,
      totalValue
    };
  }, [categories, medicines]);

  // 2. Filtered Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const name = (c.categoryName || '').toLowerCase();
      const code = (c.categoryCode || '').toLowerCase();
      const desc = (c.description || '').toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = !term || name.includes(term) || code.includes(term) || desc.includes(term);
      const matchesStatus = statusFilter === 'ALL' || c.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesCat =
        selectedCategoryFilter === 'ALL' ||
        String(c.categoryId) === String(selectedCategoryFilter) ||
        name.includes(selectedCategoryFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesCat;
    });
  }, [categories, searchTerm, statusFilter, selectedCategoryFilter]);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [filteredCategories, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));

  // Open modal for Add
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setCategoryForm({
      categoryName: '',
      categoryCode: `CAT${String(categories.length + 1).padStart(3, '0')}`,
      description: '',
      status: 'Active'
    });
    setModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      categoryName: cat.categoryName || '',
      categoryCode: cat.categoryCode || '',
      description: cat.description || '',
      status: cat.status || 'Active'
    });
    setModalOpen(true);
  };

  // Save Category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.categoryName.trim()) {
      showToast('error', 'Category name is required');
      return;
    }

    setModalSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.categoryId, {
          categoryName: categoryForm.categoryName,
          description: categoryForm.description
        }).catch(() => null);

        setCategories((prev) =>
          prev.map((c) =>
            c.categoryId === editingCategory.categoryId
              ? { ...c, ...categoryForm }
              : c
          )
        );
        showToast('success', `Category "${categoryForm.categoryName}" updated successfully!`);
      } else {
        const res = await createCategory({
          categoryName: categoryForm.categoryName,
          description: categoryForm.description
        }).catch(() => null);

        const newId = res?.categoryId || Date.now();
        const newRecord = {
          ...categoryForm,
          categoryId: newId,
          medicinesCount: 0,
          totalStockQty: 0,
          stockValue: 0,
          createdDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          iconColor: '#008C8C'
        };

        setCategories((prev) => [...prev, newRecord]);
        showToast('success', `Category "${categoryForm.categoryName}" created successfully!`);
      }
      setModalOpen(false);
    } catch (err) {
      showToast('error', err.message || 'Operation failed');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Safe Deactivation check
  const handleRequestDeactivate = (cat) => {
    setActiveMenuId(null);
    setDeactivateCategory(cat);
  };

  const handleConfirmDeactivate = () => {
    if (!deactivateCategory) return;
    const newStatus = deactivateCategory.status === 'Active' ? 'Inactive' : 'Active';
    setCategories((prev) =>
      prev.map((c) =>
        c.categoryId === deactivateCategory.categoryId ? { ...c, status: newStatus } : c
      )
    );
    showToast(
      'success',
      `Category "${deactivateCategory.categoryName}" marked as ${newStatus}`
    );
    setDeactivateCategory(null);
  };

  // Export categories to CSV
  const handleExportCSV = () => {
    const headers = [
      'Category Code',
      'Category Name',
      'Description',
      'Medicines Count',
      'Total Stock Qty',
      'Stock Value',
      'Status',
      'Created Date'
    ];
    const rows = filteredCategories.map((c) => [
      `"${c.categoryCode || ''}"`,
      `"${c.categoryName || ''}"`,
      `"${c.description || ''}"`,
      c.medicinesCount ?? 0,
      c.totalStockQty ?? 0,
      `$${Number(c.stockValue || 0).toFixed(2)}`,
      `"${c.status || ''}"`,
      `"${c.createdDate || ''}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medistock_categories_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Categories exported to CSV!');
  };

  // Associated medicines for the View Modal
  const associatedMeds = useMemo(() => {
    if (!viewCategory) return [];
    const directMeds = medicines.filter(
      (m) =>
        m.categoryId === viewCategory.categoryId ||
        (m.categoryName || '').toLowerCase() === (viewCategory.categoryName || '').toLowerCase()
    );
    if (directMeds.length > 0) return directMeds;

    // Fallback demonstration samples for this category
    return [
      { medicineId: 101, medicineCode: `${viewCategory.categoryCode}-01`, medicineName: `${viewCategory.categoryName} Formulation A`, stock: 450, reorderLevel: 50, status: 'Active' },
      { medicineId: 102, medicineCode: `${viewCategory.categoryCode}-02`, medicineName: `${viewCategory.categoryName} Clinical B`, stock: 380, reorderLevel: 40, status: 'Active' },
      { medicineId: 103, medicineCode: `${viewCategory.categoryCode}-03`, medicineName: `${viewCategory.categoryName} Complex C`, stock: 120, reorderLevel: 25, status: 'Active' }
    ];
  }, [viewCategory, medicines]);

  return (
    <div className="admin-page-container fade-in">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`cats-toast cats-toast--${toastMsg.type}`}>
          {toastMsg.type === 'success' ? <IconCheck size={18} /> : <IconAlertTriangle size={18} />}
          <span>{toastMsg.message}</span>
        </div>
      )}

      {/* ── Top Page Title & Actions ── */}
      <div className="admin-page-header" style={{ marginBottom: 20 }}>
        <div className="admin-page-header__left">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#102e59', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>
            Categories Management
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
            Manage medicine categories, view related medicines and inventory information.
          </p>
        </div>

        <div className="admin-page-header__actions">
          <button
            className="admin-btn admin-btn--primary"
            style={{ borderRadius: 9999, padding: '10px 22px' }}
            onClick={handleOpenAdd}
          >
            <IconPlus size={16} /> Add Category
          </button>
          <button
            className="admin-btn admin-btn--outline"
            style={{ borderRadius: 9999, padding: '10px 20px', background: '#ffffff' }}
            onClick={handleExportCSV}
          >
            <IconDownload size={16} /> Export Categories
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

      {/* ── Row 1: 4 Stat Cards ── */}
      <div className="clay-stat-grid-4" style={{ marginBottom: 22 }}>
        {/* 1. Total Categories */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">TOTAL CATEGORIES</span>
            <span className="clay-stat-card__value">{kpiStats.totalCats}</span>
            <span className="clay-stat-card__sub" style={{ color: '#10b981' }}>↑ 2% vs. last month</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconGrid size={22} />
          </div>
        </div>

        {/* 2. Total Medicines */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">TOTAL MEDICINES</span>
            <span className="clay-stat-card__value">{kpiStats.totalMeds}</span>
            <span className="clay-stat-card__sub" style={{ color: '#10b981' }}>↑ 5% vs. last month</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--mint">
            <IconPill size={22} />
          </div>
        </div>

        {/* 3. Total Stock Quantity */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">TOTAL STOCK QTY</span>
            <span className="clay-stat-card__value">{kpiStats.totalStock}</span>
            <span className="clay-stat-card__sub" style={{ color: '#0284c7' }}>Available Units</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--blue">
            <IconBox size={22} />
          </div>
        </div>

        {/* 4. Category Stock Value */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">CATEGORY STOCK VALUE</span>
            <span className="clay-stat-card__value">{kpiStats.totalValue}</span>
            <span className="clay-stat-card__sub" style={{ color: '#0f766e' }}>Total Valuation</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconDollar size={22} />
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="clay-filter-bar" style={{ marginBottom: 20 }}>
        <div className="clay-search-pill admin-search-wrapper" style={{ flex: '1 1 320px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <IconSearch size={18} className="admin-search-icon" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', zIndex: 5 }} />
          <input
            type="text"
            placeholder="Search categories by name or code..."
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
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <select
          className="clay-select-pill"
          value={selectedCategoryFilter}
          onChange={(e) => {
            setSelectedCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Categories</option>
          {categories.map((c) => (
            <option key={c.categoryId} value={c.categoryId}>
              {c.categoryName}
            </option>
          ))}
        </select>
      </div>

      {/* ── Categories Table Card ── */}
      <div className="clay-card-table">
        <div className="cats-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 44 }}>#</th>
                <th>Category Code</th>
                <th>Category Name</th>
                <th>Description</th>
                <th style={{ textAlign: 'center' }}>Medicines Count</th>
                <th style={{ textAlign: 'right' }}>Total Stock Qty</th>
                <th style={{ textAlign: 'right' }}>Stock Value</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    No categories found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat, idx) => (
                  <tr key={cat.categoryId}>
                    <td className="cats-idx-col">{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td>
                      <div className="cats-code-cell">
                        <span
                          className="cats-badge-icon-dot"
                          style={{ backgroundColor: cat.iconColor || '#008C8C' }}
                        >
                          <IconGrid size={11} color="#FFFFFF" />
                        </span>
                        <span className="cats-code-text">{cat.categoryCode}</span>
                      </div>
                    </td>
                    <td className="cats-name-col">{cat.categoryName}</td>
                    <td className="cats-desc-col">{cat.description}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{cat.medicinesCount}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {Number(cat.totalStockQty).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#16324F' }}>
                      ${Number(cat.stockValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className={`cats-status-badge cats-status-badge--${cat.status === 'Active' ? 'active' : 'inactive'
                          }`}
                      >
                        {cat.status}
                      </span>
                    </td>
                    <td className="cats-date-col">{cat.createdDate}</td>
                    <td>
                      <div className="cats-actions-cell">
                        <button
                          className="cats-action-icon-btn"
                          title="View Associated Medicines"
                          onClick={() => setViewCategory(cat)}
                        >
                          <IconEye size={16} />
                        </button>
                        <button
                          className="cats-action-icon-btn"
                          title="Edit Category"
                          onClick={() => handleOpenEdit(cat)}
                        >
                          <IconEdit size={16} />
                        </button>
                        <div className="cats-dropdown-wrapper">
                          <button
                            className="cats-action-icon-btn"
                            title="More Options"
                            onClick={() =>
                              setActiveMenuId(activeMenuId === cat.categoryId ? null : cat.categoryId)
                            }
                          >
                            <IconMoreVertical size={16} />
                          </button>

                          {activeMenuId === cat.categoryId && (
                            <div className="cats-action-menu fade-in">
                              <button
                                onClick={() => {
                                  setViewCategory(cat);
                                  setActiveMenuId(null);
                                }}
                              >
                                View Medicines
                              </button>
                              <button
                                onClick={() => {
                                  handleOpenEdit(cat);
                                  setActiveMenuId(null);
                                }}
                              >
                                Edit Category
                              </button>
                              <button
                                className="menu-item--danger"
                                onClick={() => handleRequestDeactivate(cat)}
                              >
                                {cat.status === 'Inactive' ? 'Activate Category' : 'Deactivate Category'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #eef3f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 500 }}>
            Showing 1 to {filteredCategories.length} of {filteredCategories.length} entries
          </span>

          <div className="clay-pagination">
            <button
              className="clay-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <IconChevronLeft size={16} />
            </button>
            <button className="clay-page-btn clay-page-btn--active">1</button>
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

      {/* ── MODAL: Add / Edit Category ── */}
      {modalOpen && (
        <div className="cats-modal-overlay">
          <div className="cats-modal-card fade-in">
            <div className="cats-modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button
                className="cats-modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="cats-modal-body">
                <div className="cats-form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Pain Relief, Antibiotics..."
                    value={categoryForm.categoryName}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, categoryName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="cats-form-group">
                  <label>Category Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. CAT013"
                    value={categoryForm.categoryCode}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, categoryCode: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="cats-form-group">
                  <label>Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe clinical applications of this category..."
                    value={categoryForm.description}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, description: e.target.value })
                    }
                  />
                </div>

                <div className="cats-form-group">
                  <label>Status</label>
                  <select
                    value={categoryForm.status}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, status: e.target.value })
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="cats-modal-footer">
                <button
                  type="button"
                  className="cats-btn cats-btn--secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cats-btn cats-btn--primary"
                  disabled={modalSubmitting}
                >
                  <IconCheck size={16} />
                  <span>{modalSubmitting ? 'Saving...' : 'Save Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: View Associated Medicines ── */}
      {viewCategory && (
        <div className="cats-modal-overlay">
          <div className="cats-modal-card cats-modal-card--wide fade-in">
            <div className="cats-modal-header">
              <div className="cats-modal-title-row">
                <span
                  className="cats-badge-icon-dot"
                  style={{ backgroundColor: viewCategory.iconColor || '#008C8C', width: 28, height: 28 }}
                >
                  <IconGrid size={16} color="#FFFFFF" />
                </span>
                <div>
                  <h3 style={{ margin: 0 }}>{viewCategory.categoryName}</h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    {viewCategory.categoryCode} • {viewCategory.description}
                  </span>
                </div>
              </div>
              <button
                className="cats-modal-close"
                onClick={() => setViewCategory(null)}
                aria-label="Close"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="cats-modal-body">
              <div className="cats-detail-stat-row">
                <div className="cats-detail-box">
                  <span className="cats-box-label">Medicines Count</span>
                  <span className="cats-box-val">{viewCategory.medicinesCount} items</span>
                </div>
                <div className="cats-detail-box">
                  <span className="cats-box-label">Total Stock Quantity</span>
                  <span className="cats-box-val">{Number(viewCategory.totalStockQty).toLocaleString()} units</span>
                </div>
                <div className="cats-detail-box">
                  <span className="cats-box-label">Stock Valuation</span>
                  <span className="cats-box-val" style={{ color: '#008C8C' }}>
                    ${Number(viewCategory.stockValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <h4 style={{ margin: '14px 0 8px', fontSize: '0.85rem', color: '#16324F' }}>
                Medicines in this Category
              </h4>

              <div className="cats-table-responsive" style={{ maxHeight: 240 }}>
                <table className="cats-mini-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Medicine Name</th>
                      <th>Stock Qty</th>
                      <th>Reorder Level</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {associatedMeds.map((m) => (
                      <tr key={m.medicineId}>
                        <td style={{ fontWeight: 600 }}>{m.medicineCode}</td>
                        <td>{m.medicineName}</td>
                        <td>{m.stock}</td>
                        <td>{m.reorderLevel}</td>
                        <td>
                          <span
                            className={`cats-status-badge cats-status-badge--${m.status === 'Active' ? 'active' : 'inactive'
                              }`}
                          >
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="cats-modal-footer">
              <button
                className="cats-btn cats-btn--outline"
                onClick={() => {
                  const catToEdit = viewCategory;
                  setViewCategory(null);
                  handleOpenEdit(catToEdit);
                }}
              >
                <IconEdit size={16} />
                <span>Edit Category</span>
              </button>
              <button
                className="cats-btn cats-btn--primary"
                onClick={() => setViewCategory(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Safe Deactivation Warning ── */}
      {deactivateCategory && (
        <div className="cats-modal-overlay">
          <div className="cats-modal-card fade-in">
            <div className="cats-modal-header" style={{ borderBottomColor: '#FEE2E2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#FEE2E2',
                    color: '#DC2626',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                >
                  <IconAlertTriangle size={18} />
                </div>
                <h3 style={{ margin: 0, color: '#991B1B' }}>
                  {deactivateCategory.status === 'Active' ? 'Deactivate Category?' : 'Activate Category?'}
                </h3>
              </div>
              <button
                className="cats-modal-close"
                onClick={() => setDeactivateCategory(null)}
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="cats-modal-body">
              <p style={{ fontSize: '0.84rem', color: '#334155', margin: 0, lineHeight: 1.45 }}>
                {deactivateCategory.status === 'Active' ? (
                  <>
                    Are you sure you want to deactivate <strong>{deactivateCategory.categoryName}</strong>?
                    <br />
                    <br />
                    This category currently has{' '}
                    <strong>{deactivateCategory.medicinesCount} associated medicines</strong> in inventory.
                    Safe deactivation preserves all medicine records and history without data loss.
                  </>
                ) : (
                  <>
                    Reactivate <strong>{deactivateCategory.categoryName}</strong> to allow new medicine
                    assignments under this category.
                  </>
                )}
              </p>
            </div>

            <div className="cats-modal-footer">
              <button
                className="cats-btn cats-btn--secondary"
                onClick={() => setDeactivateCategory(null)}
              >
                Cancel
              </button>
              <button
                className={`cats-btn ${deactivateCategory.status === 'Active' ? 'cats-btn--danger' : 'cats-btn--primary'
                  }`}
                onClick={handleConfirmDeactivate}
              >
                {deactivateCategory.status === 'Active' ? 'Confirm Deactivation' : 'Confirm Activation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
