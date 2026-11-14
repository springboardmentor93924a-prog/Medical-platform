import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  Package,
  AlertTriangle,
  AlertOctagon,
  ClockAlert,
  Skull,
  ShoppingCart,
  Truck,
  Plus,
  ArrowRight,
  ArrowLeftRight,
  FileDown,
} from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { CategoryBreakdownChart, InventoryStatusDoughnut } from '../../components/charts/DashboardCharts';
import { MedicineFormModal } from '../../components/forms/MedicineFormModal';
import { StockMovementModal } from '../../components/forms/StockMovementModal';
import { PurchaseOrderFormModal } from '../../components/forms/PurchaseOrderFormModal';

export const PharmacistDashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardService.getPharmacistDashboard();
      const s = res?.data?.data || res?.data || res;
      if (s) {
        setStats(s);
      }
    } catch (err) {
      console.error('Failed to load pharmacist dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner label="Loading pharmacy inventory metrics..." size="lg" className="min-h-[500px]" />;
  }

  const healthyStock = Math.max(
    0,
    (stats?.totalMedicines || 0) -
      ((stats?.lowStockCount || 0) + (stats?.outOfStockCount || 0) + (stats?.expiredCount || 0))
  );

  return (
    <div className="space-y-8">
      {/* Title & Pharmacist Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pharmacy Operations Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time batch tracking, stock availability, clinical expiry warnings, and procurement
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsMovementModalOpen(true)} icon={ArrowLeftRight}>
            Record Movement
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsPoModalOpen(true)} icon={Plus}>
            New Purchase Order
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsMedModalOpen(true)} icon={Plus}>
            Add Medicine
          </Button>
        </div>
      </div>

      {/* Safety Alert Banners if critical */}
      {((stats?.expiredCount || 0) > 0 || (stats?.outOfStockCount || 0) > 0) && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Critical Pharmacy Alerts Require Attention</p>
              <p className="text-rose-700">
                {stats?.expiredCount || 0} medicine batch(es) expired (prevent dispensing) • {stats?.outOfStockCount || 0} SKU(s) out of stock
              </p>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={() => navigate('/inventory/expiry')}>
            View Expiry Action Center
          </Button>
        </div>
      )}

      {/* Primary Inventory Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Medicines"
          value={stats?.totalMedicines || 0}
          subtitle="Cataloged pharmaceuticals"
          icon={Pill}
          color="blue"
          onClick={() => navigate('/medicines')}
        />
        <StatCard
          title="Available Stock"
          value={stats?.totalStockQuantity || 0}
          subtitle="In pharmacy inventory"
          icon={Package}
          color="teal"
          onClick={() => navigate('/medicines')}
        />
        <StatCard
          title="Low Stock"
          value={stats?.lowStockCount || 0}
          subtitle="Needs reordering"
          icon={AlertTriangle}
          color="amber"
          onClick={() => navigate('/medicines')}
        />
        <StatCard
          title="Out of Stock"
          value={stats?.outOfStockCount || 0}
          subtitle="Depleted batches"
          icon={AlertOctagon}
          color="rose"
          onClick={() => navigate('/medicines')}
        />
        <StatCard
          title="Near Expiry"
          value={stats?.nearExpiryCount || 0}
          subtitle="Expires in 60 days"
          icon={ClockAlert}
          color="purple"
          onClick={() => navigate('/inventory/expiry')}
        />
        <StatCard
          title="Expired"
          value={stats?.expiredCount || 0}
          subtitle="Do not dispense"
          icon={Skull}
          color="red"
          onClick={() => navigate('/inventory/expiry')}
        />
      </div>

      {/* Requisition & Supplier Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Approved Suppliers"
          value={stats?.totalSuppliers || 0}
          subtitle="Active pharmaceutical vendors"
          icon={Truck}
          color="teal"
          onClick={() => navigate('/suppliers')}
        />
        <StatCard
          title="Requisition Orders"
          value={stats?.totalPurchaseOrders || 0}
          subtitle={`${stats?.pendingOrders || 0} Pending • ${stats?.completedOrders || 0} Received`}
          icon={ShoppingCart}
          color="blue"
          onClick={() => navigate('/purchase-orders')}
        />
        <StatCard
          title="Quick Reports"
          value="PDF / Excel"
          subtitle="Instant inventory downloads"
          icon={FileDown}
          color="purple"
          onClick={() => navigate('/reports')}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">Medicines by Category</h3>
          <p className="text-xs text-slate-400 mb-4">Stock distribution across therapeutic drug categories</p>
          <CategoryBreakdownChart categories={stats?.stockByCategory || []} />
        </div>

        <div className="lg:col-span-4 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 mb-1">Stock Safety Status</h3>
          <p className="text-xs text-slate-400 mb-4">Proportion of safe vs alerted medicine batches</p>
          <InventoryStatusDoughnut
            healthy={healthyStock}
            lowStock={stats?.lowStockCount || 0}
            outOfStock={stats?.outOfStockCount || 0}
            expired={stats?.expiredCount || 0}
          />
        </div>
      </div>

      {/* Recent Movements & POs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Recent Pharmacy Movements</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/movements')}>
              All Movements <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
          {stats?.recentMovements?.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No inventory movements recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats?.recentMovements?.map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{m.medicine?.name}</p>
                    <span className="text-[11px] text-slate-400 font-mono">{m.referenceNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">{m.quantity} units</span>
                    <Badge variant={m.movementType}>{m.movementType}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Recent Purchase Orders</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/purchase-orders')}>
              All Orders <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
          {stats?.recentOrders?.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No purchase orders created yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats?.recentOrders?.map((po) => (
                <div key={po.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{po.poNumber}</p>
                    <span className="text-[11px] text-slate-400">Supplier: {po.supplier?.companyName}</span>
                  </div>
                  <Badge variant={po.orderStatus}>{po.orderStatus}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <MedicineFormModal
        isOpen={isMedModalOpen}
        onClose={() => setIsMedModalOpen(false)}
        onSuccess={loadData}
      />
      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        onSuccess={loadData}
      />
      <PurchaseOrderFormModal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

export default PharmacistDashboard;
