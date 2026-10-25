import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CalendarClock, IndianRupee, Pill } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { BarList, Card, Empty, PageHeader, Row, Stat, Tag, btn } from "../components/ui.jsx";
import { fetchAdminDashboard } from "../api/dashboard.js";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const prettyType = (t) => String(t ?? "").replaceAll("_", " ").toLowerCase();

function errorMessage(err) {
  const status = err.response?.status;
  if (status === 403) return "You do not have permission to view the admin dashboard.";
  if (!err.response) return "Cannot reach the server. Check that the backend is running.";
  return err.response?.data?.message || "Could not load dashboard data.";
}

export default function AdminDashboard() {
  const { user, logout } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    fetchAdminDashboard()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 401) {
          logout(); // expired or invalid token: the route guard sends the user to /login
          return;
        }
        setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const s = data?.summary;
  const sub = s
    ? `Welcome back, ${user.username} · ${s.totalUsers} users · ${s.totalCategories} categories`
    : `Welcome back, ${user.username}`;

  if (loading && !data) {
    return (
      <>
        <PageHeader title="Admin dashboard" sub={sub} />
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-white ring-1 ring-teal-900/5" />
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500" role="status">Loading dashboard…</p>
      </>
    );
  }

  if (error && !data) {
    return (
      <>
        <PageHeader title="Admin dashboard" sub={sub} />
        <Card>
          <p role="alert" className="text-sm text-red-600">{error}</p>
          <button className={`${btn} mt-3`} onClick={() => setReloadKey((k) => k + 1)}>Retry</button>
        </Card>
      </>
    );
  }

  const stats = [
    [Pill, "Medicines", s.totalMedicines, "teal"],
    [AlertTriangle, "Low / out of stock", s.lowStockCount, "amber"],
    [CalendarClock, "Expiring / expired", s.expiringCount, "red"],
    [IndianRupee, "Inventory value", money.format(Number(s.inventoryValue)), "blue"],
  ];

  return (
    <>
      <PageHeader title="Admin dashboard" sub={sub} />
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {stats.map(([icon, label, value, tone]) => (
          <Stat key={label} icon={icon} label={label} value={value} tone={tone} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Low-stock items" action={<Link to="/inventory" className="text-sm font-semibold text-teal-700">View inventory</Link>}>
          <ul>
            {data.lowStock.length ? (
              data.lowStock.map((m) => (
                <Row
                  key={m.medicineId}
                  left={m.name}
                  sub={`${m.quantity} left · reorder at ${m.reorderLevel}`}
                  right={<Tag s={m.quantity === 0 ? "Out of stock" : "Low stock"} />}
                />
              ))
            ) : (
              <Empty text="Everything is well stocked." />
            )}
          </ul>
        </Card>

        <Card title="Expiring medicines" action={<Link to="/alerts" className="text-sm font-semibold text-teal-700">View alerts</Link>}>
          <ul>
            {data.expiring.length ? (
              data.expiring.map((b) => (
                <Row
                  key={b.batchId}
                  left={b.medicineName}
                  sub={`Batch ${b.batchNumber} · ${b.expiryDate} · ${b.quantity} units`}
                  right={<Tag s={b.daysLeft < 0 ? "Expired" : "Near expiry"} />}
                />
              ))
            ) : (
              <Empty text="Nothing expiring soon." />
            )}
          </ul>
        </Card>

        <Card title="Stock by category">
          {data.stockByCategory.length ? (
            <BarList items={data.stockByCategory.map((c) => ({ label: c.category, value: c.quantity }))} />
          ) : (
            <Empty text="No categories yet." />
          )}
        </Card>

        <Card title="Supplier analytics">
          {data.suppliers.length ? (
            <BarList
              max={100}
              items={data.suppliers.map((x) => ({
                label: x.name,
                value: Number(x.onTimePercent),
                text: `${Number(x.onTimePercent)}% on time`,
              }))}
            />
          ) : (
            <Empty text="No supplier data yet." />
          )}
        </Card>

        <Card title="Stock movement and user activity">
          <ul>
            {data.recentActivity.length ? (
              data.recentActivity.map((a) => (
                <Row
                  key={a.id}
                  left={`${prettyType(a.movementType)} ${a.quantityChange > 0 ? "+" : ""}${a.quantityChange} · ${a.medicineName}`}
                  sub={`${a.performedBy} · ${new Date(a.createdAt).toLocaleString()}`}
                />
              ))
            ) : (
              <Empty text="No stock activity yet." />
            )}
          </ul>
        </Card>

        <Card title="System monitoring">
          <ul>
            {["API server", "Database", "Email service", "Push notifications"].map((name) => (
              <Row key={name} left={name} right={<span className="text-sm font-semibold text-emerald-700">Operational</span>} />
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}