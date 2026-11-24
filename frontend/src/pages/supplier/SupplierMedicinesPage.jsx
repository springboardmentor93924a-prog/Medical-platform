import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconPill,
  IconClock,
  IconCheckCircle,
  IconAlertTriangle,
  IconSearch,
  IconFilter,
  IconRefresh,
  IconDownload,
  IconPlus,
  IconEye,
  IconEdit,
  IconSave,
  IconPackage,
  IconTag,
  IconX
} from '../../components/icons/Icons';
import { fetchMedicines } from '../../services/api';
import PaginationBar from '../../components/ui/PaginationBar';
import '../staff/StaffCommon.css';

export default function SupplierMedicinesPage() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination for Supplied Pharmaceuticals
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, statusFilter]);

  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Edit / Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editPrice, setEditPrice] = useState('');
  const [editLeadTime, setEditLeadTime] = useState('');
  const [editStock, setEditStock] = useState('');

  // New medicine form state
  const [newMed, setNewMed] = useState({
    name: '',
    sku: '',
    category: 'Analgesics',
    price: '',
    leadTime: '2 Days',
    stock: 5000,
    status: 'In Stock',
    storage: 'Controlled Room Temp (15-25°C)',
    moq: 100
  });

  // Live formatted date & time
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
    const timer = setInterval(updateDateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const defaultMedicines = useMemo(() => [
    {
      id: 1,
      name: 'Paracetamol 500mg Tablets',
      sku: 'APX-PCT-500',
      category: 'Analgesics',
      price: 5.20,
      stock: 18500,
      leadTime: '2 Days',
      status: 'In Stock',
      moq: 500,
      storage: 'Room Temperature (15-25°C)',
      activeIngredients: 'Paracetamol 500mg',
      packaging: 'Blister pack of 10x10 strips',
      hsnCode: '30049099'
    },
    {
      id: 2,
      name: 'Amoxicillin 250mg Capsules',
      sku: 'APX-AMX-250',
      category: 'Antibiotics',
      price: 12.50,
      stock: 12400,
      leadTime: '3 Days',
      status: 'In Stock',
      moq: 200,
      storage: 'Cool dry place, avoid humidity',
      activeIngredients: 'Amoxicillin Trihydrate 250mg',
      packaging: 'Bottle of 100 capsules',
      hsnCode: '30041010'
    },
    {
      id: 3,
      name: 'Omeprazole 20mg Delayed-Release',
      sku: 'APX-OMP-020',
      category: 'Gastrointestinal',
      price: 18.75,
      stock: 3200,
      leadTime: '2 Days',
      status: 'Low Supply',
      moq: 300,
      storage: 'Protect from moisture & direct light',
      activeIngredients: 'Omeprazole 20mg',
      packaging: 'Strip of 14 capsules',
      hsnCode: '30049086'
    },
    {
      id: 4,
      name: 'Atorvastatin 10mg Film-Coated',
      sku: 'APX-ATV-010',
      category: 'Cardiovascular',
      price: 32.00,
      stock: 9600,
      leadTime: '4 Days',
      status: 'In Stock',
      moq: 150,
      storage: 'Store below 30°C',
      activeIngredients: 'Atorvastatin Calcium 10mg',
      packaging: 'Alu-Alu blister pack of 30',
      hsnCode: '30049079'
    },
    {
      id: 5,
      name: 'Metformin 500mg Extended Release',
      sku: 'APX-MET-500',
      category: 'Diabetes',
      price: 8.90,
      stock: 22000,
      leadTime: '2 Days',
      status: 'In Stock',
      moq: 500,
      storage: 'Standard warehouse conditions',
      activeIngredients: 'Metformin Hydrochloride 500mg',
      packaging: 'Pack of 100 tablets',
      hsnCode: '30049091'
    },
    {
      id: 6,
      name: 'Salbutamol 100mcg CFC-Free Inhaler',
      sku: 'APX-SLB-100',
      category: 'Respiratory',
      price: 230.00,
      stock: 1400,
      leadTime: '5 Days',
      status: 'Low Supply',
      moq: 50,
      storage: 'Store below 25°C, avoid freezing',
      activeIngredients: 'Salbutamol 100mcg/actuation',
      packaging: 'Canister with 200 actuations',
      hsnCode: '30049089'
    },
    {
      id: 7,
      name: 'Ceftriaxone 1g Sterile Injection',
      sku: 'APX-CFT-100',
      category: 'Antibiotics',
      price: 70.00,
      stock: 4500,
      leadTime: '3 Days',
      status: 'In Stock',
      moq: 100,
      storage: 'Protect from light, store below 25°C',
      activeIngredients: 'Ceftriaxone Sodium 1g',
      packaging: 'Glass vial with sterile water ampoule',
      hsnCode: '30042099'
    },
    {
      id: 8,
      name: 'Insulin Glargine 100 IU/ml Cartridge',
      sku: 'APX-INS-100',
      category: 'Diabetes',
      price: 495.00,
      stock: 850,
      leadTime: '2 Days',
      status: 'In Stock',
      moq: 30,
      storage: 'Cold Chain (2°C - 8°C), Do not freeze',
      activeIngredients: 'Insulin Glargine recombinant',
      packaging: 'Cartridge pack of 5x3ml',
      hsnCode: '30043110'
    }
  ], []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMedicines();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((m, idx) => ({
          id: m.id || idx + 1,
          name: m.name || m.medicineName || 'Pharmaceutical Formulation',
          sku: m.sku || m.code || `APX-${String(idx + 100)}`,
          category: m.category?.name || m.category || 'General',
          price: m.price || m.unitPrice || 24.50,
          stock: m.currentStock || m.quantity || 4500,
          leadTime: m.leadTime || '2-3 Days',
          status: m.currentStock > 1000 ? 'In Stock' : (m.currentStock > 0 ? 'Low Supply' : 'Out of Stock'),
          moq: m.minOrderQuantity || 100,
          storage: m.storageCondition || 'Room Temp (15-25°C)',
          activeIngredients: m.genericName || m.name,
          packaging: m.packaging || 'Standard Hospital Pack',
          hsnCode: m.hsnCode || '30049099'
        }));
        setMedicines(mapped);
        setSelectedMedicine(mapped[0]);
      } else {
        setMedicines([]);
        setSelectedMedicine(null);
      }
    } catch (_err) {
      setMedicines([]);
      setSelectedMedicine(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When selected medicine changes, pre-fill edit fields
  useEffect(() => {
    if (selectedMedicine) {
      setEditPrice(String(selectedMedicine.price));
      setEditLeadTime(selectedMedicine.leadTime);
      setEditStock(String(selectedMedicine.stock));
    }
  }, [selectedMedicine]);

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        m.name.toLowerCase().includes(query) ||
        m.sku.toLowerCase().includes(query) ||
        (m.category && m.category.toLowerCase().includes(query));

      const matchCat =
        categoryFilter === 'ALL' ||
        (m.category && m.category.toLowerCase() === categoryFilter.toLowerCase());

      const matchStatus =
        statusFilter === 'ALL' ||
        m.status.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchCat && matchStatus;
    });
  }, [medicines, searchQuery, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMedicines.length / pageSize));
  const paginatedMedicines = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMedicines.slice(start, start + pageSize);
  }, [filteredMedicines, currentPage, pageSize]);

  // Summary statistics
  const stats = useMemo(() => {
    const totalLines = medicines.length;
    const totalUnits = medicines.reduce((sum, m) => sum + (Number(m.stock) || 0), 0);
    const lowSupplyCount = medicines.filter(m => m.status === 'Low Supply' || m.stock < 3500).length;
    return {
      totalLines,
      totalUnits,
      lowSupplyCount,
      avgLeadTime: medicines.length > 0 ? '2.4 Days' : '0 Days'
    };
  }, [medicines]);

  // Category unique list
  const categories = useMemo(() => {
    const set = new Set(medicines.map(m => m.category).filter(Boolean));
    return Array.from(set);
  }, [medicines]);

  // Status badge styling
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('in stock') || s.includes('available')) return 'staff-badge--received';
    if (s.includes('low')) return 'staff-badge--warning';
    if (s.includes('out')) return 'staff-badge--critical';
    return 'staff-badge--neutral';
  };

  // Save quick updates to price / lead time
  const handleSaveQuickUpdate = (e) => {
    e.preventDefault();
    if (!selectedMedicine) return;

    const parsedPrice = parseFloat(editPrice) || selectedMedicine.price;
    const parsedStock = parseInt(editStock, 10) || selectedMedicine.stock;

    const updated = medicines.map((m) => {
      if (m.id === selectedMedicine.id) {
        return {
          ...m,
          price: parsedPrice,
          leadTime: editLeadTime,
          stock: parsedStock,
          status: parsedStock < 2000 ? 'Low Supply' : 'In Stock'
        };
      }
      return m;
    });

    setMedicines(updated);
    setSelectedMedicine(prev => ({
      ...prev,
      price: parsedPrice,
      leadTime: editLeadTime,
      stock: parsedStock,
      status: parsedStock < 2000 ? 'Low Supply' : 'In Stock'
    }));

    showToast(`Updated terms for ${selectedMedicine.name}: ₹${parsedPrice} / ${editLeadTime}`);
  };

  // Add new medicine supply
  const handleCreateMedicine = (e) => {
    e.preventDefault();
    if (!newMed.name || !newMed.sku || !newMed.price) {
      showToast('Please fill all required fields (*)');
      return;
    }

    const created = {
      id: Date.now(),
      name: newMed.name,
      sku: newMed.sku.toUpperCase(),
      category: newMed.category,
      price: parseFloat(newMed.price) || 10,
      stock: parseInt(newMed.stock, 10) || 1000,
      leadTime: newMed.leadTime,
      status: newMed.status,
      moq: parseInt(newMed.moq, 10) || 100,
      storage: newMed.storage,
      activeIngredients: newMed.name,
      packaging: 'Commercial hospital pack',
      hsnCode: '30049099'
    };

    setMedicines([created, ...medicines]);
    setSelectedMedicine(created);
    setIsAddModalOpen(false);
    setNewMed({
      name: '',
      sku: '',
      category: 'Analgesics',
      price: '',
      leadTime: '2 Days',
      stock: 5000,
      status: 'In Stock',
      storage: 'Controlled Room Temp (15-25°C)',
      moq: 100
    });
    showToast(`Medicine ${created.name} successfully added to supplied catalog!`);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredMedicines.length === 0) {
      showToast('No medicines to export.');
      return;
    }
    const headers = ['SKU', 'Medicine Name', 'Category', 'Unit Supply Price (INR)', 'Warehouse Stock', 'Lead Time', 'MOQ', 'Status'];
    const rows = filteredMedicines.map(m => [
      m.sku,
      `"${m.name}"`,
      m.category,
      m.price,
      m.stock,
      `"${m.leadTime}"`,
      m.moq,
      m.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Contracted_Medicines_Catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Catalog exported to CSV successfully!');
  };

  return (
    <div className="admin-page-container fade-in">
      {/* ── Universal Header ── */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <h1 className="admin-dash-title">Supplied Medicines Catalog</h1>
          <p className="admin-dash-sub">
            Contracted hospital pharmaceuticals, wholesale price schedules, delivery lead times, and warehouse allocations.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600, marginRight: 8 }}>
            {dateTime || 'Apr 29, 2025 11:42 AM'}
          </span>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="clay-action-pill-btn clay-action-pill-btn--primary"
            title="Add New Medicine to Catalog"
          >
            <IconPlus size={15} /> Add Medicine
          </button>
          <button
            onClick={handleExportCSV}
            className="clay-action-pill-btn clay-action-pill-btn--secondary"
            title="Export Catalog to CSV"
          >
            <IconDownload size={15} /> Export CSV
          </button>
          <button
            onClick={loadData}
            className="clay-action-pill-btn clay-action-pill-btn--secondary"
            title="Refresh Medicine Catalog"
          >
            <IconRefresh size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div style={{
          background: 'linear-gradient(135deg, #008C8C 0%, #007070 100%)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 20px rgba(0, 140, 140, 0.25)',
          margin: '4px 0'
        }}>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: '12px' }}
          >
            <IconX size={16} />
          </button>
        </div>
      )}

      {/* ── Row 1: 4 Clay KPI Cards ── */}
      <div className="clay-stat-grid-4">
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Contracted Medicines</span>
            <div className="clay-stat-card__value">{stats.totalLines}</div>
            <span className="clay-stat-card__sub">Active hospital catalog</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconPill size={22} />
          </div>
        </div>

        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">In-Stock Units</span>
            <div className="clay-stat-card__value">{stats.totalUnits.toLocaleString()}</div>
            <span className="clay-stat-card__sub">Ready for hospital POs</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--blue">
            <IconPackage size={22} />
          </div>
        </div>

        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Low Supply Lines</span>
            <div className="clay-stat-card__value" style={{ color: stats.lowSupplyCount > 0 ? '#ea580c' : '#0f172a' }}>
              {stats.lowSupplyCount}
            </div>
            <span className="clay-stat-card__sub" style={{ color: '#ea580c', fontWeight: 600 }}>Replenishment scheduled</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <IconAlertTriangle size={22} />
          </div>
        </div>

        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Avg Lead Time</span>
            <div className="clay-stat-card__value">{stats.avgLeadTime}</div>
            <span className="clay-stat-card__sub" style={{ color: '#16a34a', fontWeight: 600 }}>Fast fulfillment</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--mint">
            <IconClock size={22} />
          </div>
        </div>
      </div>

      {/* ── Row 2: Search & Filter Bar ── */}
      <div className="clay-filter-bar">
        <div className="clay-search-pill" style={{ flex: 1, minWidth: '240px' }}>
          <IconSearch size={16} />
          <input
            type="text"
            placeholder="Search medicine name, SKU, or active salt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.84rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="clay-select-pill"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by Category"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="clay-select-pill"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by Status"
          >
            <option value="ALL">All Supply Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Supply">Low Supply</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* ── Row 3: Split Layout (Catalog Table + Supply Terms Inspector) ── */}
      <div className="clay-split-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 380px' }}>
        {/* Left Column: Medicines Catalog Table */}
        <div className="clay-card-table">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #eef3f8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="clay-stat-card__icon-squircle clay-squircle--teal" style={{ width: 34, height: 34, minWidth: 34 }}>
                <IconPill size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#16324F' }}>Supplied Pharmaceuticals</h2>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#008C8C', fontWeight: 600 }}>
              {filteredMedicines.length} Formulations
            </span>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Medicine Formulation</th>
                  <th>SKU / Code</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Wholesale (₹)</th>
                  <th style={{ textAlign: 'right' }}>Warehouse Units</th>
                  <th>Lead Time</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      Loading medicine catalog...
                    </td>
                  </tr>
                ) : filteredMedicines.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No medicines matched the specified filters.
                    </td>
                  </tr>
                ) : (
                  paginatedMedicines.map((med) => {
                    const isSelected = selectedMedicine?.id === med.id;
                    return (
                      <tr
                        key={med.id}
                        onClick={() => setSelectedMedicine(med)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(0, 140, 140, 0.05)' : undefined,
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        <td style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                          {med.name}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#008C8C', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {med.sku}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#f1f5f9',
                            fontSize: '0.78rem',
                            color: '#334155'
                          }}>
                            {med.category}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#008C8C', whiteSpace: 'nowrap' }}>
                          ₹ {typeof med.price === 'number' ? med.price.toFixed(2) : med.price}
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600, color: med.stock < 2500 ? '#ea580c' : '#0f172a' }}>
                            {med.stock?.toLocaleString()}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', color: '#64748b' }}>
                          {med.leadTime}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span className={`staff-badge ${getStatusBadge(med.status)}`}>
                            {med.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMedicine(med);
                            }}
                            className="clay-action-pill-btn clay-action-pill-btn--secondary"
                            style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                          >
                            <IconEdit size={13} /> Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Numbered Pagination (1, 2, 3...) */}
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredMedicines.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[5, 8, 15, 30]}
          />
        </div>

        {/* Right Column: Supply Terms & Lead-Time Inspector */}
        <div className="clay-side-widget">
          {selectedMedicine ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ paddingBottom: '12px', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>
                    Supply Specification
                  </span>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '1.15rem', color: '#008C8C', fontWeight: 700 }}>
                    {selectedMedicine.name}
                  </h3>
                </div>
                <span className={`staff-badge ${getStatusBadge(selectedMedicine.status)}`}>
                  {selectedMedicine.status}
                </span>
              </div>

              {/* Medicine Clinical & Packaging Details */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>SKU Code:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#008C8C' }}>{selectedMedicine.sku}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Category:</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedMedicine.category}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Minimum Order Qty (MOQ):</span>
                  <span style={{ fontWeight: 600 }}>{selectedMedicine.moq} Units</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>Packaging:</span>
                  <span style={{ color: '#334155' }}>{selectedMedicine.packaging}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Storage Protocol:</span>
                  <span style={{ fontWeight: 500, color: '#008C8C' }}>{selectedMedicine.storage}</span>
                </div>
              </div>

              {/* Interactive Supply Terms Update Form */}
              <form onSubmit={handleSaveQuickUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '12px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#0f172a', fontWeight: 600 }}>
                    Contract Terms & Warehouse Allocation
                  </h4>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Unit Wholesale Supply Price (₹) *
                  </label>
                  <div className="clay-search-pill" style={{ width: '100%', boxSizing: 'border-box' }}>
                    <input
                      type="number"
                      step="0.01"
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.84rem' }}
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Standard Dispatch Lead Time *
                  </label>
                  <select
                    className="clay-select-pill"
                    style={{ width: '100%' }}
                    value={editLeadTime}
                    onChange={(e) => setEditLeadTime(e.target.value)}
                  >
                    <option value="1 Day (Priority Express)">1 Day (Priority Express)</option>
                    <option value="2 Days">2 Days</option>
                    <option value="3 Days">3 Days</option>
                    <option value="4-5 Days">4-5 Days</option>
                    <option value="7 Days (Batch Production)">7 Days (Batch Production)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Allocated Warehouse Stock Units *
                  </label>
                  <div className="clay-search-pill" style={{ width: '100%', boxSizing: 'border-box' }}>
                    <input
                      type="number"
                      style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.84rem' }}
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="clay-action-pill-btn clay-action-pill-btn--primary"
                  style={{ justifyContent: 'center', marginTop: '6px', width: '100%' }}
                >
                  <IconSave size={16} />
                  <span>Update Pricing & Terms</span>
                </button>
              </form>

              {/* Additional quick actions */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #edf2f7', paddingTop: '10px' }}>
                <button
                  onClick={() => {
                    showToast(`Certificate of Analysis (COA) requested for ${selectedMedicine.sku}.`);
                  }}
                  className="clay-action-pill-btn clay-action-pill-btn--secondary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }}
                >
                  <IconDownload size={14} />
                  <span>Download COA</span>
                </button>

                <button
                  onClick={() => {
                    showToast(`Replenishment batch flag added for ${selectedMedicine.name}.`);
                  }}
                  className="clay-action-pill-btn clay-action-pill-btn--secondary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }}
                >
                  <IconRefresh size={14} />
                  <span>Sync Quota</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
              <IconPill size={42} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
              <h3 style={{ margin: '0 0 6px 0', color: '#0f172a' }}>No Medicine Selected</h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Select a medicine from the catalog to review specifications, adjust wholesale pricing, and configure dispatch lead times.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Add New Medicine Modal ── */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '540px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#0F4A47',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconPlus size={20} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                  Add Contracted Medicine
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Medicine Name & Strength *
                </label>
                <input
                  type="text"
                  className="staff-search-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Ciprofloxacin 500mg Tablets"
                  value={newMed.name}
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Supplier SKU Code *
                  </label>
                  <input
                    type="text"
                    className="staff-search-input"
                    style={{ width: '100%' }}
                    placeholder="e.g. APX-CPR-500"
                    value={newMed.sku}
                    onChange={(e) => setNewMed({ ...newMed, sku: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Category *
                  </label>
                  <select
                    className="staff-select"
                    style={{ width: '100%' }}
                    value={newMed.category}
                    onChange={(e) => setNewMed({ ...newMed, category: e.target.value })}
                  >
                    <option value="Analgesics">Analgesics</option>
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Gastrointestinal">Gastrointestinal</option>
                    <option value="Diabetes">Diabetes</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="Oncology">Oncology</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Wholesale Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="staff-search-input"
                    style={{ width: '100%' }}
                    placeholder="e.g. 14.50"
                    value={newMed.price}
                    onChange={(e) => setNewMed({ ...newMed, price: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Initial Warehouse Units *
                  </label>
                  <input
                    type="number"
                    className="staff-search-input"
                    style={{ width: '100%' }}
                    placeholder="e.g. 5000"
                    value={newMed.stock}
                    onChange={(e) => setNewMed({ ...newMed, stock: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Dispatch Lead Time
                  </label>
                  <select
                    className="staff-select"
                    style={{ width: '100%' }}
                    value={newMed.leadTime}
                    onChange={(e) => setNewMed({ ...newMed, leadTime: e.target.value })}
                  >
                    <option value="1 Day (Priority Express)">1 Day</option>
                    <option value="2 Days">2 Days</option>
                    <option value="3 Days">3 Days</option>
                    <option value="5 Days">5 Days</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Minimum Order Qty (MOQ)
                  </label>
                  <input
                    type="number"
                    className="staff-search-input"
                    style={{ width: '100%' }}
                    value={newMed.moq}
                    onChange={(e) => setNewMed({ ...newMed, moq: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Storage Protocol
                </label>
                <input
                  type="text"
                  className="staff-search-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Store below 25°C or Cold Chain (2°C - 8°C)"
                  value={newMed.storage}
                  onChange={(e) => setNewMed({ ...newMed, storage: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="staff-btn staff-btn--outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="staff-btn staff-btn--primary"
                >
                  <IconPlus size={16} />
                  <span>Add to Catalog</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

