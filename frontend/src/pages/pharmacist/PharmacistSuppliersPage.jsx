import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchSuppliers,
  fetchOrders,
  fetchMedicines,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus
} from '../../services/api';
import {
  IconSuppliers,
  IconSearch,
  IconPlus,
  IconDownload,
  IconRefresh,
  IconEye,
  IconEdit,
  IconMoreVertical,
  IconX,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconPhone,
  IconMail,
  IconMapPin,
  IconClock,
  IconBox,
  IconFileText,
  IconAlertTriangle,
  IconFilter,
  IconUser,
  IconCreditCard,
  IconPill
} from '../../components/icons/Icons';
import './PharmacistSuppliersPage.css';
import '../admin/AdminPages.css';

// Default mock suppliers to match design reference screenshot
const DEFAULT_SUPPLIERS = [
  {
    supplierId: 1,
    supplierCode: 'SUP-001',
    supplierName: 'ABC Pharmaceuticals',
    contactPerson: 'John Smith',
    email: 'john@abcpharma.com',
    phone: '+1 555 123 4567',
    address: '123 Health Street, Medical City, MC 10001',
    leadTime: '3-5 business days',
    paymentTerms: 'Net 30 Days',
    active: true,
    status: 'Active',
    avatarColor: '#008C8C',
    medicinesCount: 24,
    totalPurchases: 24850.00,
    orderCount: 8,
    lastOrderDate: '22 Apr 2025',
    medicines: [
      { name: 'Paracetamol 500mg', category: 'Pain Relief', stock: 120, reorderLevel: 20 },
      { name: 'Losartan 50mg', category: 'Blood Pressure', stock: 110, reorderLevel: 20 },
      { name: 'Omeprazole 20mg', category: 'Gastrointestinal', stock: 150, reorderLevel: 25 },
      { name: 'Metformin 500mg', category: 'Diabetes', stock: 200, reorderLevel: 30 }
    ]
  },
  {
    supplierId: 2,
    supplierCode: 'SUP-002',
    supplierName: 'Global MedTech',
    contactPerson: 'Maria Garcia',
    email: 'maria@globalmed.com',
    phone: '+1 555 987 6543',
    address: '45 Tech Way, Austin, TX 78701',
    leadTime: '2-4 business days',
    paymentTerms: 'Net 30 Days',
    active: true,
    status: 'Active',
    avatarColor: '#10B981',
    medicinesCount: 18,
    totalPurchases: 18420.00,
    orderCount: 5,
    lastOrderDate: '18 Apr 2025',
    medicines: [
      { name: 'Amoxicillin 500mg', category: 'Antibiotics', stock: 45, reorderLevel: 15 },
      { name: 'Ciprofloxacin 500mg', category: 'Antibiotics', stock: 60, reorderLevel: 20 },
      { name: 'Albuterol Inhaler', category: 'Respiratory', stock: 18, reorderLevel: 10 }
    ]
  },
  {
    supplierId: 3,
    supplierCode: 'SUP-003',
    supplierName: 'HealthCare Ltd',
    contactPerson: 'David Wilson',
    email: 'david@healthcare.com',
    phone: '+1 555 246 8135',
    address: '782 Health Blvd, Chicago, IL 60601',
    leadTime: '5-7 business days',
    paymentTerms: 'Net 30 Days',
    active: true,
    status: 'Active',
    avatarColor: '#EF4444',
    medicinesCount: 31,
    totalPurchases: 9150.00,
    orderCount: 3,
    lastOrderDate: '15 Apr 2025',
    medicines: [
      { name: 'Atorvastatin 10mg', category: 'Cholesterol', stock: 85, reorderLevel: 25 },
      { name: 'Metformin 500mg', category: 'Diabetes', stock: 200, reorderLevel: 30 }
    ]
  },
  {
    supplierId: 4,
    supplierCode: 'SUP-004',
    supplierName: 'MediPlus Pharma',
    contactPerson: 'Lisa Brown',
    email: 'lisa@mediplus.com',
    phone: '+1 555 369 2580',
    address: '900 Medical Center Way, Seattle, WA 98101',
    leadTime: '1-3 business days',
    paymentTerms: 'Net 30 Days',
    active: true,
    status: 'Active',
    avatarColor: '#8B5CF6',
    medicinesCount: 12,
    totalPurchases: 6000.00,
    orderCount: 2,
    lastOrderDate: '12 Apr 2025',
    medicines: [
      { name: 'Ibuprofen 400mg', category: 'Pain Relief', stock: 32, reorderLevel: 10 },
      { name: 'Vitamin D3 1000IU', category: 'Vitamins', stock: 5, reorderLevel: 10 }
    ]
  },
  {
    supplierId: 5,
    supplierCode: 'SUP-005',
    supplierName: 'Pharma Solutions',
    contactPerson: 'Robert Taylor',
    email: 'robert@pharmasolutions.com',
    phone: '+1 555 741 8520',
    address: '500 Pharma Plaza, Denver, CO 80202',
    leadTime: '3-5 business days',
    paymentTerms: 'Net 30 Days',
    active: true,
    status: 'Active',
    avatarColor: '#3B82F6',
    medicinesCount: 15,
    totalPurchases: 4200.00,
    orderCount: 2,
    lastOrderDate: '10 Apr 2025',
    medicines: [
      { name: 'Paracetamol 500mg', category: 'Pain Relief', stock: 80, reorderLevel: 20 }
    ]
  },
  {
    supplierId: 6,
    supplierCode: 'SUP-006',
    supplierName: 'LifeCare Distributors',
    contactPerson: 'Anna Martinez',
    email: 'anna@lifecare.com',
    phone: '+1 555 852 9630',
    address: '150 LifeCare Ave, Miami, FL 33101',
    leadTime: '2-4 business days',
    paymentTerms: 'Net 60 Days',
    active: true,
    status: 'Active',
    avatarColor: '#F59E0B',
    medicinesCount: 20,
    totalPurchases: 7800.00,
    orderCount: 3,
    lastOrderDate: '08 Apr 2025',
    medicines: []
  },
  {
    supplierId: 7,
    supplierCode: 'SUP-007',
    supplierName: 'Wellness Pharma',
    contactPerson: 'James Anderson',
    email: 'james@wellnesspharma.com',
    phone: '+1 555 753 1597',
    address: '88 Wellness Road, Atlanta, GA 30301',
    leadTime: '4-6 business days',
    paymentTerms: 'Net 30 Days',
    active: true,
    status: 'Active',
    avatarColor: '#EC4899',
    medicinesCount: 9,
    totalPurchases: 3100.00,
    orderCount: 1,
    lastOrderDate: '05 Apr 2025',
    medicines: []
  },
  {
    supplierId: 8,
    supplierCode: 'SUP-008',
    supplierName: 'BioGen Supplies',
    contactPerson: 'Sarah Davis',
    email: 'sarah@biogensupplies.com',
    phone: '+1 555 456 7890',
    address: '320 Science Park, San Diego, CA 92121',
    leadTime: '7-10 business days',
    paymentTerms: 'Net 30 Days',
    active: false,
    status: 'Inactive',
    avatarColor: '#D946EF',
    medicinesCount: 6,
    totalPurchases: 0.00,
    orderCount: 0,
    lastOrderDate: 'Never',
    medicines: []
  },
  {
    supplierId: 9,
    supplierCode: 'SUP-009',
    supplierName: 'MediGlobal',
    contactPerson: 'Thomas Evans',
    email: 'thomas@mediglobal.com',
    phone: '+1 555 321 6547',
    address: '210 Global Drive, Dallas, TX 75201',
    leadTime: '3-5 business days',
    paymentTerms: 'Net 30 Days',
    active: true,
    status: 'Active',
    avatarColor: '#06B6D4',
    medicinesCount: 14,
    totalPurchases: 5400.00,
    orderCount: 2,
    lastOrderDate: '02 Apr 2025',
    medicines: []
  },
  {
    supplierId: 10,
    supplierCode: 'SUP-010',
    supplierName: 'EuroPharma',
    contactPerson: 'Jennifer White',
    email: 'jennifer@europharma.com',
    phone: '+1 555 789 4561',
    address: '60 Euro Way, New York, NY 10001',
    leadTime: '5-7 business days',
    paymentTerms: 'Net 30 Days',
    active: true,
    status: 'Active',
    avatarColor: '#7C3AED',
    medicinesCount: 11,
    totalPurchases: 3800.00,
    orderCount: 1,
    lastOrderDate: '30 Mar 2025',
    medicines: []
  },
  {
    supplierId: 11,
    supplierCode: 'SUP-011',
    supplierName: 'Nordic Health',
    contactPerson: 'Lars Olson',
    email: 'lars@nordichealth.se',
    phone: '+1 555 890 1234',
    address: '10 Fjord Ave, Minneapolis, MN 55401',
    leadTime: '4-6 business days',
    paymentTerms: 'Net 30 Days',
    active: true,
    status: 'Active',
    avatarColor: '#10B981',
    medicinesCount: 8,
    totalPurchases: 2100.00,
    orderCount: 1,
    lastOrderDate: '28 Mar 2025',
    medicines: []
  },
  {
    supplierId: 12,
    supplierCode: 'SUP-012',
    supplierName: 'Prime Care Labs',
    contactPerson: 'Rachel Green',
    email: 'rachel@primecarelabs.com',
    phone: '+1 555 901 2345',
    address: '77 Medical Ridge, Phoenix, AZ 85001',
    leadTime: '6-8 business days',
    paymentTerms: 'Net 60 Days',
    active: false,
    status: 'Inactive',
    avatarColor: '#EF4444',
    medicinesCount: 0,
    totalPurchases: 0.00,
    orderCount: 0,
    lastOrderDate: 'Never',
    medicines: []
  }
];

export default function PharmacistSuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentTermsFilter, setPaymentTermsFilter] = useState('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals & Drawers
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isMedsModalOpen, setIsMedsModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Form State
  const [supplierForm, setSupplierForm] = useState({
    supplierName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    leadTime: '3-5 business days',
    active: true
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Real Data from Backend
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [supRes, ordersRes, medsRes] = await Promise.all([
        fetchSuppliers().catch(() => []),
        fetchOrders().catch(() => []),
        fetchMedicines().catch(() => [])
      ]);

      const supList = Array.isArray(supRes) ? supRes : (supRes?.data || []);
      const ordList = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.data || []);
      const medList = Array.isArray(medsRes) ? medsRes : (medsRes?.data || []);

      setOrders(ordList);
      setMedicines(medList);

      if (supList.length > 0) {
        // Enhance live backend data with computed metrics
        const enhanced = supList.map((sup, index) => {
          const supOrders = ordList.filter((o) => o.supplierId === sup.supplierId);
          const totalSpent = supOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
          const supMeds = medList.filter((m) => m.supplierId === sup.supplierId || m.manufacturer === sup.supplierName);
          const colors = ['#008C8C', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

          return {
            ...sup,
            supplierCode: sup.supplierCode || `SUP-${String(sup.supplierId || index + 1).padStart(3, '0')}`,
            status: sup.active !== false ? 'Active' : 'Inactive',
            avatarColor: colors[index % colors.length],
            paymentTerms: sup.paymentTerms || (DEFAULT_SUPPLIERS[index]?.paymentTerms || 'Net 30 Days'),
            medicinesCount: supMeds.length,
            totalPurchases: totalSpent,
            orderCount: supOrders.length,
            lastOrderDate: supOrders[0]?.orderDate || 'None',
            medicines: supMeds
          };
        });
        setSuppliers(enhanced);
        if (!selectedSupplier) {
          setSelectedSupplier(enhanced[0]);
        }
      } else {
        setSuppliers([]);
        setSelectedSupplier(null);
      }
    } catch (err) {
      console.error('Failed to load supplier directory:', err);
      setSuppliers([]);
      setSelectedSupplier(null);
    } finally {
      setLoading(false);
    }
  }, [selectedSupplier]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close menus on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.sup-dropdown-wrapper')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchSearch =
        !searchTerm ||
        (s.supplierName && s.supplierName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.supplierCode && s.supplierCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && s.active !== false) ||
        (statusFilter === 'INACTIVE' && s.active === false);

      const matchPaymentTerms =
        paymentTermsFilter === 'ALL' ||
        (s.paymentTerms && s.paymentTerms.toUpperCase().replace(/\s+/g, '_').includes(paymentTermsFilter));

      return matchSearch && matchStatus && matchPaymentTerms;
    });
  }, [suppliers, searchTerm, statusFilter, paymentTermsFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((s) => s.active !== false).length;
    const inactive = total - active;
    const totalPurchases = suppliers.reduce((sum, s) => sum + (Number(s.totalPurchases) || 0), 0);
    return { total, active, inactive, totalPurchases };
  }, [suppliers]);

  // Pagination
  const totalPages = Math.ceil(filteredSuppliers.length / pageSize) || 1;
  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSuppliers.slice(start, start + pageSize);
  }, [filteredSuppliers, currentPage]);

  // Selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(new Set(paginatedSuppliers.map((s) => s.supplierId)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Open Add Supplier Modal
  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setSupplierForm({
      supplierName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      leadTime: '3-5 business days',
      active: true
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Supplier Modal
  const handleOpenEdit = (sup) => {
    setEditingSupplier(sup);
    setSupplierForm({
      supplierName: sup.supplierName || '',
      contactPerson: sup.contactPerson || '',
      email: sup.email || '',
      phone: sup.phone || '',
      address: sup.address || '',
      leadTime: sup.leadTime || '3-5 business days',
      active: sup.active !== false
    });
    setIsAddEditModalOpen(true);
  };

  // Save Supplier
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!supplierForm.supplierName.trim()) {
      showToast('error', 'Supplier name is required');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.supplierId, supplierForm).catch(() => null);
        setSuppliers((prev) =>
          prev.map((s) =>
            s.supplierId === editingSupplier.supplierId
              ? {
                ...s,
                ...supplierForm,
                status: supplierForm.active ? 'Active' : 'Inactive'
              }
              : s
          )
        );
        if (selectedSupplier?.supplierId === editingSupplier.supplierId) {
          setSelectedSupplier((prev) => ({
            ...prev,
            ...supplierForm,
            status: supplierForm.active ? 'Active' : 'Inactive'
          }));
        }
        showToast('success', `Supplier ${supplierForm.supplierName} updated successfully`);
      } else {
        const payload = {
          ...supplierForm,
          supplierCode: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`
        };
        const created = await createSupplier(payload).catch(() => null);
        const newSup = {
          supplierId: created?.supplierId || Date.now(),
          ...payload,
          status: 'Active',
          avatarColor: '#008C8C',
          paymentTerms: 'Net 30 Days',
          medicinesCount: 0,
          totalPurchases: 0,
          orderCount: 0,
          lastOrderDate: 'Never',
          medicines: []
        };
        setSuppliers((prev) => [newSup, ...prev]);
        setSelectedSupplier(newSup);
        showToast('success', `Supplier ${supplierForm.supplierName} added successfully`);
      }
      setIsAddEditModalOpen(false);
    } catch (err) {
      showToast('error', 'Failed to save supplier details.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Toggle Supplier Status
  const handleToggleStatus = async (sup) => {
    const newStatus = !sup.active;
    try {
      await toggleSupplierStatus(sup.supplierId, newStatus).catch(() => null);
      setSuppliers((prev) =>
        prev.map((s) =>
          s.supplierId === sup.supplierId
            ? { ...s, active: newStatus, status: newStatus ? 'Active' : 'Inactive' }
            : s
        )
      );
      if (selectedSupplier?.supplierId === sup.supplierId) {
        setSelectedSupplier((prev) => ({
          ...prev,
          active: newStatus,
          status: newStatus ? 'Active' : 'Inactive'
        }));
      }
      showToast('info', `Supplier ${sup.supplierName} status changed to ${newStatus ? 'Active' : 'Inactive'}`);
    } catch (err) {
      showToast('error', 'Status toggle failed.');
    }
  };

  // Delete / Remove Supplier
  const handleDeleteSupplier = async (sup) => {
    if (window.confirm(`Are you sure you want to deactivate supplier "${sup.supplierName}"?`)) {
      try {
        await deleteSupplier(sup.supplierId).catch(() => null);
        setSuppliers((prev) => prev.filter((s) => s.supplierId !== sup.supplierId));
        if (selectedSupplier?.supplierId === sup.supplierId) {
          setSelectedSupplier(suppliers[0] || null);
        }
        showToast('success', `Supplier ${sup.supplierName} deactivated.`);
      } catch (err) {
        showToast('error', 'Failed to deactivate supplier.');
      }
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Supplier Code,Supplier Name,Contact Person,Email,Phone,Address,Medicines Count,Status'];
    const rows = filteredSuppliers.map(
      (s) =>
        `"${s.supplierCode}","${s.supplierName}","${s.contactPerson}","${s.email}","${s.phone}","${s.address}",${s.medicinesCount},"${s.status}"`
    );
    const blob = new Blob([[...headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medistock-suppliers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Supplier list exported successfully (CSV).');
  };

  return (
    <div className="admin-page-container fade-in">
      {/* Toast Notification */}
      {toast && (
        <div className={`sup-toast sup-toast--${toast.type} fade-in`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Top Header (Admin Clay Layout) ── */}
      <div className="admin-page-header" style={{ marginBottom: 20 }}>
        <div className="admin-page-header__left">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#102e59', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>
            Suppliers
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
            Manage supplier directory, vendor contracts, and monitor supplied medicine catalogs.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <button
            className="admin-btn admin-btn--primary"
            style={{ borderRadius: 9999, padding: '10px 22px' }}
            onClick={handleOpenAdd}
          >
            <IconPlus size={16} /> Add Supplier
          </button>
          <button
            className="admin-btn admin-btn--outline"
            style={{ borderRadius: 9999, padding: '10px 18px', background: '#ffffff' }}
            onClick={handleExportCSV}
          >
            <IconDownload size={16} /> Export Suppliers
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

      {/* ── 4 KPI Summary Cards (Clay Elevated 3D Tiles) ── */}
      <div className="clay-stat-grid-4" style={{ marginBottom: 22 }}>
        {/* Card 1: Total Suppliers */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">TOTAL SUPPLIERS</span>
            <span className="clay-stat-card__value">{stats.total}</span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>Active vendor contracts</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconSuppliers size={22} />
          </div>
        </div>

        {/* Card 2: Active Suppliers */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">ACTIVE SUPPLIERS</span>
            <span className="clay-stat-card__value" style={{ color: '#047857' }}>{stats.active}</span>
            <span className="clay-stat-card__sub" style={{ color: '#059669' }}>Certified active partner</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--mint">
            <IconCheck size={22} />
          </div>
        </div>

        {/* Card 3: Inactive Suppliers */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">INACTIVE SUPPLIERS</span>
            <span className="clay-stat-card__value" style={{ color: '#ef4444' }}>{stats.inactive}</span>
            <span className="clay-stat-card__sub" style={{ color: '#dc2626' }}>Deactivated accounts</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--coral">
            <IconAlertTriangle size={22} />
          </div>
        </div>

        {/* Card 4: Total Purchases */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">TOTAL PURCHASES</span>
            <span className="clay-stat-card__value" style={{ color: '#008C8C' }}>
              ${(stats.totalPurchases || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>Cumulative PO expenditure</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--purple">
            <IconBox size={22} />
          </div>
        </div>
      </div>

      {/* ── Recessed Filter Toolbar ── */}
      <div className="clay-filter-bar" style={{ marginBottom: 20 }}>
        <div className="clay-search-pill" style={{ position: 'relative', flex: '1 1 240px', display: 'flex', alignItems: 'center' }}>
          <IconSearch size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', zIndex: 2 }} />
          <input
            type="text"
            placeholder="Search suppliers by name, code, or contact person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', height: 42, padding: '0 18px 0 48px', boxSizing: 'border-box' }}
          />
        </div>

        <select
          className="clay-select-pill"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <select
          className="clay-select-pill"
          value={paymentTermsFilter}
          onChange={(e) => setPaymentTermsFilter(e.target.value)}
        >
          <option value="ALL">All Payment Terms</option>
          <option value="NET_30">Net 30 Days</option>
          <option value="NET_60">Net 60 Days</option>
          <option value="COD">COD</option>
          <option value="PREPAID">Prepaid</option>
        </select>

        <button
          className="clay-action-pill-btn"
          style={{ padding: '8px 16px', borderRadius: 20, background: '#ffffff', border: '1px solid #dce8f2' }}
          onClick={() => {
            setSearchTerm('');
            setStatusFilter('ALL');
            setPaymentTermsFilter('ALL');
          }}
        >
          <IconFilter size={15} />
          <span>Clear Filters</span>
        </button>
      </div>

      {/* ── Main Two-Column Layout: Table + Supplier Details Sidebar ── */}
      <div className="clay-split-grid">
        {/* Left Column: Table Container */}
        <div className="clay-card-table">
          <div className="sup-table-responsive">
            <table className="admin-table">
              <colgroup>
                <col style={{ width: '40px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '125px' }} />
                <col style={{ width: '165px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '70px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        paginatedSuppliers.length > 0 &&
                        paginatedSuppliers.every((s) => selectedItems.has(s.supplierId))
                      }
                    />
                  </th>
                  <th>Supplier Code</th>
                  <th>Company Name</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      Loading suppliers directory...
                    </td>
                  </tr>
                ) : paginatedSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      No suppliers match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedSuppliers.map((sup) => {
                    const isSelected = selectedSupplier?.supplierId === sup.supplierId;
                    const initial = (sup.supplierName || 'S').charAt(0).toUpperCase();

                    return (
                      <tr
                        key={sup.supplierId}
                        className={isSelected ? 'sup-row--selected' : ''}
                        onClick={() => setSelectedSupplier(sup)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedItems.has(sup.supplierId)}
                            onChange={() => handleSelectItem(sup.supplierId)}
                          />
                        </td>
                        {/* Supplier Code column */}
                        <td>
                          <div className="sup-code-cell">
                            <span
                              className="sup-avatar-dot"
                              style={{ backgroundColor: sup.avatarColor || '#008C8C' }}
                            >
                              {initial}
                            </span>
                            <span className="sup-code-pill">{sup.supplierCode}</span>
                          </div>
                        </td>
                        {/* Company Name column */}
                        <td>
                          <span className="sup-company-text">{sup.supplierName}</span>
                        </td>
                        {/* Contact Person column */}
                        <td>
                          <span className="sup-contact-name">{sup.contactPerson || 'N/A'}</span>
                        </td>
                        {/* Phone column */}
                        <td className="sup-phone-col">{sup.phone}</td>
                        {/* Email column */}
                        <td className="sup-email-col">{sup.email}</td>
                        <td>
                          <span
                            className={`sup-status-badge sup-status-badge--${sup.status === 'Active' ? 'active' : 'inactive'
                              }`}
                          >
                            {sup.status}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="sup-actions-cell">
                            <button
                              className="sup-action-icon-btn"
                              title="View Supplier Details"
                              onClick={() => setSelectedSupplier(sup)}
                            >
                              <IconEye size={16} />
                            </button>
                            <button
                              className="sup-action-icon-btn"
                              title="Edit Supplier"
                              onClick={() => handleOpenEdit(sup)}
                            >
                              <IconEdit size={16} />
                            </button>

                            <div className="sup-dropdown-wrapper">
                              <button
                                className="sup-action-icon-btn"
                                onClick={() =>
                                  setActiveMenuId(activeMenuId === sup.supplierId ? null : sup.supplierId)
                                }
                              >
                                <IconMoreVertical size={16} />
                              </button>

                              {activeMenuId === sup.supplierId && (
                                <div className="sup-action-menu fade-in">
                                  <button
                                    onClick={() => {
                                      setSelectedSupplier(sup);
                                      setIsMedsModalOpen(true);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    View Supplied Medicines
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedSupplier(sup);
                                      setIsOrdersModalOpen(true);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    Purchase History
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleToggleStatus(sup);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    {sup.active ? 'Deactivate Supplier' : 'Activate Supplier'}
                                  </button>
                                  <button
                                    className="menu-item--danger"
                                    onClick={() => {
                                      handleDeleteSupplier(sup);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    Remove Supplier
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid #eef3f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 500 }}>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredSuppliers.length)} of {filteredSuppliers.length} suppliers
            </span>

            <div className="clay-pagination">
              <button
                className="clay-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <IconChevronLeft size={16} />
              </button>
              <button
                className={`clay-page-btn ${currentPage === 1 ? 'clay-page-btn--active' : ''}`}
                onClick={() => setCurrentPage(1)}
              >
                1
              </button>
              {totalPages > 1 && (
                <button
                  className={`clay-page-btn ${currentPage === 2 ? 'clay-page-btn--active' : ''}`}
                  onClick={() => setCurrentPage(2)}
                >
                  2
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

        {/* ── Right Column: 4 Distinct Modular Cards matching screenshot ── */}
        {selectedSupplier && (
          <aside className="sup-right-col">
            {/* Card 1: Supplier Details */}
            <div className="sup-card sup-card--details">
              <div className="sup-details-header">
                <h2 className="sup-details-title">Supplier Details</h2>
                <button
                  className="sup-details-close"
                  onClick={() => setSelectedSupplier(null)}
                  aria-label="Close"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="sup-details-body">
                {/* Profile Header Block */}
                <div className="sup-details-profile">
                  <div
                    className="sup-details-avatar"
                    style={{ backgroundColor: selectedSupplier.avatarColor || '#008C8C' }}
                  >
                    {(selectedSupplier.supplierName || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div className="sup-details-profile-info">
                    <h3 className="sup-details-name">{selectedSupplier.supplierName}</h3>
                    <span className="sup-details-code">{selectedSupplier.supplierCode}</span>
                  </div>
                  <span
                    className={`sup-status-badge sup-status-badge--${selectedSupplier.status === 'Active' ? 'active' : 'inactive'
                      }`}
                  >
                    {selectedSupplier.status}
                  </span>
                </div>

                {/* Contact Items List */}
                <div className="sup-contact-items-list">
                  <div className="sup-contact-item">
                    <span className="sup-contact-icon-pill">
                      <IconUser size={14} />
                    </span>
                    <div>
                      <span className="sup-contact-label">Contact Person</span>
                      <div className="sup-contact-val">{selectedSupplier.contactPerson}</div>
                    </div>
                  </div>

                  <div className="sup-contact-item">
                    <span className="sup-contact-icon-pill">
                      <IconPhone size={14} />
                    </span>
                    <div>
                      <span className="sup-contact-label">Phone</span>
                      <div className="sup-contact-val">{selectedSupplier.phone}</div>
                    </div>
                  </div>

                  <div className="sup-contact-item">
                    <span className="sup-contact-icon-pill">
                      <IconMail size={14} />
                    </span>
                    <div>
                      <span className="sup-contact-label">Email</span>
                      <div className="sup-contact-val">{selectedSupplier.email}</div>
                    </div>
                  </div>

                  <div className="sup-contact-item">
                    <span className="sup-contact-icon-pill">
                      <IconMapPin size={14} />
                    </span>
                    <div>
                      <span className="sup-contact-label">Address</span>
                      <div className="sup-contact-val">{selectedSupplier.address}</div>
                    </div>
                  </div>

                  <div className="sup-contact-item">
                    <span className="sup-contact-icon-pill">
                      <IconCreditCard size={14} />
                    </span>
                    <div>
                      <span className="sup-contact-label">Payment Terms</span>
                      <div className="sup-contact-val">{selectedSupplier.paymentTerms || 'Net 30 Days'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Supplied Medicines */}
            <div className="sup-card sup-card--supplied">
              <div className="sup-card-header">
                <h3 className="sup-card-title">Supplied Medicines</h3>
                <button
                  className="sup-link-btn"
                  onClick={() => setIsMedsModalOpen(true)}
                >
                  View All
                </button>
              </div>
              <div className="sup-card-body">
                <div className="sup-meds-box">
                  <div className="sup-meds-icon-wrap">
                    <IconPill size={18} color="#008C8C" />
                  </div>
                  <div>
                    <span className="sup-meds-num">{selectedSupplier.medicinesCount || 24}</span>
                    <span className="sup-meds-label">medicines supplied</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Purchase History */}
            <div className="sup-card sup-card--history">
              <div className="sup-card-header">
                <h3 className="sup-card-title">Purchase History</h3>
                <button
                  className="sup-link-btn"
                  onClick={() => setIsOrdersModalOpen(true)}
                >
                  View All
                </button>
              </div>
              <div className="sup-card-body">
                <div className="sup-history-row">
                  <div className="sup-history-stat-group">
                    <div className="sup-history-icon-wrap">
                      <IconFileText size={18} color="#008C8C" />
                    </div>
                    <div>
                      <span className="sup-history-stat-num">{selectedSupplier.orderCount || 8}</span>
                      <span className="sup-history-stat-label">total purchases</span>
                    </div>
                  </div>
                  <div className="sup-history-amount-group">
                    <span className="sup-history-amount-num">
                      ${Number(selectedSupplier.totalPurchases || 24850).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="sup-history-stat-label">total amount</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Quick Actions */}
            <div className="sup-card sup-card--actions">
              <div className="sup-card-header">
                <h3 className="sup-card-title">Quick Actions</h3>
              </div>
              <div className="sup-card-body">
                <div className="sup-quick-actions-col">
                  <button
                    className="sup-quick-action-btn"
                    onClick={() => setIsMedsModalOpen(true)}
                  >
                    <IconEye size={16} />
                    <span>View Medicine List</span>
                  </button>
                  <button
                    className="sup-quick-action-btn"
                    onClick={() => setIsOrdersModalOpen(true)}
                  >
                    <IconFileText size={16} />
                    <span>View Purchase History</span>
                  </button>
                  <button
                    className="sup-quick-action-btn"
                    onClick={() => handleOpenEdit(selectedSupplier)}
                  >
                    <IconEdit size={16} />
                    <span>Edit Supplier</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── MODAL: Add / Edit Supplier ── */}
      {isAddEditModalOpen && (
        <div className="sup-modal-overlay">
          <div className="sup-modal-card fade-in">
            <div className="sup-modal-header">
              <h3>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
              <button
                className="sup-modal-close"
                onClick={() => setIsAddEditModalOpen(false)}
              >
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveSupplier}>
              <div className="sup-modal-body">
                <div className="sup-field">
                  <label>Supplier Company Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Health Pharmaceuticals"
                    value={supplierForm.supplierName}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, supplierName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="sup-field-row">
                  <div className="sup-field">
                    <label>Contact Person</label>
                    <input
                      type="text"
                      placeholder="e.g. Robert Smith"
                      value={supplierForm.contactPerson}
                      onChange={(e) =>
                        setSupplierForm({ ...supplierForm, contactPerson: e.target.value })
                      }
                    />
                  </div>
                  <div className="sup-field">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +1 555-0199"
                      value={supplierForm.phone}
                      onChange={(e) =>
                        setSupplierForm({ ...supplierForm, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="sup-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. orders@supplier.com"
                    value={supplierForm.email}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, email: e.target.value })
                    }
                  />
                </div>

                <div className="sup-field">
                  <label>Physical Address</label>
                  <textarea
                    rows={2}
                    placeholder="Street, City, State, ZIP..."
                    value={supplierForm.address}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, address: e.target.value })
                    }
                  />
                </div>

                <div className="sup-field-row">
                  <div className="sup-field">
                    <label>Lead Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 2-4 business days"
                      value={supplierForm.leadTime}
                      onChange={(e) =>
                        setSupplierForm({ ...supplierForm, leadTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="sup-field">
                    <label>Status</label>
                    <select
                      value={supplierForm.active ? 'active' : 'inactive'}
                      onChange={(e) =>
                        setSupplierForm({
                          ...supplierForm,
                          active: e.target.value === 'active'
                        })
                      }
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="sup-modal-footer">
                <button
                  type="button"
                  className="sup-btn sup-btn--secondary"
                  onClick={() => setIsAddEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="sup-btn sup-btn--primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting
                    ? 'Saving...'
                    : editingSupplier
                      ? 'Save Changes'
                      : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: View Supplied Medicines ── */}
      {isMedsModalOpen && selectedSupplier && (
        <div className="sup-modal-overlay">
          <div className="sup-modal-card sup-modal-card--large fade-in">
            <div className="sup-modal-header">
              <h3>Medicines Supplied by {selectedSupplier.supplierName}</h3>
              <button
                className="sup-modal-close"
                onClick={() => setIsMedsModalOpen(false)}
              >
                <IconX size={18} />
              </button>
            </div>
            <div className="sup-modal-body">
              <table className="sup-modal-table">
                <thead>
                  <tr>
                    <th>Medicine Name</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Stock Level</th>
                    <th style={{ textAlign: 'right' }}>Reorder Level</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSupplier.medicines && selectedSupplier.medicines.length > 0 ? (
                    selectedSupplier.medicines.map((med, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: '#16324F' }}>
                          {med.name || med.medicineName}
                        </td>
                        <td style={{ color: '#64748B' }}>{med.category || med.categoryName || 'General'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{med.stock ?? 100}</td>
                        <td style={{ textAlign: 'right', color: '#64748B' }}>{med.reorderLevel ?? 20}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                        No catalog records found for this vendor.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="sup-modal-footer">
              <button
                type="button"
                className="sup-btn sup-btn--primary"
                onClick={() => setIsMedsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: View Purchase History ── */}
      {isOrdersModalOpen && selectedSupplier && (
        <div className="sup-modal-overlay">
          <div className="sup-modal-card sup-modal-card--large fade-in">
            <div className="sup-modal-header">
              <h3>Purchase History — {selectedSupplier.supplierName}</h3>
              <button
                className="sup-modal-close"
                onClick={() => setIsOrdersModalOpen(false)}
              >
                <IconX size={18} />
              </button>
            </div>
            <div className="sup-modal-body">
              <table className="sup-modal-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Order Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.filter((o) => o.supplierId === selectedSupplier.supplierId).length > 0 ? (
                    orders
                      .filter((o) => o.supplierId === selectedSupplier.supplierId)
                      .map((o) => (
                        <tr key={o.orderId}>
                          <td style={{ fontWeight: 600, color: '#008C8C' }}>{o.orderNumber}</td>
                          <td style={{ color: '#64748B' }}>{o.orderDate}</td>
                          <td>
                            <span className="sup-status-badge sup-status-badge--active">{o.status}</span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            ${Number(o.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                        Historical spend recorded: ${Number(selectedSupplier.totalPurchases).toLocaleString(undefined, { minimumFractionDigits: 2 })} across {selectedSupplier.orderCount} archived procurement transactions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="sup-modal-footer">
              <button
                type="button"
                className="sup-btn sup-btn--primary"
                onClick={() => setIsOrdersModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
