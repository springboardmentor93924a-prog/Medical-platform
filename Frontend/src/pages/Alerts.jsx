import { useState } from "react";
import { AlertOctagon, AlertTriangle } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { Empty, PageHeader, ghost } from "../components/ui.jsx";
import { daysTo, expiryStatus, stockStatus } from "../data/mock.js";

export default function Alerts() {
  const { user, medicines, setMedicines, log } = useApp();
  const [tab, setTab] = useState("All");
  const items = [];
  medicines.forEach((m) => {
    const s = stockStatus(m), e = expiryStatus(m), n = daysTo(m.expiry);
    if (s === "Out of stock") items.push({ id: `${m.id}o`, kind: "Stock", sev: "red", title: `${m.name} is out of stock`, sub: `Batch ${m.batch} · ${m.supplier}` });
    else if (s === "Low stock") items.push({ id: `${m.id}l`, kind: "Stock", sev: "amber", title: `${m.name} is running low`, sub: `${m.qty} left · reorder level ${m.reorder}` });
    if (e === "Expired") items.push({ id: `${m.id}x`, kind: "Expiry", sev: "red", title: `${m.name} expired ${-n} days ago`, sub: `Batch ${m.batch} · ${m.qty} units to remove`, m });
    else if (e === "Near expiry") items.push({ id: `${m.id}n`, kind: "Expiry", sev: "amber", title: `${m.name} expires in ${n} days`, sub: `Batch ${m.batch} · ${m.expiry}` });
  });
  const shown = items.filter((i) => tab === "All" || i.kind === tab).sort((a, b) => (a.sev === "red" ? -1 : 1) - (b.sev === "red" ? -1 : 1));
  const removeExpired = (m) => { setMedicines((l) => l.filter((x) => x.id !== m.id)); log(`Removed expired stock: ${m.name} (batch ${m.batch})`); };

  return (
    <>
      <PageHeader title="Alerts" sub="Low stock, out of stock and expiry notifications" />
      <div className="mb-4 flex gap-2" role="tablist">
        {["All", "Stock", "Expiry"].map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === t ? "bg-teal-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{t}</button>
        ))}
      </div>
      <ul className="space-y-3">
        {shown.map((i) => {
          const Icon = i.sev === "red" ? AlertOctagon : AlertTriangle;
          return (
            <li key={i.id} className={`flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ${i.sev === "red" ? "ring-red-200" : "ring-amber-200"}`}>
              <Icon className={`size-6 shrink-0 ${i.sev === "red" ? "text-red-600" : "text-amber-500"}`} aria-hidden="true" />
              <div className="min-w-0 flex-1"><p className="font-semibold">{i.title}</p><p className="text-sm text-slate-500">{i.sub}</p></div>
              {i.m && user.role !== "Staff" && <button className={ghost} onClick={() => removeExpired(i.m)}>Remove expired stock</button>}
            </li>
          );
        })}
        {!shown.length && <Empty text="No alerts. All clear." />}
      </ul>
    </>
  );
}