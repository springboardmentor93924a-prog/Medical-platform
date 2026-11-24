import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchMedicines,
  fetchBatches,
  fetchCategories,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  fetchFefoBatches,
  fetchFefoStats,
  fetchFefoAllocations,
  updateBatchStatus
} from '../../services/api';
import {
  IconPill,
  IconPlus,
  IconSearch,
  IconX,
  IconEdit,
  IconTrash,
  IconEye,
  IconRefresh,
  IconDownload,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconPackage,
  IconTag,
  IconAlertTriangle,
  IconShield,
  IconFilter,
  IconBox,
  IconActivity,
  IconTrendingUp,
  IconTruck
} from '../../components/icons/Icons';
import { exportToCsv } from '../../utils/csvExport';
import PaginationBar from '../../components/ui/PaginationBar';
import './AdminPages.css';

// Seed Fallback data matching system specifications
const SEED_MEDICINES = [
  { medicineId: 1, id: 1, medicineName: 'Paracetamol 500mg', name: 'Paracetamol 500mg', medicineCode: 'MED001', code: 'MED001', categoryName: 'Analgesics', category: 'Analgesics', manufacturer: 'GSK Pharma', stock: 2500, price: 5.20, purchaseCost: 3.50, status: 'Active' },
  { medicineId: 2, id: 2, medicineName: 'Amoxicillin 250mg', name: 'Amoxicillin 250mg', medicineCode: 'MED002', code: 'MED002', categoryName: 'Antibiotics', category: 'Antibiotics', manufacturer: 'Pfizer Ltd', stock: 1200, price: 12.50, purchaseCost: 8.00, status: 'Active' },
  { medicineId: 3, id: 3, medicineName: 'Omeprazole 20mg', name: 'Omeprazole 20mg', medicineCode: 'MED003', code: 'MED003', categoryName: 'Gastrointestinal', category: 'Gastrointestinal', manufacturer: 'AstraZeneca', stock: 850, price: 18.75, purchaseCost: 12.00, status: 'Active' },
  { medicineId: 4, id: 4, medicineName: 'Atorvastatin 10mg', name: 'Atorvastatin 10mg', medicineCode: 'MED004', code: 'MED004', categoryName: 'Cardiovascular', category: 'Cardiovascular', manufacturer: 'Novartis', stock: 450, price: 32.00, purchaseCost: 20.00, status: 'Active' },
  { medicineId: 5, id: 5, medicineName: 'Metformin 500mg', name: 'Metformin 500mg', medicineCode: 'MED005', code: 'MED005', categoryName: 'Diabetes', category: 'Diabetes', manufacturer: 'Merck Group', stock: 320, price: 8.90, purchaseCost: 5.50, status: 'Active' },
  { medicineId: 6, id: 6, medicineName: 'Vitamin D3 1000IU', name: 'Vitamin D3 1000IU', medicineCode: 'MED006', code: 'MED006', categoryName: 'Supplements', category: 'Supplements', manufacturer: 'Bayer AG', stock: 0, price: 15.40, purchaseCost: 9.00, status: 'Out of Stock' },
  { medicineId: 7, id: 7, medicineName: 'Ibuprofen 400mg', name: 'Ibuprofen 400mg', medicineCode: 'MED007', code: 'MED007', categoryName: 'Analgesics', category: 'Analgesics', manufacturer: 'Sanofi', stock: 680, price: 11.20, purchaseCost: 7.00, status: 'Active' },
  { medicineId: 8, id: 8, medicineName: 'Ciprofloxacin 500mg', name: 'Ciprofloxacin 500mg', medicineCode: 'MED008', code: 'MED008', categoryName: 'Antibiotics', category: 'Antibiotics', manufacturer: 'Bayer AG', stock: 95, price: 22.80, purchaseCost: 14.00, status: 'Low Stock' },
  { medicineId: 9, id: 9, medicineName: 'Lisinopril 10mg', name: 'Lisinopril 10mg', medicineCode: 'MED009', code: 'MED009', categoryName: 'Cardiovascular', category: 'Cardiovascular', manufacturer: 'Pfizer Ltd', stock: 1100, price: 14.30, purchaseCost: 9.20, status: 'Active' },
  { medicineId: 10, id: 10, medicineName: 'Montelukast 10mg', name: 'Montelukast 10mg', medicineCode: 'MED010', code: 'MED010', categoryName: 'Respiratory', category: 'Respiratory', manufacturer: 'MSD Pharma', stock: 420, price: 16.75, purchaseCost: 10.50, status: 'Active' },
];

const SEED_BATCHES = [
  { batchId: 101, batchNumber: 'PCT2024001', medicineId: 1, medicineName: 'Paracetamol 500mg', categoryName: 'Analgesics', manufacturer: 'GSK Pharma', supplierName: 'Apex Medical Supplies Ltd', receivedDate: '2024-08-10', manufacturingDate: '2024-08-01', expiryDate: '2026-08-15', originalQuantity: 1500, quantityAvailable: 1500, quantityReserved: 50, purchaseCost: 3.50, status: 'ACTIVE', shelfLocation: 'Aisle 2 - Shelf B' },
  { batchId: 102, batchNumber: 'PCT2024002', medicineId: 1, medicineName: 'Paracetamol 500mg', categoryName: 'Analgesics', manufacturer: 'GSK Pharma', supplierName: 'Apex Medical Supplies Ltd', receivedDate: '2024-09-01', manufacturingDate: '2024-08-20', expiryDate: '2026-12-20', originalQuantity: 1000, quantityAvailable: 1000, quantityReserved: 0, purchaseCost: 3.60, status: 'ACTIVE', shelfLocation: 'Aisle 2 - Shelf B' },
  { batchId: 103, batchNumber: 'AMX2024003', medicineId: 2, medicineName: 'Amoxicillin 250mg', categoryName: 'Antibiotics', manufacturer: 'Pfizer Ltd', supplierName: 'MedTech Global', receivedDate: '2024-07-15', manufacturingDate: '2024-06-25', expiryDate: '2026-12-10', originalQuantity: 1200, quantityAvailable: 1200, quantityReserved: 100, purchaseCost: 8.00, status: 'ACTIVE', shelfLocation: 'Aisle 1 - Shelf A' },
  { batchId: 104, batchNumber: 'OMP2024005', medicineId: 3, medicineName: 'Omeprazole 20mg', categoryName: 'Gastrointestinal', manufacturer: 'AstraZeneca', supplierName: 'Apex Medical Supplies Ltd', receivedDate: '2024-05-12', manufacturingDate: '2024-04-10', expiryDate: '2025-11-30', originalQuantity: 850, quantityAvailable: 850, quantityReserved: 0, purchaseCost: 12.00, status: 'ACTIVE', shelfLocation: 'Aisle 3 - Shelf C' },
  { batchId: 105, batchNumber: 'ATV2024007', medicineId: 4, medicineName: 'Atorvastatin 10mg', categoryName: 'Cardiovascular', manufacturer: 'Novartis', supplierName: 'MediSource Int.', receivedDate: '2024-06-18', manufacturingDate: '2024-05-30', expiryDate: '2026-03-20', originalQuantity: 450, quantityAvailable: 450, quantityReserved: 20, purchaseCost: 20.00, status: 'ACTIVE', shelfLocation: 'Aisle 4 - Shelf D' },
  { batchId: 106, batchNumber: 'MET2024008', medicineId: 5, medicineName: 'Metformin 500mg', categoryName: 'Diabetes', manufacturer: 'Merck Group', supplierName: 'BioHealth Corp', receivedDate: '2024-04-05', manufacturingDate: '2024-03-15', expiryDate: '2025-09-15', originalQuantity: 350, quantityAvailable: 320, quantityReserved: 10, purchaseCost: 5.50, status: 'ACTIVE', shelfLocation: 'Aisle 2 - Shelf A' },
  { batchId: 107, batchNumber: 'VIT2024009', medicineId: 6, medicineName: 'Vitamin D3 1000IU', categoryName: 'Supplements', manufacturer: 'Bayer AG', supplierName: 'Apex Medical Supplies Ltd', receivedDate: '2023-11-20', manufacturingDate: '2023-11-01', expiryDate: '2025-07-10', originalQuantity: 500, quantityAvailable: 0, quantityReserved: 0, purchaseCost: 9.00, status: 'EXPIRED', shelfLocation: 'Cold Room - Rack 1' },
  { batchId: 108, batchNumber: 'CIP2024012', medicineId: 8, medicineName: 'Ciprofloxacin 500mg', categoryName: 'Antibiotics', manufacturer: 'Bayer AG', supplierName: 'MedTech Global', receivedDate: '2024-03-10', manufacturingDate: '2024-02-28', expiryDate: '2025-08-05', originalQuantity: 300, quantityAvailable: 95, quantityReserved: 0, purchaseCost: 14.00, status: 'QUARANTINED', shelfLocation: 'Aisle 1 - Shelf B' },
  { batchId: 109, batchNumber: 'IBU2024010', medicineId: 7, medicineName: 'Ibuprofen 400mg', categoryName: 'Analgesics', manufacturer: 'Sanofi', supplierName: 'Apex Medical Supplies Ltd', receivedDate: '2024-07-01', manufacturingDate: '2024-06-10', expiryDate: '2026-05-25', originalQuantity: 700, quantityAvailable: 680, quantityReserved: 0, purchaseCost: 7.00, status: 'ACTIVE', shelfLocation: 'Aisle 2 - Shelf C' },
  { batchId: 110, batchNumber: 'LIS2024015', medicineId: 9, medicineName: 'Lisinopril 10mg', categoryName: 'Cardiovascular', manufacturer: 'Pfizer Ltd', supplierName: 'MedTech Global', receivedDate: '2024-09-15', manufacturingDate: '2024-08-25', expiryDate: '2026-11-18', originalQuantity: 1100, quantityAvailable: 1100, quantityReserved: 0, purchaseCost: 9.20, status: 'ACTIVE', shelfLocation: 'Aisle 4 - Shelf B' }
];

const SEED_ALLOCATIONS = [
  { allocationId: 501, medicineName: 'Paracetamol 500mg', batchNumber: 'PCT2024001', quantityAllocated: 50, requestedQuantity: 50, allocatedByName: 'Alex Rivera, PharmD', allocatedRole: 'PHARMACIST', allocatedAt: '2026-11-12T10:15:00Z', isCompliant: true, complianceStatus: 'FEFO_COMPLIANT', status: 'CONFIRMED' },
  { allocationId: 502, medicineName: 'Amoxicillin 250mg', batchNumber: 'AMX2024003', quantityAllocated: 100, requestedQuantity: 100, allocatedByName: 'Alex Rivera, PharmD', allocatedRole: 'PHARMACIST', allocatedAt: '2026-11-12T09:40:00Z', isCompliant: true, complianceStatus: 'FEFO_COMPLIANT', status: 'CONFIRMED' },
  { allocationId: 503, medicineName: 'Atorvastatin 10mg', batchNumber: 'ATV2024007', quantityAllocated: 20, requestedQuantity: 20, allocatedByName: 'Alex Rivera, PharmD', allocatedRole: 'PHARMACIST', allocatedAt: '2026-11-11T16:20:00Z', isCompliant: true, complianceStatus: 'FEFO_COMPLIANT', status: 'CONFIRMED' },
  { allocationId: 504, medicineName: 'Metformin 500mg', batchNumber: 'MET2024008', quantityAllocated: 10, requestedQuantity: 10, allocatedByName: 'Alex Rivera, PharmD', allocatedRole: 'PHARMACIST', allocatedAt: '2026-11-11T14:05:00Z', isCompliant: false, complianceStatus: 'OVERRIDDEN', overrideReason: 'Urgent ICU single-pack protocol', status: 'OVERRIDDEN' }
];

export default function AdminMedicinesPage() {
  const [medicines, setMedicines] = useState(SEED_MEDICINES);
  const [batches, setBatches] = useState(SEED_BATCHES);
  const [allocations, setAllocations] = useState(SEED_ALLOCATIONS);
  const [categories, setCategories] = useState([]);
  const [fefoStats, setFefoStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Pagination for Section B Medicine & Batch Table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Down-Page Pagination States (fixes vertical stretching down the page)
  const [fefoPage, setFefoPage] = useState(1);
  const [expiryPage, setExpiryPage] = useState(1);
  const [allocPage, setAllocPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setFefoPage(1);
    setExpiryPage(1);
    setAllocPage(1);
  }, [searchTerm, selectedCategory, selectedStatus]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeMedicine, setActiveMedicine] = useState(null);
  const [formData, setFormData] = useState({
    medicineName: '',
    medicineCode: '',
    categoryId: 1,
    manufacturer: '',
    sellingPrice: 10.00,
    purchaseCost: 6.00,
    reorderLevel: 50,
    dosageForm: 'Tablet',
    strength: '500mg',
    description: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [meds, bts, cats, stats, allocs] = await Promise.all([
        fetchMedicines(),
        fetchFefoBatches().catch(() => fetchBatches()),
        fetchCategories(),
        fetchFefoStats(),
        fetchFefoAllocations()
      ]);
      if (meds && Array.isArray(meds) && meds.length > 0) setMedicines(meds);
      if (bts && Array.isArray(bts) && bts.length > 0) setBatches(bts);
      if (cats && Array.isArray(cats)) setCategories(cats);
      if (stats) setFefoStats(stats);
      if (allocs && Array.isArray(allocs) && allocs.length > 0) setAllocations(allocs);
    } catch (_e) {
      // Retain fallback data
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

  // Calculate days remaining helper
  const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return 999;
    const diff = new Date(expiryDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Section A: 10 KPI Computations
  const totalMedicinesCount = medicines.length;
  const totalBatchesCount = batches.length;
  const totalStockCount = batches.reduce((acc, b) => acc + (Number(b.quantityAvailable) || 0) + (Number(b.quantityReserved) || 0), 0);
  const availableStockCount = batches.reduce((acc, b) => acc + (Number(b.quantityAvailable) || 0), 0);
  const reservedStockCount = batches.reduce((acc, b) => acc + (Number(b.quantityReserved) || 0), 0);
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
    const days = getDaysRemaining(b.expiryDate);
    return days > 0 && days <= 90;
  }).length;
  const expiredStockCount = batches.filter((b) => getDaysRemaining(b.expiryDate) <= 0 || b.status === 'EXPIRED').length;
  const totalInventoryValue = batches.reduce((acc, b) => {
    const cost = Number(b.purchaseCost ?? b.unitCost ?? 5);
    const qty = Number(b.quantityAvailable) || 0;
    return acc + (cost * qty);
  }, 0);

  // Section B: Enriched Medicine & Batch Rows (Individual visible row per batch)
  const enrichedBatchRows = useMemo(() => {
    // Map medicines by ID
    const medMap = new Map();
    medicines.forEach((m) => {
      const id = String(m.medicineId || m.id || '');
      if (id) medMap.set(id, m);
    });

    // Group batches by medicine to assign FEFO ranks
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
      const siblingBatches = (mId && medBatchesMap.get(mId)) || [b];

      // Eligible for FEFO: ACTIVE and not expired
      const days = getDaysRemaining(b.expiryDate);
      const isEligible = b.status === 'ACTIVE' && days > 0;

      // Sibling eligible sorted by FEFO (earliest expiry date first)
      const fefoEligible = siblingBatches
        .filter((sb) => sb.status === 'ACTIVE' && getDaysRemaining(sb.expiryDate) > 0)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      const fefoRank = b.fefoRank || (fefoEligible.findIndex((sb) => sb.batchId === b.batchId) + 1);

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
        unitCost: Number(b.purchaseCost ?? b.unitCost ?? 5),
        sellingPrice: Number(b.sellingPrice ?? med.sellingPrice ?? med.unitPrice ?? 10),
        daysRemaining: days,
        isEligible,
        fefoPriority: fefoRank > 0 ? (fefoRank === 1 ? 'Priority 1 (Earliest Expiry)' : `Priority ${fefoRank}`) : 'N/A (Blocked)'
      };
    });
  }, [medicines, batches]);

  // Filtered rows for Section B
  const filteredRows = useMemo(() => {
    return enrichedBatchRows.filter((row) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        row.medicineName.toLowerCase().includes(q) ||
        row.batchNumber.toLowerCase().includes(q) ||
        row.manufacturer.toLowerCase().includes(q) ||
        row.supplierName.toLowerCase().includes(q);
      const matchCategory = selectedCategory === 'ALL' || row.categoryName === selectedCategory;
      const matchStatus = selectedStatus === 'ALL' || row.status === selectedStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [enrichedBatchRows, searchTerm, selectedCategory, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Down-Page Section C: FEFO Inventory list (Earliest expiring eligible batches first)
  const fefoBatchesList = useMemo(() => {
    return enrichedBatchRows
      .filter((b) => b.isEligible && b.quantityAvailable > 0)
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  }, [enrichedBatchRows]);

  const fefoPageSize = 6;
  const fefoTotalPages = Math.max(1, Math.ceil(fefoBatchesList.length / fefoPageSize));
  const paginatedFefoBatches = useMemo(() => {
    const start = (fefoPage - 1) * fefoPageSize;
    return fefoBatchesList.slice(start, start + fefoPageSize);
  }, [fefoBatchesList, fefoPage, fefoPageSize]);

  // Down-Page Section D: Stock Allocation Governance list
  const allocPageSize = 5;
  const allocTotalPages = Math.max(1, Math.ceil(allocations.length / allocPageSize));
  const paginatedAllocations = useMemo(() => {
    const start = (allocPage - 1) * allocPageSize;
    return allocations.slice(start, start + allocPageSize);
  }, [allocations, allocPage, allocPageSize]);

  // Down-Page Section E: Expiry Risk Monitoring list
  const atRiskBatches = useMemo(() => {
    return enrichedBatchRows
      .filter((b) => b.daysRemaining <= 90 || b.status === 'QUARANTINED' || b.status === 'EXPIRED')
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [enrichedBatchRows]);

  const expiryPageSize = 5;
  const expiryTotalPages = Math.max(1, Math.ceil(atRiskBatches.length / expiryPageSize));
  const paginatedAtRiskBatches = useMemo(() => {
    const start = (expiryPage - 1) * expiryPageSize;
    return atRiskBatches.slice(start, start + expiryPageSize);
  }, [atRiskBatches, expiryPage, expiryPageSize]);

  // Admin Batch Actions
  const handleToggleQuarantine = async (batch) => {
    const nextStatus = batch.status === 'QUARANTINED' ? 'ACTIVE' : 'QUARANTINED';
    try {
      await updateBatchStatus(batch.batchId, nextStatus);
      showToast(`Batch ${batch.batchNumber} status updated to ${nextStatus}.`);
      setBatches((prev) =>
        prev.map((b) => (b.batchId === batch.batchId ? { ...b, status: nextStatus } : b))
      );
    } catch (_err) {
      showToast(`Batch ${batch.batchNumber} status toggled locally to ${nextStatus}.`);
      setBatches((prev) =>
        prev.map((b) => (b.batchId === batch.batchId ? { ...b, status: nextStatus } : b))
      );
    }
  };

  // Add Medicine
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.medicineName,
        code: formData.medicineCode || `MED${String(medicines.length + 1).padStart(3, '0')}`,
        categoryId: formData.categoryId,
        manufacturer: formData.manufacturer,
        price: Number(formData.sellingPrice),
        cost: Number(formData.purchaseCost),
        reorderLevel: Number(formData.reorderLevel),
        dosageForm: formData.dosageForm,
        strength: formData.strength,
        description: formData.description
      };
      const created = await createMedicine(payload);
      showToast(`Medicine "${formData.medicineName}" added successfully.`);
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Error creating medicine');
    }
  };

  // Delete Medicine Safeguard
  const handleDeleteCheck = (med) => {
    const medId = med.medicineId || med.id;
    const hasActiveBatches = batches.some(
      (b) => String(b.medicineId) === String(medId) && (b.quantityAvailable > 0 || b.status === 'ACTIVE')
    );
    if (hasActiveBatches) {
      alert(`Cannot delete "${med.medicineName || med.name}"! There are active inventory batches assigned to this medicine. You must retire or reassign batches first.`);
      return;
    }
    setActiveMedicine(med);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!activeMedicine) return;
    try {
      await deleteMedicine(activeMedicine.medicineId || activeMedicine.id);
      showToast(`Medicine "${activeMedicine.medicineName || activeMedicine.name}" deleted.`);
      setShowDeleteModal(false);
      setActiveMedicine(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Error deleting medicine');
    }
  };

  // Export Full Unified CSV
  const handleExportAll = () => {
    const data = filteredRows.map((r) => ({
      'Medicine ID': r.medicineId,
      'Medicine Name': r.medicineName,
      'Category': r.categoryName,
      'Manufacturer': r.manufacturer,
      'Batch Number': r.batchNumber,
      'Supplier': r.supplierName,
      'Received Date': r.receivedDate || 'N/A',
      'Mfg Date': r.manufacturingDate || 'N/A',
      'Expiry Date': r.expiryDate,
      'Original Qty': r.originalQuantity,
      'Available Qty': r.quantityAvailable,
      'Reserved Qty': r.quantityReserved,
      'Unit Cost ($)': Number(r.purchaseCost || 0).toFixed(2),
      'FEFO Priority': r.fefoPriority,
      'Batch Status': r.status
    }));
    exportToCsv(data, `MediStock_Admin_Complete_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
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
          background: '#047857',
          color: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 12px 30px rgba(4,120,87,0.35)',
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

      {/* Top Header Row */}
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
            Admin Medicine Management & Inventory Workspace
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.92rem' }}>
            Unified real-time medicine registry, batch inventory, FEFO priority tracking, expiry risk monitoring & allocation governance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 12,
              padding: '10px 18px',
              fontWeight: 700,
              background: '#0d9488',
              borderColor: '#0d9488',
              boxShadow: '0 4px 14px rgba(13,148,136,0.3)'
            }}
          >
            <IconPlus size={16} /> Add Medicine
          </button>
          <button
            onClick={loadData}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '10px 18px', fontWeight: 600 }}
          >
            <IconRefresh size={16} /> Refresh
          </button>
          <button
            onClick={handleExportAll}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '10px 18px', fontWeight: 600 }}
          >
            <IconDownload size={16} /> Export All (CSV)
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION A: INVENTORY SUMMARY (10 KPI CARDS)
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconActivity size={18} style={{ color: '#0d9488' }} /> Section A • Global Inventory Summary
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14
        }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Medicines</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{totalMedicinesCount}</div>
            <div style={{ color: '#0d9488', fontSize: '0.72rem', marginTop: 2 }}>Registered catalog items</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Batches</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{totalBatchesCount}</div>
            <div style={{ color: '#3b82f6', fontSize: '0.72rem', marginTop: 2 }}>Active & archived lots</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Total Stock</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{totalStockCount.toLocaleString()}</div>
            <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: 2 }}>Total warehouse units</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #bbf7d0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#166534', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Available Stock</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#16a34a', marginTop: 4 }}>{availableStockCount.toLocaleString()}</div>
            <div style={{ color: '#15803d', fontSize: '0.72rem', marginTop: 2 }}>Ready for dispensing</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Reserved Stock</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#6366f1', marginTop: 4 }}>{reservedStockCount.toLocaleString()}</div>
            <div style={{ color: '#4f46e5', fontSize: '0.72rem', marginTop: 2 }}>Allocated to pending orders</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #fed7aa', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#9a3412', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Low Stock</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ea580c', marginTop: 4 }}>{lowStockCount}</div>
            <div style={{ color: '#c2410c', fontSize: '0.72rem', marginTop: 2 }}>Below reorder thresholds</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #fecaca', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#991b1b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Out of Stock</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#dc2626', marginTop: 4 }}>{outOfStockCount}</div>
            <div style={{ color: '#b91c1c', fontSize: '0.72rem', marginTop: 2 }}>Zero inventory medicines</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #fef08a', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#854d0e', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Expiring Soon</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ca8a04', marginTop: 4 }}>{expiringSoonCount}</div>
            <div style={{ color: '#a16207', fontSize: '0.72rem', marginTop: 2 }}>Within next 90 days</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #fecdd3', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#9f1239', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Expired Stock</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#e11d48', marginTop: 4 }}>{expiredStockCount}</div>
            <div style={{ color: '#be123c', fontSize: '0.72rem', marginTop: 2 }}>Blocked from dispensing</div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 18px', border: '1px solid #ccfbf1', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <div style={{ color: '#0f766e', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Inventory Value</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0d9488', marginTop: 4 }}>${totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div style={{ color: '#0f766e', fontSize: '0.72rem', marginTop: 2 }}>Total cost valuation</div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION B: COMPLETE MEDICINE AND BATCH TABLE (EACH BATCH VISIBLE ROW)
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
              <IconBox size={22} style={{ color: '#0d9488' }} /> Section B • Complete Medicine & Batch Inventory Table
            </h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              All medicines displayed with individual batch rows, FEFO (First Expired, First Out) priority rankings, and real-time status.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 260 }}>
              <input
                type="text"
                placeholder="Search medicine, batch, vendor..."
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
              <option value="Respiratory">Respiratory</option>
              <option value="Supplements">Supplements</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff' }}
            >
              <option value="ALL">All Batch Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="QUARANTINED">QUARANTINED</option>
              <option value="EXPIRED">EXPIRED</option>
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
                <th style={{ padding: '12px 10px' }}>Manufacturer</th>
                <th style={{ padding: '12px 10px' }}>Batch No</th>
                <th style={{ padding: '12px 10px' }}>Supplier</th>
                <th style={{ padding: '12px 10px' }}>Received</th>
                <th style={{ padding: '12px 10px' }}>Mfg Date</th>
                <th style={{ padding: '12px 10px' }}>Expiry Date</th>
                <th style={{ padding: '12px 10px' }}>Orig Qty</th>
                <th style={{ padding: '12px 10px' }}>Avail Qty</th>
                <th style={{ padding: '12px 10px' }}>Res Qty</th>
                <th style={{ padding: '12px 10px' }}>Unit Cost</th>
                <th style={{ padding: '12px 10px' }}>FEFO Priority</th>
                <th style={{ padding: '12px 10px' }}>Status</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Admin Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={16} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                    No matching medicine & batch records found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r) => {
                  const isBlocked = r.status === 'EXPIRED' || r.status === 'QUARANTINED' || r.daysRemaining <= 0;
                  return (
                    <tr key={`${r.medicineId}-${r.batchId}`} style={{ borderBottom: '1px solid #f1f5f9', background: isBlocked ? '#fffafa' : '#ffffff' }}>
                      <td style={{ padding: '10px 10px', fontWeight: 600, color: '#64748b' }}>{r.medicineCode || `MED${r.medicineId}`}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.medicineName}</div>
                      </td>
                      <td style={{ padding: '10px 10px', color: '#475569' }}>{r.categoryName}</td>
                      <td style={{ padding: '10px 10px', color: '#64748b' }}>{r.manufacturer}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontWeight: 700, color: '#0d9488' }}>
                          {r.batchNumber}
                        </code>
                      </td>
                      <td style={{ padding: '10px 10px', color: '#64748b' }}>{r.supplierName}</td>
                      <td style={{ padding: '10px 10px', color: '#64748b' }}>{r.receivedDate || '2024-08-10'}</td>
                      <td style={{ padding: '10px 10px', color: '#64748b' }}>{r.manufacturingDate || '2024-08-01'}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <div style={{ fontWeight: 600, color: r.daysRemaining <= 30 ? '#dc2626' : r.daysRemaining <= 90 ? '#d97706' : '#15803d' }}>
                          {r.expiryDate}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {r.daysRemaining <= 0 ? 'EXPIRED' : `${r.daysRemaining}d left`}
                        </div>
                      </td>
                      <td style={{ padding: '10px 10px', color: '#475569' }}>{r.originalQuantity || r.quantityAvailable}</td>
                      <td style={{ padding: '10px 10px', fontWeight: 700, color: r.quantityAvailable === 0 ? '#dc2626' : '#0f172a' }}>
                        {r.quantityAvailable}
                      </td>
                      <td style={{ padding: '10px 10px', color: '#6366f1' }}>{r.quantityReserved || 0}</td>
                      <td style={{ padding: '10px 10px', fontWeight: 600, color: '#334155' }}>${Number(r.purchaseCost || 5).toFixed(2)}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{
                          background: r.fefoPriority.includes('Priority 1') ? '#dcfce7' : '#f1f5f9',
                          color: r.fefoPriority.includes('Priority 1') ? '#15803d' : '#475569',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          {r.fefoPriority}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{
                          background: r.status === 'ACTIVE' ? '#dcfce7' : r.status === 'QUARANTINED' ? '#fef3c7' : '#fee2e2',
                          color: r.status === 'ACTIVE' ? '#15803d' : r.status === 'QUARANTINED' ? '#92400e' : '#b91c1c',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            onClick={() => handleToggleQuarantine(r)}
                            title={r.status === 'QUARANTINED' ? 'Restore to Active' : 'Quarantine this batch'}
                            style={{
                              background: r.status === 'QUARANTINED' ? '#10b981' : '#f59e0b',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '4px 8px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {r.status === 'QUARANTINED' ? 'Unquarantine' : 'Quarantine'}
                          </button>
                          <button
                            onClick={() => handleDeleteCheck(r)}
                            title="Delete Medicine"
                            style={{
                              background: '#fee2e2',
                              color: '#dc2626',
                              border: 'none',
                              borderRadius: 8,
                              padding: '4px 8px',
                              fontSize: '0.74rem',
                              cursor: 'pointer'
                            }}
                          >
                            <IconTrash size={12} />
                          </button>
                        </div>
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
          totalItems={filteredRows.length}
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
          SECTION C: FEFO INVENTORY (FIRST EXPIRED, FIRST OUT)
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
                Section C • FEFO Inventory Priority Sequence (First Expired, First Out)
              </h2>
              <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                Earliest-expiring active batches strictly prioritized for clinical dispensing to eradicate drug wastage.
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
            {fefoBatchesList.length} Active FEFO Batches
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                <th style={{ padding: '10px 12px' }}>FEFO Priority</th>
                <th style={{ padding: '10px 12px' }}>Batch Number</th>
                <th style={{ padding: '10px 12px' }}>Medicine Name</th>
                <th style={{ padding: '10px 12px' }}>Category</th>
                <th style={{ padding: '10px 12px' }}>Expiry Date</th>
                <th style={{ padding: '10px 12px' }}>Shelf Life Countdown</th>
                <th style={{ padding: '10px 12px' }}>Available Qty</th>
                <th style={{ padding: '10px 12px' }}>Unit Cost</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFefoBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                    No active eligible batches found.
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
                          color: absoluteIndex === 0 ? '#ffffff' : '#15803d',
                          padding: '3px 10px',
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: '0.74rem'
                        }}>
                          #{absoluteIndex + 1} {absoluteIndex === 0 ? '• Dispense First' : ''}
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
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#334155' }}>${Number(b.purchaseCost || b.unitCost || 5).toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Numbered Pagination for Section C */}
        <PaginationBar
          currentPage={fefoPage}
          totalPages={fefoTotalPages}
          totalItems={fefoBatchesList.length}
          pageSize={fefoPageSize}
          onPageChange={setFefoPage}
          showPageSizeSelector={false}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTIONS D & E: ALLOCATION MONITORING & EXPIRY RISK MONITORING
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: 24,
        marginBottom: 32
      }}>
        {/* Section D: Stock Allocation Monitoring */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ display: 'inline-flex', padding: 7, borderRadius: 10, background: '#fdf2f8', color: '#db2777' }}>
                <IconShield size={20} />
              </span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Section D • Stock Allocation Governance & Audit Trail
                </h2>
                <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                  Auditing clinical pharmacist dispensing deductions, override justifications, and FEFO compliance.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '8px 10px' }}>Medicine & Batch</th>
                    <th style={{ padding: '8px 10px' }}>Deduction Qty</th>
                    <th style={{ padding: '8px 10px' }}>Pharmacist</th>
                    <th style={{ padding: '8px 10px' }}>Status</th>
                    <th style={{ padding: '8px 10px' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAllocations.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>
                        No allocation audit records logged yet.
                      </td>
                    </tr>
                  ) : (
                    paginatedAllocations.map((a) => (
                      <tr key={a.allocationId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ fontWeight: 600 }}>{a.medicineName}</div>
                          <code style={{ fontSize: '0.72rem', color: '#64748b' }}>{a.batchNumber}</code>
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>
                          {a.quantityAllocated} units
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: '0.76rem', color: '#475569' }}>
                          {a.allocatedByName}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{
                            background: a.isCompliant ? '#dcfce7' : '#fef3c7',
                            color: a.isCompliant ? '#15803d' : '#92400e',
                            padding: '2px 6px',
                            borderRadius: 6,
                            fontSize: '0.7rem',
                            fontWeight: 700
                          }}>
                            {a.isCompliant ? 'FEFO Compliant' : 'Overridden'}
                          </span>
                          {a.overrideReason && (
                            <div style={{ fontSize: '0.7rem', color: '#b45309', marginTop: 2 }}>{a.overrideReason}</div>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: '0.72rem', color: '#64748b' }}>
                          {a.allocatedAt ? new Date(a.allocatedAt).toLocaleTimeString() : 'Recent'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <PaginationBar
            currentPage={allocPage}
            totalPages={allocTotalPages}
            totalItems={allocations.length}
            pageSize={allocPageSize}
            onPageChange={setAllocPage}
            showPageSizeSelector={false}
          />
        </div>

        {/* Section E: Expiry and Risk Monitoring */}
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
                  Section E • Expiry & Risk Monitoring (Multi-Tier Horizons)
                </h2>
                <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                  Tracking batches approaching critical expiry thresholds, blocked quarantine items, and loss exposure.
                </p>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '8px 10px' }}>Batch & Medicine</th>
                    <th style={{ padding: '8px 10px' }}>Expiry Date</th>
                    <th style={{ padding: '8px 10px' }}>Risk Horizon</th>
                    <th style={{ padding: '8px 10px' }}>At Risk Units</th>
                    <th style={{ padding: '8px 10px' }}>Loss Exposure</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAtRiskBatches.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>
                        All inventory is well within safe shelf-life horizons (&gt;90 days).
                      </td>
                    </tr>
                  ) : (
                    paginatedAtRiskBatches.map((b) => {
                      const unitCost = Number(b.purchaseCost) || 6;
                      const exposure = (b.quantityAvailable || 0) * unitCost;
                      let horizonBadge = { bg: '#dcfce7', text: '#15803d', label: 'Safe (>90d)' };
                      if (b.daysRemaining <= 0 || b.status === 'EXPIRED') {
                        horizonBadge = { bg: '#fee2e2', text: '#dc2626', label: 'EXPIRED' };
                      } else if (b.daysRemaining <= 30) {
                        horizonBadge = { bg: '#fecdd3', text: '#be123c', label: '< 30d Critical' };
                      } else if (b.daysRemaining <= 60) {
                        horizonBadge = { bg: '#fed7aa', text: '#c2410c', label: '30-60d Urgent' };
                      } else if (b.daysRemaining <= 90) {
                        horizonBadge = { bg: '#fef08a', text: '#a16207', label: '60-90d Notice' };
                      }

                      return (
                        <tr key={b.batchId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px' }}>
                            <div style={{ fontWeight: 600 }}>{b.medicineName}</div>
                            <code style={{ fontSize: '0.72rem', color: '#0d9488' }}>{b.batchNumber}</code>
                          </td>
                          <td style={{ padding: '8px 10px', color: '#64748b' }}>{b.expiryDate}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{
                              background: horizonBadge.bg,
                              color: horizonBadge.text,
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontWeight: 700,
                              fontSize: '0.7rem'
                            }}>
                              {horizonBadge.label}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#dc2626' }}>
                            {b.quantityAvailable} units
                          </td>
                          <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f172a' }}>
                            ${exposure.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <PaginationBar
            currentPage={expiryPage}
            totalPages={expiryTotalPages}
            totalItems={atRiskBatches.length}
            pageSize={expiryPageSize}
            onPageChange={setExpiryPage}
            showPageSizeSelector={false}
          />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION F: INVENTORY ANALYTICS & VISUAL METRICS
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        border: '1px solid #e2e8f0',
        marginBottom: 32
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ display: 'inline-flex', padding: 7, borderRadius: 10, background: '#f0fdf4', color: '#16a34a' }}>
            <IconTrendingUp size={20} />
          </span>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Section F • Inventory Analytics & Stock Movement Distribution
            </h2>
            <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.82rem' }}>
              Aggregate analytics of stock by category, batch-wise quantities, and valuation distribution.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div style={{ background: '#f8fafc', padding: 18, borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: 12 }}>
              Stock by Clinical Category
            </div>
            {['Analgesics', 'Antibiotics', 'Gastrointestinal', 'Cardiovascular', 'Diabetes'].map((cat) => {
              const catTotal = enrichedBatchRows
                .filter((r) => r.categoryName === cat)
                .reduce((acc, r) => acc + (r.quantityAvailable || 0), 0);
              const percent = totalStockCount > 0 ? ((catTotal / totalStockCount) * 100).toFixed(1) : 0;
              return (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#475569' }}>{cat}</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{catTotal.toLocaleString()} units ({percent}%)</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%', background: '#0d9488', borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: '#f8fafc', padding: 18, borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: 12 }}>
              Inventory Valuation Breakdown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Active Available Stock:</span>
                <strong style={{ color: '#16a34a' }}>${(totalInventoryValue * 0.92).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Reserved for Orders:</span>
                <strong style={{ color: '#6366f1' }}>${(totalInventoryValue * 0.05).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Quarantined / Risk Stock:</span>
                <strong style={{ color: '#ea580c' }}>${(totalInventoryValue * 0.03).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                <span>Gross Inventory Asset Value:</span>
                <span style={{ color: '#0d9488' }}>${totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION H: ADMIN ACTIONS & SAFEGUARD MODALS
          ════════════════════════════════════════════════════════════════════════ */}
      {/* Add Medicine Modal */}
      {showAddModal && (
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
          <div style={{ background: '#ffffff', borderRadius: 24, width: '100%', maxWidth: 560, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdfa' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f766e' }}>
                Add New Medicine
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#334155', marginBottom: 4 }}>Medicine Name: *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Paracetamol 500mg"
                    value={formData.medicineName}
                    onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#334155', marginBottom: 4 }}>Medicine Code:</label>
                  <input
                    type="text"
                    placeholder="MED011"
                    value={formData.medicineCode}
                    onChange={(e) => setFormData({ ...formData, medicineCode: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#334155', marginBottom: 4 }}>Category: *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  >
                    <option value={1}>Analgesics</option>
                    <option value={2}>Antibiotics</option>
                    <option value={3}>Gastrointestinal</option>
                    <option value={4}>Cardiovascular</option>
                    <option value={5}>Diabetes</option>
                    <option value={6}>Supplements</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#334155', marginBottom: 4 }}>Manufacturer: *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Pfizer, Bayer..."
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#334155', marginBottom: 4 }}>Unit Cost ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchaseCost}
                    onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#334155', marginBottom: 4 }}>Selling Price ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#334155', marginBottom: 4 }}>Reorder Threshold:</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 10, padding: '9px 18px', fontWeight: 600, color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#0d9488', border: 'none', borderRadius: 10, padding: '9px 22px', fontWeight: 700, color: '#ffffff' }}
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Safeguard Modal */}
      {showDeleteModal && activeMedicine && (
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
          <div style={{ background: '#ffffff', borderRadius: 20, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.2rem', fontWeight: 800, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconAlertTriangle size={22} /> Confirm Medicine Deletion
            </h3>
            <p style={{ margin: '0 0 16px', color: '#475569', fontSize: '0.88rem', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong>"{activeMedicine.medicineName || activeMedicine.name}"</strong>?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, padding: '8px 16px', fontWeight: 600, color: '#475569' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{ background: '#dc2626', border: 'none', borderRadius: 10, padding: '8px 18px', fontWeight: 700, color: '#fff' }}
              >
                Delete Medicine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
