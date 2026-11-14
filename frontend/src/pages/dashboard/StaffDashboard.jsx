import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Pill, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeftRight, 
  Search,
  Eye,
  PlusCircle,
  Clock
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StockMovementModal from '../../components/forms/StockMovementModal';
import { dashboardService } from '../../services/dashboardService';
import { medicineService } from '../../services/medicineService';
import { stockService } from '../../services/stockService';
import { useNotification } from '../../context/NotificationContext';

const StaffDashboard = () => {
  const { showToast } = useNotification();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentMovements, setRecentMovements] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, movRes, medRes] = await Promise.all([
        dashboardService.getStaffStats(),
        stockService.getMovements({ page: 0, size: 5 }),
        medicineService.getAll({ page: 0, size: 10 })
      ]);

      const sData = statsRes?.data?.data || statsRes?.data || statsRes;
      const mData = movRes?.data?.data || movRes?.data || movRes;
      const medData = medRes?.data?.data || medRes?.data || medRes;

      setStats(sData || null);
      setRecentMovements(mData?.content || (Array.isArray(mData) ? mData : []));
      setMedicines(medData?.content || (Array.isArray(medData) ? medData : []));
    } catch (err) {
      console.error('Error fetching staff dashboard data', err);
      showToast('error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordMovement = (med = null) => {
    setSelectedMedicine(med);
    setIsMovementModalOpen(true);
  };

  const handleMovementSuccess = () => {
    setIsMovementModalOpen(false);
    setSelectedMedicine(null);
    showToast('success', 'Stock movement recorded successfully');
    fetchDashboardData();
  };

  const filteredMedicines = medicines.filter(m =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.genericName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" message="Loading staff dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital Staff Operations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time medicine dispensing, inventory status, and stock movement logging.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="primary" 
            icon={ArrowLeftRight} 
            onClick={() => handleRecordMovement()}
          >
            Record Movement
          </Button>
          <Link to="/inventory/movements">
            <Button variant="outline">
              Movement History
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Medicines"
          value={stats?.totalMedicines ?? 0}
          icon={Pill}
          color="blue"
          subtitle="Catalog items available"
        />
        <StatCard
          title="Total In-Stock Units"
          value={stats?.totalStockQuantity ?? 0}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Physical inventory count"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.lowStockMedicines ?? 0}
          icon={AlertTriangle}
          color="amber"
          subtitle="Below reorder threshold"
        />
        <StatCard
          title="Near Expiry Items"
          value={stats?.nearExpiryMedicines ?? 0}
          icon={Clock}
          color="rose"
          subtitle="Expiring in <= 60 days"
        />
      </div>

      {/* Quick Search & Inventory View */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Quick Medicine Check</h2>
            <p className="text-sm text-gray-500">Check active stock, batch numbers, and expiry before dispensing</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {filteredMedicines.length === 0 ? (
          <EmptyState
            title="No medicines found"
            description={searchQuery ? "No medicines matching your search query." : "No medicines in database yet."}
            icon={Pill}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b">
                <tr>
                  <th className="py-3 px-4">Medicine</th>
                  <th className="py-3 px-4">SKU / Batch</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMedicines.slice(0, 6).map((med) => (
                  <tr key={med.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{med.name}</div>
                      <div className="text-xs text-gray-400">{med.genericName || '—'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-mono">{med.sku}</div>
                      <div className="text-xs text-gray-400">Batch: {med.batchNumber || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {med.categoryName || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      {med.quantity} {med.unitOfMeasure || 'units'}
                    </td>
                    <td className="py-3 px-4">
                      {med.status === 'AVAILABLE' && <Badge variant="success">Available</Badge>}
                      {med.status === 'LOW_STOCK' && <Badge variant="warning">Low Stock</Badge>}
                      {med.status === 'OUT_OF_STOCK' && <Badge variant="danger">Out of Stock</Badge>}
                      {med.status === 'EXPIRED' && <Badge variant="danger">Expired</Badge>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to="/medicines">
                          <button 
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleRecordMovement(med)}
                          disabled={med.quantity <= 0}
                          className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed rounded"
                        >
                          Dispense / Move
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Movements & Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Movements Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Movements Log</h2>
            <Link to="/inventory/movements" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
              View All
            </Link>
          </div>

          {recentMovements.length === 0 ? (
            <EmptyState
              title="No movements yet"
              description="No stock movements recorded in the system yet."
              icon={ArrowLeftRight}
            />
          ) : (
            <div className="space-y-3">
              {recentMovements.map((mov) => (
                <div key={mov.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      mov.type === 'STOCK_IN' ? 'bg-emerald-100 text-emerald-700' :
                      mov.type === 'STOCK_OUT' ? 'bg-blue-100 text-blue-700' :
                      mov.type === 'DISPOSAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <ArrowLeftRight className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{mov.medicineName}</p>
                      <p className="text-xs text-gray-500">
                        {mov.type?.replace('_', ' ')} • {mov.createdAt ? new Date(mov.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${
                      mov.type === 'STOCK_IN' || mov.type === 'RETURN' ? 'text-emerald-600' : 'text-gray-900'
                    }`}>
                      {mov.type === 'STOCK_IN' || mov.type === 'RETURN' ? '+' : '-'}{mov.quantity}
                    </span>
                    <p className="text-xs text-gray-400">By {mov.performedByName || 'Staff'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Safety & Protocol Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-2.5 py-1 rounded-full">
              Dispensing Protocols
            </span>
            <h3 className="text-lg font-bold text-gray-900 mt-3">Staff Safety & Compliance</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Always verify patient prescription against medicine SKU and batch before dispensing.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Expired medicines are automatically locked from <strong>STOCK_OUT</strong> dispensing.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Immediately report physical count discrepancies using the <strong>ADJUSTMENT</strong> reason.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Stock movements are immutable and audited for regulatory compliance.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-900 font-medium">
            <span>MediStock v1.0 • Staff Portal</span>
            <Link to="/inventory/expiry" className="underline hover:text-emerald-700">
              Review Expiring Stocks
            </Link>
          </div>
        </div>
      </div>

      {/* Stock Movement Modal */}
      {isMovementModalOpen && (
        <StockMovementModal
          isOpen={isMovementModalOpen}
          onClose={() => {
            setIsMovementModalOpen(false);
            setSelectedMedicine(null);
          }}
          onSuccess={handleMovementSuccess}
          initialMedicine={selectedMedicine}
        />
      )}
    </div>
  );
};

export default StaffDashboard;
