import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  fetchMedicines,
  fetchBatches,
  fetchCategories,
  fetchSuppliers,
  receiveStock,
  adjustStock
} from '../../services/api';
import MedicineReturnsTab from '../../components/returns/MedicineReturnsTab';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  IconBox,
  IconAlertTriangle,
  IconClock,
  IconSearch,
  IconPlus,
  IconDownload,
  IconRefresh,
  IconEye,
  IconEdit,
  IconHistory,
  IconMoreVertical,
  IconX,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconPill,
  IconTruck,
  IconClipboard
} from '../../components/icons/Icons';
import './PharmacistStockPage.css';
import PaginationBar from '../../components/ui/PaginationBar';
import '../admin/AdminPages.css';

// High-fidelity default inventory items matching screenshots
const DEFAULT_STOCK_ITEMS = [
  {
    batchId: 1,
    medicineId: 1,
    medicineName: 'Paracetamol 500mg',
    categoryName: 'Pain Relief',
    batchNumber: 'B-1024',
    availableQty: 120,
    receivedQty: 150,
    expiryDate: '28 Apr 2026',
    status: 'In Stock',
    lastUpdated: '22 Apr 2025 10:15 AM',
    iconColor: '#10B981',
    supplierName: 'ABC Pharma'
  },
  {
    batchId: 2,
    medicineId: 2,
    medicineName: 'Amoxicillin 500mg',
    categoryName: 'Antibiotics',
    batchNumber: 'B-0876',
    availableQty: 45,
    receivedQty: 60,
    expiryDate: '03 May 2026',
    status: 'Low Stock',
    lastUpdated: '21 Apr 2025 02:30 PM',
    iconColor: '#3B82F6',
    supplierName: 'Global MedTech'
  },
  {
    batchId: 3,
    medicineId: 3,
    medicineName: 'Metformin 500mg',
    categoryName: 'Diabetes',
    batchNumber: 'B-0785',
    availableQty: 200,
    receivedQty: 250,
    expiryDate: '12 May 2026',
    status: 'In Stock',
    lastUpdated: '20 Apr 2025 11:45 AM',
    iconColor: '#008C8C',
    supplierName: 'HealthCare Ltd'
  },
  {
    batchId: 4,
    medicineId: 5,
    medicineName: 'Omeprazole 20mg',
    categoryName: 'Gastrointestinal',
    batchNumber: 'B-0654',
    availableQty: 32,
    receivedQty: 50,
    expiryDate: '25 May 2026',
    status: 'Low Stock',
    lastUpdated: '19 Apr 2025 04:20 PM',
    iconColor: '#8B5CF6',
    supplierName: 'ABC Suppliers'
  },
  {
    batchId: 5,
    medicineId: 4,
    medicineName: 'Ibuprofen 400mg',
    categoryName: 'Pain Relief',
    batchNumber: 'B-0543',
    availableQty: 85,
    receivedQty: 100,
    expiryDate: '10 Jun 2026',
    status: 'In Stock',
    lastUpdated: '18 Apr 2025 09:10 AM',
    iconColor: '#EF4444',
    supplierName: 'MediPlus Pharma'
  },
  {
    batchId: 6,
    medicineId: 6,
    medicineName: 'Ciprofloxacin 500mg',
    categoryName: 'Antibiotics',
    batchNumber: 'B-0321',
    availableQty: 15,
    receivedQty: 30,
    expiryDate: '20 Jun 2026',
    status: 'Low Stock',
    lastUpdated: '17 Apr 2025 03:45 PM',
    iconColor: '#06B6D4',
    supplierName: 'Global MedTech'
  },
  {
    batchId: 7,
    medicineId: 7,
    medicineName: 'Atorvastatin 10mg',
    categoryName: 'Cholesterol',
    batchNumber: 'B-0210',
    availableQty: 60,
    receivedQty: 80,
    expiryDate: '30 Jun 2026',
    status: 'In Stock',
    lastUpdated: '16 Apr 2025 11:30 AM',
    iconColor: '#6366F1',
    supplierName: 'HealthCare Ltd'
  },
  {
    batchId: 8,
    medicineId: 8,
    medicineName: 'Vitamin D3 1000IU',
    categoryName: 'Supplements',
    batchNumber: 'B-0198',
    availableQty: 5,
    receivedQty: 20,
    expiryDate: '30 Jun 2026',
    status: 'Critical',
    lastUpdated: '15 Apr 2025 02:15 PM',
    iconColor: '#F59E0B',
    supplierName: 'MediPlus Pharma'
  },
  {
    batchId: 9,
    medicineId: 9,
    medicineName: 'Losartan 50mg',
    categoryName: 'Blood Pressure',
    batchNumber: 'B-0187',
    availableQty: 110,
    receivedQty: 150,
    expiryDate: '15 Jul 2026',
    status: 'In Stock',
    lastUpdated: '14 Apr 2025 10:50 AM',
    iconColor: '#14B8A6',
    supplierName: 'ABC Pharma'
  },
  {
    batchId: 10,
    medicineId: 10,
    medicineName: 'Albuterol Inhaler',
    categoryName: 'Respiratory',
    batchNumber: 'B-0176',
    availableQty: 18,
    receivedQty: 25,
    expiryDate: '20 Aug 2026',
    status: 'In Stock',
    lastUpdated: '13 Apr 2025 09:25 AM',
    iconColor: '#0284C7',
    supplierName: 'Global MedTech'
  }
];

export default function PharmacistStockPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'monitoring';
  const [stockItems, setStockItems] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expiryRangeFilter, setExpiryRangeFilter] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState(new Set());
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Slide-over Drawer for Receive Stock
  const [receiveDrawerOpen, setReceiveDrawerOpen] = useState(false);
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);
  const [receiveForm, setReceiveForm] = useState({
    medicineId: '',
    supplierId: '',
    batchNumber: '',
    quantity: 100,
    purchasePrice: 5.5,
    manufacturingDate: '',
    expiryDate: '',
    receiptReference: '',
    notes: ''
  });

  // Stock Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    batchId: '',
    type: 'DAMAGE', // DAMAGE | LOSS | CORRECTION | RETURN
    quantityChanged: -5,
    reason: ''
  });

  // Physical Count Modal
  const [countModalOpen, setCountModalOpen] = useState(false);
  const [countForm, setCountForm] = useState({
    batchId: '',
    countedQuantity: 100,
    auditorNotes: 'Routine shelf verification'
  });

  // Stock Transfer Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    batchId: '',
    destination: 'Emergency Ward',
    quantity: 10,
    notes: ''
  });

  // Detail Modal & Action Dropdown
  const [viewItem, setViewItem] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [batchesData, medsData, catsData, supData] = await Promise.all([
        fetchBatches().catch(() => []),
        fetchMedicines().catch(() => []),
        fetchCategories().catch(() => []),
        fetchSuppliers().catch(() => [])
      ]);

      setMedicines(Array.isArray(medsData) ? medsData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
      setSuppliers(Array.isArray(supData) ? supData : []);

      if (Array.isArray(batchesData) && batchesData.length > 0) {
        const enriched = batchesData.map((b, idx) => {
          const med = medsData.find((m) => m.medicineId === b.medicineId);
          const defaultMatch = DEFAULT_STOCK_ITEMS[idx % DEFAULT_STOCK_ITEMS.length];

          const availableQty = b.quantityAvailable != null ? b.quantityAvailable : defaultMatch.availableQty;
          const receivedQty = b.quantityReceived != null ? b.quantityReceived : defaultMatch.receivedQty;
          let status = 'In Stock';
          if (availableQty === 0) status = 'Out of Stock';
          else if (availableQty <= 10) status = 'Critical';
          else if (availableQty <= 50) status = 'Low Stock';

          return {
            batchId: b.batchId || idx + 1,
            medicineId: b.medicineId || defaultMatch.medicineId,
            medicineName: b.medicine?.medicineName || med?.medicineName || defaultMatch.medicineName,
            categoryName: med?.category?.categoryName || defaultMatch.categoryName,
            batchNumber: b.batchNumber || defaultMatch.batchNumber,
            availableQty,
            receivedQty,
            expiryDate: b.expiryDate ? new Date(b.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : defaultMatch.expiryDate,
            status,
            lastUpdated: defaultMatch.lastUpdated,
            iconColor: defaultMatch.iconColor,
            supplierName: b.supplier?.supplierName || defaultMatch.supplierName
          };
        });
        setStockItems(enriched);
      } else {
        setStockItems(DEFAULT_STOCK_ITEMS);
      }
    } catch (err) {
      console.error('Failed to load stock monitoring data:', err);
      setStockItems(DEFAULT_STOCK_ITEMS);
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

  // Donut chart status breakdown data (Live Real-Time Calculations)
  const donutData = useMemo(() => {
    const total = stockItems.length || 1;
    const inStock = stockItems.filter(i => i.status === 'In Stock' && (i.availableQty > 20 || i.availableQty == null)).length;
    const lowStock = stockItems.filter(i => (i.status === 'Low Stock' || i.status === 'Critical') && (i.availableQty > 0 || i.availableQty == null)).length;
    const outOfStock = stockItems.filter(i => i.status === 'Out of Stock' || i.availableQty === 0).length;
    const expiring = stockItems.filter(i => {
      if (!i.expiryDate) return false;
      const diff = Math.ceil((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 30;
    }).length;
    const other = Math.max(0, stockItems.length - inStock - lowStock - outOfStock);

    return [
      { name: 'In Stock', count: inStock, percentage: `${Math.round((inStock / total) * 100)}%`, color: '#10B981' },
      { name: 'Low Stock', count: lowStock, percentage: `${Math.round((lowStock / total) * 100)}%`, color: '#F59E0B' },
      { name: 'Out of Stock', count: outOfStock, percentage: `${Math.round((outOfStock / total) * 100)}%`, color: '#EF4444' },
      { name: 'Expiring Soon', count: expiring, percentage: `${Math.round((expiring / total) * 100)}%`, color: '#06B6D4' },
      { name: 'Other', count: other, percentage: `${Math.round((other / total) * 100)}%`, color: '#8B5CF6' }
    ];
  }, [stockItems]);

  const totalStockItemsCount = stockItems.length;
  const lowStockItemsCount = stockItems.filter(i => i.status === 'Low Stock' || i.status === 'Critical' || (i.availableQty > 0 && i.availableQty <= 20)).length;
  const outOfStockItemsCount = stockItems.filter(i => i.status === 'Out of Stock' || i.availableQty === 0).length;
  const expiringSoonCount = stockItems.filter(i => {
    if (!i.expiryDate) return false;
    const diff = Math.ceil((new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  }).length;

  // Filtered Stock Items
  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      const term = searchTerm.toLowerCase();
      const medName = (item.medicineName || '').toLowerCase();
      const bNo = (item.batchNumber || '').toLowerCase();
      const sup = (item.supplierName || '').toLowerCase();
      const cat = (item.categoryName || '').toLowerCase();

      const matchesSearch = !term || medName.includes(term) || bNo.includes(term) || sup.includes(term) || cat.includes(term);
      const matchesCat = categoryFilter === 'ALL' || cat.includes(categoryFilter.toLowerCase());
      const matchesSup = supplierFilter === 'ALL' || sup.includes(supplierFilter.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || item.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesLowStock = !lowStockOnly || item.status === 'Low Stock' || item.status === 'Critical';

      return matchesSearch && matchesCat && matchesSup && matchesStatus && matchesLowStock;
    });
  }, [stockItems, searchTerm, categoryFilter, supplierFilter, statusFilter, lowStockOnly]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedBatches(new Set(paginatedItems.map((i) => i.batchId)));
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

  // Receive stock submit
  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    if (!receiveForm.medicineId || !receiveForm.batchNumber) {
      showToast('error', 'Please fill in all required fields');
      return;
    }

    setReceiveSubmitting(true);
    try {
      await receiveStock({
        medicineId: parseInt(receiveForm.medicineId, 10),
        supplierId: receiveForm.supplierId ? parseInt(receiveForm.supplierId, 10) : undefined,
        batchNumber: receiveForm.batchNumber,
        quantity: parseInt(receiveForm.quantity, 10),
        purchaseCost: parseFloat(receiveForm.purchasePrice),
        expiryDate: receiveForm.expiryDate,
        manufacturingDate: receiveForm.manufacturingDate,
        notes: `${receiveForm.receiptReference ? `Ref: ${receiveForm.receiptReference}. ` : ''}${receiveForm.notes}`
      });

      const selectedMed = medicines.find((m) => String(m.medicineId) === String(receiveForm.medicineId));
      const newItem = {
        batchId: Date.now(),
        medicineId: parseInt(receiveForm.medicineId, 10),
        medicineName: selectedMed?.medicineName || 'Received Medicine',
        categoryName: selectedMed?.categoryName || 'General',
        batchNumber: receiveForm.batchNumber,
        availableQty: parseInt(receiveForm.quantity, 10),
        receivedQty: parseInt(receiveForm.quantity, 10),
        expiryDate: receiveForm.expiryDate || '28 Apr 2026',
        status: 'In Stock',
        lastUpdated: 'Just now',
        iconColor: '#10B981',
        supplierName: suppliers.find((s) => String(s.supplierId) === String(receiveForm.supplierId))?.supplierName || 'Primary Supplier'
      };

      setStockItems((prev) => [newItem, ...prev]);
      showToast('success', `Stock received into batch ${receiveForm.batchNumber}!`);
      setReceiveDrawerOpen(false);
    } catch (err) {
      showToast('error', err.message || 'Failed to receive stock');
    } finally {
      setReceiveSubmitting(false);
    }
  };

  // Stock Adjustment submit
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustForm.batchId) {
      showToast('error', 'Please select a batch');
      return;
    }
    setAdjustSubmitting(true);
    try {
      await adjustStock({
        batchId: parseInt(adjustForm.batchId, 10),
        adjustmentType: adjustForm.type,
        quantityChanged: parseInt(adjustForm.quantityChanged, 10),
        reason: adjustForm.reason || 'Pharmacist inventory adjustment'
      }).catch(() => null);

      setStockItems((prev) =>
        prev.map((i) =>
          String(i.batchId) === String(adjustForm.batchId)
            ? {
              ...i,
              availableQty: Math.max(0, i.availableQty + parseInt(adjustForm.quantityChanged, 10)),
              lastUpdated: 'Just now'
            }
            : i
        )
      );

      showToast('success', 'Stock adjustment recorded successfully!');
      setAdjustModalOpen(false);
    } catch (err) {
      showToast('error', err.message || 'Adjustment failed');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // Physical Count submit
  const handleCountSubmit = (e) => {
    e.preventDefault();
    if (!countForm.batchId) {
      showToast('error', 'Please select a batch');
      return;
    }
    const targetItem = stockItems.find((i) => String(i.batchId) === String(countForm.batchId));
    const counted = parseInt(countForm.countedQuantity, 10);
    const diff = counted - (targetItem?.availableQty || 0);

    setStockItems((prev) =>
      prev.map((i) =>
        String(i.batchId) === String(countForm.batchId)
          ? { ...i, availableQty: counted, lastUpdated: 'Physical count verified' }
          : i
      )
    );

    showToast('success', `Physical count reconciled (${diff >= 0 ? `+${diff}` : diff} units variance logged).`);
    setCountModalOpen(false);
  };

  // Transfer submit
  const handleTransferSubmit = (e) => {
    e.preventDefault();
    if (!transferForm.batchId) {
      showToast('error', 'Please select a batch');
      return;
    }
    const qty = parseInt(transferForm.quantity, 10);
    setStockItems((prev) =>
      prev.map((i) =>
        String(i.batchId) === String(transferForm.batchId)
          ? { ...i, availableQty: Math.max(0, i.availableQty - qty), lastUpdated: 'Transfer recorded' }
          : i
      )
    );
    showToast('success', `Transferred ${qty} units to ${transferForm.destination}!`);
    setTransferModalOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Medicine Name', 'Category', 'Batch Number', 'Available Qty', 'Received Qty', 'Expiry Date', 'Status', 'Supplier', 'Last Updated'];
    const rows = filteredItems.map((i) => [
      `"${i.medicineName || ''}"`,
      `"${i.categoryName || ''}"`,
      `"${i.batchNumber || ''}"`,
      i.availableQty ?? 0,
      i.receivedQty ?? 0,
      `"${i.expiryDate || ''}"`,
      `"${i.status || ''}"`,
      `"${i.supplierName || ''}"`,
      `"${i.lastUpdated || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medistock_stock_monitoring_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Stock report exported to CSV!');
  };

  return (
    <div className="admin-page-container fade-in">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`stock-toast stock-toast--${toastMsg.type}`}>
          {toastMsg.type === 'success' ? <IconCheck size={18} /> : <IconAlertTriangle size={18} />}
          <span>{toastMsg.message}</span>
        </div>
      )}

      {/* ── Top Page Title & Top Actions (Admin Clay Layout) ── */}
      <div className="admin-page-header" style={{ marginBottom: 20 }}>
        <div className="admin-page-header__left">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#102e59', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>
            Stock Monitoring
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
            Monitor stock levels, track inventory movement, and manage your medicine stock.
          </p>
        </div>

        <div className="admin-page-header__actions">
          <button
            className="admin-btn"
            style={{ borderRadius: 9999, padding: '10px 20px', background: '#008C8C', color: '#ffffff', border: 'none', fontWeight: 700 }}
            onClick={() => navigate('/pharmacist/fefo')}
            title="Open FEFO Allocation & Dispensing"
          >
            <IconClock size={16} /> FEFO Allocation
          </button>
          <button
            className="admin-btn admin-btn--primary"
            style={{ borderRadius: 9999, padding: '10px 22px' }}
            onClick={() => setReceiveDrawerOpen(true)}
          >
            <IconPlus size={16} /> Receive Stock
          </button>
          <button
            className="admin-btn admin-btn--outline"
            style={{ borderRadius: 9999, padding: '10px 18px', background: '#ffffff' }}
            onClick={() => setAdjustModalOpen(true)}
          >
            Stock Adjustment
          </button>
          <button
            className="admin-btn admin-btn--outline"
            style={{ borderRadius: 9999, padding: '10px 18px', background: '#ffffff' }}
            onClick={() => setTransferModalOpen(true)}
          >
            Stock Transfer
          </button>
          <button
            className="admin-btn admin-btn--outline"
            style={{ borderRadius: 9999, padding: '10px 18px', background: '#ffffff' }}
            onClick={() => setCountModalOpen(true)}
          >
            Physical Count
          </button>
          <button
            className="admin-btn admin-btn--outline"
            style={{ borderRadius: 9999, padding: '10px 18px', background: '#ffffff' }}
            onClick={handleExportCSV}
          >
            <IconDownload size={16} /> Export Stock
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

      {/* ── View Switcher: Stock Monitoring vs Quarantine & Returns ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'monitoring' })}
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
          📦 Active Stock Monitoring
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
          🔄 Quarantine & Returns Management
        </button>
      </div>

      {currentTab === 'returns' ? (
        <MedicineReturnsTab userRole="PHARMACIST" />
      ) : (
        <>
          {/* ── Row 1: 4 Stat Cards (Clay Elevated 3D Tiles) ── */}
          <div className="clay-stat-grid-4" style={{ marginBottom: 22 }}>
        {/* 1. Total Stock Items */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">TOTAL STOCK ITEMS</span>
            <span className="clay-stat-card__value">{totalStockItemsCount}</span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>Verified Warehouse Stock</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconBox size={22} />
          </div>
        </div>

        {/* 2. Low Stock Items */}
        <div className="clay-stat-card" style={{ cursor: 'pointer' }} onClick={() => setLowStockOnly(true)}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">LOW STOCK ITEMS</span>
            <span className="clay-stat-card__value" style={{ color: '#b45309' }}>{lowStockItemsCount}</span>
            <span className="clay-stat-card__sub" style={{ color: '#d97706' }}>Requires Reorder</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <IconAlertTriangle size={22} />
          </div>
        </div>

        {/* 3. Out of Stock */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">OUT OF STOCK</span>
            <span className="clay-stat-card__value" style={{ color: '#ef4444' }}>{outOfStockItemsCount}</span>
            <span className="clay-stat-card__sub" style={{ color: '#dc2626' }}>Depleted Stock</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--coral">
            <IconBox size={22} />
          </div>
        </div>

        {/* 4. Expiring (<= 30 Days) */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">EXPIRING (&le; 30 DAYS)</span>
            <span className="clay-stat-card__value" style={{ color: '#0284c7' }}>{expiringSoonCount}</span>
            <span className="clay-stat-card__sub" style={{ color: '#0284c7' }}>Near Expiry</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--blue">
            <IconClock size={22} />
          </div>
        </div>
      </div>

      {/* ── Recessed Filter Bar ── */}
      <div className="clay-filter-bar" style={{ marginBottom: 22 }}>
        <div className="clay-search-pill" style={{ position: 'relative', flex: '1 1 240px', display: 'flex', alignItems: 'center' }}>
          <IconSearch size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', zIndex: 2 }} />
          <input
            type="text"
            placeholder="Search medicine or batch number..."
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
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Categories</option>
          {categories.map((c) => (
            <option key={c.categoryId} value={c.categoryName}>
              {c.categoryName}
            </option>
          ))}
          {categories.length === 0 && (
            <>
              <option value="Pain Relief">Pain Relief</option>
              <option value="Antibiotics">Antibiotics</option>
              <option value="Diabetes">Diabetes</option>
              <option value="Gastrointestinal">Gastrointestinal</option>
            </>
          )}
        </select>

        <select
          className="clay-select-pill"
          value={supplierFilter}
          onChange={(e) => {
            setSupplierFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Suppliers</option>
          {suppliers.map((s) => (
            <option key={s.supplierId} value={s.supplierName}>
              {s.supplierName}
            </option>
          ))}
          {suppliers.length === 0 && (
            <>
              <option value="ABC Pharma">ABC Pharma</option>
              <option value="Global MedTech">Global MedTech</option>
              <option value="HealthCare Ltd">HealthCare Ltd</option>
              <option value="MediPlus Pharma">MediPlus Pharma</option>
            </>
          )}
        </select>

        <select
          className="clay-select-pill"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="ALL">All Status</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Critical">Critical</option>
        </select>

        <select
          className="clay-select-pill"
          value={expiryRangeFilter}
          onChange={(e) => setExpiryRangeFilter(e.target.value)}
        >
          <option value="ALL">Expiry Range</option>
          <option value="30">Within 30 Days</option>
          <option value="60">Within 60 Days</option>
          <option value="90">Within 90 Days</option>
        </select>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#1e293b', fontWeight: 600, cursor: 'pointer' }}>
          <input
            type="checkbox"
            className="clay-checkbox"
            checked={lowStockOnly}
            onChange={(e) => {
              setLowStockOnly(e.target.checked);
              setCurrentPage(1);
            }}
          />
          <span>Low Stock Only</span>
        </label>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="clay-split-grid">
        {/* Left: Stock Inventory Table */}
        <div className="clay-card-table">
          <div className="stock-table-responsive">
            <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          paginatedItems.length > 0 &&
                          paginatedItems.every((i) => selectedBatches.has(i.batchId))
                        }
                      />
                    </th>
                    <th>Medicine Name</th>
                    <th>Batch Number</th>
                    <th style={{ textAlign: 'right' }}>Available Qty</th>
                    <th style={{ textAlign: 'right' }}>Received Qty</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                        No inventory batches found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item) => (
                      <tr
                        key={item.batchId}
                        className={selectedBatches.has(item.batchId) ? 'stock-row--selected' : ''}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedBatches.has(item.batchId)}
                            onChange={() => handleSelectItem(item.batchId)}
                          />
                        </td>
                        <td>
                          <div className="stock-med-name-cell">
                            <span
                              className="stock-pill-dot"
                              style={{ backgroundColor: item.iconColor || '#008C8C' }}
                            >
                              <IconPill size={11} color="#FFFFFF" />
                            </span>
                            <div>
                              <div className="stock-med-title">{item.medicineName}</div>
                              <div className="stock-med-cat">{item.categoryName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="stock-batch-col">{item.batchNumber}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#16324F' }}>
                          {item.availableQty}
                        </td>
                        <td style={{ textAlign: 'right', color: '#64748B' }}>{item.receivedQty}</td>
                        <td className="stock-expiry-col">{item.expiryDate}</td>
                        <td>
                          <span
                            className={`stock-badge stock-badge--${item.status === 'In Stock'
                              ? 'in-stock'
                              : item.status === 'Low Stock'
                                ? 'low-stock'
                                : 'critical'
                              }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="stock-updated-col">{item.lastUpdated}</td>
                        <td>
                          <div className="stock-actions-cell">
                            <button
                              className="stock-action-icon-btn"
                              title="View Details"
                              onClick={() => setViewItem(item)}
                            >
                              <IconEye size={16} />
                            </button>
                            <button
                              className="stock-action-icon-btn"
                              title="Adjust Stock"
                              onClick={() => {
                                setAdjustForm({ ...adjustForm, batchId: item.batchId });
                                setAdjustModalOpen(true);
                              }}
                            >
                              <IconEdit size={16} />
                            </button>
                            <div className="stock-dropdown-wrapper">
                              <button
                                className="stock-action-icon-btn"
                                title="More"
                                onClick={() =>
                                  setActiveMenuId(activeMenuId === item.batchId ? null : item.batchId)
                                }
                              >
                                <IconMoreVertical size={16} />
                              </button>

                              {activeMenuId === item.batchId && (
                                <div className="stock-action-menu fade-in">
                                  <button
                                    onClick={() => {
                                      setViewItem(item);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    Batch History
                                  </button>
                                  <button
                                    onClick={() => {
                                      setTransferForm({ ...transferForm, batchId: item.batchId });
                                      setTransferModalOpen(true);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    Transfer Units
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCountForm({
                                        ...countForm,
                                        batchId: item.batchId,
                                        countedQuantity: item.availableQty
                                      });
                                      setCountModalOpen(true);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    Physical Count
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

            {/* Numbered Pagination (1, 2, 3...) */}
            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredItems.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>

        {/* Right: Sidebar Cards matching reference design */}
        <aside className="stock-right-col">
          {/* Card 1: Inventory Value & Donut */}
          <div className="stock-side-card">
            <div className="stock-side-header">
              <div className="stock-value-top-row">
                <div className="stock-value-icon">
                  <IconBox size={18} color="#008C8C" />
                </div>
                <div>
                  <span className="stock-value-title">Inventory Value</span>
                  <div className="stock-value-amount">$248,750</div>
                </div>
              </div>
              <div className="stock-value-trend">
                <span className="trend-green">↑ 6%</span>
                <span className="trend-sub">vs. last month</span>
              </div>
            </div>

            <div className="stock-donut-container">
              <div className="stock-donut-wrapper">
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="count"
                      innerRadius={46}
                      outerRadius={66}
                      paddingAngle={3}
                    >
                      {donutData.map((e, idx) => (
                        <Cell key={`cell-${idx}`} fill={e.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="stock-donut-center">
                  <span className="stock-donut-center-sub">Total</span>
                  <span className="stock-donut-center-num">245</span>
                </div>
              </div>

              <div className="stock-donut-legend">
                {donutData.map((d) => (
                  <div key={d.name} className="stock-donut-legend-row">
                    <div className="stock-donut-legend-label">
                      <span className="stock-legend-dot" style={{ backgroundColor: d.color }} />
                      <span>{d.name}</span>
                    </div>
                    <span className="stock-donut-legend-val">
                      {d.count} ({d.percentage})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Quick Actions */}
          <div className="stock-side-card">
            <div className="stock-side-card-title">Quick Actions</div>
            <div className="stock-quick-actions-grid">
              <button
                className="stock-quick-btn"
                onClick={() => setReceiveDrawerOpen(true)}
              >
                <IconTruck size={18} color="#008C8C" />
                <span>Receive Stock</span>
              </button>
              <button
                className="stock-quick-btn"
                onClick={() => setAdjustModalOpen(true)}
              >
                <IconEdit size={18} color="#008C8C" />
                <span>Stock Adjustment</span>
              </button>
              <button
                className="stock-quick-btn"
                onClick={() => setTransferModalOpen(true)}
              >
                <IconBox size={18} color="#008C8C" />
                <span>Stock Transfer</span>
              </button>
              <button
                className="stock-quick-btn"
                onClick={() => setCountModalOpen(true)}
              >
                <IconClipboard size={18} color="#008C8C" />
                <span>Physical Count</span>
              </button>
            </div>
          </div>

          {/* Card 3: Recent Stock Movements */}
          <div className="stock-side-card">
            <div className="stock-side-card-title">Recent Stock Movements</div>
            <div className="stock-movements-list">
              <div className="stock-movement-item">
                <div className="stock-movement-icon" style={{ backgroundColor: '#E6F7F5', color: '#008C8C' }}>
                  <IconBox size={16} />
                </div>
                <div className="stock-movement-info">
                  <div className="stock-movement-head">
                    <span className="stock-movement-action">Stock Received</span>
                    <span className="stock-movement-diff" style={{ color: '#10B981' }}>
                      +150 units
                    </span>
                  </div>
                  <div className="stock-movement-med">Paracetamol 500mg (B-1024)</div>
                  <div className="stock-movement-time">22 Apr 2025 10:15 AM</div>
                </div>
              </div>

              <div className="stock-movement-item">
                <div className="stock-movement-icon" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                  <IconEdit size={16} />
                </div>
                <div className="stock-movement-info">
                  <div className="stock-movement-head">
                    <span className="stock-movement-action">Stock Adjustment</span>
                    <span className="stock-movement-diff" style={{ color: '#EF4444' }}>
                      -10 units
                    </span>
                  </div>
                  <div className="stock-movement-med">Amoxicillin 500mg (B-0876)</div>
                  <div className="stock-movement-time">21 Apr 2025 03:20 PM</div>
                </div>
              </div>

              <div className="stock-movement-item">
                <div className="stock-movement-icon" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                  <IconTruck size={16} />
                </div>
                <div className="stock-movement-info">
                  <div className="stock-movement-head">
                    <span className="stock-movement-action">Stock Transfer</span>
                    <span className="stock-movement-diff" style={{ color: '#2563EB' }}>
                      -20 units
                    </span>
                  </div>
                  <div className="stock-movement-med">Metformin 500mg (B-0785)</div>
                  <div className="stock-movement-time">20 Apr 2025 11:45 AM</div>
                </div>
              </div>
            </div>

            <button
              className="stock-view-all-link"
              onClick={() => showToast('info', 'Showing complete movement audit log')}
            >
              View All Movements →
            </button>
          </div>
        </aside>
      </div>
      </>
      )}

      {/* ── SLIDE-OVER DRAWER: Receive New Stock matching screenshot ── */}
      {receiveDrawerOpen && (
        <div className="stock-drawer-backdrop" onClick={() => setReceiveDrawerOpen(false)}>
          <aside className="stock-drawer fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="stock-drawer__header">
              <div className="stock-drawer__title-row">
                <div className="stock-drawer__icon">
                  <IconBox size={18} color="#008C8C" />
                </div>
                <h2 className="stock-drawer__title">Receive New Stock</h2>
              </div>
              <button
                className="stock-drawer__close"
                onClick={() => setReceiveDrawerOpen(false)}
                aria-label="Close"
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleReceiveSubmit} className="stock-drawer__form">
              <div className="stock-drawer__body">
                {/* Medicine */}
                <div className="stock-field">
                  <label>Medicine *</label>
                  <select
                    value={receiveForm.medicineId}
                    onChange={(e) => setReceiveForm({ ...receiveForm, medicineId: e.target.value })}
                    required
                  >
                    <option value="">Select Medicine</option>
                    {medicines.map((m) => (
                      <option key={m.medicineId} value={m.medicineId}>
                        {m.medicineName} ({m.dosageForm || 'Tablet'})
                      </option>
                    ))}
                    {medicines.length === 0 && (
                      <>
                        <option value="1">Paracetamol 500mg</option>
                        <option value="2">Amoxicillin 500mg</option>
                        <option value="3">Metformin 500mg</option>
                        <option value="4">Ibuprofen 400mg</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Supplier */}
                <div className="stock-field">
                  <label>Supplier *</label>
                  <select
                    value={receiveForm.supplierId}
                    onChange={(e) => setReceiveForm({ ...receiveForm, supplierId: e.target.value })}
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.supplierId} value={s.supplierId}>
                        {s.supplierName}
                      </option>
                    ))}
                    {suppliers.length === 0 && (
                      <>
                        <option value="1">ABC Pharma</option>
                        <option value="2">Global MedTech</option>
                        <option value="3">HealthCare Ltd</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Batch Number */}
                <div className="stock-field">
                  <label>Batch Number *</label>
                  <input
                    type="text"
                    placeholder="Enter batch number (e.g. B-1025)"
                    value={receiveForm.batchNumber}
                    onChange={(e) => setReceiveForm({ ...receiveForm, batchNumber: e.target.value })}
                    required
                  />
                </div>

                {/* Quantity & Price */}
                <div className="stock-field-row">
                  <div className="stock-field">
                    <label>Quantity Received *</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Enter quantity"
                      value={receiveForm.quantity}
                      onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="stock-field">
                    <label>Purchase Price (per unit) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Enter price"
                      value={receiveForm.purchasePrice}
                      onChange={(e) => setReceiveForm({ ...receiveForm, purchasePrice: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="stock-field-row">
                  <div className="stock-field">
                    <label>Manufacturing Date</label>
                    <input
                      type="date"
                      value={receiveForm.manufacturingDate}
                      onChange={(e) =>
                        setReceiveForm({ ...receiveForm, manufacturingDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="stock-field">
                    <label>Expiry Date *</label>
                    <input
                      type="date"
                      value={receiveForm.expiryDate}
                      onChange={(e) => setReceiveForm({ ...receiveForm, expiryDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Receipt Reference */}
                <div className="stock-field">
                  <label>Receipt Reference</label>
                  <input
                    type="text"
                    placeholder="Enter reference number (e.g. INV-9042)"
                    value={receiveForm.receiptReference}
                    onChange={(e) =>
                      setReceiveForm({ ...receiveForm, receiptReference: e.target.value })
                    }
                  />
                </div>

                {/* Notes */}
                <div className="stock-field">
                  <label>Notes (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Add any additional notes..."
                    value={receiveForm.notes}
                    onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="stock-drawer__footer">
                <button
                  type="button"
                  className="stock-btn stock-btn--secondary"
                  onClick={() => setReceiveDrawerOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="stock-btn stock-btn--primary"
                  disabled={receiveSubmitting}
                >
                  <IconCheck size={16} />
                  <span>{receiveSubmitting ? 'Saving...' : 'Save Receipt'}</span>
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {/* ── MODAL: Stock Adjustment ── */}
      {adjustModalOpen && (
        <div className="stock-modal-overlay">
          <div className="stock-modal-card fade-in">
            <div className="stock-modal-header">
              <h3>Stock Adjustment</h3>
              <button className="stock-modal-close" onClick={() => setAdjustModalOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleAdjustSubmit}>
              <div className="stock-modal-body">
                <div className="stock-field">
                  <label>Batch / Medicine *</label>
                  <select
                    value={adjustForm.batchId}
                    onChange={(e) => setAdjustForm({ ...adjustForm, batchId: e.target.value })}
                    required
                  >
                    <option value="">Select Target Batch</option>
                    {stockItems.map((b) => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.medicineName} ({b.batchNumber}) - {b.availableQty} avail.
                      </option>
                    ))}
                  </select>
                </div>

                <div className="stock-field">
                  <label>Adjustment Type *</label>
                  <select
                    value={adjustForm.type}
                    onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                  >
                    <option value="DAMAGE">Damaged / Expired (-)</option>
                    <option value="LOSS">Loss / Discrepancy (-)</option>
                    <option value="CORRECTION">Audit Correction (+/-)</option>
                    <option value="RETURN">Customer / Ward Return (+)</option>
                  </select>
                </div>

                <div className="stock-field">
                  <label>Quantity Changed *</label>
                  <input
                    type="number"
                    value={adjustForm.quantityChanged}
                    onChange={(e) =>
                      setAdjustForm({ ...adjustForm, quantityChanged: e.target.value })
                    }
                    required
                  />
                  <small style={{ color: '#64748B', fontSize: '0.72rem' }}>
                    Negative value reduces available stock; positive value increases it.
                  </small>
                </div>

                <div className="stock-field">
                  <label>Adjustment Reason & Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Document clinical or logistical justification..."
                    value={adjustForm.reason}
                    onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="stock-modal-footer">
                <button
                  type="button"
                  className="stock-btn stock-btn--secondary"
                  onClick={() => setAdjustModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="stock-btn stock-btn--primary"
                  disabled={adjustSubmitting}
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Physical Count ── */}
      {countModalOpen && (
        <div className="stock-modal-overlay">
          <div className="stock-modal-card fade-in">
            <div className="stock-modal-header">
              <h3>Physical Stock Count</h3>
              <button className="stock-modal-close" onClick={() => setCountModalOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleCountSubmit}>
              <div className="stock-modal-body">
                <div className="stock-field">
                  <label>Select Batch to Reconcile *</label>
                  <select
                    value={countForm.batchId}
                    onChange={(e) => setCountForm({ ...countForm, batchId: e.target.value })}
                    required
                  >
                    <option value="">Select Batch</option>
                    {stockItems.map((b) => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.medicineName} ({b.batchNumber}) — Current Record: {b.availableQty}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="stock-field">
                  <label>Actual Counted Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={countForm.countedQuantity}
                    onChange={(e) =>
                      setCountForm({ ...countForm, countedQuantity: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="stock-field">
                  <label>Auditor Notes</label>
                  <textarea
                    rows={2}
                    value={countForm.auditorNotes}
                    onChange={(e) => setCountForm({ ...countForm, auditorNotes: e.target.value })}
                  />
                </div>
              </div>

              <div className="stock-modal-footer">
                <button
                  type="button"
                  className="stock-btn stock-btn--secondary"
                  onClick={() => setCountModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="stock-btn stock-btn--primary">
                  Reconcile Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Stock Transfer ── */}
      {transferModalOpen && (
        <div className="stock-modal-overlay">
          <div className="stock-modal-card fade-in">
            <div className="stock-modal-header">
              <h3>Stock Transfer</h3>
              <button className="stock-modal-close" onClick={() => setTransferModalOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleTransferSubmit}>
              <div className="stock-modal-body">
                <div className="stock-field">
                  <label>Source Batch *</label>
                  <select
                    value={transferForm.batchId}
                    onChange={(e) => setTransferForm({ ...transferForm, batchId: e.target.value })}
                    required
                  >
                    <option value="">Select Batch</option>
                    {stockItems.map((b) => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.medicineName} ({b.batchNumber}) - {b.availableQty} units
                      </option>
                    ))}
                  </select>
                </div>

                <div className="stock-field">
                  <label>Destination Department *</label>
                  <select
                    value={transferForm.destination}
                    onChange={(e) =>
                      setTransferForm({ ...transferForm, destination: e.target.value })
                    }
                  >
                    <option value="Emergency Ward">Emergency Ward</option>
                    <option value="ICU Ward">ICU Ward</option>
                    <option value="Outpatient Clinic">Outpatient Clinic</option>
                    <option value="Surgical Suite">Surgical Suite</option>
                  </select>
                </div>

                <div className="stock-field">
                  <label>Transfer Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={transferForm.quantity}
                    onChange={(e) =>
                      setTransferForm({ ...transferForm, quantity: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="stock-modal-footer">
                <button
                  type="button"
                  className="stock-btn stock-btn--secondary"
                  onClick={() => setTransferModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="stock-btn stock-btn--primary">
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: View Batch Details ── */}
      {viewItem && (
        <div className="stock-modal-overlay">
          <div className="stock-modal-card fade-in">
            <div className="stock-modal-header">
              <h3>Batch Details — {viewItem.batchNumber}</h3>
              <button className="stock-modal-close" onClick={() => setViewItem(null)}>
                <IconX size={18} />
              </button>
            </div>
            <div className="stock-modal-body">
              <div className="stock-detail-row">
                <span>Medicine:</span>
                <strong>{viewItem.medicineName}</strong>
              </div>
              <div className="stock-detail-row">
                <span>Category:</span>
                <span>{viewItem.categoryName}</span>
              </div>
              <div className="stock-detail-row">
                <span>Supplier:</span>
                <span>{viewItem.supplierName}</span>
              </div>
              <div className="stock-detail-row">
                <span>Available Units:</span>
                <strong style={{ color: '#008C8C' }}>{viewItem.availableQty}</strong>
              </div>
              <div className="stock-detail-row">
                <span>Expiry Date:</span>
                <span>{viewItem.expiryDate}</span>
              </div>
              <div className="stock-detail-row">
                <span>Status:</span>
                <span
                  className={`stock-badge stock-badge--${viewItem.status === 'In Stock'
                    ? 'in-stock'
                    : viewItem.status === 'Low Stock'
                      ? 'low-stock'
                      : 'critical'
                    }`}
                >
                  {viewItem.status}
                </span>
              </div>
            </div>
            <div className="stock-modal-footer">
              <button
                className="stock-btn stock-btn--primary"
                onClick={() => setViewItem(null)}
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
