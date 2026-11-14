import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeftRight, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Trash,
  RotateCcw
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StockMovementModal from '../../components/forms/StockMovementModal';
import { stockService } from '../../services/stockService';
import { reportService } from '../../services/reportService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const StockMovementsPage = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const canRecord = user?.role !== 'SUPPLIER';

  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: 15,
        type: typeFilter || undefined
      };
      const res = await stockService.getMovements(params);
      const data = res?.data?.data || res?.data || res;
      const list = data?.content || (Array.isArray(data) ? data : []);
      setMovements(list);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || list.length);
    } catch (err) {
      console.error('Error fetching movements', err);
      showToast('error', 'Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, showToast]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleExport = async (format) => {
    try {
      showToast('info', `Preparing ${format.toUpperCase()} export...`);
      await reportService.exportStockMovements(format);
      showToast('success', `${format.toUpperCase()} export downloaded successfully`);
    } catch (err) {
      console.error('Export error', err);
      showToast('error', `Failed to export movements as ${format.toUpperCase()}`);
    }
  };

  const getMovementBadge = (type) => {
    switch (type) {
      case 'STOCK_IN':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Stock In
          </span>
        );
      case 'STOCK_OUT':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
            <ArrowUpRight className="w-3.5 h-3.5" /> Stock Out
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
            <RefreshCw className="w-3.5 h-3.5" /> Adjustment
          </span>
        );
      case 'RETURN':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
            <RotateCcw className="w-3.5 h-3.5" /> Return
          </span>
        );
      case 'DISPOSAL':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700">
            <Trash className="w-3.5 h-3.5" /> Disposal
          </span>
        );
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Movements Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">
            Audited history of physical receipts, patient dispensing, disposals, and reconciliations ({totalElements} entries).
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canRecord && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setIsModalOpen(true)}
            >
              Record Movement
            </Button>
          )}
          <Button variant="outline" icon={Download} onClick={() => handleExport('pdf')}>
            Export PDF
          </Button>
          <Button variant="outline" icon={Download} onClick={() => handleExport('excel')}>
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
        <div className="w-full sm:w-64">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(0);
            }}
            className="w-full py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">All Movement Types</option>
            <option value="STOCK_IN">Stock In (Receipts)</option>
            <option value="STOCK_OUT">Stock Out (Dispensing)</option>
            <option value="ADJUSTMENT">Inventory Adjustment</option>
            <option value="RETURN">Customer / Ward Return</option>
            <option value="DISPOSAL">Disposal (Expired / Damaged)</option>
          </select>
        </div>

        <span className="text-xs text-gray-500">
          Showing {movements.length} records
        </span>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" message="Loading movements ledger..." />
          </div>
        ) : movements.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No movements recorded"
              description="No stock movement records found for the selected filter."
              icon={ArrowLeftRight}
              action={canRecord ? { label: "Record Movement", onClick: () => setIsModalOpen(true) } : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Medicine & SKU</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4 text-right">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((mov) => {
                  const movType = mov.type || mov.movementType;
                  const isPositive = movType === 'STOCK_IN' || movType === 'RETURN';
                  const medName = mov.medicineName || mov.medicine?.name || 'Unknown';
                  const medSku = mov.medicineSku || mov.medicine?.sku || mov.medicine?.batchNumber || '—';
                  const performedBy = mov.performedByName || mov.performedBy?.fullName || 'System';
                  return (
                    <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-xs font-medium text-gray-500">
                        {mov.createdAt ? new Date(mov.createdAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{medName}</div>
                        <div className="text-xs text-gray-400 font-mono">SKU: {medSku}</div>
                      </td>
                      <td className="py-3 px-4">
                        {getMovementBadge(movType)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-base font-bold ${
                          isPositive ? 'text-emerald-600' : 'text-gray-900'
                        }`}>
                          {isPositive ? `+${mov.quantity}` : `-${mov.quantity}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        <div className="font-medium text-gray-800">{mov.reason || 'General operation'}</div>
                        {mov.referenceNumber && (
                          <div className="text-gray-400 font-mono mt-0.5">Ref: {mov.referenceNumber}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-xs">
                        <span className="font-semibold text-gray-800">{performedBy}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Record Movement Modal */}
      {isModalOpen && (
        <StockMovementModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchMovements();
          }}
        />
      )}
    </div>
  );
};

export default StockMovementsPage;
