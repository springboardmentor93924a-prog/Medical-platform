import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import api, { errorOf } from "../api/client.js";
import { Badge, Card, PageHeader, TableWrap, fld, td, th } from "../components/ui.jsx";

const money = (v) => `₹${Number(v).toLocaleString("en-IN")}`;
const CATEGORIES = ["All", "Orders", "Stock", "Counts"];

export default function AuditLogs() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All");
  const [role, setRole] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    api.get("/api/admin/audit").then((res) => setData(res.data)).catch((err) => setError(errorOf(err).message));
  }, []);

  const events = useMemo(() => {
    const q = text.trim().toLowerCase();
    return (data?.events ?? []).filter((e) =>
      (category === "All" || e.category === category) && (!role || e.role === role) &&
      (!q || `${e.actor} ${e.action} ${e.target} ${e.detail}`.toLowerCase().includes(q)));
  }, [data, category, role, text]);

  const header = <PageHeader title="Audit Logs" sub="Who placed orders, who approved and received them, and who changed stock" />;
  if (error) return <>{header}<p role="alert" className="p-6 text-center font-medium text-red-700">{error}</p></>;
  if (!data) return <>{header}<p className="p-6 text-center text-slate-500">Loading audit logs...</p></>;

  return (
    <>
      {header}
      <Card title="Orders and purchases by user">
        <TableWrap>
          <thead><tr>{["User", "Role", "Orders placed", "Order value", "Approved", "Rejected", "Stock receipts"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>
            {data.summary.map((s) => (
              <tr key={s.username}>
                <td className={`${td} font-semibold`}>@{s.username}</td>
                <td className={td}><Badge tone="slate">{s.role}</Badge></td>
                <td className={td}>{s.ordersPlaced}</td><td className={td}>{money(s.orderValue)}</td>
                <td className={td}>{s.approved}</td><td className={td}>{s.rejected}</td><td className={td}>{s.receipts}</td>
              </tr>
            ))}
            {!data.summary.length && <tr><td colSpan={7} className="p-6 text-center text-slate-500">No activity yet.</td></tr>}
          </tbody>
        </TableWrap>
      </Card>

      <div className="mb-3 mt-6 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto font-bold">Activity log ({events.length})</h2>
        <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className={`${fld} w-auto`}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)} className={`${fld} w-auto`}>
          <option value="">All roles</option>{["Admin", "Pharmacist", "Staff", "Supplier", "System"].map((r) => <option key={r}>{r}</option>)}
        </select>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input aria-label="Search the log" placeholder="Search" value={text} onChange={(e) => setText(e.target.value)} className={`${fld} w-48 pl-9`} />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
        <TableWrap>
          <thead><tr>{["When", "Who", "Action", "Item", "Details"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i}>
                <td className={`${td} whitespace-nowrap`}>{new Date(e.time).toLocaleString()}</td>
                <td className={td}><p className="font-semibold">@{e.actor}</p><Badge tone="slate">{e.role}</Badge></td>
                <td className={`${td} font-semibold`}>{e.action}</td>
                <td className={td}>{e.target}</td>
                <td className={`${td} text-slate-600`}>{e.detail || "—"}</td>
              </tr>
            ))}
            {!events.length && <tr><td colSpan={5} className="p-6 text-center text-slate-500">Nothing matches.</td></tr>}
          </tbody>
        </TableWrap>
      </div>
      <p className="mt-2 text-xs text-slate-500">Built from orders, stock changes and stock counts. Supplier accept or dispatch steps and order cancellations are not time-stamped yet.</p>
    </>
  );
}