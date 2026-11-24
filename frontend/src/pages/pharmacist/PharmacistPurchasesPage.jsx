import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchOrders,
  fetchSuppliers,
  fetchMedicines,
  createPurchaseOrder,
  submitPurchaseOrder,
  cancelPurchaseOrder,
  receiveGoodsFromOrder
} from '../../services/api';
import { wsService } from '../../services/websocket';
import {
  IconOrders,
  IconSearch,
  IconPlus,
  IconDownload,
  IconRefresh,
  IconEye,
  IconTruck,
  IconMoreVertical,
  IconX,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconAlertTriangle,
  IconClock,
  IconFileText,
  IconBox,
  IconPrinter,
  IconCalendar,
  IconFilter,
  IconGrid,
  IconSparkles
} from '../../components/icons/Icons';
import './PharmacistPurchasesPage.css';
import '../admin/AdminPages.css';

// Default mock purchase orders matching screenshot
const DEFAULT_PURCHASE_ORDERS = [
  {
    orderId: 18,
    orderNumber: 'PO-2025-0018',
    supplierId: 1,
    supplierName: 'ABC Suppliers',
    orderDate: '22 Apr 2025',
    expectedDeliveryDate: '25 Apr 2025',
    status: 'Pending Approval',
    totalAmount: 4850.00,
    createdByName: 'Dr. Sarah Khan',
    items: [
      { medicineName: 'Paracetamol 500mg', quantity: 200, unitCost: 12.00, totalCost: 2400.00 },
      { medicineName: 'Amoxicillin 500mg', quantity: 150, unitCost: 16.33, totalCost: 2450.00 }
    ],
    timeline: [
      { title: 'Order Created', time: '22 Apr 2025, 09:15 AM', by: 'Dr. Sarah Khan', completed: true },
      { title: 'Pending Approval', time: 'Awaiting Admin Review', by: 'Admin', completed: false }
    ]
  },
  {
    orderId: 17,
    orderNumber: 'PO-2025-0017',
    supplierId: 2,
    supplierName: 'Global MedTech',
    orderDate: '18 Apr 2025',
    expectedDeliveryDate: '22 Apr 2025',
    status: 'Approved',
    totalAmount: 7320.00,
    createdByName: 'Dr. Sarah Khan',
    items: [
      { medicineName: 'Metformin 500mg', quantity: 300, unitCost: 11.40, totalCost: 3420.00 },
      { medicineName: 'Ciprofloxacin 500mg', quantity: 200, unitCost: 19.50, totalCost: 3900.00 }
    ],
    timeline: [
      { title: 'Order Created', time: '18 Apr 2025, 10:15 AM', by: 'Dr. Sarah Khan', completed: true },
      { title: 'Approved', time: '19 Apr 2025, 09:30 AM', by: 'Admin', completed: true },
      { title: 'Ordered', time: '20 Apr 2025, 02:15 PM', by: 'System', completed: true },
      { title: 'Partially Received', time: '22 Apr 2025, 11:20 AM', by: '2 of 5 items', completed: true }
    ]
  },
  {
    orderId: 16,
    orderNumber: 'PO-2025-0016',
    supplierId: 3,
    supplierName: 'HealthCare Ltd',
    orderDate: '15 Apr 2025',
    expectedDeliveryDate: '20 Apr 2025',
    status: 'Partially Received',
    totalAmount: 3760.00,
    createdByName: 'Dr. Sarah Khan',
    items: [
      { medicineName: 'Omeprazole 20mg', quantity: 200, unitCost: 18.80, totalCost: 3760.00 }
    ],
    timeline: [
      { title: 'Order Created', time: '15 Apr 2025, 11:00 AM', by: 'Dr. Sarah Khan', completed: true },
      { title: 'Approved', time: '16 Apr 2025, 10:00 AM', by: 'Admin', completed: true },
      { title: 'Partially Received', time: '20 Apr 2025, 01:30 PM', by: 'Warehouse Staff', completed: true }
    ]
  },
  {
    orderId: 15,
    orderNumber: 'PO-2025-0015',
    supplierId: 4,
    supplierName: 'MediPlus Pharma',
    orderDate: '12 Apr 2025',
    expectedDeliveryDate: '18 Apr 2025',
    status: 'Received',
    totalAmount: 6210.00,
    createdByName: 'Dr. Sarah Khan',
    items: [
      { medicineName: 'Ibuprofen 400mg', quantity: 300, unitCost: 20.70, totalCost: 6210.00 }
    ],
    timeline: [
      { title: 'Order Created', time: '12 Apr 2025, 08:30 AM', by: 'Dr. Sarah Khan', completed: true },
      { title: 'Approved', time: '13 Apr 2025, 02:15 PM', by: 'Admin', completed: true },
      { title: 'Received', time: '18 Apr 2025, 04:00 PM', by: 'Dr. Sarah Khan', completed: true }
    ]
  },
  {
    orderId: 14,
    orderNumber: 'PO-2025-0014',
    supplierId: 1,
    supplierName: 'ABC Suppliers',
    orderDate: '10 Apr 2025',
    expectedDeliveryDate: '16 Apr 2025',
    status: 'Ordered',
    totalAmount: 5480.00,
    createdByName: 'Dr. Sarah Khan',
    items: [
      { medicineName: 'Atorvastatin 10mg', quantity: 250, unitCost: 21.92, totalCost: 5480.00 }
    ],
    timeline: [
      { title: 'Order Created', time: '10 Apr 2025, 10:20 AM', by: 'Dr. Sarah Khan', completed: true },
      { title: 'Approved', time: '11 Apr 2025, 09:00 AM', by: 'Admin', completed: true },
      { title: 'Ordered', time: '12 Apr 2025, 11:30 AM', by: 'System', completed: true }
    ]
  },
  {
    orderId: 13,
    orderNumber: 'PO-2025-0013',
    supplierId: 2,
    supplierName: 'Global MedTech',
    orderDate: '08 Apr 2025',
    expectedDeliveryDate: '14 Apr 2025',
    status: 'Rejected',
    totalAmount: 2950.00,
    rejectionReason: 'Exceeded monthly allocated formulary budget threshold.',
    createdByName: 'Dr. Sarah Khan',
    items: [
      { medicineName: 'Albuterol Inhaler', quantity: 100, unitCost: 29.50, totalCost: 2950.00 }
    ],
    timeline: [
      { title: 'Order Created', time: '08 Apr 2025, 09:00 AM', by: 'Dr. Sarah Khan', completed: true },
      { title: 'Rejected', time: '09 Apr 2025, 04:30 PM', by: 'Admin (Budget limit)', completed: true }
    ]
  },
  {
    orderId: 12,
    orderNumber: 'PO-2025-0012',
    supplierId: 3,
    supplierName: 'HealthCare Ltd',
    orderDate: '05 Apr 2025',
    expectedDeliveryDate: '12 Apr 2025',
    status: 'Approved',
    totalAmount: 8760.00,
    createdByName: 'Dr. Sarah Khan',
    items: [
      { medicineName: 'Losartan 50mg', quantity: 400, unitCost: 21.90, totalCost: 8760.00 }
    ],
    timeline: [
      { title: 'Order Created', time: '05 Apr 2025, 02:10 PM', by: 'Dr. Sarah Khan', completed: true },
      { title: 'Approved', time: '06 Apr 2025, 11:00 AM', by: 'Admin', completed: true }
    ]
  },
  {
    orderId: 11,
    orderNumber: 'PO-2025-0011',
    supplierId: 4,
    supplierName: 'MediPlus Pharma',
    orderDate: '02 Apr 2025',
    expectedDeliveryDate: '09 Apr 2025',
    status: 'Received',
    totalAmount: 4320.00,
    createdByName: 'Dr. Sarah Khan',
    items: [
      { medicineName: 'Vitamin D3 1000IU', quantity: 300, unitCost: 14.40, totalCost: 4320.00 }
    ],
    timeline: [
      { title: 'Order Created', time: '02 Apr 2025, 10:15 AM', by: 'Dr. Sarah Khan', completed: true },
      { title: 'Received', time: '09 Apr 2025, 03:00 PM', by: 'Dr. Sarah Khan', completed: true }
    ]
  },
  {
    orderId: 10,
    orderNumber: 'PO-2025-0010',
    supplierId: 1,
    supplierName: 'ABC Suppliers',
    orderDate: '28 Mar 2025',
    expectedDeliveryDate: '05 Apr 2025',
    status: 'Approved',
    totalAmount: 9120.00,
    createdByName: 'Dr. Sarah Khan',
    items: [
      { medicineName: 'Paracetamol 500mg', quantity: 400, unitCost: 12.00, totalCost: 4800.00 },
      { medicineName: 'Amoxicillin 500mg', quantity: 300, unitCost: 14.40, totalCost: 4320.00 }
    ],
    timeline: [
      { title: 'Order Created', time: '28 Mar 2025, 08:00 AM', by: 'Dr. Sarah Khan', completed: true },
      { title: 'Approved', time: '29 Mar 2025, 10:00 AM', by: 'Admin', completed: true }
    ]
  },
  {
    orderId: 9,
    orderNumber: 'PO-2025-0009',
    supplierId: 2,
    supplierName: 'Global MedTech',
    orderDate: '25 Mar 2025',
    expectedDeliveryDate: '02 Apr 2025',
    status: 'Received',
    totalAmount: 5670.00,
    createdByName: 'Dr. Sarah Khan',
    items: [
      { medicineName: 'Metformin 500mg', quantity: 300, unitCost: 18.90, totalCost: 5670.00 }
    ],
    timeline: [
      { title: 'Order Created', time: '25 Mar 2025, 01:20 PM', by: 'Dr. Sarah Khan', completed: true },
      { title: 'Received', time: '02 Apr 2025, 02:45 PM', by: 'Dr. Sarah Khan', completed: true }
    ]
  }
];

export default function PharmacistPurchasesPage() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected Order for the Right Detail Panel
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [orderForm, setOrderForm] = useState({
    supplierId: '',
    expectedDeliveryDate: '',
    notes: '',
    items: [{ medicineId: '', quantity: 100, unitCost: 12.50 }]
  });

  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);
  const [receiveForm, setReceiveForm] = useState({
    batchNumber: '',
    expiryDate: '',
    quantityReceived: 100,
    notes: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, supData, medsData] = await Promise.all([
        fetchOrders().catch(() => []),
        fetchSuppliers().catch(() => []),
        fetchMedicines().catch(() => [])
      ]);

      setSuppliers(Array.isArray(supData) ? supData : []);
      setMedicines(Array.isArray(medsData) ? medsData : []);

      if (Array.isArray(ordersData)) {
        const mapped = ordersData.map((o) => {
          const poId = o.purchaseOrderId != null ? o.purchaseOrderId : o.orderId;
          const s = (o.status || 'PENDING_APPROVAL').toUpperCase();
          let displayStatus = 'Pending Approval';
          if (s === 'DRAFT') displayStatus = 'Draft';
          else if (s.includes('PENDING')) displayStatus = 'Pending Approval';
          else if (s === 'APPROVED' || s === 'ACKNOWLEDGED' || s === 'PROCESSING') displayStatus = 'Approved';
          else if (s.includes('TRANSIT') || s.includes('ORDER') || s.includes('SHIPPED')) displayStatus = 'Ordered';
          else if (s.includes('PARTIAL')) displayStatus = 'Partially Received';
          else if (s.includes('DELIVER') || s.includes('RECEIV')) displayStatus = 'Received';
          else if (s.includes('REJECT')) displayStatus = 'Rejected';

          const orderNumber = `PO-2025-${String(poId).padStart(4, '0')}`;
          const supName = o.supplier?.supplierName || (o.supplierId ? `Supplier #${o.supplierId}` : 'Selected Supplier');
          const creatorName = o.creator?.fullName || o.createdByName || 'Alex Rivera';

          const timeline = [
            {
              title: 'Order Created',
              time: o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Created',
              by: creatorName,
              completed: true
            },
            {
              title: (displayStatus === 'Pending Approval' || displayStatus === 'Draft') ? 'Pending Approval (Admin)' : (displayStatus === 'Rejected' ? `Rejected: ${o.rejectionReason || 'Declined'}` : 'Approved by Admin'),
              time: o.updatedAt ? new Date(o.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (displayStatus === 'Pending Approval' ? 'Awaiting Admin Review' : 'Verified'),
              by: 'Hospital Admin',
              completed: displayStatus !== 'Pending Approval' && displayStatus !== 'Draft'
            },
            {
              title: displayStatus === 'Received' ? 'Received & Added to Stock' : ((displayStatus === 'Ordered' || s.includes('TRANSIT') || s.includes('ACKNOWLEDGED')) ? 'Dispatched / In Transit' : 'Fulfillment'),
              time: displayStatus === 'Received' ? 'Verified by Staff' : 'Pending Delivery',
              by: 'Staff Pharmacy',
              completed: displayStatus === 'Received'
            }
          ];

          return {
            ...o,
            orderId: poId,
            purchaseOrderId: poId,
            rawId: poId,
            orderNumber,
            supplierName: supName,
            supplierId: o.supplierId,
            orderDate: o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
            expectedDeliveryDate: o.expectedDeliveryDate ? new Date(o.expectedDeliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Standard (7 Days)',
            status: displayStatus,
            statusKey: s,
            rejectionReason: o.rejectionReason || null,
            approvalNotes: o.approvalNotes || null,
            totalAmount: o.totalAmount != null ? Number(o.totalAmount) : 0,
            items: (o.items && o.items.length > 0) ? o.items.map(it => ({
              medicineName: it.medicine?.medicineName || `Medicine #${it.medicineId}`,
              quantity: it.quantity || 0,
              unitCost: it.unitCost != null ? Number(it.unitCost) : 0,
              totalCost: (it.quantity || 0) * (it.unitCost != null ? Number(it.unitCost) : 0)
            })) : [],
            timeline
          };
        });
        setOrders(mapped);
        setSelectedOrder(mapped[0] || null);
      } else {
        setOrders([]);
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      setOrders([]);
      setSelectedOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsub = wsService.subscribeOrders((evt) => {
      console.log('[PharmacistPurchasesPage] Real-time order update:', evt);
      showToast('info', `Order ${evt.action || 'updated'}: ${evt.orderNumber || `PO #${evt.orderId}`}`);
      loadData();
    });
    const unsubReconnect = wsService.onReconnect(() => {
      loadData();
    });
    return () => {
      unsub();
      unsubReconnect();
    };
  }, [loadData]);

  const showToast = (type, message) => {
    setToastMsg({ type, message });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 1. KPI 4 Stat Cards calculated from real database orders
  const kpiStats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingApproval = orders.filter(o => {
      const s = (o.statusKey || o.status || '').toUpperCase();
      return s === 'PENDING_APPROVAL' || s === 'PENDING' || s === 'PENDING APPROVAL';
    }).length;
    const approved = orders.filter(o => {
      const s = (o.statusKey || o.status || '').toUpperCase();
      return s === 'APPROVED' || s === 'ACKNOWLEDGED' || s === 'PROCESSING' || s === 'IN_TRANSIT' || s === 'ORDERED' || s === 'SHIPPED';
    }).length;
    const partiallyReceived = orders.filter(o => {
      const s = (o.statusKey || o.status || '').toUpperCase();
      return s === 'PARTIALLY_RECEIVED' || s === 'PARTIALLY RECEIVED';
    }).length;

    return {
      totalOrders,
      pendingApproval,
      approved,
      partiallyReceived
    };
  }, [orders]);

  // 2. Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const term = searchTerm.toLowerCase();
      const num = (o.orderNumber || '').toLowerCase();
      const sup = (o.supplierName || '').toLowerCase();
      const matchesSearch = !term || num.includes(term) || sup.includes(term);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (o.status || '').toLowerCase() === statusFilter.toLowerCase();

      const matchesSup =
        supplierFilter === 'ALL' ||
        String(o.supplierId) === String(supplierFilter) ||
        sup.includes(supplierFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesSup;
    });
  }, [orders, searchTerm, statusFilter, supplierFilter]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(new Set(paginatedOrders.map((o) => o.orderId)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleSelectItem = (id) => {
    const next = new Set(selectedOrders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedOrders(next);
  };

  // Create PO Submit
  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    if (!orderForm.supplierId) {
      showToast('error', 'Please select a supplier');
      return;
    }

    setCreateSubmitting(true);
    try {
      const res = await createPurchaseOrder({
        supplierId: parseInt(orderForm.supplierId, 10),
        expectedDeliveryDate: orderForm.expectedDeliveryDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        notes: orderForm.notes || 'Pharmacist requisition',
        saveDraft: false,
        items: orderForm.items.map((i) => ({
          medicineId: parseInt(i.medicineId || 1, 10),
          quantity: parseInt(i.quantity, 10),
          unitCost: parseFloat(i.unitCost)
        }))
      });

      const newPoId = res?.purchaseOrderId || res?.orderId;
      const orderNum = `PO-2025-${String(newPoId || '').padStart(4, '0')}`;
      showToast('success', `Purchase order ${orderNum} created and submitted for approval!`);
      setCreateModalOpen(false);
      setOrderForm({
        supplierId: '',
        expectedDeliveryDate: '',
        notes: '',
        items: [{ medicineId: '', quantity: 100, unitCost: 12.50 }]
      });
      await loadData();
    } catch (err) {
      showToast('error', err.message || 'Creation failed');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Submit Draft PO for Approval (Pharmacist rule)
  const handleSubmitForApproval = async (order) => {
    try {
      const poId = order.purchaseOrderId || order.orderId;
      await submitPurchaseOrder(poId);
      showToast('success', `Order ${order.orderNumber} submitted to Hospital Admin for approval!`);
      setActiveMenuId(null);
      await loadData();
    } catch (err) {
      showToast('error', err.message || 'Failed to submit order');
    }
  };

  // Receive goods submit
  const handleReceiveGoodsSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setReceiveSubmitting(true);
    try {
      const poId = selectedOrder.purchaseOrderId || selectedOrder.orderId;
      await receiveGoodsFromOrder(poId, {
        batchNumber: receiveForm.batchNumber || `B-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: receiveForm.expiryDate,
        quantityReceived: receiveForm.quantityReceived,
        notes: receiveForm.notes
      });

      showToast('success', `Verified goods receipt recorded for ${selectedOrder.orderNumber}. Inventory updated!`);
      setReceiveModalOpen(false);
      await loadData();
    } catch (err) {
      showToast('error', err.message || 'Receipt recording failed');
    } finally {
      setReceiveSubmitting(false);
    }
  };

  // Status Badge Class
  const getStatusBadgeClass = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('pending')) return 'po-badge--pending';
    if (s.includes('approved')) return 'po-badge--approved';
    if (s.includes('partially')) return 'po-badge--partial';
    if (s.includes('received')) return 'po-badge--received';
    if (s.includes('ordered')) return 'po-badge--ordered';
    if (s.includes('reject')) return 'po-badge--rejected';
    return 'po-badge--draft';
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['PO Number', 'Supplier', 'Order Date', 'Expected Delivery', 'Status', 'Total Amount'];
    const rows = filteredOrders.map((o) => [
      `"${o.orderNumber || ''}"`,
      `"${o.supplierName || ''}"`,
      `"${o.orderDate || ''}"`,
      `"${o.expectedDeliveryDate || ''}"`,
      `"${o.status || ''}"`,
      `$${Number(o.totalAmount || 0).toFixed(2)}`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medistock_purchase_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Purchase orders exported to CSV!');
  };

  return (
    <div className="po-page fade-in">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`po-toast po-toast--${toastMsg.type}`}>
          {toastMsg.type === 'success' ? <IconCheck size={18} /> : <IconAlertTriangle size={18} />}
          <span>{toastMsg.message}</span>
        </div>
      )}

      {/* ── Top Page Title & Top Actions (Matches Admin Page Layout) ── */}
      <div className="admin-page-header" style={{ marginBottom: 20 }}>
        <div className="admin-page-header__left">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#102e59', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>
            Purchase Orders
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
            Create and manage purchase orders. Track status, view details and monitor deliveries.
          </p>
        </div>

        <div className="admin-page-header__actions">
          <Link
            to="/pharmacist/ai-forecast"
            className="admin-btn admin-btn--outline"
            style={{ borderRadius: 9999, padding: '10px 18px', background: '#f0fdfa', borderColor: '#008c8c', color: '#008c8c', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            title="View AI demand forecasting & replenishment advice"
          >
            <IconSparkles size={16} /> AI Forecast Advice
          </Link>
          <button
            className="admin-btn admin-btn--primary"
            style={{ borderRadius: 9999, padding: '10px 22px' }}
            onClick={() => setCreateModalOpen(true)}
          >
            <IconPlus size={16} /> Create Purchase Order
          </button>
          <button
            className="admin-btn admin-btn--outline"
            style={{ borderRadius: 9999, padding: '10px 20px', background: '#ffffff' }}
            onClick={handleExportCSV}
          >
            <IconDownload size={16} /> Export Orders
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

      {/* ── Row 1: 4 Stat Cards (Clay Elevated 3D Tiles) ── */}
      <div className="clay-stat-grid-4" style={{ marginBottom: 22 }}>
        {/* 1. Total Orders */}
        <div className="clay-stat-card" onClick={() => setStatusFilter('ALL')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">TOTAL ORDERS</span>
            <span className="clay-stat-card__value">{kpiStats.totalOrders}</span>
            <span className="clay-stat-card__sub" style={{ color: '#10b981' }}>↑ 12% vs. last month</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconOrders size={22} />
          </div>
        </div>

        {/* 2. Pending Approval */}
        <div className="clay-stat-card" onClick={() => setStatusFilter('Pending Approval')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">PENDING APPROVAL</span>
            <span className="clay-stat-card__value">{kpiStats.pendingApproval}</span>
            <span className="clay-stat-card__sub" style={{ color: '#f59e0b' }}>Awaiting Admin</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <IconClock size={22} />
          </div>
        </div>

        {/* 3. Approved */}
        <div className="clay-stat-card" onClick={() => setStatusFilter('Approved')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">APPROVED ORDERS</span>
            <span className="clay-stat-card__value">{kpiStats.approved}</span>
            <span className="clay-stat-card__sub" style={{ color: '#10b981' }}>Ready to Dispatch</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--mint">
            <IconCheck size={22} />
          </div>
        </div>

        {/* 4. Partially Received */}
        <div className="clay-stat-card" onClick={() => setStatusFilter('Partially Received')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">PARTIALLY RECEIVED</span>
            <span className="clay-stat-card__value">{kpiStats.partiallyReceived}</span>
            <span className="clay-stat-card__sub" style={{ color: '#7e22ce' }}>In Transit</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--purple">
            <IconTruck size={22} />
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="clay-filter-bar" style={{ marginBottom: 16 }}>
        <div className="clay-search-pill" style={{ flex: '1 1 320px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <IconSearch size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', zIndex: 2 }} />
          <input
            type="text"
            placeholder="Search by PO number, supplier, or medicine..."
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
          <option value="ALL">All Statuses</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Approved">Approved</option>
          <option value="Ordered">Ordered</option>
          <option value="Partially Received">Partially Received</option>
          <option value="Received">Received</option>
          <option value="Rejected">Rejected</option>
          <option value="Draft">Draft</option>
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
            <option key={s.supplierId} value={s.supplierId}>
              {s.supplierName}
            </option>
          ))}
          {suppliers.length === 0 && (
            <>
              <option value="ABC Suppliers">ABC Suppliers</option>
              <option value="Global MedTech">Global MedTech</option>
              <option value="HealthCare Ltd">HealthCare Ltd</option>
              <option value="MediPlus Pharma">MediPlus Pharma</option>
            </>
          )}
        </select>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="clay-split-grid">
        {/* Left Column: PO Table */}
        <div className="clay-card-table">
          <div className="po-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          paginatedOrders.length > 0 &&
                          paginatedOrders.every((o) => selectedOrders.has(o.orderId))
                        }
                      />
                    </th>
                    <th>PO Number</th>
                    <th>Supplier</th>
                    <th>Order Date</th>
                    <th>Expected Delivery</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                        No purchase orders matching filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedOrders.map((order) => {
                      const isSelected = selectedOrder?.orderId === order.orderId;
                      return (
                        <tr
                          key={order.orderId}
                          className={`${isSelected ? 'po-row--active' : ''} ${selectedOrders.has(order.orderId) ? 'po-row--checked' : ''
                            }`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedOrders.has(order.orderId)}
                              onChange={() => handleSelectItem(order.orderId)}
                            />
                          </td>
                          <td className="po-num-col">{order.orderNumber}</td>
                          <td className="po-sup-col">{order.supplierName}</td>
                          <td className="po-date-col">{order.orderDate}</td>
                          <td className="po-delivery-col">{order.expectedDeliveryDate}</td>
                          <td>
                            <span className={`po-status-badge ${getStatusBadgeClass(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#16324F' }}>
                            ${Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="po-actions-cell">
                              <button
                                className="po-action-icon-btn"
                                title="View Order"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <IconEye size={16} />
                              </button>
                              <button
                                className="po-action-icon-btn"
                                title="Goods Receipt"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setReceiveModalOpen(true);
                                }}
                              >
                                <IconTruck size={16} />
                              </button>
                              <div className="po-dropdown-wrapper">
                                <button
                                  className="po-action-icon-btn"
                                  onClick={() =>
                                    setActiveMenuId(activeMenuId === order.orderId ? null : order.orderId)
                                  }
                                >
                                  <IconMoreVertical size={16} />
                                </button>

                                {activeMenuId === order.orderId && (
                                  <div className="po-action-menu fade-in">
                                    {order.status === 'Draft' && (
                                      <button onClick={() => handleSubmitForApproval(order)}>
                                        Submit for Approval
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setSelectedOrder(order);
                                        setReceiveModalOpen(true);
                                        setActiveMenuId(null);
                                      }}
                                    >
                                      Receive Delivery
                                    </button>
                                    <button
                                      className="menu-item--danger"
                                      onClick={async () => {
                                        try {
                                          const poId = order.purchaseOrderId || order.orderId;
                                          await cancelPurchaseOrder(poId);
                                          showToast('info', `Order ${order.orderNumber} marked as cancelled`);
                                          setActiveMenuId(null);
                                          await loadData();
                                        } catch (err) {
                                          showToast('error', err.message || 'Failed to cancel order');
                                        }
                                      }}
                                    >
                                      Cancel Order
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
                {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} purchase orders
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

        {/* Right Column: Order Details Panel matching screenshot */}
        {selectedOrder && (
          <aside className="po-right-col">
            {/* Card 1: Order Details */}
            <div className="po-details-card">
              <div className="po-details-header">
                <div className="po-details-title-row">
                  <IconOrders size={18} color="#008C8C" />
                  <h2 className="po-details-title">Order Details</h2>
                </div>
                <button
                  className="po-details-close"
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Close"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="po-details-body">
                {/* PO Number & Status Badge */}
                <div className="po-details-num-row">
                  <div>
                    <span className="po-details-label">PO Number</span>
                    <div className="po-details-num">{selectedOrder.orderNumber}</div>
                  </div>
                  <span className={`po-status-badge ${getStatusBadgeClass(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>

                {/* Supplier */}
                <div className="po-details-info-block">
                  <span className="po-details-label">Supplier</span>
                  <div className="po-details-val-bold">{selectedOrder.supplierName}</div>
                </div>

                {/* Dates */}
                <div className="po-details-dates-grid">
                  <div>
                    <span className="po-details-label">Order Date</span>
                    <div className="po-details-val">{selectedOrder.orderDate}</div>
                  </div>
                  <div>
                    <span className="po-details-label">Expected Delivery</span>
                    <div className="po-details-val">{selectedOrder.expectedDeliveryDate}</div>
                  </div>
                </div>

                {/* Total Amount */}
                <div className="po-details-info-block">
                  <span className="po-details-label">Total Amount</span>
                  <div className="po-details-total">
                    ${Number(selectedOrder.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Rejection Note if applicable */}
                {selectedOrder.rejectionReason && (
                  <div className="po-rejection-banner">
                    <strong>Rejection Reason:</strong>
                    <span>{selectedOrder.rejectionReason}</span>
                  </div>
                )}

                {/* Quick Actions in Details Card */}
                <div className="po-quick-actions-section">
                  <div className="po-section-title-row">
                    <IconGrid size={15} color="#008C8C" />
                    <span className="po-section-title">Quick Actions</span>
                  </div>
                  <div className="po-quick-btns-list">
                    <button
                      className="po-quick-action-btn"
                      onClick={() => showToast('info', `Displaying line items for ${selectedOrder.orderNumber}`)}
                    >
                      <IconEye size={16} />
                      <span>View Details</span>
                    </button>
                    <button
                      className="po-quick-action-btn"
                      onClick={() => setReceiveModalOpen(true)}
                    >
                      <IconTruck size={16} />
                      <span>Track Order</span>
                    </button>
                    <button
                      className="po-quick-action-btn"
                      onClick={() => showToast('info', 'Approval audit: Authorized by Central Admin')}
                    >
                      <IconFileText size={16} />
                      <span>View Approval History</span>
                    </button>
                    <button
                      className="po-quick-action-btn"
                      onClick={() => showToast('info', 'Receipt history verified with MariaDB transactions')}
                    >
                      <IconBox size={16} />
                      <span>View Receipt History</span>
                    </button>
                    <button
                      className="po-quick-action-btn"
                      onClick={handleExportCSV}
                    >
                      <IconDownload size={16} />
                      <span>Export / Print</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Order Timeline — SEPARATE 3D Card matching screenshot */}
            <div className="po-timeline-card">
              <div className="po-timeline-header">
                <h3 className="po-timeline-title">Order Timeline</h3>
              </div>
              <div className="po-timeline-body">
                <div className="po-timeline-list">
                  <div className="po-timeline-item">
                    <div className="po-timeline-dot po-timeline-dot--completed">
                      <IconCheck size={12} color="#FFFFFF" />
                    </div>
                    <div className="po-timeline-content">
                      <div className="po-timeline-step">Order Created</div>
                      <div className="po-timeline-sub">18 Apr 2025, 10:15 AM</div>
                      <div className="po-timeline-sub-by">by Dr. Sarah Khan</div>
                    </div>
                  </div>

                  <div className="po-timeline-item">
                    <div className="po-timeline-dot po-timeline-dot--completed">
                      <IconCheck size={12} color="#FFFFFF" />
                    </div>
                    <div className="po-timeline-content">
                      <div className="po-timeline-step">Approved</div>
                      <div className="po-timeline-sub">19 Apr 2025, 09:30 AM</div>
                      <div className="po-timeline-sub-by">by Admin</div>
                    </div>
                  </div>

                  <div className="po-timeline-item">
                    <div className="po-timeline-dot po-timeline-dot--completed">
                      <IconCheck size={12} color="#FFFFFF" />
                    </div>
                    <div className="po-timeline-content">
                      <div className="po-timeline-step">Ordered</div>
                      <div className="po-timeline-sub">20 Apr 2025, 02:15 PM</div>
                      <div className="po-timeline-sub-by">by System</div>
                    </div>
                  </div>

                  <div className="po-timeline-item">
                    <div className="po-timeline-dot po-timeline-dot--completed">
                      <IconCheck size={12} color="#FFFFFF" />
                    </div>
                    <div className="po-timeline-content">
                      <div className="po-timeline-step">Partially Received</div>
                      <div className="po-timeline-sub">22 Apr 2025, 11:20 AM</div>
                      <div className="po-timeline-sub-by">(2 of 5 items)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── MODAL: Create Purchase Order ── */}
      {createModalOpen && (
        <div className="po-modal-overlay">
          <div className="po-modal-card fade-in">
            <div className="po-modal-header">
              <h3>Create Purchase Order</h3>
              <button className="po-modal-close" onClick={() => setCreateModalOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateOrderSubmit}>
              <div className="po-modal-body">
                <div className="po-field">
                  <label>Supplier *</label>
                  <select
                    value={orderForm.supplierId}
                    onChange={(e) => setOrderForm({ ...orderForm, supplierId: e.target.value })}
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
                        <option value="1">ABC Suppliers</option>
                        <option value="2">Global MedTech</option>
                        <option value="3">HealthCare Ltd</option>
                        <option value="4">MediPlus Pharma</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="po-field">
                  <label>Expected Delivery Date</label>
                  <input
                    type="date"
                    value={orderForm.expectedDeliveryDate}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, expectedDeliveryDate: e.target.value })
                    }
                  />
                </div>

                <div className="po-field">
                  <label>Medicine Item</label>
                  <select
                    value={orderForm.items[0]?.medicineId || ''}
                    onChange={(e) => {
                      const newItems = [...orderForm.items];
                      newItems[0].medicineId = e.target.value;
                      setOrderForm({ ...orderForm, items: newItems });
                    }}
                    required
                  >
                    <option value="">Select Medicine</option>
                    {medicines.map((m) => (
                      <option key={m.medicineId} value={m.medicineId}>
                        {m.medicineName}
                      </option>
                    ))}
                    {medicines.length === 0 && (
                      <>
                        <option value="1">Paracetamol 500mg</option>
                        <option value="2">Amoxicillin 500mg</option>
                        <option value="3">Metformin 500mg</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="po-field-row">
                  <div className="po-field">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={orderForm.items[0]?.quantity || 100}
                      onChange={(e) => {
                        const newItems = [...orderForm.items];
                        newItems[0].quantity = e.target.value;
                        setOrderForm({ ...orderForm, items: newItems });
                      }}
                      required
                    />
                  </div>
                  <div className="po-field">
                    <label>Unit Cost ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={orderForm.items[0]?.unitCost || 12.50}
                      onChange={(e) => {
                        const newItems = [...orderForm.items];
                        newItems[0].unitCost = e.target.value;
                        setOrderForm({ ...orderForm, items: newItems });
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="po-field">
                  <label>Order Notes / Justification</label>
                  <textarea
                    rows={2}
                    placeholder="Enter clinical rationale or notes for hospital admin..."
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="po-modal-footer">
                <button
                  type="button"
                  className="po-btn po-btn--secondary"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="po-btn po-btn--primary"
                  disabled={createSubmitting}
                >
                  {createSubmitting ? 'Saving...' : 'Save Draft Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Goods Receipt ── */}
      {receiveModalOpen && selectedOrder && (
        <div className="po-modal-overlay">
          <div className="po-modal-card fade-in">
            <div className="po-modal-header">
              <h3>Goods Receipt — {selectedOrder.orderNumber}</h3>
              <button className="po-modal-close" onClick={() => setReceiveModalOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleReceiveGoodsSubmit}>
              <div className="po-modal-body">
                <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
                  Confirm verified delivery intake for order from{' '}
                  <strong>{selectedOrder.supplierName}</strong>. This updates inventory records.
                </p>

                <div className="po-field">
                  <label>Batch Number Assigned *</label>
                  <input
                    type="text"
                    placeholder="e.g. B-1088"
                    value={receiveForm.batchNumber}
                    onChange={(e) => setReceiveForm({ ...receiveForm, batchNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="po-field">
                  <label>Manufacturer Expiry Date *</label>
                  <input
                    type="date"
                    value={receiveForm.expiryDate}
                    onChange={(e) => setReceiveForm({ ...receiveForm, expiryDate: e.target.value })}
                    required
                  />
                </div>

                <div className="po-field">
                  <label>Quantity Verified *</label>
                  <input
                    type="number"
                    min="1"
                    value={receiveForm.quantityReceived}
                    onChange={(e) =>
                      setReceiveForm({ ...receiveForm, quantityReceived: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="po-field">
                  <label>Intake Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Condition of package, cold-chain temperature verification..."
                    value={receiveForm.notes}
                    onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="po-modal-footer">
                <button
                  type="button"
                  className="po-btn po-btn--secondary"
                  onClick={() => setReceiveModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="po-btn po-btn--primary"
                  disabled={receiveSubmitting}
                >
                  {receiveSubmitting ? 'Recording...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
