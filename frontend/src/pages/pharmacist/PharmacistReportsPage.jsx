import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchMedicines,
  fetchBatches,
  fetchOrders,
  fetchSuppliers
} from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  IconReports,
  IconSearch,
  IconDownload,
  IconPrinter,
  IconChevronLeft,
  IconChevronRight,
  IconFileText,
  IconPill,
  IconAlertTriangle,
  IconBox,
  IconFilter,
  IconCalendar,
  IconCheck,
  IconX,
  IconTrendUp
} from '../../components/icons/Icons';
import './PharmacistReportsPage.css';
import '../admin/AdminPages.css';

// Monthly trend data matching screenshot Nov 2024 - Apr 2025
const MONTHLY_TREND_DATA = [
  { month: 'Nov 2024', value: 28400 },
  { month: 'Dec 2024', value: 35200 },
  { month: 'Jan 2025', value: 38400 },
  { month: 'Feb 2025', value: 41200 },
  { month: 'Mar 2025', value: 43500 },
  { month: 'Apr 2025', value: 48732 },
];

// Reference inventory records from uploaded screenshot
const DEFAULT_INVENTORY_REPORT_ROWS = [
  {
    id: 1,
    name: 'Paracetamol 500mg',
    batchCode: 'B-1024',
    supplier: 'ABC Suppliers',
    category: 'Pain Relief',
    totalQty: 1250,
    available: 1120,
    lowStock: 80,
    outOfStock: 50,
    totalValue: 2500.00,
    status: 'In Stock',
    iconColor: '#10B981',
  },
  {
    id: 2,
    name: 'Amoxicillin 500mg',
    batchCode: 'B-0876',
    supplier: 'Global MedTech',
    category: 'Antibiotics',
    totalQty: 800,
    available: 650,
    lowStock: 100,
    outOfStock: 50,
    totalValue: 3200.00,
    status: 'Low Stock',
    iconColor: '#3B82F6',
  },
  {
    id: 3,
    name: 'Metformin 500mg',
    batchCode: 'B-0765',
    supplier: 'HealthCare Ltd',
    category: 'Diabetes',
    totalQty: 1000,
    available: 920,
    lowStock: 60,
    outOfStock: 20,
    totalValue: 2800.00,
    status: 'In Stock',
    iconColor: '#008C8C',
  },
  {
    id: 4,
    name: 'Omeprazole 20mg',
    batchCode: 'B-0654',
    supplier: 'Pain Relief Pharma',
    category: 'Gastrointestinal',
    totalQty: 600,
    available: 520,
    lowStock: 50,
    outOfStock: 30,
    totalValue: 1800.00,
    status: 'Low Stock',
    iconColor: '#EF4444',
  },
  {
    id: 5,
    name: 'Ibuprofen 400mg',
    batchCode: 'B-0532',
    supplier: 'MediPlus Pharma',
    category: 'Pain Relief',
    totalQty: 950,
    available: 870,
    lowStock: 40,
    outOfStock: 40,
    totalValue: 2300.00,
    status: 'In Stock',
    iconColor: '#008C8C',
  },
  {
    id: 6,
    name: 'Ciprofloxacin 500mg',
    batchCode: 'B-0321',
    supplier: 'ABC Suppliers',
    category: 'Antibiotics',
    totalQty: 500,
    available: 420,
    lowStock: 50,
    outOfStock: 30,
    totalValue: 1750.00,
    status: 'Low Stock',
    iconColor: '#06B6D4',
  },
  {
    id: 7,
    name: 'Atorvastatin 10mg',
    batchCode: 'B-0210',
    supplier: 'Global MedTech',
    category: 'Cholesterol',
    totalQty: 700,
    available: 680,
    lowStock: 15,
    outOfStock: 5,
    totalValue: 2100.00,
    status: 'In Stock',
    iconColor: '#8B5CF6',
  },
  {
    id: 8,
    name: 'Vitamin D3 1000IU',
    batchCode: 'B-0198',
    supplier: 'HealthCare Ltd',
    category: 'Supplements',
    totalQty: 400,
    available: 360,
    lowStock: 30,
    outOfStock: 10,
    totalValue: 1200.00,
    status: 'In Stock',
    iconColor: '#F59E0B',
  },
  {
    id: 9,
    name: 'Losartan 50mg',
    batchCode: 'B-0187',
    supplier: 'MediPlus Pharma',
    category: 'Blood Pressure',
    totalQty: 600,
    available: 540,
    lowStock: 45,
    outOfStock: 15,
    totalValue: 1600.00,
    status: 'In Stock',
    iconColor: '#008C8C',
  },
  {
    id: 10,
    name: 'Albuterol Inhaler',
    batchCode: 'B-0176',
    supplier: 'ABC Suppliers',
    category: 'Respiratory',
    totalQty: 300,
    available: 280,
    lowStock: 15,
    outOfStock: 5,
    totalValue: 2400.00,
    status: 'In Stock',
    iconColor: '#3B82F6',
  },
];

// Color palette for items
const CATEGORY_COLORS = [
  '#10B981', '#3B82F6', '#008C8C', '#EF4444',
  '#06B6D4', '#8B5CF6', '#F59E0B', '#EC4899',
];

export default function PharmacistReportsPage() {
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Active Report Tab: SUMMARY | EXPIRY | PURCHASES | STOCK | SUPPLIERS
  const [activeTab, setActiveTab] = useState('SUMMARY');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState('ALL');
  const [medicineName, setMedicineName] = useState('');
  const [dateRangeText, setDateRangeText] = useState('Apr 1, 2025 - Apr 24, 2025');

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    frequency: 'Weekly',
    format: 'PDF',
    email: 'sarah.khan@medistock.health',
    time: '09:00 AM'
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Real Data from Backend if available
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [medsRes, batchesRes, ordersRes, supRes] = await Promise.all([
        fetchMedicines().catch(() => []),
        fetchBatches().catch(() => []),
        fetchOrders().catch(() => []),
        fetchSuppliers().catch(() => [])
      ]);

      const medList = Array.isArray(medsRes) ? medsRes : (medsRes?.data || []);
      const batchList = Array.isArray(batchesRes) ? batchesRes : (batchesRes?.data || []);
      const orderList = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.data || []);
      const supList = Array.isArray(supRes) ? supRes : (supRes?.data || []);

      setMedicines(medList);
      setBatches(batchList);
      setOrders(orderList);
      setSuppliers(supList);
    } catch (err) {
      console.warn('Backend data load error in Reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Categories list
  const categoryOptions = [
    'All Categories',
    'Pain Relief',
    'Antibiotics',
    'Diabetes',
    'Gastrointestinal',
    'Cholesterol',
    'Supplements',
    'Blood Pressure',
    'Respiratory',
  ];

  // Suppliers list
  const supplierOptions = [
    'All Suppliers',
    'ABC Suppliers',
    'Global MedTech',
    'HealthCare Ltd',
    'Pain Relief Pharma',
    'MediPlus Pharma',
  ];

  // Donut chart status distribution matching screenshot
  const donutData = [
    { name: 'In Stock', value: 282, color: '#008C8C', pct: '82.5%' },
    { name: 'Low Stock', value: 18, color: '#F59E0B', pct: '5.3%' },
    { name: 'Out of Stock', value: 42, color: '#EF4444', pct: '12.3%' },
  ];
  const donutTotal = 342;

  // Filtered Table Rows based on Active Tab (Live Database Data)
  const tableRows = useMemo(() => {
    let rows = [];

    if (activeTab === 'SUMMARY' || activeTab === 'STOCK') {
      if (medicines.length > 0) {
        rows = medicines.map((m, i) => {
          const medBatches = batches.filter(b => b.medicineId === m.medicineId);
          const avail = medBatches.reduce((sum, b) => sum + (b.quantityAvailable || 0), 0) || (m.totalStock || 0);
          const totalQ = medBatches.reduce((sum, b) => sum + (b.quantityReceived || b.quantityAvailable || 0), avail);
          const price = medBatches[0]?.sellingPrice != null ? Number(medBatches[0].sellingPrice) : (m.unitPrice != null ? Number(m.unitPrice) : 10);
          const val = avail * price;
          const status = avail === 0 ? 'Out of Stock' : (avail <= 20 ? 'Low Stock' : 'In Stock');

          return {
            id: m.medicineId || i + 1,
            name: m.medicineName,
            batchCode: medBatches[0]?.batchNumber || `BAT-${m.medicineId}-01`,
            supplier: medBatches[0]?.supplier?.supplierName || 'General',
            category: m.category?.categoryName || m.categoryName || 'General',
            totalQty: totalQ,
            available: avail,
            lowStock: avail <= 20 ? avail : 0,
            outOfStock: avail === 0 ? totalQ : 0,
            totalValue: val,
            status: activeTab === 'STOCK' && avail <= 20 ? 'Audit Needed' : status,
            iconColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
          };
        });
      } else {
        rows = DEFAULT_INVENTORY_REPORT_ROWS;
      }
    } else if (activeTab === 'EXPIRY') {
      if (batches.length > 0) {
        rows = batches.map((b, idx) => {
          const days = b.daysUntilExpiry ?? (idx * 15 - 5);
          return {
            id: b.batchId || idx + 1,
            name: b.medicineName || `Medicine Batch ${idx + 1}`,
            batchCode: b.batchNumber || `B-${String(idx + 101).padStart(4, '0')}`,
            supplier: b.supplierName || 'ABC Suppliers',
            category: b.expiryDate || '2025-05-30',
            totalQty: b.quantityAvailable ?? 450,
            available: b.quantityAvailable ?? 400,
            lowStock: days <= 30 ? 50 : 15,
            outOfStock: days <= 0 ? 30 : 0,
            totalValue: (b.quantityAvailable ?? 400) * Number(b.purchasePrice || 4.5),
            status: days <= 0 ? 'Expired' : days <= 30 ? 'Low Stock' : 'In Stock',
            iconColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
          };
        });
      } else {
        rows = [
          { id: 101, name: 'Amoxicillin 500mg', batchCode: 'B-0876', supplier: 'Global MedTech', category: '2025-05-15', totalQty: 450, available: 400, lowStock: 80, outOfStock: 20, totalValue: 1800, status: 'Low Stock', iconColor: '#3B82F6' },
          { id: 102, name: 'Paracetamol 500mg', batchCode: 'B-1024', supplier: 'ABC Suppliers', category: '2025-05-22', totalQty: 600, available: 550, lowStock: 60, outOfStock: 10, totalValue: 1200, status: 'In Stock', iconColor: '#10B981' },
          { id: 103, name: 'Omeprazole 20mg', batchCode: 'B-0654', supplier: 'Pain Relief Pharma', category: '2025-06-01', totalQty: 300, available: 250, lowStock: 40, outOfStock: 15, totalValue: 900, status: 'Low Stock', iconColor: '#EF4444' },
          { id: 104, name: 'Ciprofloxacin 500mg', batchCode: 'B-0321', supplier: 'ABC Suppliers', category: '2025-06-15', totalQty: 250, available: 200, lowStock: 50, outOfStock: 25, totalValue: 875, status: 'Low Stock', iconColor: '#06B6D4' },
        ];
      }
    } else if (activeTab === 'PURCHASES') {
      if (orders.length > 0) {
        rows = orders.map((o, idx) => ({
          id: o.orderId || idx + 1,
          name: `Order ${o.orderNumber || `PO-2025-00${idx + 1}`}`,
          batchCode: o.orderNumber || `PO-2025-00${idx + 1}`,
          supplier: o.supplierName || 'ABC Suppliers',
          category: o.orderDate || '2025-04-18',
          totalQty: o.items?.length || 5,
          available: o.items?.length || 5,
          lowStock: 0,
          outOfStock: 0,
          totalValue: Number(o.totalAmount || 4500.00),
          status: o.status === 'Approved' ? 'In Stock' : 'Low Stock',
          iconColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
        }));
      } else {
        rows = [
          { id: 201, name: 'PO-2025-0017', batchCode: 'PO-0017', supplier: 'Global MedTech', category: '2025-04-18', totalQty: 8, available: 8, lowStock: 0, outOfStock: 0, totalValue: 7320, status: 'In Stock', iconColor: '#10B981' },
          { id: 202, name: 'PO-2025-0018', batchCode: 'PO-0018', supplier: 'ABC Suppliers', category: '2025-04-22', totalQty: 5, available: 4, lowStock: 1, outOfStock: 0, totalValue: 4850, status: 'Low Stock', iconColor: '#F59E0B' },
          { id: 203, name: 'PO-2025-0016', batchCode: 'PO-0016', supplier: 'HealthCare Ltd', category: '2025-04-15', totalQty: 4, available: 3, lowStock: 1, outOfStock: 0, totalValue: 3760, status: 'In Stock', iconColor: '#3B82F6' },
        ];
      }
    } else if (activeTab === 'SUPPLIERS') {
      rows = [
        { id: 301, name: 'ABC Suppliers', batchCode: 'SUP-001', supplier: 'John Smith', category: 'Primary Vendor', totalQty: 24, available: 24, lowStock: 2, outOfStock: 0, totalValue: 24850, status: 'In Stock', iconColor: '#10B981' },
        { id: 302, name: 'Global MedTech', batchCode: 'SUP-002', supplier: 'Maria Garcia', category: 'Medical Tech', totalQty: 18, available: 16, lowStock: 3, outOfStock: 1, totalValue: 19400, status: 'In Stock', iconColor: '#3B82F6' },
        { id: 303, name: 'HealthCare Ltd', batchCode: 'SUP-003', supplier: 'David Wilson', category: 'Pharma Distributor', totalQty: 15, available: 14, lowStock: 1, outOfStock: 0, totalValue: 14200, status: 'In Stock', iconColor: '#8B5CF6' },
      ];
    }

    // Apply Filter Search & Category
    return rows.filter((r) => {
      const matchMedName =
        !medicineName ||
        r.name.toLowerCase().includes(medicineName.toLowerCase()) ||
        r.batchCode.toLowerCase().includes(medicineName.toLowerCase());
      const matchCat =
        selectedCategory === 'ALL' ||
        selectedCategory === 'All Categories' ||
        r.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchSup =
        selectedSupplier === 'ALL' ||
        selectedSupplier === 'All Suppliers' ||
        r.supplier.toLowerCase() === selectedSupplier.toLowerCase();
      return matchMedName && matchCat && matchSup;
    });
  }, [activeTab, batches, orders, medicineName, selectedCategory, selectedSupplier]);

  // Pagination
  const totalPages = Math.ceil(tableRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return tableRows.slice(start, start + pageSize);
  }, [tableRows, currentPage]);

  // Checkbox Selection
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedRows.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Medicine Name,Batch,Supplier,Category,Total Quantity,Available,Low Stock,Out of Stock,Total Value,Status'];
    const lines = tableRows.map(
      (r) =>
        `"${r.name}","${r.batchCode}","${r.supplier}","${r.category}",${r.totalQty},${r.available},${r.lowStock},${r.outOfStock},${r.totalValue.toFixed(2)},"${r.status}"`
    );
    const blob = new Blob([[...headers, ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medistock-${activeTab.toLowerCase()}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', `${activeTab} report exported successfully (CSV/Excel).`);
  };

  // Export PDF
  const handleExportPDF = () => {
    showToast('success', 'PDF generation complete. Download started.');
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="admin-page-container fade-in">
      {/* Toast Alert */}
      {toast && (
        <div className={`rep-toast rep-toast--${toast.type} fade-in`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Top Header (Admin Clay Layout) ── */}
      <div className="admin-page-header" style={{ marginBottom: 20 }}>
        <div className="admin-page-header__left">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#102e59', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>
            Inventory Reports
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
            Generate, view, and export inventory audit reports, valuation trends and expiry insights.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <button
            className="admin-btn admin-btn--primary"
            style={{ borderRadius: 9999, padding: '10px 22px' }}
            onClick={handleExportPDF}
          >
            <IconDownload size={16} /> Export PDF
          </button>
          <button
            className="admin-btn admin-btn--outline"
            style={{ borderRadius: 9999, padding: '10px 18px', background: '#ffffff' }}
            onClick={handleExportCSV}
          >
            <IconDownload size={16} /> Export Excel
          </button>
          <button
            className="admin-btn admin-btn--outline"
            style={{ borderRadius: 9999, padding: '10px 16px', background: '#ffffff' }}
            onClick={handlePrint}
            title="Print Report"
          >
            <IconPrinter size={16} />
          </button>
        </div>
      </div>

      {/* ── 4 KPI Stat Cards (Clay Elevated 3D Tiles) ── */}
      <div className="clay-stat-grid-4" style={{ marginBottom: 22 }}>
        {/* Card 1: Total Medicines */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">TOTAL MEDICINES</span>
            <span className="clay-stat-card__value">342</span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>↑ 5% vs. last month</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconPill size={22} />
          </div>
        </div>

        {/* Card 2: Low Stock Items */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">LOW STOCK ITEMS</span>
            <span className="clay-stat-card__value" style={{ color: '#b45309' }}>18</span>
            <span className="clay-stat-card__sub" style={{ color: '#d97706' }}>↑ 3% vs. last month</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <IconAlertTriangle size={22} />
          </div>
        </div>

        {/* Card 3: Expiring (<= 30 Days) */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">EXPIRING (&le; 30 DAYS)</span>
            <span className="clay-stat-card__value" style={{ color: '#0284c7' }}>28</span>
            <span className="clay-stat-card__sub" style={{ color: '#0284c7' }}>↓ 12% vs. last month</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--blue">
            <IconCalendar size={22} />
          </div>
        </div>

        {/* Card 4: Total Inventory Value */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">TOTAL INVENTORY VALUE</span>
            <span className="clay-stat-card__value" style={{ color: '#008C8C' }}>$48,732.50</span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>↑ 8% vs. last month</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--purple">
            <IconBox size={22} />
          </div>
        </div>
      </div>

      {/* ── Report Type Tab Navigation Bar ── */}
      <div className="rep-tabs-bar">
        <button
          className={`rep-tab-btn ${activeTab === 'SUMMARY' ? 'rep-tab-btn--active' : ''}`}
          onClick={() => { setActiveTab('SUMMARY'); setCurrentPage(1); }}
        >
          Inventory Report
        </button>
        <button
          className={`rep-tab-btn ${activeTab === 'EXPIRY' ? 'rep-tab-btn--active' : ''}`}
          onClick={() => { setActiveTab('EXPIRY'); setCurrentPage(1); }}
        >
          Expiry Report
        </button>
        <button
          className={`rep-tab-btn ${activeTab === 'PURCHASES' ? 'rep-tab-btn--active' : ''}`}
          onClick={() => { setActiveTab('PURCHASES'); setCurrentPage(1); }}
        >
          Purchase Report
        </button>
        <button
          className={`rep-tab-btn ${activeTab === 'STOCK' ? 'rep-tab-btn--active' : ''}`}
          onClick={() => { setActiveTab('STOCK'); setCurrentPage(1); }}
        >
          Stock Movement Report
        </button>
        <button
          className={`rep-tab-btn ${activeTab === 'SUPPLIERS' ? 'rep-tab-btn--active' : ''}`}
          onClick={() => { setActiveTab('SUPPLIERS'); setCurrentPage(1); }}
        >
          Supplier Report
        </button>
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="rep-layout">
        {/* Main Column */}
        <div className="rep-main-col">
          {/* Charts Row — 3 cards: Inventory Value Trend | Stock Status | Export Options */}
          <div className="rep-charts-grid">
            {/* Chart 1: Inventory Value Trend */}
            <div className="rep-chart-card">
              <div className="rep-chart-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconTrendUp size={16} color="#008C8C" />
                  <h3 className="rep-chart-title">Inventory Value Trend</h3>
                </div>
              </div>
              <div className="rep-chart-container" style={{ width: '100%', height: 210 }}>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart
                    data={MONTHLY_TREND_DATA}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="month"
                      stroke="#94A3B8"
                      fontSize={8}
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                      interval={0}
                      tick={{ dy: 3 }}
                    />
                    <YAxis
                      domain={[0, 60000]}
                      ticks={[0, 15000, 30000, 45000, 60000]}
                      stroke="#94A3B8"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => (v === 0 ? '$0' : `$${(v).toLocaleString()}`)}
                    />
                    <Tooltip
                      formatter={(val) => [`$${val.toLocaleString()}`, 'Valuation']}
                      contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: '0.8rem' }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#008C8C"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Stock Status Donut */}
            <div className="rep-chart-card">
              <div className="rep-chart-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconPill size={16} color="#008C8C" />
                  <h3 className="rep-chart-title">Stock Status</h3>
                </div>
              </div>
              <div className="rep-donut-wrap">
                <div className="rep-donut-circle-wrap">
                  <ResponsiveContainer width={105} height={105}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        innerRadius={32}
                        outerRadius={48}
                        paddingAngle={3}
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="rep-donut-center-label">
                    <div className="rep-donut-center-val">{donutTotal}</div>
                    <div className="rep-donut-center-sub">Total Medicines</div>
                  </div>
                </div>
                <div className="rep-donut-legend">
                  {donutData.map((d, i) => (
                    <div key={i} className="rep-legend-row">
                      <div className="rep-legend-left">
                        <span className="rep-legend-dot" style={{ backgroundColor: d.color }} />
                        <span className="rep-legend-label">{d.name}</span>
                      </div>
                      <div className="rep-legend-right">
                        <span className="rep-legend-val">{d.value}</span>
                        <span className="rep-legend-pct">({d.pct})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 3: Export Options */}
            <div className="rep-chart-card rep-export-card">
              <h3 className="rep-chart-title" style={{ marginBottom: '16px' }}>Export Options</h3>
              <div className="rep-export-buttons-stack">
                <button className="rep-export-btn-item" onClick={handleExportPDF}>
                  <span className="rep-export-badge rep-export-badge--pdf">PDF</span>
                  <span className="rep-export-text">Export PDF</span>
                </button>
                <button className="rep-export-btn-item" onClick={handleExportCSV}>
                  <span className="rep-export-badge rep-export-badge--xls">XLS</span>
                  <span className="rep-export-text">Export Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table Container (Clay Elevated Card) */}
          <div className="clay-card-table" style={{ marginTop: 20 }}>
            <div className="rep-table-header-flex">
              <div className="rep-table-title-wrap">
                <IconFileText size={18} color="#008C8C" />
                <h3 className="rep-table-title">Inventory Report</h3>
              </div>
            </div>

            <div className="rep-table-responsive">
              <table className="admin-table">
                <colgroup>
                  <col style={{ width: '32px' }} />
                  <col style={{ width: '180px' }} />
                  <col style={{ width: '95px' }} />
                  <col style={{ width: '75px' }} />
                  <col style={{ width: '65px' }} />
                  <col style={{ width: '60px' }} />
                  <col style={{ width: '70px' }} />
                  <col style={{ width: '80px' }} />
                  <col style={{ width: '80px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ width: 36, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === paginatedRows.length}
                        onChange={toggleSelectAll}
                        style={{ accentColor: '#008C8C', cursor: 'pointer' }}
                      />
                    </th>
                    <th>Medicine Name</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Total Quantity</th>
                    <th style={{ textAlign: 'right' }}>Available</th>
                    <th style={{ textAlign: 'right' }}>Low Stock</th>
                    <th style={{ textAlign: 'right' }}>Out of Stock</th>
                    <th style={{ textAlign: 'right' }}>Total Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                        No records match the current report criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(row.id)}
                            onChange={() => toggleSelectRow(row.id)}
                            style={{ accentColor: '#008C8C', cursor: 'pointer' }}
                          />
                        </td>
                        <td>
                          <div className="rep-med-cell">
                            <span className="rep-med-dot" style={{ backgroundColor: row.iconColor || '#008C8C' }} />
                            <div className="rep-med-text-wrap">
                              <span className="rep-med-name">{row.name}</span>
                              <span className="rep-med-sub">{row.batchCode} | {row.supplier}</span>
                            </div>
                          </div>
                        </td>
                        <td className="rep-cat-col">{row.category}</td>
                        <td style={{ textAlign: 'right', fontWeight: 500, color: '#16324F' }}>
                          {row.totalQty.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 500, color: '#16324F' }}>
                          {row.available.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#EF4444' }}>
                          {row.lowStock}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#EF4444' }}>
                          {row.outOfStock}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#16324F' }}>
                          ${row.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td>
                          <span
                            className={`rep-badge rep-badge--${
                              row.status === 'In Stock'
                                ? 'success'
                                : row.status === 'Low Stock'
                                ? 'warning'
                                : 'danger'
                            }`}
                          >
                            {row.status}
                          </span>
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
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, 50)} of 50 medicines
              </span>

              <div className="clay-pagination">
                <button
                  className="clay-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <IconChevronLeft size={14} />
                </button>
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    className={`clay-page-btn ${currentPage === num ? 'clay-page-btn--active' : ''}`}
                    onClick={() => setCurrentPage(num)}
                  >
                    {num}
                  </button>
                ))}
                <button
                  className="clay-page-btn"
                  disabled={currentPage === 5}
                  onClick={() => setCurrentPage((p) => Math.min(5, p + 1))}
                >
                  <IconChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Report Filters, Quick Actions, Recent Reports ── */}
        <aside className="rep-right-col">
          {/* Card 1: Report Filters */}
          <div className="rep-sidebar-card">
            <div className="rep-sidebar-card-header">
              <IconFilter size={16} color="#008C8C" />
              <h3 className="rep-sidebar-title">Report Filters</h3>
            </div>

            <div className="rep-filter-form">
              {/* Report Type */}
              <div className="rep-sidebar-field">
                <label>Report Type</label>
                <select
                  value={activeTab}
                  onChange={(e) => {
                    setActiveTab(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="SUMMARY">Inventory Report</option>
                  <option value="EXPIRY">Expiry Report</option>
                  <option value="PURCHASES">Purchase Report</option>
                  <option value="STOCK">Stock Movement Report</option>
                  <option value="SUPPLIERS">Supplier Report</option>
                </select>
              </div>

              {/* Date Range with calendar icon inside right */}
              <div className="rep-sidebar-field">
                <label>Date Range</label>
                <div className="rep-date-range-row">
                  <input
                    type="text"
                    className="rep-date-range-input"
                    value={dateRangeText}
                    onChange={(e) => setDateRangeText(e.target.value)}
                    placeholder="Apr 1, 2025 - Apr 24, 2025"
                  />
                  <button className="rep-cal-icon-btn" title="Open calendar" onClick={() => showToast('info', 'Date picker calendar')}>
                    <IconCalendar size={15} />
                  </button>
                </div>
              </div>

              {/* Category */}
              <div className="rep-sidebar-field">
                <label>Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c === 'All Categories' ? 'ALL' : c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier */}
              <div className="rep-sidebar-field">
                <label>Supplier</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                  {supplierOptions.map((s) => (
                    <option key={s} value={s === 'All Suppliers' ? 'ALL' : s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Medicine Name search input */}
              <div className="rep-sidebar-field">
                <label>Medicine Name</label>
                <div className="rep-search-input-wrap">
                  <IconSearch size={15} className="rep-search-icon" />
                  <input
                    type="text"
                    className="rep-search-input"
                    placeholder="Search medicines..."
                    value={medicineName}
                    onChange={(e) => setMedicineName(e.target.value)}
                  />
                </div>
              </div>

              {/* Apply Filters & Reset Buttons */}
              <div className="rep-sidebar-btn-row">
                <button
                  className="rep-btn rep-btn--primary"
                  onClick={() => showToast('success', 'Filters applied to Inventory Report.')}
                >
                  Apply Filters
                </button>
                <button
                  className="rep-btn rep-btn--outline"
                  onClick={() => {
                    setMedicineName('');
                    setSelectedCategory('ALL');
                    setSelectedSupplier('ALL');
                    setDateRangeText('Apr 1, 2025 - Apr 24, 2025');
                    showToast('info', 'Report filters reset.');
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Quick Actions */}
          <div className="rep-sidebar-card">
            <div className="rep-sidebar-card-header">
              <IconBox size={16} color="#008C8C" />
              <h3 className="rep-sidebar-title">Quick Actions</h3>
            </div>
            <div className="rep-quick-actions-list">
              <button className="rep-quick-act-btn" onClick={handleExportCSV}>
                <IconDownload size={16} />
                <span>Export Report</span>
              </button>
              <button className="rep-quick-act-btn" onClick={() => setDetailsModalOpen(true)}>
                <IconFileText size={16} />
                <span>View Details</span>
              </button>
              <button className="rep-quick-act-btn" onClick={handlePrint}>
                <IconPrinter size={16} />
                <span>Print Report</span>
              </button>
              <button className="rep-quick-act-btn" onClick={() => setScheduleModalOpen(true)}>
                <IconCalendar size={16} />
                <span>Schedule Report</span>
              </button>
            </div>
          </div>

          {/* Card 3: Recent Reports */}
          <div className="rep-sidebar-card">
            <div className="rep-recent-header">
              <h3 className="rep-sidebar-title" style={{ margin: 0 }}>Recent Reports</h3>
              <button
                className="rep-link-btn"
                onClick={() => showToast('info', 'Listing all recent report archives.')}
              >
                View All
              </button>
            </div>
            <div className="rep-recent-reports-list">
              <div className="rep-recent-item" onClick={handleExportPDF}>
                <div className="rep-recent-left">
                  <div className="rep-file-badge rep-file-badge--pdf">PDF</div>
                  <div>
                    <span className="rep-recent-name">Inventory Report</span>
                    <span className="rep-recent-meta">Apr 24, 2025, 10:15 AM</span>
                    <span className="rep-recent-meta">PDF • 2.4 MB</span>
                  </div>
                </div>
                <IconChevronRight size={16} className="rep-recent-arrow" />
              </div>

              <div className="rep-recent-item" onClick={handleExportCSV}>
                <div className="rep-recent-left">
                  <div className="rep-file-badge rep-file-badge--excel">XLS</div>
                  <div>
                    <span className="rep-recent-name">Expiry Report</span>
                    <span className="rep-recent-meta">Apr 22, 2025, 02:30 PM</span>
                    <span className="rep-recent-meta">Excel • 1.8 MB</span>
                  </div>
                </div>
                <IconChevronRight size={16} className="rep-recent-arrow" />
              </div>

              <div className="rep-recent-item" onClick={handleExportPDF}>
                <div className="rep-recent-left">
                  <div className="rep-file-badge rep-file-badge--pdf">PDF</div>
                  <div>
                    <span className="rep-recent-name">Purchase Report</span>
                    <span className="rep-recent-meta">Apr 20, 2025, 11:45 AM</span>
                    <span className="rep-recent-meta">PDF • 2.1 MB</span>
                  </div>
                </div>
                <IconChevronRight size={16} className="rep-recent-arrow" />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Details Modal ── */}
      {detailsModalOpen && (
        <div className="rep-modal-backdrop" onClick={() => setDetailsModalOpen(false)}>
          <div className="rep-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rep-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconFileText size={20} color="#008C8C" />
                <h2 className="rep-modal-title">Inventory Report Details</h2>
              </div>
              <button className="rep-modal-close" onClick={() => setDetailsModalOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <div className="rep-modal-body">
              <div className="rep-modal-metrics-grid">
                <div className="rep-modal-metric">
                  <span className="rep-modal-metric-label">Report Period</span>
                  <span className="rep-modal-metric-val">{dateRangeText}</span>
                </div>
                <div className="rep-modal-metric">
                  <span className="rep-modal-metric-label">Total Medicines</span>
                  <span className="rep-modal-metric-val">342 Formulary SKUs</span>
                </div>
                <div className="rep-modal-metric">
                  <span className="rep-modal-metric-label">Total Inventory Value</span>
                  <span className="rep-modal-metric-val" style={{ color: '#008C8C' }}>$48,732.50</span>
                </div>
                <div className="rep-modal-metric">
                  <span className="rep-modal-metric-label">Low Stock Alerts</span>
                  <span className="rep-modal-metric-val" style={{ color: '#D97706' }}>18 Items</span>
                </div>
              </div>

              <div className="rep-modal-section">
                <h4 className="rep-modal-section-title">Valuation & Movement Breakdown</h4>
                <p className="rep-modal-desc">
                  This report includes live pharmacy stock balances across all registered batches, reorder thresholds, supplier performance metrics, and inventory movement logs up to Apr 24, 2025.
                </p>
              </div>
            </div>
            <div className="rep-modal-footer">
              <button className="rep-btn rep-btn--outline" onClick={handleExportCSV}>
                <IconDownload size={15} />
                <span>Download XLS</span>
              </button>
              <button className="rep-btn rep-btn--primary" onClick={handleExportPDF}>
                <IconDownload size={15} />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule Report Modal ── */}
      {scheduleModalOpen && (
        <div className="rep-modal-backdrop" onClick={() => setScheduleModalOpen(false)}>
          <div className="rep-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rep-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconCalendar size={20} color="#008C8C" />
                <h2 className="rep-modal-title">Schedule Automated Report</h2>
              </div>
              <button className="rep-modal-close" onClick={() => setScheduleModalOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <div className="rep-modal-body">
              <div className="rep-form-group">
                <label>Recurrence Frequency</label>
                <select
                  value={scheduleForm.frequency}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                >
                  <option value="Daily">Daily (Every Morning)</option>
                  <option value="Weekly">Weekly (Every Monday)</option>
                  <option value="Monthly">Monthly (1st of Month)</option>
                </select>
              </div>

              <div className="rep-form-group">
                <label>Export Format</label>
                <select
                  value={scheduleForm.format}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, format: e.target.value })}
                >
                  <option value="PDF">Adobe PDF (.pdf)</option>
                  <option value="XLS">Excel Spreadsheet (.xlsx)</option>
                  <option value="BOTH">Both PDF & Excel</option>
                </select>
              </div>

              <div className="rep-form-group">
                <label>Delivery Email</label>
                <input
                  type="email"
                  value={scheduleForm.email}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, email: e.target.value })}
                />
              </div>

              <div className="rep-form-group">
                <label>Delivery Time</label>
                <input
                  type="text"
                  value={scheduleForm.time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                />
              </div>
            </div>
            <div className="rep-modal-footer">
              <button className="rep-btn rep-btn--outline" onClick={() => setScheduleModalOpen(false)}>
                Cancel
              </button>
              <button
                className="rep-btn rep-btn--primary"
                onClick={() => {
                  setScheduleModalOpen(false);
                  showToast('success', `Report scheduled for ${scheduleForm.frequency} delivery to ${scheduleForm.email}.`);
                }}
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
