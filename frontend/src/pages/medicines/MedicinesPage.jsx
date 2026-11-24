import { useState, useEffect } from 'react';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { IconPill, IconPlus } from '../../components/icons/Icons';
import { fetchMedicines } from '../../services/api';
import './MedicinesPage.css';

/**
 * Table column definitions for medicines.
 * The `render` function is optional — when provided it receives
 * the cell value and the full row object.
 */
const COLUMNS = [
  { key: 'medicineId', label: 'ID' },
  {
    key: 'medicineName',
    label: 'Medicine Name',
    render: (val) => <span className="med-name">{val}</span>,
  },
  { key: 'brandName', label: 'Brand' },
  { key: 'genericName', label: 'Generic Name' },
  { key: 'strength', label: 'Strength' },
  {
    key: 'dosageForm',
    label: 'Dosage Form',
    render: (val) =>
      val ? <StatusBadge variant="info" label={val} /> : '—',
  },
];

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadMedicines() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMedicines();
      setMedicines(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load medicines');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMedicines();
  }, []);

  if (error) {
    return (
      <ErrorState
        title="Could not load medicines"
        message={error}
        onRetry={loadMedicines}
      />
    );
  }

  return (
    <div className="medicines-page fade-in">
      <div className="medicines-page__header">
        <div>
          <h2 className="medicines-page__title">Medicine Catalog</h2>
          <p className="medicines-page__subtitle">
            {loading
              ? 'Loading…'
              : medicines.length
                ? `${medicines.length} medicines from database`
                : 'No medicines found — add entries to the database to see them here.'}
          </p>
        </div>
        <button className="medicines-page__add-btn" id="add-medicine-btn">
          <IconPlus size={18} />
          Add Medicine
        </button>
      </div>

      <DataTable
        columns={COLUMNS}
        data={medicines}
        loading={loading}
        pageSize={8}
        filterKey="dosageForm"
        filterLabel="Dosage Form"
        searchPlaceholder="Search medicines…"
        emptyState={
          <EmptyState
            title="No medicines in database"
            message="Your medicines table is empty. Add medicines via the backend or database to see them listed here."
            icon={<IconPill size={40} />}
          />
        }
      />
    </div>
  );
}
