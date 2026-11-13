import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertOctagon, AlertTriangle, Info } from "lucide-react";
import api, { errorOf } from "../api/client.js";
import { Empty, PageHeader, btn, ghost } from "../components/ui.jsx";

const OPEN = ["Pending", "Accepted", "Dispatched", "Partially received"];

// Turns the supplier's own orders into a list of notifications
function notificationsFrom(orders) {
  const today = new Date().toLocaleDateString("en-CA");
  const out = [];
  orders.forEach((o) => {
    const items = o.items.map((i) => `${i.medicine} × ${i.quantity}`).join(", ");
    if (OPEN.includes(o.status) && o.expectedDate && o.expectedDate < today)
      out.push({ id: `late-${o.id}`, level: "critical", action: true, title: `${o.orderNumber} is overdue`, detail: `It was expected on ${o.expectedDate}. ${items}` });
    if (o.status === "Pending")
      out.push({ id: `new-${o.id}`, level: "action", action: true, title: `New order ${o.orderNumber} is waiting for you`, detail: `Accept it to confirm. ${items}` });
    else if (o.status === "Accepted")
      out.push({ id: `acc-${o.id}`, level: "action", action: true, title: `${o.orderNumber} is accepted`, detail: `Mark it dispatched when it is sent. ${items}` });
    else if (o.status === "Dispatched")
      out.push({ id: `dis-${o.id}`, level: "info", title: `${o.orderNumber} is on its way`, detail: "Waiting for the pharmacy to receive it." });
    else if (o.status === "Partially received") {
      const left = o.items.reduce((sum, i) => sum + i.quantity - i.receivedQuantity, 0);
      out.push({ id: `par-${o.id}`, level: "info", title: `${o.orderNumber} was partly received`, detail: `${left} units are still to arrive.` });
    } else if (o.status === "Received")
      out.push({ id: `rec-${o.id}`, level: "info", title: `${o.orderNumber} was received`, detail: `Delivered ${o.deliveredAt ? o.deliveredAt.slice(0, 10) : ""}. ${items}` });
    else if (o.status === "Cancelled")
      out.push({ id: `can-${o.id}`, level: "info", title: `${o.orderNumber} was cancelled`, detail: items });
  });
  return out;
}

const STYLE = {
  critical: ["ring-red-200", "text-red-600", AlertOctagon],
  action: ["ring-amber-200", "text-amber-500", AlertTriangle],
  info: ["ring-slate-200", "text-slate-400", Info],
};

export default function SupplierNotifications() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("All");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/orders");
      setOrders(data);
      setLoadError("");
    } catch (err) {
      setLoadError(errorOf(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const all = notificationsFrom(orders);
  const shown = tab === "All" ? all : all.filter((n) => n.action);

  return (
    <>
      <PageHeader title="Notifications" sub="Updates about the orders placed with you" />
      <div className="mb-4 flex gap-2" role="tablist">
        {[["All", all.length], ["Needs action", all.filter((n) => n.action).length]].map(([label, n]) => {
          const key = label === "All" ? "All" : "Action";
          return (
            <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === key ? "bg-teal-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{label} ({n})</button>
          );
        })}
      </div>

      {loading ? <p className="p-6 text-center text-slate-500">Loading notifications...</p>
        : loadError ? (
          <div className="p-6 text-center">
            <p role="alert" className="mb-3 font-medium text-red-700">{loadError}</p>
            <button className={btn} onClick={() => { setLoading(true); load(); }}>Try again</button>
          </div>
        ) : (
          <ul className="space-y-3">
            {shown.map((n) => {
              const [ring, color, Icon] = STYLE[n.level];
              return (
                <li key={n.id} className={`flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ${ring}`}>
                  <Icon className={`size-6 shrink-0 ${color}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1"><p className="font-semibold">{n.title}</p><p className="text-sm text-slate-500">{n.detail}</p></div>
                  {n.action && <Link to="/orders" className={ghost}>Open orders</Link>}
                </li>
              );
            })}
            {!shown.length && <Empty text="No notifications." />}
          </ul>
        )}
    </>
  );
}