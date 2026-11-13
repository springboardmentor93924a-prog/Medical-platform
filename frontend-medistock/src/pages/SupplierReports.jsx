import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import api, { errorOf } from "../api/client.js";
import { PageHeader, Stat, TableWrap, Tag, btn, fld, td, th } from "../components/ui.jsx";
import { ClipboardList, PackageCheck, IndianRupee } from "lucide-react";

const STATUSES = ["Pending", "Accepted", "Dispatched", "Partially received", "Received", "Cancelled"];
const money = (v) => `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const cell = (v) => { const t = String(v); return `"${(/^[=+@]/.test(t) ? `'${t}` : t).replace(/"/g, '""')}"`; };

export default function SupplierReports() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.get("/api/orders").then((res) => setOrders(res.data)).catch((err) => setError(errorOf(err).message));
  }, []);

  const shown = useMemo(() => (orders ?? []).filter((o) => !status || o.status === status), [orders, status]);
  const counted = shown.filter((o) => o.status !== "Cancelled");
  const value = counted.reduce((sum, o) => sum + Number(o.totalAmount), 0);

  const downloadCsv = () => {
    const head = ["Order", "Medicines", "Total (Rs)", "Ordered", "Expected", "Delivered", "Status"];
    const rows = shown.map((o) => [o.orderNumber, o.items.map((i) => `${i.medicine} x ${i.quantity}`).join("; "), Number(o.totalAmount).toFixed(2),
      o.createdAt.slice(0, 10), o.expectedDate ?? "-", o.deliveredAt ? o.deliveredAt.slice(0, 10) : "-", o.status]);
    const blob = new Blob(["\uFEFF" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "my-orders-report.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <PageHeader title="Reports" sub="Your order history">
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className={`${fld} w-auto`}>
          <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className={btn} onClick={downloadCsv} disabled={!orders}><Download className="size-4" />Download CSV</button>
      </PageHeader>

      {error ? <p role="alert" className="p-6 text-center font-medium text-red-700">{error}</p>
        : !orders ? <p className="p-6 text-center text-slate-500">Loading report...</p> : (
          <>
            <div className="mb-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
              <Stat icon={ClipboardList} label="Orders" value={shown.length} tone="teal" />
              <Stat icon={PackageCheck} label="Delivered" value={shown.filter((o) => o.status === "Received").length} tone="blue" />
              <Stat icon={IndianRupee} label="Order value (not cancelled)" value={money(value)} tone="amber" />
            </div>
            <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
              <TableWrap>
                <thead><tr>{["Order", "Medicines", "Total", "Ordered", "Expected", "Delivered", "Status"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {shown.map((o) => (
                    <tr key={o.id}>
                      <td className={`${td} font-semibold`}>{o.orderNumber}</td>
                      <td className={td}>{o.items.map((i) => <p key={i.itemId}>{i.medicine} × {i.quantity}</p>)}</td>
                      <td className={td}>{money(o.totalAmount)}</td>
                      <td className={td}>{o.createdAt.slice(0, 10)}</td>
                      <td className={td}>{o.expectedDate ?? "—"}</td>
                      <td className={td}>{o.deliveredAt ? o.deliveredAt.slice(0, 10) : "—"}</td>
                      <td className={td}><Tag s={o.status} /></td>
                    </tr>
                  ))}
                  {!shown.length && <tr><td colSpan={7} className="p-6 text-center text-slate-500">No orders found.</td></tr>}
                </tbody>
              </TableWrap>
            </div>
          </>
        )}
    </>
  );
}