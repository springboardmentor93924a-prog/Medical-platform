import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchMedicines,
  fetchBatches,
  fetchFefoBatches,
  createWastageReport
} from '../../services/api';
import {
  IconPill,
  IconSearch,
  IconRefresh,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconBox,
  IconAlertTriangle,
  IconShield,
  IconClipboard,
  IconTruck,
  IconEye,
  IconX
} from '../../components/icons/Icons';
import './StaffCommon.css';
import PaginationBar from '../../components/ui/PaginationBar';
import '../admin/AdminPages.css';

const SEED_MEDICINES = [
  { medicineId: 1, id: 1, medicineName: 'Paracetamol 500mg', code: 'MED001', categoryName: 'Analgesics', stock: 2500, status: 'In Stock' },
  { medicineId: 2, id: 2, medicineName: 'Amoxicillin 250mg', code: 'MED002', categoryName: 'Antibiotics', stock: 1200, status: 'In Stock' },
  { medicineId: 3, id: 3, medicineName: 'Omeprazole 20mg', code: 'MED003', categoryName: 'Gastrointestinal', stock: 850, status: 'In Stock' },
  { medicineId: 4, id: 4, medicineName: 'Atorvastatin 10mg', code: 'MED004', categoryName: 'Cardiovascular', stock: 450, status: 'In Stock' },
  { medicineId: 5, id: 5, medicineName: 'Metformin 500mg', code: 'MED005', categoryName: 'Diabetes', stock: 320, status: 'In Stock' },
  { medicineId: 6, id: 6, medicineName: 'Vitamin D3 1000IU', code: 'MED006', categoryName: 'Supplements', stock: 0, status: 'Out of Stock' },
  { medicineId: 7, id: 7, medicineName: 'Ibuprofen 400mg', code: 'MED007', categoryName: 'Analgesics', stock: 680, status: 'In Stock' },
  { medicineId: 8, id: 8, medicineName: 'Ciprofloxacin 500mg', code: 'MED008', categoryName: 'Antibiotics', stock: 95, status: 'Low Stock' },
];

const SEED_BATCHES = [
  { batchId: 101, batchNumber: 'PCT2024001', medicineId: 1, medicineName: 'Paracetamol 500mg', categoryName: 'Analgesics', shelfLocation: 'Aisle 2 - Shelf B', expiryDate: '2026-08-15', receivedDate: '2024-08-10', quantityAvailable: 1500, status: 'ACTIVE' },
  { batchId: 102, batchNumber: 'PCT2024002', medicineId: 1, medicineName: 'Paracetamol 500mg', categoryName: 'Analgesics', shelfLocation: 'Aisle 2 - Shelf B', expiryDate: '2026-12-20', receivedDate: '2024-09-01', quantityAvailable: 1000, status: 'ACTIVE' },
  { batchId: 103, batchNumber: 'AMX2024003', medicineId: 2, medicineName: 'Amoxicillin 250mg', categoryName: 'Antibiotics', shelfLocation: 'Aisle 1 - Shelf A', expiryDate: '2026-12-10', receivedDate: '2024-07-15', quantityAvailable: 1200, status: 'ACTIVE' },
  { batchId: 104, batchNumber: 'OMP2024005', medicineId: 3, medicineName: 'Omeprazole 20mg', categoryName: 'Gastrointestinal', shelfLocation: 'Aisle 3 - Shelf C', expiryDate: '2025-11-30', receivedDate: '2024-05-12', quantityAvailable: 850, status: 'ACTIVE' },
  { batchId: 105, batchNumber: 'ATV2024007', medicineId: 4, medicineName: 'Atorvastatin 10mg', categoryName: 'Cardiovascular', shelfLocation: 'Aisle 4 - Shelf D', expiryDate: '2026-03-20', receivedDate: '2024-06-18', quantityAvailable: 450, status: 'ACTIVE' },
  { batchId: 106, batchNumber: 'MET2024008', medicineId: 5, medicineName: 'Metformin 500mg', categoryName: 'Diabetes', shelfLocation: 'Aisle 2 - Shelf A', expiryDate: '2025-09-15', receivedDate: '2024-04-05', quantityAvailable: 320, status: 'ACTIVE' },
  { batchId: 107, batchNumber: 'VIT2024009', medicineId: 6, medicineName: 'Vitamin D3 1000IU', categoryName: 'Supplements', shelfLocation: 'Cold Room - Rack 1', expiryDate: '2025-07-10', receivedDate: '2023-11-20', quantityAvailable: 0, status: 'EXPIRED' },
  { batchId: 108, batchNumber: 'CIP2024012', medicineId: 8, medicineName: 'Ciprofloxacin 500mg', categoryName: 'Antibiotics', shelfLocation: 'Aisle 1 - Shelf B', expiryDate: '2025-08-05', receivedDate: '2024-03-10', quantityAvailable: 95, status: 'QUARANTINED' }
];

export default function StaffMedicinesPage() {
  const [medicines, setMedicines] = useState(SEED_MEDICINES);
  const [batches, setBatches] = useState(SEED_BATCHES);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Pagination for Section B Medicine & Batch Table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Down-Page Pagination State
  const [fefoPage, setFefoPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setFefoPage(1);
  }, [searchTerm, selectedCategory]);

  const [toastMsg, setToastMsg] = useState(null);

  // Discrepancy Modal
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);
  const [activeBatch, setActiveBatch] = useState(null);
  const [physicalCount, setPhysicalCount] = useState('');
  const [discrepancyReason, setDiscrepancyReason] = useState('COUNT_MISMATCH');
  const [discrepancyNotes, setDiscrepancyNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [meds, bts] = await Promise.all([
        fetchMedicines(),
        fetchFefoBatches().catch(() => fetchBatches())
      ]);
      if (meds && Array.isArray(meds) && meds.length > 0) setMedicines(meds);
      if (bts && Array.isArray(bts) && bts.length > 0) setBatches(bts);
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

  // Section A: 8 KPIs
  const totalMedicines = medicines.length;
  const totalBatches = batches.length;
  const availableStock = batches.reduce((acc, b) => acc + (Number(b.quantityAvailable) || 0), 0);
  const inStockMedicines = medicines.filter((m) => {
    const stock = Number(m.totalStock ?? m.stockQuantity ?? m.stock ?? 0);
    const reorder = Number(m.reorderLevel ?? 50);
    return stock > reorder;
  }).length;
  const lowStockMedicines = medicines.filter((m) => {
    const stock = Number(m.totalStock ?? m.stockQuantity ?? m.stock ?? 0);
    const reorder = Number(m.reorderLevel ?? 50);
    return stock > 0 && stock <= reorder;
  }).length;
  const outOfStockMedicines = medicines.filter((m) => {
    const stock = Number(m.totalStock ?? m.stockQuantity ?? m.stock ?? 0);
    return stock === 0;
  }).length;
  const expiringSoonBatches = batches.filter((b) => {
    const d = getDaysRemaining(b.expiryDate);
    return d > 0 && d <= 90;
  }).length;
  const expiredBatches = batches.filter((b) => getDaysRemaining(b.expiryDate) <= 0 || b.status === 'EXPIRED').length;

  // Enriched rows (Every batch has its own row without expandable rows)
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

      // FEFO sibling rank (earliest expiry first)
      const fefoEligible = siblings
        .filter((s) => s.status === 'ACTIVE' && getDaysRemaining(s.expiryDate) > 0)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      const fefoRank = b.fefoRank || (fefoEligible.findIndex((s) => s.batchId === b.batchId) + 1);

      return {
        ...b,
        medicineId: b.medicineId || b.medicine?.medicineId || med.medicineId,
        medicineName: b.medicineName || b.medicine?.medicineName || med.medicineName || med.name || 'Unknown',
        categoryName: b.categoryName || med.categoryName || med.category?.categoryName || med.category || 'General',
        storageLocation: b.shelfLocation || b.storageLocation || 'Aisle 2 - Shelf B',
        daysRemaining: days,
        isEligible,
        fefoRecommendation: isEligible ? (fefoRank === 1 ? 'PICK THIS BATCH FIRST' : `Priority ${fefoRank}`) : 'BLOCKED'
      };
    });
  }, [medicines, batches]);

  const filteredBatches = useMemo(() => {
    return enrichedBatches.filter((b) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        b.medicineName.toLowerCase().includes(q) ||
        b.batchNumber.toLowerCase().includes(q) ||
        b.storageLocation.toLowerCase().includes(q);
      const matchCategory = selectedCategory === 'ALL' || b.categoryName === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [enrichedBatches, searchTerm, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / pageSize));
  const paginatedBatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBatches.slice(start, start + pageSize);
  }, [filteredBatches, currentPage, pageSize]);

  // Section C: FEFO picking list (Earliest expiry first)
  const fefoPickingList = useMemo(() => {
    return enrichedBatches
      .filter((b) => b.isEligible && b.quantityAvailable > 0)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  }, [enrichedBatches]);

  const fefoPageSize = 6;
  const fefoTotalPages = Math.max(1, Math.ceil(fefoPickingList.length / fefoPageSize));
  const paginatedFefoPickingList = useMemo(() => {
    const start = (fefoPage - 1) * fefoPageSize;
    return fefoPickingList.slice(start, start + fefoPageSize);
  }, [fefoPickingList, fefoPage, fefoPageSize]);

  // Handle Discrepancy Submit
  const handleDiscrepancySubmit = async (e) => {
    e.preventDefault();
    if (!activeBatch) return;
    setSubmitting(true);
    try {
      const pCount = parseInt(physicalCount, 10);
      const diff = Math.abs((activeBatch.quantityAvailable || 0) - pCount);
      const payload = {
        medicineId: activeBatch.medicineId,
        medicineName: activeBatch.medicineName,
        batchId: activeBatch.batchId,
        batchNumber: activeBatch.batchNumber,
        categoryName: activeBatch.categoryName || 'General',
        quantity: diff > 0 ? diff : 1,
        unitCost: 5.0,
        reason: 'STORAGE_FAILURE',
        physicalCondition: `Physical stock count mismatch: Recorded ${activeBatch.quantityAvailable}, Found ${pCount}. ${discrepancyNotes}`
      };
      await createWastageReport(payload);
      showToast(`Discrepancy for batch ${activeBatch.batchNumber} logged & escalated to Lead Pharmacist.`);
      setShowDiscrepancyModal(false);
      setActiveBatch(null);
      setPhysicalCount('');
      setDiscrepancyNotes('');
      loadData();
    } catch (err) {
      alert(err.message || 'Error submitting discrepancy');
    } finally {
      setSubmitting(false);
    }
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
          background: '#2563eb',
          color: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 12px 30px rgba(37,99,235,0.35)',
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
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              color: '#2563eb'
            }}>
              <IconPill size={26} />
            </span>
            Staff Medicine Inventory & Picking Workspace
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.92rem' }}>
            Comprehensive ward medicine directory, shelf location guide, First Expiry First Out picking rules & physical verification.
          </p>
        </div>

        <div>
          <button
            onClick={loadData}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '10px 18px', fontWeight: 600 }}
          >
            <IconRefresh size={16} /> Refresh Stock
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION A: INVENTORY SUMMARY (8 KPIS)
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconClipboard size={18} style={{ color: '#2563eb' }} /> Section A • Ward Inventory Overview
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14
        }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Medicines</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{totalMedicines}</div>
            <div style={{ color: '#2563eb', fontSize: '0.72rem', marginTop: 2 }}>Registered medicines</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Batches</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{totalBatches}</div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: 2 }}>Batches on shelves</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #bbf7d0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#166534', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Available Stock</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#16a34a', marginTop: 4 }}>{availableStock.toLocaleString()}</div>
            <div style={{ color: '#15803d', fontSize: '0.72rem', marginTop: 2 }}>Physical units on hand</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#1e40af', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>In-Stock Medicines</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#2563eb', marginTop: 4 }}>{inStockMedicines}</div>
            <div style={{ color: '#1d4ed8', fontSize: '0.72rem', marginTop: 2 }}>Optimal inventory</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #fed7aa', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#9a3412', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Low Stock</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ea580c', marginTop: 4 }}>{lowStockMedicines}</div>
            <div style={{ color: '#c2410c', fontSize: '0.72rem', marginTop: 2 }}>Needs restocking</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #fecaca', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#991b1b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Out of Stock</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#dc2626', marginTop: 4 }}>{outOfStockMedicines}</div>
            <div style={{ color: '#b91c1c', fontSize: '0.72rem', marginTop: 2 }}>Empty shelf locations</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #fef08a', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#854d0e', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Expiring Soon</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ca8a04', marginTop: 4 }}>{expiringSoonBatches}</div>
            <div style={{ color: '#a16207', fontSize: '0.72rem', marginTop: 2 }}>Pick first under FEFO</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #fecdd3', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#9f1239', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Expired Batches</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#e11d48', marginTop: 4 }}>{expiredBatches}</div>
            <div style={{ color: '#be123c', fontSize: '0.72rem', marginTop: 2 }}>Do not dispense</div>
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
              <IconBox size={22} style={{ color: '#2563eb' }} /> Section B • Ward Medicine & Shelf Location Directory
            </h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              Every batch has its own visible row with shelf location guidance, expiry date, and direct FEFO picking instructions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 280 }}>
              <input
                type="text"
                placeholder="Search medicine, batch, shelf location..."
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
                <th style={{ padding: '12px 10px' }}>Batch Number</th>
                <th style={{ padding: '12px 10px' }}>Storage Location / Shelf</th>
                <th style={{ padding: '12px 10px' }}>Expiry Date</th>
                <th style={{ padding: '12px 10px' }}>Avail Qty</th>
                <th style={{ padding: '12px 10px' }}>Status</th>
                <th style={{ padding: '12px 10px' }}>FEFO Recommendation</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Verify Count</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                    No matching medicine & batch records found.
                  </td>
                </tr>
              ) : (
                paginatedBatches.map((b) => {
                  const isBlocked = b.status === 'EXPIRED' || b.status === 'QUARANTINED' || b.daysRemaining <= 0;
                  const isTopFefo = b.fefoRecommendation === 'PICK THIS BATCH FIRST';

                  return (
                    <tr key={`${b.medicineId}-${b.batchId}`} style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: isTopFefo ? '#f0fdf4' : isBlocked ? '#fffafa' : '#ffffff'
                    }}>
                      <td style={{ padding: '10px 10px', fontWeight: 600, color: '#64748b' }}>MED{String(b.medicineId).padStart(3, '0')}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{b.medicineName}</td>
                      <td style={{ padding: '10px 10px', color: '#475569' }}>{b.categoryName}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontWeight: 700, color: '#2563eb' }}>
                          {b.batchNumber}
                        </code>
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{ background: '#eff6ff', color: '#1e40af', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                          {b.storageLocation}
                        </span>
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
                        {b.quantityAvailable} units
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
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{
                          background: isTopFefo ? '#16a34a' : '#f1f5f9',
                          color: isTopFefo ? '#ffffff' : '#475569',
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 800
                        }}>
                          {b.fefoRecommendation}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setActiveBatch(b);
                            setPhysicalCount(String(b.quantityAvailable));
                            setShowDiscrepancyModal(true);
                          }}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: 8,
                            padding: '4px 10px',
                            fontWeight: 600,
                            fontSize: '0.74rem',
                            color: '#2563eb',
                            cursor: 'pointer'
                          }}
                        >
                          Check Count
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
          SECTION C: FEFO PICKING INSTRUCTIONS (FIRST EXPIRED, FIRST OUT)
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        border: '2px solid #16a34a',
        marginBottom: 32
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-flex', padding: 8, borderRadius: 10, background: '#dcfce7', color: '#16a34a' }}>
              <IconCheckCircle size={20} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Section C • FEFO Picking Instructions (First Expired, First Out)
              </h2>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                Staff picking sequence based on earliest expiry date to guarantee zero expired medicine dispensing.
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
            {fefoPickingList.length} Active Batches
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                <th style={{ padding: '10px 12px' }}>Priority</th>
                <th style={{ padding: '10px 12px' }}>Batch Number</th>
                <th style={{ padding: '10px 12px' }}>Medicine Name</th>
                <th style={{ padding: '10px 12px' }}>Storage / Shelf Location</th>
                <th style={{ padding: '10px 12px' }}>Expiry Date</th>
                <th style={{ padding: '10px 12px' }}>Shelf Life Countdown</th>
                <th style={{ padding: '10px 12px' }}>Available Qty</th>
                <th style={{ padding: '10px 12px' }}>Picking Directive</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFefoPickingList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                    No active eligible batches in queue.
                  </td>
                </tr>
              ) : (
                paginatedFefoPickingList.map((b, idx) => {
                  const absoluteIndex = (fefoPage - 1) * fefoPageSize + idx;
                  return (
                    <tr key={b.batchId} style={{ borderBottom: '1px solid #f1f5f9', background: absoluteIndex === 0 ? '#f0fdf4' : '#ffffff' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          background: absoluteIndex === 0 ? '#16a34a' : '#dcfce7',
                          color: absoluteIndex === 0 ? '#ffffff' : '#15803d',
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontWeight: 800,
                          fontSize: '0.74rem'
                        }}>
                          #{absoluteIndex + 1}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#15803d' }}>
                        <code>{b.batchNumber}</code>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{b.medicineName}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: '#eff6ff', color: '#1e40af', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                          {b.storageLocation}
                        </span>
                      </td>
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
                      <td style={{ padding: '10px 12px' }}>
                        {absoluteIndex === 0 ? (
                          <span style={{ background: '#16a34a', color: '#ffffff', padding: '4px 12px', borderRadius: 8, fontSize: '0.74rem', fontWeight: 800 }}>
                            PICK THIS BATCH FIRST
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.74rem' }}>Next in queue</span>
                        )}
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
          totalItems={fefoPickingList.length}
          pageSize={fefoPageSize}
          onPageChange={setFefoPage}
          showPageSizeSelector={false}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTIONS E & F: PHYSICAL STOCK VERIFICATION & EXPIRY CHECKING
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: 24,
        marginBottom: 32
      }}>
        {/* Section E: Physical Stock Checking & Discrepancy Reporting */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ display: 'inline-flex', padding: 7, borderRadius: 10, background: '#eff6ff', color: '#2563eb' }}>
              <IconClipboard size={20} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Section E • Physical Stock Verification Checklist
              </h2>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                Compare recorded inventory against physical ward shelf counts and log discrepancies.
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '8px 10px' }}>Batch & Med</th>
                  <th style={{ padding: '8px 10px' }}>Recorded Qty</th>
                  <th style={{ padding: '8px 10px' }}>Shelf Location</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Verify Physical Count</th>
                </tr>
              </thead>
              <tbody>
                {enrichedBatches.slice(0, 5).map((b) => (
                  <tr key={b.batchId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: 600 }}>{b.medicineName}</div>
                      <code style={{ fontSize: '0.72rem', color: '#2563eb' }}>{b.batchNumber}</code>
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: 700 }}>{b.quantityAvailable}</td>
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>{b.storageLocation}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setActiveBatch(b);
                          setPhysicalCount(String(b.quantityAvailable));
                          setShowDiscrepancyModal(true);
                        }}
                        style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          borderRadius: 8,
                          padding: '4px 10px',
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          cursor: 'pointer'
                        }}
                      >
                        Report Discrepancy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section F: Expiry Checking Horizon */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ display: 'inline-flex', padding: 7, borderRadius: 10, background: '#fef3c7', color: '#d97706' }}>
              <IconClock size={20} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Section F • Color-Coded Expiry Checking
              </h2>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                Green: Safe (&gt;90d) • Yellow: Expiring Soon (30-90d) • Orange: Critical (&lt;30d) • Red: Expired
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {enrichedBatches.slice(0, 5).map((b) => {
              let badgeColor = { bg: '#dcfce7', text: '#15803d', label: 'Safe (>90 Days)' };
              if (b.daysRemaining <= 0 || b.status === 'EXPIRED') {
                badgeColor = { bg: '#fee2e2', text: '#dc2626', label: 'EXPIRED' };
              } else if (b.daysRemaining <= 30) {
                badgeColor = { bg: '#fed7aa', text: '#c2410c', label: 'Critical (<30 Days)' };
              } else if (b.daysRemaining <= 90) {
                badgeColor = { bg: '#fef08a', text: '#a16207', label: 'Expiring Soon (30-90 Days)' };
              }

              return (
                <div key={b.batchId} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  fontSize: '0.84rem'
                }}>
                  <div>
                    <strong>{b.medicineName}</strong>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Batch: {b.batchNumber} • Shelf: {b.storageLocation}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      background: badgeColor.bg,
                      color: badgeColor.text,
                      padding: '3px 10px',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: '0.72rem'
                    }}>
                      {badgeColor.label}
                    </span>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 3 }}>Exp: {b.expiryDate}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTIONS G & H: STOCK MOVEMENT & READ-ONLY ROLE PERMISSIONS
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: 24,
        marginBottom: 32
      }}>
        {/* Section G: Stock Movement & Assigned Tasks */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ display: 'inline-flex', padding: 7, borderRadius: 10, background: '#eff6ff', color: '#2563eb' }}>
              <IconTruck size={20} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Section G • Stock Movement & Assigned Inspection Tasks
              </h2>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                Recent receiving batches and physical shelf restocking tasks.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.84rem' }}>
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>Restock Shelf A2: Paracetamol 500mg</strong>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Transfer 150 units from primary receiving holding bay</div>
              </div>
              <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700 }}>
                ASSIGNED
              </span>
            </div>
            <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <strong>Cold Chain Temperature Audit: Cold Room 1</strong>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Verify calibrated loggers maintain 2°C to 8°C</div>
              </div>
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700 }}>
                IN PROGRESS
              </span>
            </div>
          </div>
        </div>

        {/* Section H: Staff Permissions & Role Boundaries */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ display: 'inline-flex', padding: 7, borderRadius: 10, background: '#eff6ff', color: '#2563eb' }}>
              <IconShield size={20} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Section H • Staff Role Permissions & Governance Boundaries
              </h2>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                Strict read-only medicine catalog access and discrepancy reporting authority.
              </p>
            </div>
          </div>

          <ul style={{ margin: '8px 0 0 20px', color: '#475569', fontSize: '0.86rem', lineHeight: '1.6' }}>
            <li><strong>Read-Only Access:</strong> View medicines, batches, locations, and expiry dates freely.</li>
            <li><strong>No Deletion Authority:</strong> Medicine creation, editing, and deletion are restricted to Administrator roles.</li>
            <li><strong>No Direct Stock Deduction:</strong> Physical dispensing deductions are strictly authorized and executed by Lead Pharmacists.</li>
            <li><strong>Discrepancy Reporting:</strong> Empowered to report physical count errors, broken vials, or damaged cartons directly to dispensary supervision.</li>
          </ul>
        </div>
      </div>

      {/* Discrepancy Modal */}
      {showDiscrepancyModal && activeBatch && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{ background: '#ffffff', borderRadius: 24, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e40af' }}>
                Report Physical Stock Discrepancy
              </h3>
              <button onClick={() => setShowDiscrepancyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleDiscrepancySubmit} style={{ padding: 24 }}>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0', fontSize: '0.85rem', marginBottom: 16 }}>
                <div>Medicine: <strong>{activeBatch.medicineName}</strong></div>
                <div>Batch #: <code>{activeBatch.batchNumber}</code></div>
                <div>Recorded System Stock: <strong>{activeBatch.quantityAvailable} units</strong></div>
                <div>Storage Location: <em>{activeBatch.storageLocation}</em></div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                  Physical Units Actually Counted: *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={physicalCount}
                  onChange={(e) => setPhysicalCount(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                  Discrepancy Reason:
                </label>
                <select
                  value={discrepancyReason}
                  onChange={(e) => setDiscrepancyReason(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff' }}
                >
                  <option value="COUNT_MISMATCH">Physical count mismatch on shelf</option>
                  <option value="DAMAGED">Damaged packaging / seal broken</option>
                  <option value="STORAGE_FAILURE">Temperature deviation / shelf dampness</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                  Notes for Lead Pharmacist:
                </label>
                <textarea
                  rows={2}
                  value={discrepancyNotes}
                  onChange={(e) => setDiscrepancyNotes(e.target.value)}
                  placeholder="E.g. Recounted twice with Ward Nurse; 10 units missing from Shelf B..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.85rem', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowDiscrepancyModal(false)}
                  style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, padding: '9px 16px', fontWeight: 600, color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: 10,
                    padding: '9px 20px',
                    fontWeight: 700,
                    color: '#fff',
                    cursor: submitting ? 'wait' : 'pointer'
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit to Pharmacist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
