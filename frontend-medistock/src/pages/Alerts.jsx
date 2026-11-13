import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertOctagon, AlertTriangle } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import api, { errorOf } from "../api/client.js";
import { Empty, PageHeader, btn, ghost } from "../components/ui.jsx";

const TABS = ["All", "Stock", "Expiry"];

export default function Alerts() {
  const { user } = useApp();
  const canRemove = user.role !== "Staff";   // Staff can see stock and expiry alerts but not remove stock
  const tabs = canRemove ? [...TABS, "Purchase"] : TABS;   // purchase alerts are for Admin and Pharmacist

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [tab, setTab] = useState("All");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/alerts");
      setAlerts(data);
      setLoadError("");
    } catch (err) {
      setLoadError(errorOf(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const removeExpired = async (a) => {
    if (!window.confirm(`Remove ${a.quantity} expired units from stock? This is recorded in the history.`)) return;
    setActionError("");
    try {
      await api.post(`/api/alerts/expired/${a.batchId}/remove`);
      await load();
      window.dispatchEvent(new Event("alerts-changed"));   // refreshes the bell count in the top bar
    } catch (err) {
      setActionError(errorOf(err).message);
    }
  };

  const shown = alerts.filter((a) => tab === "All" || a.category === tab);
  const count = (t) => alerts.filter((a) => t === "All" || a.category === t).length;

  return (
    <>
      <PageHeader title="Notifications" sub="Low stock, out of stock and expiry notifications" />

      <div className="mb-4 flex gap-2" role="tablist">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === t ? "bg-teal-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
            {t} ({count(t)})
          </button>
        ))}
      </div>

      {actionError && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{actionError}</p>}

      {loading ? (
        <p className="p-6 text-center text-slate-500">Loading alerts...</p>
      ) : loadError ? (
        <div className="p-6 text-center">
          <p role="alert" className="mb-3 font-medium text-red-700">{loadError}</p>
          <button className={btn} onClick={() => { setLoading(true); load(); }}>Try again</button>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((a) => {
            const critical = a.severity === "critical";
            const Icon = critical ? AlertOctagon : AlertTriangle;
            return (
              <li key={a.id} className={`flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ${critical ? "ring-red-200" : "ring-amber-200"}`}>
                <Icon className={`size-6 shrink-0 ${critical ? "text-red-600" : "text-amber-500"}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-sm text-slate-500">{a.detail}</p>
                </div>
                {a.type === "Expired" && canRemove && (
                  <button className={ghost} onClick={() => removeExpired(a)}>Remove expired stock</button>
                )}
                {a.category === "Purchase" && <Link to="/orders" className={ghost}>View orders</Link>}
              </li>
            );
          })}
          {!shown.length && <Empty text="No alerts. All clear." />}
        </ul>
      )}
    </>
  );
}