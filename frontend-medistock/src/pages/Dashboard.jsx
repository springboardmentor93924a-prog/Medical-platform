import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CalendarClock, ClipboardList, Clock, IndianRupee, PackageCheck, Pill, Truck } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import api, { errorOf } from "../api/client.js";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Empty, PageHeader, Row, Stat, Tag, btn } from "../components/ui.jsx";

const money = (v) => `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const linkCls = "text-sm font-semibold text-teal-700";

// ---------- Charts ----------
const STATUS_COLORS = { "In stock": "#10b981", "Low stock": "#f59e0b", "Out of stock": "#ef4444" };
const EXPIRY_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#eab308"];
const TEAL = "#0f766e";
const describe = (data) => data.map((d) => `${d.label}: ${d.value}`).join(", ");
const shortMoney = (v) => (v >= 100000 ? `₹${+(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${+(v / 1000).toFixed(1)}k` : `₹${v}`);
const tooltipStyle = { borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 };

// Donut of medicines by stock status, with the total in the middle
function StatusDonut({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (!total) return <Empty text="No medicines yet." />;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
      <div className="relative size-48 shrink-0" role="img" aria-label={`Medicines by stock status. ${describe(data)}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={56} outerRadius={86} paddingAngle={data.filter((d) => d.value).length > 1 ? 3 : 0} stroke="none">
              {data.map((d) => <Cell key={d.label} fill={STATUS_COLORS[d.label]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [`${v} medicines`, name]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center"><p className="text-2xl font-extrabold">{total}</p><p className="text-xs text-slate-500">medicines</p></div>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ background: STATUS_COLORS[d.label] }} aria-hidden="true" />
            {d.label}: <b>{d.value}</b> <span className="text-slate-500">({Math.round((d.value / total) * 100)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Vertical bars. Used for the expiry timeline and the monthly purchases.
function Columns({ data, colors, money: asMoney, unit }) {
  return (
    <div className="h-56 w-full" role="img" aria-label={describe(data)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} interval={0} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={asMoney ? 48 : 28} tickFormatter={asMoney ? shortMoney : undefined} />
          <Tooltip cursor={{ fill: "rgba(15,118,110,0.08)" }} contentStyle={tooltipStyle}
            formatter={(v) => [asMoney ? money(v) : v, unit]} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={TEAL} maxBarSize={48}>
            {colors && data.map((d, i) => <Cell key={d.label} fill={colors[i % colors.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Horizontal bars with the category names on the left
function Rows({ data }) {
  return (
    <div className="w-full" style={{ height: Math.max(160, data.length * 36) }} role="img" aria-label={describe(data)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={96} />
          <Tooltip cursor={{ fill: "rgba(15,118,110,0.08)" }} contentStyle={tooltipStyle} formatter={(v) => [v, "Units"]} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} fill={TEAL} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);   // a supplier's own orders, for the action and performance cards

  const load = useCallback(async () => {
    try {
      const res = await api.get("/api/dashboard");
      setData(res.data);
      setError("");
    } catch (err) {
      setError(errorOf(err).message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (user.role === "Supplier") api.get("/api/orders").then((res) => setOrders(res.data)).catch(() => {});
  }, [user.role]);

  const header = <PageHeader title={`${user.role} dashboard`} sub={`Welcome back, ${user.username}`} />;

  if (error) {
    return (
      <>
        {header}
        <div className="p-6 text-center">
          <p role="alert" className="mb-3 font-medium text-red-700">{error}</p>
          <button className={btn} onClick={() => { setError(""); load(); }}>Try again</button>
        </div>
      </>
    );
  }
  if (!data) return <>{header}<p className="p-6 text-center text-slate-500">Loading dashboard...</p></>;

  const s = data.stats;

  // Supplier only: orders that need an answer, and how the supplier has performed
  const waiting = orders.filter((o) => o.status === "Pending" || o.status === "Accepted");
  const delivered = orders.filter((o) => o.status === "Received" && o.deliveredAt);
  const timed = delivered.filter((o) => o.expectedDate);
  const onTime = timed.length
    ? Math.round((100 * timed.filter((o) => new Date(o.deliveredAt).toLocaleDateString("en-CA") <= o.expectedDate).length) / timed.length) : null;
  const avgDays = delivered.length
    ? (delivered.reduce((sum, o) => sum + (new Date(o.deliveredAt) - new Date(o.createdAt)) / 86400000, 0) / delivered.length).toFixed(1) : null;
  const isSupplier = data.role === "Supplier";
  const stats = isSupplier
    ? [[Clock, "Pending orders", s.pending, "amber"], [ClipboardList, "Accepted", s.accepted, "blue"],
       [Truck, "Dispatched", s.dispatched, "blue"], [PackageCheck, "Delivered", s.delivered, "teal"]]
    : [[Pill, "Medicines", s.medicines, "teal"], [AlertTriangle, "Low / out of stock", s.lowStock, "amber"],
       [CalendarClock, "Expired", s.expired, "red"], [CalendarClock, "Expiring soon", s.expiringSoon, "amber"],
       s.inventoryValue != null ? [IndianRupee, "Inventory value", money(s.inventoryValue), "blue"]
                                : [PackageCheck, "Units in stock", s.units, "blue"]];

  const alertRows = (list, emptyText) => list.length
    ? list.map((a) => <Row key={a.id} left={a.title} sub={a.detail} right={<Tag s={a.type} />} />)
    : <Empty text={emptyText} />;

  const statusRows = (counts) => Object.entries(counts).map(([status, n]) => (
    <Row key={status} left={<Tag s={status} />} right={<b>{n}</b>} />
  ));

  return (
    <>
      {header}
      <div className={`grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 ${isSupplier ? "lg:grid-cols-4" : "lg:grid-cols-5"}`}>
        {stats.map(([icon, label, value, tone]) => <Stat key={label} icon={icon} label={label} value={value} tone={tone} />)}
      </div>

      {!isSupplier && data.stockStatus && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card title="Stock status"><StatusDonut data={data.stockStatus} /></Card>
          <Card title="Expiry timeline (batches)" action={<Link to="/expiry" className={linkCls}>View expiry</Link>}>
            {data.expiryBuckets.every((b) => b.value === 0)
              ? <Empty text="Nothing has expired or expires within 90 days." />
              : <Columns data={data.expiryBuckets} colors={EXPIRY_COLORS} unit="Batches" />}
          </Card>
          {data.stockByCategory && (
            <Card title="Units by category">
              {data.stockByCategory.length ? <Rows data={data.stockByCategory} /> : <Empty text="No stock yet." />}
            </Card>
          )}
          {data.monthlyPurchases && (
            <Card title="Purchases per month (approved orders)">
              {data.monthlyPurchases.every((m) => m.value === 0)
                ? <Empty text="No approved orders in the last 6 months." />
                : <Columns data={data.monthlyPurchases} money unit="Order value" />}
            </Card>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {isSupplier ? (
          <>
            <Card title="Your orders" action={<Link to="/orders" className={linkCls}>Manage</Link>}>
              <ul>{statusRows(data.orderStatus)}</ul>
            </Card>
            <Card title="Needs your action" action={<Link to="/orders" className={linkCls}>Open orders</Link>}>
              <ul>
                {waiting.length
                  ? waiting.map((o) => (
                      <Row key={o.id} left={`${o.orderNumber} · ${o.items.map((i) => `${i.medicine} × ${i.quantity}`).join(", ")}`}
                        sub={`${o.status === "Pending" ? "Accept this order" : "Mark it dispatched"} · expected ${o.expectedDate ?? "—"}`} right={<Tag s={o.status} />} />
                    ))
                  : <Empty text="Nothing is waiting for you." />}
              </ul>
            </Card>
            <Card title="Your performance">
              <ul>
                <Row left="Orders delivered" right={<b>{delivered.length}</b>} />
                <Row left="On-time delivery" right={<b>{onTime == null ? "—" : `${onTime}%`}</b>} />
                <Row left="Average delivery time" right={<b>{avgDays == null ? "—" : `${avgDays} days`}</b>} />
              </ul>
            </Card>
            <Card title="Medicines you supply">
              <ul>
                {data.supplied.length
                  ? data.supplied.map((m) => <Row key={m.name} left={m.name} right={<span className="text-sm font-semibold">{m.quantity} in stock</span>} />)
                  : <Empty text="No medicines linked to you yet." />}
              </ul>
            </Card>
          </>
        ) : (
          <>
            <Card title="Low-stock items" action={<Link to="/alerts" className={linkCls}>View notifications</Link>}>
              <ul>{alertRows(data.lowStock, "Everything is well stocked.")}</ul>
            </Card>
            <Card title="Expiring medicines" action={<Link to="/expiry" className={linkCls}>View expiry</Link>}>
              <ul>{alertRows(data.expiring, "Nothing expiring soon.")}</ul>
            </Card>

            {data.orderStatus && (
              <Card title="Purchase summary" action={<Link to="/orders" className={linkCls}>View orders</Link>}>
                <ul>{statusRows(data.orderStatus)}</ul>
              </Card>
            )}
            {data.suppliers && (
              <Card title={data.role === "Admin" ? "Supplier analytics" : "Supplier insights"}>
                <ul>
                  {data.suppliers.map((sp) => (
                    <li key={sp.name} className="border-t border-slate-100 py-2.5 first:border-0">
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="font-medium">{sp.name}</span>
                        <span className="font-semibold">{sp.onTimePercent == null ? "No timed deliveries yet" : `${sp.onTimePercent}% on time`}</span>
                      </div>
                      <p className="text-xs text-slate-500">{sp.ordersPlaced} orders placed, {sp.ordersReceived} received</p>
                    </li>
                  ))}
                  {!data.suppliers.length && <Empty text="No suppliers yet." />}
                </ul>
              </Card>
            )}
            {data.activity && (
              <>
                <Card title="Stock movement and user activity">
                  <ul>
                    {data.activity.length
                      ? data.activity.map((a, i) => <Row key={i} left={a.text} sub={`${a.by} · ${new Date(a.time).toLocaleString()}`} />)
                      : <Empty text="No activity yet." />}
                  </ul>
                </Card>
                <Card title="System monitoring" action={<Link to="/monitoring" className={linkCls}>Open</Link>}>
                  <ul>
                    <Row left="API server" right={<span className="text-sm font-semibold text-emerald-700">Operational</span>} />
                    <Row left="Database" right={<span className="text-sm font-semibold text-emerald-700">Operational</span>} />
                    <Row left="Registered users" right={<b>{s.users}</b>} />
                  </ul>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}