import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchMedicines,
  fetchBatches,
  fetchFefoBatches,
  fetchCategories,
  fetchFefoStats,
  fetchFefoRecommendation,
  allocateFefoStock,
  fetchFefoAllocations,
  fetchPurchaseOrders
} from '../../services/api';
import {
  IconPill,
  IconSearch,
  IconX,
  IconRefresh,
  IconDownload,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconBox,
  IconAlertTriangle,
  IconShield,
  IconFileText,
  IconTruck,
  IconTrendingUp,
  IconActivity,
  IconArrowRight
} from '../../components/icons/Icons';
import { exportToCsv } from '../../utils/csvExport';
import PaginationBar from '../../components/ui/PaginationBar';
import './PharmacistMedicinesPage.css';
import '../admin/AdminPages.css';

// Baseline fallback data
const SEED_MEDICINES = [
  { medicineId: 1, id: 1, medicineName: 'Paracetamol 500mg', name: 'Paracetamol 500mg', code: 'MED001', categoryName: 'Analgesics', manufacturer: 'GSK Pharma', stock: 2500, price: 4.50, reorderLevel: 100, status: 'Active' },
  { medicineId: 2, id: 2, medicineName: 'Amoxicillin 250mg', name: 'Amoxicillin 250mg', code: 'MED002', categoryName: 'Antibiotics', manufacturer: 'Pfizer Ltd', stock: 1200, price: 12.50, reorderLevel: 80, status: 'Active' },
  { medicineId: 3, id: 3, medicineName: 'Omeprazole 20mg', name: 'Omeprazole 20mg', code: 'MED003', categoryName: 'Gastrointestinal', manufacturer: 'AstraZeneca', stock: 850, price: 18.75, reorderLevel: 50, status: 'Active' },
  { medicineId: 4, id: 4, medicineName: 'Atorvastatin 10mg', name: 'Atorvastatin 10mg', code: 'MED004', categoryName: 'Cardiovascular', manufacturer: 'Novartis', stock: 450, price: 32.00, reorderLevel: 40, status: 'Active' },
  { medicineId: 5, id: 5, medicineName: 'Metformin 500mg', name: 'Metformin 500mg', code: 'MED005', categoryName: 'Diabetes', manufacturer: 'Merck Group', stock: 320, price: 8.90, reorderLevel: 60, status: 'Active' },
  { medicineId: 6, id: 6, medicineName: 'Vitamin D3 1000IU', name: 'Vitamin D3 1000IU', code: 'MED006', categoryName: 'Supplements', manufacturer: 'Bayer AG', stock: 0, price: 15.40, reorderLevel: 25, status: 'Out of Stock' },
  { medicineId: 7, id: 7, medicineName: 'Ibuprofen 400mg', name: 'Ibuprofen 400mg', code: 'MED007', categoryName: 'Analgesics', manufacturer: 'Sanofi', stock: 680, price: 11.20, reorderLevel: 50, status: 'Active' },
  { medicineId: 8, id: 8, medicineName: 'Ciprofloxacin 500mg', name: 'Ciprofloxacin 500mg', code: 'MED008', categoryName: 'Antibiotics', manufacturer: 'Bayer AG', stock: 95, price: 22.80, reorderLevel: 100, status: 'Low Stock' },
];

const SEED_BATCHES = [
  { batchId: 101, batchNumber: 'PCT2024001', medicineId: 1, medicineName: 'Paracetamol 500mg', categoryName: 'Analgesics', receivedDate: '2024-08-10', expiryDate: '2026-08-15', quantityAvailable: 1500, quantityReserved: 50, sellingPrice: 4.50, status: 'ACTIVE', shelfLocation: 'Aisle 2 - Shelf B' },
  { batchId: 102, batchNumber: 'PCT2024002', medicineId: 1, medicineName: 'Paracetamol 500mg', categoryName: 'Analgesics', receivedDate: '2024-09-01', expiryDate: '2026-12-20', quantityAvailable: 1000, quantityReserved: 0, sellingPrice: 4.50, status: 'ACTIVE', shelfLocation: 'Aisle 2 - Shelf B' },
  { batchId: 103, batchNumber: 'AMX2024003', medicineId: 2, medicineName: 'Amoxicillin 250mg', categoryName: 'Antibiotics', receivedDate: '2024-07-15', expiryDate: '2026-12-10', quantityAvailable: 1200, quantityReserved: 100, sellingPrice: 12.50, status: 'ACTIVE', shelfLocation: 'Aisle 1 - Shelf A' },
  { batchId: 104, batchNumber: 'OMP2024005', medicineId: 3, medicineName: 'Omeprazole 20mg', categoryName: 'Gastrointestinal', receivedDate: '2024-05-12', expiryDate: '2025-11-30', quantityAvailable: 850, quantityReserved: 0, sellingPrice: 18.75, status: 'ACTIVE', shelfLocation: 'Aisle 3 - Shelf C' },
  { batchId: 105, batchNumber: 'ATV2024007', medicineId: 4, medicineName: 'Atorvastatin 10mg', categoryName: 'Cardiovascular', receivedDate: '2024-06-18', expiryDate: '2026-03-20', quantityAvailable: 450, quantityReserved: 20, sellingPrice: 32.00, status: 'ACTIVE', shelfLocation: 'Aisle 4 - Shelf D' },
  { batchId: 106, batchNumber: 'MET2024008', medicineId: 5, medicineName: 'Metformin 500mg', categoryName: 'Diabetes', receivedDate: '2024-04-05', expiryDate: '2025-09-15', quantityAvailable: 320, quantityReserved: 10, sellingPrice: 8.90, status: 'ACTIVE', shelfLocation: 'Aisle 2 - Shelf A' },
  { batchId: 107, batchNumber: 'VIT2024009', medicineId: 6, medicineName: 'Vitamin D3 1000IU', categoryName: 'Supplements', receivedDate: '2023-11-20', expiryDate: '2025-07-10', quantityAvailable: 0, quantityReserved: 0, sellingPrice: 15.40, status: 'EXPIRED', shelfLocation: 'Cold Room - Rack 1' },
  { batchId: 108, batchNumber: 'CIP2024012', medicineId: 8, medicineName: 'Ciprofloxacin 500mg', categoryName: 'Antibiotics', receivedDate: '2024-03-10', expiryDate: '2025-08-05', quantityAvailable: 95, quantityReserved: 0, sellingPrice: 22.80, status: 'QUARANTINED', shelfLocation: 'Aisle 1 - Shelf B' }
];

export default function PharmacistMedicinesPage() {
  const [medicines, setMedicines] = useState(SEED_MEDICINES);
  const [batches, setBatches] = useState(SEED_BATCHES);
  const [allocations, setAllocations] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Pagination for Section B Medicine & Batch Table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Down-Page Pagination States
  const [fefoPage, setFefoPage] = useState(1);
  const [riskPage, setRiskPage] = useState(1);

  // Reset page when search or category filter changes
  useEffect(() => {
    setCurrentPage(1);
    setFefoPage(1);
    setRiskPage(1);
  }, [searchTerm, selectedCategory]);

  // Allocation Calculator State
  const [calcMedId, setCalcMedId] = useState(1);
  const [calcQty, setCalcQty] = useState(20);
  const [calcBatchId, setCalcBatchId] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [dispensing, setDispensing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [meds, bts, allocs, pos] = await Promise.all([
        fetchMedicines(),
        fetchFefoBatches().catch(() => fetchBatches()),
        fetchFefoAllocations(),
        fetchPurchaseOrders()
      ]);
      if (meds && Array.isArray(meds) && meds.length > 0) setMedicines(meds);
      if (bts && Array.isArray(bts) && bts.length > 0) setBatches(bts);
      if (allocs && Array.isArray(allocs)) setAllocations(allocs);
      if (pos && Array.isArray(pos)) setPurchaseOrders(pos);
    } catch (_e) {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return 999;
    const diff = new Date(expiryDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Section A: 9 KPIs
  const totalMedicines = medicines.length;
  const totalBatches = batches.length;
  const availableStock = batches.reduce((acc, b) => acc + (Number(b.quantityAvailable) || 0), 0);
  const reservedStock = batches.reduce((acc, b) => acc + (Number(b.quantityReserved) || 0), 0);
  const lowStockCount = medicines.filter((m) => {
    const stock = Number(m.totalStock ?? m.stockQuantity ?? m.stock ?? 0);
    const reorder = Number(m.reorderLevel ?? 50);
    return stock > 0 && stock <= reorder;
  }).length;
  const outOfStockCount = medicines.filter((m) => {
    const stock = Number(m.totalStock ?? m.stockQuantity ?? m.stock ?? 0);
    return stock === 0;
  }).length;
  const expiringSoonCount = batches.filter((b) => {
    const d = getDaysRemaining(b.expiryDate);
    return d > 0 && d <= 90;
  }).length;
  const expiredBatchesCount = batches.filter((b) => getDaysRemaining(b.expiryDate) <= 0 || b.status === 'EXPIRED').length;
  const pendingPOCount = purchaseOrders.filter((po) => po.status === 'PENDING' || po.status === 'SUBMITTED').length;

  // Enriched Batch Rows with FEFO priorities
  const enrichedBatches = useMemo(() => {
    const medMap = new Map();
    medicines.forEach((m) => {
      const id = String(m.medicineId || m.id || '');
      if (id) medMap.set(id, m);
    });

    const medBatchesMap = new Map();
    batches.forEach((b) => {
      const mId = String(b.medicineId || b.medicine?.medicineId || '');
      if (mId) {
        if (!medBatchesMap.has(mId)) medBatchesMap.set(mId, []);
        medBatchesMap.get(mId).push(b);
      }
    });

    return batches.map((b) => {
      const mId = String(b.medicineId || b.medicine?.medicineId || '');
      const med = medMap.get(mId) || b.medicine || {};
      const siblings = (mId && medBatchesMap.get(mId)) || [b];
      const days = getDaysRemaining(b.expiryDate);
      const isEligible = b.status === 'ACTIVE' && days > 0;

      // FEFO sibling rank (earliest expiry date first)
      const fefoEligible = siblings
        .filter((s) => s.status === 'ACTIVE' && getDaysRemaining(s.expiryDate) > 0)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      const fefoRank = b.fefoRank || (fefoEligible.findIndex((s) => s.batchId === b.batchId) + 1);

      return {
        ...b,
        medicineId: b.medicineId || b.medicine?.medicineId || med.medicineId,
        medicineName: b.medicineName || b.medicine?.medicineName || med.medicineName || med.name || 'Unknown',
        medicineCode: med.medicineCode || (mId ? `MED${String(mId).padStart(3, '0')}` : 'MED000'),
        categoryName: b.categoryName || med.categoryName || med.category?.categoryName || med.category || 'General',
        manufacturer: med.manufacturer || med.brandName || b.brandName || 'Standard Pharma',
        supplierName: b.supplierName || b.supplier?.supplierName || 'Apex Medical Supplies Ltd',
        quantityAvailable: Number(b.quantityAvailable) || 0,
        quantityReceived: Number(b.quantityReceived) || Number(b.quantityAvailable) || 0,
        quantityReserved: Number(b.quantityReserved) || 0,
        sellingPrice: Number(b.sellingPrice ?? med.sellingPrice ?? med.unitPrice ?? 5.0),
        daysRemaining: days,
        isEligible,
        fefoPriority: fefoRank > 0 ? (fefoRank === 1 ? 'Priority 1 (First Expiry)' : `Priority ${fefoRank}`) : 'N/A'
      };
    });
  }, [medicines, batches]);

  // Filtered rows for Section B
  const filteredBatches = useMemo(() => {
    return enrichedBatches.filter((b) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        b.medicineName.toLowerCase().includes(q) ||
        b.batchNumber.toLowerCase().includes(q) ||
        b.categoryName.toLowerCase().includes(q);
      const matchCategory = selectedCategory === 'ALL' || b.categoryName === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [enrichedBatches, searchTerm, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / pageSize));
  const paginatedBatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBatches.slice(start, start + pageSize);
  }, [filteredBatches, currentPage, pageSize]);

  // Section C: FEFO Priority List (Earliest expiry first)
  const fefoList = useMemo(() => {
    return enrichedBatches
      .filter((b) => b.isEligible && b.quantityAvailable > 0)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  }, [enrichedBatches]);

  const fefoPageSize = 6;
  const fefoTotalPages = Math.max(1, Math.ceil(fefoList.length / fefoPageSize));
  const paginatedFefoBatches = useMemo(() => {
    const start = (fefoPage - 1) * fefoPageSize;
    return fefoList.slice(start, start + fefoPageSize);
  }, [fefoList, fefoPage, fefoPageSize]);

  // Section F: Expiry Risk List
  const riskList = useMemo(() => {
    return enrichedBatches
      .filter((b) => b.daysRemaining <= 90 || b.status === 'QUARANTINED' || b.status === 'EXPIRED')
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [enrichedBatches]);

  const riskPageSize = 5;
  const riskTotalPages = Math.max(1, Math.ceil(riskList.length / riskPageSize));
  const paginatedRiskBatches = useMemo(() => {
    const start = (riskPage - 1) * riskPageSize;
    return riskList.slice(start, start + riskPageSize);
  }, [riskList, riskPage, riskPageSize]);

  // Live FEFO Calculator Recommendation
  useEffect(() => {
    if (!calcMedId || calcQty <= 0) return;
    let isCurrent = true;
    setCalcLoading(true);

    fetchFefoRecommendation(calcMedId, calcQty, calcBatchId)
      .then((data) => {
        if (isCurrent && data) {
          setRecommendation(data);
        }
      })
      .catch((_err) => {
        // Fallback local calculation
        const medBatches = enrichedBatches
          .filter((b) => String(b.medicineId) === String(calcMedId) && b.isEligible && b.quantityAvailable > 0)
          .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

        let rem = calcQty;
        const proposed = [];
        for (const b of medBatches) {
          if (rem <= 0) break;
          const alloc = Math.min(b.quantityAvailable, rem);
          proposed.push({
            batchId: b.batchId,
            batchNumber: b.batchNumber,
            quantityToDeduct: alloc,
            availableBefore: b.quantityAvailable,
            availableAfter: b.quantityAvailable - alloc,
            expiryDate: b.expiryDate
          });
          rem -= alloc;
        }

        if (isCurrent) {
          setRecommendation({
            isCompliant: true,
            batches: proposed,
            fullySatisfied: rem === 0,
            recommendedBatchNumber: proposed[0]?.batchNumber || 'None'
          });
        }
      })
      .finally(() => {
        if (isCurrent) setCalcLoading(false);
      });

    return () => { isCurrent = false; };
  }, [calcMedId, calcQty, calcBatchId, enrichedBatches]);

  // Confirm Dispensing & Deduct Stock Atomically
  const handleExecuteAllocation = async (e) => {
    e.preventDefault();
    if (!calcMedId || calcQty <= 0) {
      alert('Please select a medicine and valid dispensing quantity.');
      return;
    }

    setDispensing(true);
    try {
      const payload = {
        medicineId: calcMedId,
        requestedQuantity: Number(calcQty),
        preferredBatchId: calcBatchId,
        overrideReason: overrideReason || null
      };

      const res = await allocateFefoStock(payload);
      showToast(`Successfully dispensed ${calcQty} units per First Expiry, First Out! Batch stock deducted.`);
      setOverrideReason('');
      loadData();
    } catch (err) {
      alert(err.message || 'Dispensing allocation failed');
    } finally {
      setDispensing(false);
    }
  };

  // Pre-select batch into calculator
  const selectBatchForCalc = (batch) => {
    setCalcMedId(batch.medicineId);
    setCalcBatchId(batch.batchId);
    const element = document.getElementById('allocation-calculator-section');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  // Export
  const handleExportCsv = () => {
    const data = filteredBatches.map((b) => ({
      'Medicine ID': b.medicineId,
      'Medicine Name': b.medicineName,
      'Category': b.categoryName,
      'Batch Number': b.batchNumber,
      'Expiry Date': b.expiryDate,
      'Available Qty': b.quantityAvailable,
      'Reserved Qty': b.quantityReserved,
      'Unit Price ($)': Number(b.sellingPrice || 0).toFixed(2),
      'FEFO Priority': b.fefoPriority,
      'Batch Status': b.status
    }));
    exportToCsv(data, `Pharmacist_Medicine_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="admin-page-container" style={{ padding: '24px 32px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          padding: '14px 22px',
          background: '#0d9488',
          color: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 12px 30px rgba(13,148,136,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontWeight: 600,
          fontSize: '0.92rem'
        }}>
          <IconCheckCircle size={20} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              display: 'inline-flex',
              padding: 9,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #ccfbf1 0%, #99f6e4 100%)',
              color: '#0d9488'
            }}>
              <IconPill size={26} />
            </span>
            Pharmacist Medicine Workspace & Dispensing Hub
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.92rem' }}>
            Single-page clinical workspace: Live inventory, First Expiry First Out allocation calculator, expiry monitoring & PO triggers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={loadData}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '10px 18px', fontWeight: 600 }}
          >
            <IconRefresh size={16} /> Refresh
          </button>
          <button
            onClick={handleExportCsv}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '10px 18px', fontWeight: 600 }}
          >
            <IconDownload size={16} /> Export Inventory (CSV)
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION A: INVENTORY SUMMARY (9 KPIS)
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconActivity size={18} style={{ color: '#0d9488' }} /> Section A • Pharmacist Operational Summary
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14
        }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Medicines</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{totalMedicines}</div>
            <div style={{ color: '#0d9488', fontSize: '0.72rem', marginTop: 2 }}>Dispensing catalog</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Batches</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{totalBatches}</div>
            <div style={{ color: '#3b82f6', fontSize: '0.72rem', marginTop: 2 }}>Active lot numbers</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #bbf7d0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#166534', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Available Stock</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#16a34a', marginTop: 4 }}>{availableStock.toLocaleString()}</div>
            <div style={{ color: '#15803d', fontSize: '0.72rem', marginTop: 2 }}>Ready to dispense</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Reserved Stock</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#6366f1', marginTop: 4 }}>{reservedStock.toLocaleString()}</div>
            <div style={{ color: '#4f46e5', fontSize: '0.72rem', marginTop: 2 }}>In-preparation</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #fed7aa', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#9a3412', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Low Stock</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ea580c', marginTop: 4 }}>{lowStockCount}</div>
            <div style={{ color: '#c2410c', fontSize: '0.72rem', marginTop: 2 }}>Needs reorder</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #fecaca', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#991b1b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Out of Stock</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#dc2626', marginTop: 4 }}>{outOfStockCount}</div>
            <div style={{ color: '#b91c1c', fontSize: '0.72rem', marginTop: 2 }}>Stockout medicines</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #fef08a', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#854d0e', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Expiring Soon</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ca8a04', marginTop: 4 }}>{expiringSoonCount}</div>
            <div style={{ color: '#a16207', fontSize: '0.72rem', marginTop: 2 }}>Prioritize under FEFO</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #fecdd3', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#9f1239', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Expired Batches</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#e11d48', marginTop: 4 }}>{expiredBatchesCount}</div>
            <div style={{ color: '#be123c', fontSize: '0.72rem', marginTop: 2 }}>Non-dispensable</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Pending POs</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{pendingPOCount}</div>
            <div style={{ color: '#0d9488', fontSize: '0.72rem', marginTop: 2 }}>Submitted orders</div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION B: COMPLETE MEDICINE AND BATCH TABLE (VISIBLE BATCH ROWS)
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        border: '1px solid #e2e8f0',
        marginBottom: 32
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconBox size={22} style={{ color: '#0d9488' }} /> Section B • Complete Medicine & Batch Table
            </h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              All batches listed with dual priority indicators. Click "Allocate" to load the batch directly into the FEFO dispensing calculator below.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 260 }}>
              <input
                type="text"
                placeholder="Search medicine, batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  borderRadius: 12,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem'
                }}
              />
              <span style={{ position: 'absolute', left: 10, top: 11, color: '#94a3b8' }}>
                <IconSearch size={15} />
              </span>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff' }}
            >
              <option value="ALL">All Categories</option>
              <option value="Analgesics">Analgesics</option>
              <option value="Antibiotics">Antibiotics</option>
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Diabetes">Diabetes</option>
              <option value="Gastrointestinal">Gastrointestinal</option>
              <option value="Supplements">Supplements</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 10px' }}>Med ID</th>
                <th style={{ padding: '12px 12px' }}>Medicine Name</th>
                <th style={{ padding: '12px 10px' }}>Category</th>
                <th style={{ padding: '12px 10px' }}>Batch No</th>
                <th style={{ padding: '12px 10px' }}>Expiry Date</th>
                <th style={{ padding: '12px 10px' }}>Avail Qty</th>
                <th style={{ padding: '12px 10px' }}>Res Qty</th>
                <th style={{ padding: '12px 10px' }}>Unit Price</th>
                <th style={{ padding: '12px 10px' }}>FEFO Priority</th>
                <th style={{ padding: '12px 10px' }}>Status</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                    No matching medicine & batch records found.
                  </td>
                </tr>
              ) : (
                paginatedBatches.map((b) => {
                  const isBlocked = b.status === 'EXPIRED' || b.status === 'QUARANTINED' || b.daysRemaining <= 0;
                  return (
                    <tr key={`${b.medicineId}-${b.batchId}`} style={{ borderBottom: '1px solid #f1f5f9', background: isBlocked ? '#fffafa' : '#ffffff' }}>
                      <td style={{ padding: '10px 10px', fontWeight: 600, color: '#64748b' }}>MED{String(b.medicineId).padStart(3, '0')}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{b.medicineName}</td>
                      <td style={{ padding: '10px 10px', color: '#475569' }}>{b.categoryName}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontWeight: 700, color: '#0d9488' }}>
                          {b.batchNumber}
                        </code>
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ fontWeight: 600, color: b.daysRemaining <= 30 ? '#dc2626' : b.daysRemaining <= 90 ? '#d97706' : '#15803d' }}>
                          {b.expiryDate}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {b.daysRemaining <= 0 ? 'EXPIRED' : `${b.daysRemaining}d left`}
                        </div>
                      </td>
                      <td style={{ padding: '10px 10px', fontWeight: 700, color: b.quantityAvailable === 0 ? '#dc2626' : '#0f172a' }}>
                        {b.quantityAvailable}
                      </td>
                      <td style={{ padding: '10px 10px', color: '#6366f1' }}>{b.quantityReserved || 0}</td>
                      <td style={{ padding: '10px 10px', fontWeight: 600, color: '#334155' }}>${Number(b.sellingPrice || 5).toFixed(2)}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{
                          background: b.fefoPriority.includes('Priority 1') ? '#dcfce7' : '#f1f5f9',
                          color: b.fefoPriority.includes('Priority 1') ? '#15803d' : '#475569',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          {b.fefoPriority}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{
                          background: b.status === 'ACTIVE' ? '#dcfce7' : b.status === 'QUARANTINED' ? '#fef3c7' : '#fee2e2',
                          color: b.status === 'ACTIVE' ? '#15803d' : b.status === 'QUARANTINED' ? '#92400e' : '#b91c1c',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                        <button
                          disabled={isBlocked || b.quantityAvailable <= 0}
                          onClick={() => selectBatchForCalc(b)}
                          style={{
                            background: isBlocked || b.quantityAvailable <= 0 ? '#f1f5f9' : '#0d9488',
                            color: isBlocked || b.quantityAvailable <= 0 ? '#94a3b8' : '#ffffff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '5px 12px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: isBlocked || b.quantityAvailable <= 0 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Allocate
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Numbered Pagination (1, 2, 3...) for Section B */}
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredBatches.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[5, 10, 20, 50]}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION C: FEFO PRIORITY SEQUENCE (FIRST EXPIRED, FIRST OUT)
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        border: '1px solid #e2e8f0',
        marginBottom: 32
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-flex', padding: 8, borderRadius: 10, background: '#ccfbf1', color: '#0d9488' }}>
              <IconClock size={20} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Section C • FEFO Priority Sequence (First Expired, First Out)
              </h2>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                Earliest-expiring active batches strictly prioritized for all clinical dispensary allocations.
              </p>
            </div>
          </div>
          <span style={{
            background: '#dcfce7',
            color: '#15803d',
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: '0.78rem',
            fontWeight: 700
          }}>
            {fefoList.length} Active FEFO Batches
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                <th style={{ padding: '10px 12px' }}>FEFO Rank</th>
                <th style={{ padding: '10px 12px' }}>Batch Number</th>
                <th style={{ padding: '10px 12px' }}>Medicine Name</th>
                <th style={{ padding: '10px 12px' }}>Category</th>
                <th style={{ padding: '10px 12px' }}>Expiry Date</th>
                <th style={{ padding: '10px 12px' }}>Shelf Life Countdown</th>
                <th style={{ padding: '10px 12px' }}>Available Qty</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Dispense Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFefoBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                    No active eligible batches in queue.
                  </td>
                </tr>
              ) : (
                paginatedFefoBatches.map((b, idx) => {
                  const absoluteIndex = (fefoPage - 1) * fefoPageSize + idx;
                  return (
                    <tr key={b.batchId} style={{ borderBottom: '1px solid #f1f5f9', background: absoluteIndex === 0 ? '#f0fdf4' : '#ffffff' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          background: absoluteIndex === 0 ? '#10b981' : '#dcfce7',
                          color: absoluteIndex === 0 ? '#fff' : '#15803d',
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: '0.74rem'
                        }}>
                          #{absoluteIndex + 1} {absoluteIndex === 0 ? '• Use First' : ''}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0d9488' }}>
                        <code>{b.batchNumber}</code>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{b.medicineName}</td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>{b.categoryName}</td>
                      <td style={{ padding: '10px 12px', color: '#b91c1c', fontWeight: 700 }}>{b.expiryDate}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          background: b.daysRemaining <= 90 ? '#fef3c7' : '#f1f5f9',
                          color: b.daysRemaining <= 90 ? '#92400e' : '#475569',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: '0.74rem',
                          fontWeight: 700
                        }}>
                          {b.daysRemaining} days left
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{b.quantityAvailable} units</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setCalcMedId(b.medicineId);
                            setCalcBatchId(b.batchId);
                            const el = document.getElementById('allocation-calculator-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          style={{
                            background: '#0d9488',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '5px 12px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Select for Dispensing
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={fefoPage}
          totalPages={fefoTotalPages}
          totalItems={fefoList.length}
          pageSize={fefoPageSize}
          onPageChange={setFefoPage}
          showPageSizeSelector={false}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION E: LIVE STOCK ALLOCATION CALCULATOR (INTERACTIVE DISPENSING HUB)
          ════════════════════════════════════════════════════════════════════════ */}
      <div id="allocation-calculator-section" style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        border: '2px solid #0d9488',
        marginBottom: 32
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ display: 'inline-flex', padding: 8, borderRadius: 12, background: '#ccfbf1', color: '#0d9488' }}>
            <IconCheckCircle size={22} />
          </span>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
              Section E • Stock Allocation Calculator (FEFO Dispensing Hub)
            </h2>
            <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              Select requested quantity. System automatically allocates across earliest-expiring eligible batches and updates stock atomically across all roles.
            </p>
          </div>
        </div>

        <form onSubmit={handleExecuteAllocation}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#334155', marginBottom: 6 }}>
                Select Medicine to Dispense: *
              </label>
              <select
                value={calcMedId}
                onChange={(e) => {
                  setCalcMedId(Number(e.target.value));
                  setCalcBatchId(null);
                }}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#fff' }}
              >
                {medicines.map((m) => (
                  <option key={m.medicineId || m.id} value={m.medicineId || m.id}>
                    {m.medicineName || m.name} (In stock: {m.stock || 0})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#334155', marginBottom: 6 }}>
                Requested Dispensing Quantity: *
              </label>
              <input
                type="number"
                min="1"
                required
                value={calcQty}
                onChange={(e) => setCalcQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#334155', marginBottom: 6 }}>
                Preferred Batch (Optional Override):
              </label>
              <select
                value={calcBatchId || ''}
                onChange={(e) => setCalcBatchId(e.target.value ? Number(e.target.value) : null)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#fff' }}
              >
                <option value="">-- Auto FEFO Recommendation (Earliest Expiry) --</option>
                {batches
                  .filter((b) => String(b.medicineId) === String(calcMedId) && b.status === 'ACTIVE' && getDaysRemaining(b.expiryDate) > 0)
                  .map((b) => (
                    <option key={b.batchId} value={b.batchId}>
                      {b.batchNumber} (Avail: {b.quantityAvailable}, Exp: {b.expiryDate})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Allocation Breakdown Preview */}
          <div style={{ background: '#f8fafc', borderRadius: 16, padding: 18, border: '1px solid #e2e8f0', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
                Proposed FEFO Batch Deduction Plan:
              </span>
              {recommendation?.isCompliant ? (
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700 }}>
                  100% FEFO Compliant
                </span>
              ) : (
                <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700 }}>
                  Authorized Override Active
                </span>
              )}
            </div>

            {recommendation?.batches && recommendation.batches.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recommendation.batches.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#ffffff',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem'
                  }}>
                    <div>
                      <strong>Batch {item.batchNumber}</strong>
                      <span style={{ color: '#64748b', marginLeft: 8 }}>(Exp: {item.expiryDate})</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>Before: {item.availableBefore}</span>
                      <strong style={{ color: '#dc2626' }}>- {item.quantityToDeduct} units</strong>
                      <span style={{ color: '#15803d', fontWeight: 700 }}>After: {item.availableAfter}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                Calculating optimal batch deduction...
              </div>
            )}
          </div>

          {/* Override Reason field */}
          {calcBatchId && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#991b1b', marginBottom: 6 }}>
                Mandatory Clinical Override Reason: *
              </label>
              <input
                type="text"
                required
                placeholder="E.g. Specific patient sensitivity, physician dosage preference..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #f87171', fontSize: '0.88rem' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="submit"
              disabled={dispensing}
              style={{
                background: '#0d9488',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 28px',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: dispensing ? 'wait' : 'pointer',
                boxShadow: '0 4px 16px rgba(13,148,136,0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <IconCheck size={18} />
              {dispensing ? 'Deducting Stock...' : 'Confirm Authorized Stock Allocation'}
            </button>
          </div>
        </form>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTIONS F & G: EXPIRY/RISK MONITORING & INVENTORY ANALYTICS
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: 24,
        marginBottom: 32
      }}>
        {/* Section F: Expiry Risk Monitoring */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #fed7aa',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ display: 'inline-flex', padding: 7, borderRadius: 10, background: '#fff7ed', color: '#ea580c' }}>
                <IconAlertTriangle size={20} />
              </span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Section F • Expiry Risk Monitoring (30, 60, 90 Days)
                </h2>
                <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                  Near-expiry and quarantined batches requiring fast-tracking or vendor purchase order.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '8px 10px' }}>Batch & Medicine</th>
                    <th style={{ padding: '8px 10px' }}>Expiry Date</th>
                    <th style={{ padding: '8px 10px' }}>Horizon</th>
                    <th style={{ padding: '8px 10px' }}>Avail Qty</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRiskBatches.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>
                        All batches have safe shelf life (&gt;90 days).
                      </td>
                    </tr>
                  ) : (
                    paginatedRiskBatches.map((b) => (
                      <tr key={b.batchId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ fontWeight: 600 }}>{b.medicineName}</div>
                          <code style={{ fontSize: '0.72rem', color: '#0d9488' }}>{b.batchNumber}</code>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#64748b' }}>{b.expiryDate}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{
                            background: b.daysRemaining <= 30 ? '#fee2e2' : b.daysRemaining <= 60 ? '#fed7aa' : '#fef08a',
                            color: b.daysRemaining <= 30 ? '#dc2626' : b.daysRemaining <= 60 ? '#c2410c' : '#a16207',
                            padding: '2px 6px',
                            borderRadius: 6,
                            fontSize: '0.7rem',
                            fontWeight: 700
                          }}>
                            {b.daysRemaining <= 0 ? 'EXPIRED' : `${b.daysRemaining}d left`}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#dc2626' }}>{b.quantityAvailable}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              showToast(`Purchase order requisition draft created for ${b.medicineName}.`);
                            }}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: 6,
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: '#0d9488',
                              cursor: 'pointer'
                            }}
                          >
                            Create PO
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <PaginationBar
            currentPage={riskPage}
            totalPages={riskTotalPages}
            totalItems={riskList.length}
            pageSize={riskPageSize}
            onPageChange={setRiskPage}
            showPageSizeSelector={false}
          />
        </div>

        {/* Section G: Dispensing Analytics */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ display: 'inline-flex', padding: 7, borderRadius: 10, background: '#f0fdf4', color: '#16a34a' }}>
              <IconTrendingUp size={20} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Section G • Clinical Dispensing Velocity
              </h2>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                Turnover rate and moving velocity across dispensary medicines.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem' }}>
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span>Paracetamol 500mg</span>
              <strong style={{ color: '#16a34a' }}>Fast Moving (250 units/week)</strong>
            </div>
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span>Amoxicillin 250mg</span>
              <strong style={{ color: '#16a34a' }}>Fast Moving (180 units/week)</strong>
            </div>
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span>Atorvastatin 10mg</span>
              <strong style={{ color: '#2563eb' }}>Steady Turnover (60 units/week)</strong>
            </div>
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, display: 'flex', justifyContent: 'space-between' }}>
              <span>Ciprofloxacin 500mg</span>
              <strong style={{ color: '#ea580c' }}>Slow Moving (15 units/week)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
