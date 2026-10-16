import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { PageHeader, TableWrap, btn, fld, ghost, td, th } from "../components/ui.jsx";
import { daysTo, expiryStatus, stockStatus } from "../data/mock.js";

const toCsv = (cols, rows) => [cols, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

export default function Reports() {
  const { medicines, orders } = useApp();
  const [key, setKey] = useState("inventory");
  const reports = {
    inventory: { title: "Inventory report", cols: ["Medicine", "Batch", "Category", "Supplier", "Qty", "Expiry", "Price"],
      rows: medicines.map((m) => [m.name, m.batch, m.category, m.supplier, m.qty, m.expiry, m.price]) },
    stock: { title: "Stock data", cols: ["Medicine", "Qty", "Reorder level", "Status"],
      rows: medicines.map((m) => [m.name, m.qty, m.reorder, stockStatus(m)]) },
    expiry: { title: "Expiry report", cols: ["Medicine", "Batch", "Expiry", "Days left", "Status"],
      rows: medicines.filter((m) => expiryStatus(m) !== "Safe").map((m) => [m.name, m.batch, m.expiry, daysTo(m.expiry), expiryStatus(m)]) },
    purchases: { title: "Purchase history", cols: ["Order", "Supplier", "Medicine", "Qty", "Date", "Status"],
      rows: orders.map((o) => [o.id, o.supplier, o.medicine, o.qty, o.date, o.status]) },
  };
  const r = reports[key];
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([toCsv(r.cols, r.rows)], { type: "text/csv" }));
    a.download = `medistock-${key}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <PageHeader title="Reports" sub="Generate, export and print inventory data">
        <select aria-label="Report type" value={key} onChange={(e) => setKey(e.target.value)} className={`${fld} w-auto`}>
          {Object.entries(reports).map(([k, v]) => <option key={k} value={k}>{v.title}</option>)}
        </select>
        <button className={btn} onClick={download}><Download className="size-4" />Excel (CSV)</button>
        <button className={ghost} onClick={() => window.print()}><Printer className="size-4" />Print / PDF</button>
      </PageHeader>
      <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
        <p className="px-3 pt-2 font-bold">{r.title} · {new Date().toLocaleDateString()}</p>
        <TableWrap>
          <thead><tr>{r.cols.map((c) => <th key={c} className={th}>{c}</th>)}</tr></thead>
          <tbody>{r.rows.map((row, i) => <tr key={i}>{row.map((v, j) => <td key={j} className={td}>{v}</td>)}</tr>)}</tbody>
        </TableWrap>
        {!r.rows.length && <p className="p-6 text-center text-slate-500">Nothing to report.</p>}
      </div>
    </>
  );
}