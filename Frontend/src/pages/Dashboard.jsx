import { Link } from "react-router-dom";
import { AlertTriangle, CalendarClock, ClipboardList, Clock, IndianRupee, PackageCheck, Pill, Truck } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { BarList, Card, Empty, PageHeader, Row, Stat, Tag } from "../components/ui.jsx";
import { MY_SUPPLIER, categories, daysTo, expiryStatus, inr, stockStatus } from "../data/mock.js";

export default function Dashboard() {
  const { user, medicines, orders, suppliers, logs } = useApp();
  const role = user.role;
  const low = medicines.filter((m) => stockStatus(m) !== "In stock");
  const exp = medicines.filter((m) => expiryStatus(m) !== "Safe").sort((a, b) => daysTo(a.expiry) - daysTo(b.expiry));
  const mine = orders.filter((o) => o.supplier === MY_SUPPLIER);
  const count = (list, s) => list.filter((o) => o.status === s).length;
  const units = medicines.reduce((s, m) => s + m.qty, 0);
  const value = medicines.reduce((s, m) => s + m.qty * m.price, 0);

  const stats = role === "Supplier"
    ? [[Clock, "Pending orders", count(mine, "Pending"), "amber"], [ClipboardList, "Accepted", count(mine, "Accepted"), "blue"],
       [Truck, "Dispatched", count(mine, "Dispatched"), "blue"], [PackageCheck, "Delivered", count(mine, "Received"), "teal"]]
    : [[Pill, "Medicines", medicines.length, "teal"], [AlertTriangle, "Low / out of stock", low.length, "amber"],
       [CalendarClock, "Expiring / expired", exp.length, "red"],
       role === "Staff" ? [PackageCheck, "Units in stock", units, "blue"] : [IndianRupee, "Inventory value", inr(value), "blue"]];

  const lowCard = (
    <Card key="low" title="Low-stock items" action={<Link to="/inventory" className="text-sm font-semibold text-teal-700">View inventory</Link>}>
      <ul>{low.length ? low.map((m) => <Row key={m.id} left={m.name} sub={`${m.qty} left · reorder at ${m.reorder}`} right={<Tag s={stockStatus(m)} />} />) : <Empty text="Everything is well stocked." />}</ul>
    </Card>
  );
  const expCard = (
    <Card key="exp" title="Expiring medicines" action={<Link to="/alerts" className="text-sm font-semibold text-teal-700">View alerts</Link>}>
      <ul>{exp.length ? exp.map((m) => <Row key={m.id} left={m.name} sub={`Batch ${m.batch} · ${m.expiry}`} right={<Tag s={expiryStatus(m)} />} />) : <Empty text="Nothing expiring soon." />}</ul>
    </Card>
  );
  const catCard = (
    <Card key="cat" title="Stock by category">
      <BarList items={categories.map((c) => ({ label: c, value: medicines.filter((m) => m.category === c).reduce((s, m) => s + m.qty, 0) }))} />
    </Card>
  );

  return (
    <>
      <PageHeader title={`${role} dashboard`} sub={`Welcome back, ${user.username}`} />
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {stats.map(([icon, label, value, tone]) => <Stat key={label} icon={icon} label={label} value={value} tone={tone} />)}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {role === "Supplier" && (
          <>
            <Card title="Incoming orders" action={<Link to="/orders" className="text-sm font-semibold text-teal-700">Manage</Link>}>
              <ul>{mine.map((o) => <Row key={o.id} left={`${o.id} · ${o.medicine}`} sub={`${o.qty} units · ${o.date}`} right={<Tag s={o.status} />} />)}</ul>
            </Card>
            <Card title="Medicines you supply">
              <ul>{medicines.filter((m) => m.supplier === MY_SUPPLIER).map((m) => <Row key={m.id} left={m.name} sub={m.category} right={<span className="text-sm font-semibold">{m.qty} in stock</span>} />)}</ul>
            </Card>
          </>
        )}
        {role !== "Supplier" && [lowCard, expCard]}
        {(role === "Admin" || role === "Pharmacist") && catCard}
        {role === "Pharmacist" && (
          <Card title="Purchase summary">
            <ul>{["Pending", "Accepted", "Dispatched", "Received"].map((s) => <Row key={s} left={<Tag s={s} />} right={<b>{count(orders, s)}</b>} />)}</ul>
            <p className="mt-3 text-sm text-slate-600">Top supplier: <b>{[...suppliers].sort((a, b) => b.onTime - a.onTime)[0]?.name}</b></p>
          </Card>
        )}
        {role === "Admin" && (
          <>
            <Card title="Supplier analytics">
              <BarList max={100} items={suppliers.map((s) => ({ label: s.name, value: s.onTime, text: `${s.onTime}% on time` }))} />
            </Card>
            <Card title="Stock movement and user activity">
              <ul>{logs.slice(0, 5).map((l) => <Row key={l.id} left={l.text} sub={`${l.by} · ${l.time}`} />)}</ul>
            </Card>
            <Card title="System monitoring">
              <ul>{["API server", "Database", "Email service", "Push notifications"].map((s) => <Row key={s} left={s} right={<span className="text-sm font-semibold text-emerald-700">Operational</span>} />)}</ul>
            </Card>
          </>
        )}
      </div>
    </>
  );
}