import { useState, useEffect } from 'react';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { IconInventory, IconPlus } from '../../components/icons/Icons';
import { fetchInventory } from '../../services/api';
import './InventoryPage.css';

/*
 * ─── UI SAMPLE DATA ─────────────────────────────────────────────────
 * Clearly marked as SAMPLE data for UI demonstration purposes.
 * NOT from the database. Will be replaced once GET /api/inventory
 * is implemented in the backend.
 * ──────────────────────────────────────────────────────────────────────
 */
const SAMPLE_INVENTORY = [
  { id: 1, medicineName: 'Paracetamol 500mg', batchNo: 'PCM-2026-A1', quantity: 4500, reorderLevel: 500, expiryDate: '2027-06-15', status: 'In Stock' },
  { id: 2, medicineName: 'Amoxicillin 250mg', batchNo: 'AMX-2026-B3', quantity: 12, reorderLevel: 100, expiryDate: '2027-03-20', status: 'Low Stock' },
  { id: 3, medicineName: 'Ibuprofen 400mg', batchNo: 'IBU-2026-C2', quantity: 1800, reorderLevel: 200, expiryDate: '2027-09-01', status: 'In Stock' },
  { id: 4, medicineName: 'Omeprazole 20mg', batchNo: 'OMP-2025-D1', quantity: 0, reorderLevel: 150, expiryDate: '2026-01-10', status: 'Out of Stock' },
  { id: 5, medicineName: 'Metformin 500mg', batchNo: 'MTF-2026-E5', quantity: 2200, reorderLevel: 300, expiryDate: '2027-12-31', status: 'In Stock' },
  { id: 6, medicineName: 'Ciprofloxacin 500mg', batchNo: 'CIP-2026-F2', quantity: 45, reorderLevel: 100, expiryDate: '2027-04-18', status: 'Low Stock' },
  { id: 7, medicineName: 'Vitamin C 1000mg', batchNo: 'VC-2024-G1', quantity: 300, reorderLevel: 200, expiryDate: '2026-10-05', status: 'Expiring Soon' },
  { id: 8, medicineName: 'Losartan 50mg', batchNo: 'LOS-2026-H3', quantity: 780, reorderLevel: 100, expiryDate: '2028-01-22', status: 'In Stock' },
  { id: 9, medicineName: 'Salbutamol Inhaler', batchNo: 'SAL-2026-I1', quantity: 65, reorderLevel: 50, expiryDate: '2027-07-14', status: 'In Stock' },
  { id: 10, medicineName: 'Amlodipine 5mg', batchNo: 'AML-2025-J4', quantity: 0, reorderLevel: 200, expiryDate: '2026-11-30', status: 'Out of Stock' },
  { id: 11, medicineName: 'Atorvastatin 20mg', batchNo: 'ATV-2026-K2', quantity: 1150, reorderLevel: 150, expiryDate: '2028-05-10', status: 'In Stock' },
  { id: 12, medicineName: 'Cetirizine 10mg', batchNo: 'CTZ-2026-L1', quantity: 3200, reorderLevel: 400, expiryDate: '2027-11-25', status: 'In Stock' },
];

const STATUS_MAP = {
  'In Stock': 'success',
  'Low Stock': 'warning',
  'Out of Stock': 'danger',
  'Expiring Soon': 'danger',
};

const COLUMNS = [
  { key: 'id', label: 'ID' },
  {
    key: 'medicineName',
    label: 'Medicine',
    render: (val) => <span className="inv-name">{val}</span>,
  },
  { key: 'batchNo', label: 'Batch No.' },
  {
    key: 'quantity',
    label: 'Qty',
    render: (val) => val.toLocaleString(),
  },
  { key: 'reorderLevel', label: 'Reorder Lvl' },
  { key: 'expiryDate', label: 'Expiry Date' },
  {
    key: 'status',
    label: 'Status',
    render: (val) => (
      <StatusBadge variant={STATUS_MAP[val] || 'neutral'} label={val} />
    ),
  },
];

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingSample, setUsingSample] = useState(false);
  const [error, setError] = useState(null);

  async function loadInventory() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInventory();
      if (data && data.length > 0) {
        setInventory(data);
        setUsingSample(false);
      } else {
        // Backend not ready — show sample data
        setInventory(SAMPLE_INVENTORY);
        setUsingSample(true);
      }
    } catch (err) {
      // Network error — show sample data with notice
      setInventory(SAMPLE_INVENTORY);
      setUsingSample(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  if (error) {
    return <ErrorState title="Could not load inventory" message={error} onRetry={loadInventory} />;
  }

  return (
    <div className="inventory-page fade-in">
      <div className="inventory-page__header">
        <div>
          <h2 className="inventory-page__title">Inventory Management</h2>
          <p className="inventory-page__subtitle">
            {usingSample
              ? '⚠️ Showing sample data — backend endpoint GET /api/inventory is not yet available.'
              : `${inventory.length} inventory records from database`}
          </p>
        </div>
        <button className="inventory-page__add-btn" id="add-inventory-btn">
          <IconPlus size={18} />
          Add Stock
        </button>
      </div>

      <DataTable
        columns={COLUMNS}
        data={inventory}
        loading={loading}
        pageSize={8}
        filterKey="status"
        filterLabel="Status"
        searchPlaceholder="Search inventory…"
        emptyState={
          <EmptyState
            title="Inventory is empty"
            message="No inventory records found. Stock entries will appear here."
            icon={<IconInventory size={40} />}
          />
        }
      />
    </div>
  );
}
