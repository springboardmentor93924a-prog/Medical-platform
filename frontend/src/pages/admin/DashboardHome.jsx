import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch } from "../../services/api";

const PALETTE = ["#0f766e", "#f59e0b", "#dc2626", "#0ea5e9", "#7c3aed", "#64748b"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

function KpiCard({ icon: Icon, label, value, tone = "teal" }) {
  const tones = {
    teal: "from-teal-500 to-emerald-600 shadow-teal-600/20",
    amber: "from-amber-500 to-orange-600 shadow-orange-600/20",
    red: "from-red-500 to-rose-600 shadow-rose-600/20",
    blue: "from-sky-500 to-blue-600 shadow-blue-600/20",
    slate: "from-slate-600 to-slate-800 shadow-slate-800/20",
    violet: "from-violet-500 to-purple-600 shadow-purple-600/20",
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`rounded-xl bg-gradient-to-br p-2.5 text-white shadow-md ${tones[tone] || tones.teal}`}
        >
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="truncate text-xl font-extrabold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <div className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm ${className}`}>
      <h3 className="mb-1 text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h3>
      {subtitle && <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStats(await apiFetch("/admin/dashboard/stats"));
    } catch (err) {
      setError(err.message || "Unable to load dashboard stats.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setResults(null);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await apiFetch(`/search?q=${encodeURIComponent(value)}`));
      } catch {
        setResults(null);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (loading) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-4">
        <RefreshCw size={30} className="animate-spin text-teal-600 dark:text-teal-400" />
        <p className="font-medium text-slate-600 dark:text-slate-300">Loading dashboard...</p>
      </div>
    );
  }

  const kpis = stats?.kpis || {};

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-sm font-medium text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {/* Global search */}
      <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Search size={18} className="shrink-0 text-slate-400 dark:text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search medicines, batches or users..."
            className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
          />
          {searching && <RefreshCw size={14} className="animate-spin text-teal-600 dark:text-teal-400" />}
        </div>

        {results && (
          <div className="mt-3 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
            {results.medicines?.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                  Medicines
                </p>
                {results.medicines.map((item) => (
                  <p key={item.medicineId} className="text-sm text-slate-700 dark:text-slate-300">
                    {item.medicineName}
                    {item.category ? ` — ${item.category}` : ""}
                  </p>
                ))}
              </div>
            )}
            {results.inventory?.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                  Inventory
                </p>
                {results.inventory.map((item) => (
                  <p key={item.inventoryId} className="text-sm text-slate-700 dark:text-slate-300">
                    Batch {item.batchNumber} — {item.quantity} units, expires{" "}
                    {item.expiryDate || "n/a"}
                  </p>
                ))}
              </div>
            )}
            {results.users?.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                  Users
                </p>
                {results.users.map((item) => (
                  <p key={item.userId} className="text-sm text-slate-700 dark:text-slate-300">
                    {item.fullName} ({item.email}) — {item.role}
                  </p>
                ))}
              </div>
            )}
            {!results.medicines?.length &&
              !results.inventory?.length &&
              !results.users?.length && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No matches for “{results.query}”.
                </p>
              )}
          </div>
        )}
      </div>

      {/* KPI cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Wallet} label="Stock value" value={formatCurrency(kpis.stockValue)} />
        <KpiCard icon={Package} label="Batches / units" value={`${kpis.totalBatches ?? 0} / ${kpis.totalUnits ?? 0}`} />
        <KpiCard icon={AlertTriangle} label="Low stock" value={kpis.lowStockCount ?? 0} tone="amber" />
        <KpiCard icon={CalendarClock} label="Expiring (30d)" value={kpis.expiringSoonCount ?? 0} tone="red" />
        <KpiCard icon={TrendingUp} label="Medicines" value={kpis.totalMedicines ?? 0} tone="blue" />
        <KpiCard icon={ShoppingCart} label="Pending orders" value={kpis.pendingOrders ?? 0} tone="violet" />
        <KpiCard icon={Users} label="Active users" value={kpis.activeUsers ?? 0} tone="slate" />
        <KpiCard icon={AlertTriangle} label="Expired batches" value={kpis.expiredCount ?? 0} tone="red" />
      </section>

      {/* Charts row 1 */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel
          title="Stock movements — last 30 days"
          subtitle="Units received (IN) vs issued (OUT)"
          className="xl:col-span-2"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats?.movementsLast30Days || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="in" name="Received" fill="#0f766e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="out" name="Issued" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Stock health" subtitle="Batches by expiry status">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={[
                  { name: "Healthy", value: stats?.healthBuckets?.healthy ?? 0 },
                  { name: "Expiring soon", value: stats?.healthBuckets?.expiringSoon ?? 0 },
                  { name: "Expired", value: stats?.healthBuckets?.expired ?? 0 },
                ]}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                <Cell fill="#0f766e" />
                <Cell fill="#f59e0b" />
                <Cell fill="#dc2626" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </section>

      {/* Charts row 2 */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel title="Stock by category" subtitle="Total units per medicine category">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats?.stockByCategory || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="quantity" name="Units" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Expiry timeline" subtitle="Batches expiring per month (overdue included)">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats?.expiryTimeline || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Batches" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Purchase order value" subtitle="Monthly PO totals (last 6 months)">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats?.monthlyPoValue || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(m) => m.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="value" name="PO value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </section>

      {/* Charts row 3 */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Panel title="Stock by supplier" subtitle="Units held per supplier">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats?.stockBySupplier || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="supplier" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="quantity" name="Units" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Users by role" subtitle="Account distribution">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats?.userRoles || []}
                dataKey="count"
                nameKey="role"
                outerRadius={90}
                label
              >
                {(stats?.userRoles || []).map((entry, index) => (
                  <Cell key={entry.role} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </section>

      <div className="flex justify-end">
        <button
          onClick={loadStats}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
        >
          <RefreshCw size={15} />
          Refresh stats
        </button>
      </div>
    </div>
  );
}
