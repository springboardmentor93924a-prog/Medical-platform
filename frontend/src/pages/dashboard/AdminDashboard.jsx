import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  Package,
  AlertTriangle,
  AlertOctagon,
  ClockAlert,
  Skull,
  Users,
  Truck,
  ShoppingCart,
  DollarSign,
  Plus,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { CategoryBreakdownChart, InventoryStatusDoughnut } from '../../components/charts/DashboardCharts';
import { MedicineFormModal } from '../../components/forms/MedicineFormModal';
import { SupplierFormModal } from '../../components/forms/SupplierFormModal';
import { PurchaseOrderFormModal } from '../../components/forms/PurchaseOrderFormModal';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardService.getAdminDashboard();
      const s = res?.data?.data || res?.data || res;
      if (s) {
        setStats(s);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner label="Loading administrator dashboard analytics..." size="lg" className="min-h-[500px]" />;
  }

  const healthyStock = Math.max(
    0,
    (stats?.totalMedicines || 0) -
      ((stats?.lowStockCount || 0) + (stats?.outOfStockCount || 0) + (stats?.expiredCount || 0))
  );

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Administration Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time medical inventory intelligence, supplier performance, and requisition metrics
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsSupplierModalOpen(true)} icon={Plus}>
            New Supplier
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsPoModalOpen(true)} icon={Plus}>
            New Purchase Order
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsMedModalOpen(true)} icon={Plus}>
            Add Medicine
          </Button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Medicines"
          value={stats?.totalMedicines || 0}
          subtitle="Registered catalog items"
          icon={Pill}
          color="blue"
          onClick={() => navigate('/medicines')}
        />
        <StatCard
          title="Stock In Hand"
          value={stats?.totalStockQuantity || 0}
          subtitle="Total aggregate units"
          icon={Package}
          color="teal"
          onClick={() => navigate('/medicines')}
        />
        <StatCard
          title="Low Stock"
          value={stats?.lowStockCount || 0}
          subtitle="At or below threshold"
          icon={AlertTriangle}
          color="amber"
          onClick={() => navigate('/medicines')}
        />
        <StatCard
          title="Out of Stock"
          value={stats?.outOfStockCount || 0}
          subtitle="Zero units on hand"
          icon={AlertOctagon}
          color="rose"
          onClick={() => navigate('/medicines')}
        />
        <StatCard
          title="Near Expiry"
          value={stats?.nearExpiryCount || 0}
          subtitle="Expiring within 60 days"
          icon={ClockAlert}
          color="purple"
          onClick={() => navigate('/inventory/expiry')}
        />
        <StatCard
          title="Expired Items"
          value={stats?.expiredCount || 0}
          subtitle="Action: Dispose"
          icon={Skull}
          color="red"
          onClick={() => navigate('/inventory/expiry')}
        />
      </div>

      {/* Secondary Administration KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          subtitle={`${stats?.totalPharmacists || 0} Pharmacists • ${stats?.totalStaff || 0} Staff`}
          icon={Users}
          color="blue"
          onClick={() => navigate('/users')}
        />
        <StatCard
          title="Suppliers"
          value={stats?.totalSuppliers || 0}
          subtitle={`${stats?.approvedSuppliers || 0} Approved • ${stats?.pendingSuppliers || 0} Pending`}
          icon={Truck}
          color="teal"
          onClick={() => navigate('/suppliers')}
        />
        <StatCard
          title="Purchase Orders"
          value={stats?.totalPurchaseOrders || 0}
          subtitle={`${stats?.completedOrders || 0} Completed • ${stats?.pendingOrders || 0} Pending`}
          icon={ShoppingCart}
          color="purple"
          onClick={() => navigate('/purchase-orders')}
        />
        <StatCard
          title="Total PO Value"
          value={`$${Number(stats?.totalPurchasesAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle="Active procurement volume"
          icon={DollarSign}
          color="emerald"
          onClick={() => navigate('/purchase-orders')}
        />
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Inventory Distribution by Category</h3>
              <p className="text-xs text-slate-400">Total medicine SKUs cataloged per therapeutic class</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/categories')}>
              View Categories <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
          <CategoryBreakdownChart categories={stats?.stockByCategory || []} />
        </div>

        <div className="lg:col-span-4 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Inventory Health Breakdown</h3>
            <p className="text-xs text-slate-400 mb-4">Live batch safety distribution</p>
            <InventoryStatusDoughnut
              healthy={healthyStock}
              lowStock={stats?.lowStockCount || 0}
              outOfStock={stats?.outOfStockCount || 0}
              expired={stats?.expiredCount || 0}
            />
          </div>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Critical alerts pending</span>
            <span className="font-bold text-rose-600">{(stats?.outOfStockCount || 0) + (stats?.expiredCount || 0)}</span>
          </div>
        </div>
      </div>

      {/* Recent Tables: Movements & Purchase Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Stock Movements */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Stock Movements</h3>
              <p className="text-xs text-slate-400">Latest inventory receipts, dispensations, and adjustments</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/movements')}>
              All Movements <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          {stats?.recentMovements?.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No inventory movements recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats?.recentMovements?.map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{m.medicine?.name || 'Medicine Item'}</p>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Ref: {m.referenceNumber} • {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-700">{m.quantity} units</span>
                    <Badge variant={m.movementType}>{m.movementType}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Purchase Orders */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Purchase Orders</h3>
              <p className="text-xs text-slate-400">Active procurement requests and deliveries</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/purchase-orders')}>
              All Orders <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          {stats?.recentOrders?.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No purchase orders created yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats?.recentOrders?.map((po) => (
                <div key={po.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{po.poNumber}</p>
                    <span className="text-[11px] text-slate-400">
                      {po.supplier?.companyName} • ${Number(po.totalAmount).toFixed(2)}
                    </span>
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
      <SupplierFormModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
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

export default AdminDashboard;
