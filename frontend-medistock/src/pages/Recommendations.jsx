import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import api, { errorOf } from "../api/client.js";
import { Badge, Card, Empty, PageHeader, TableWrap, ghost, td, th } from "../components/ui.jsx";

const money = (v) => `₹${Number(v).toLocaleString("en-IN")}`;

export default function Recommendations() {
  const { user } = useApp();
  const canOrder = user.role === "Pharmacist";   // the Admin can read the suggestions but does not place orders
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/recommendations").then((res) => setData(res.data)).catch((err) => setError(errorOf(err).message));
  }, []);

  const header = <PageHeader title="Smart Recommendations" sub="What to order, and which stock is at risk" />;
  if (error) return <>{header}<p role="alert" className="p-6 text-center font-medium text-red-700">{error}</p></>;
  if (!data) return <>{header}<p className="p-6 text-center text-slate-500">Working out recommendations...</p></>;

  return (
    <>
      {header}
      <p className="mb-4 flex items-start gap-2 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-900">
        <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{data.basis} This is a forecast from your own records, so treat it as advice and check it before ordering.</span>
      </p>

      <Card title={`Reorder suggestions (${data.reorders.length})`}>
        <TableWrap>
          <thead><tr>{["Medicine", "In stock", "On order", "Days left", "Suggested order", "Priority", "Why", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>
            {data.reorders.map((r) => (
              <tr key={r.medicineId}>
                <td className={td}><p className="font-semibold">{r.medicine}</p><p className="text-xs text-slate-500">{r.supplier}</p></td>
                <td className={td}>{r.usable}</td><td className={td}>{r.onOrder}</td>
                <td className={td}>{r.daysLeft == null ? "—" : r.daysLeft}</td>
                <td className={`${td} font-bold`}>{r.suggestedQty}</td>
                <td className={td}><Badge tone={r.priority === "High" ? "red" : "amber"}>{r.priority}</Badge></td>
                <td className={`${td} max-w-xs text-xs text-slate-600`}>{r.reason}</td>
                <td className={td}>{canOrder && <Link className={ghost} to={`/orders?medicineId=${r.medicineId}&qty=${r.suggestedQty}&supplierId=${r.supplierId}`}>Create order</Link>}</td>
              </tr>
            ))}
            {!data.reorders.length && <tr><td colSpan={8}><Empty text="Nothing needs ordering right now." /></td></tr>}
          </tbody>
        </TableWrap>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card title={`Stock that may expire unused (${data.expiryRisks.length})`}>
          <TableWrap>
            <thead><tr>{["Medicine", "Quantity", "Expires", "At risk", "Advice"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>
              {data.expiryRisks.map((r) => (
                <tr key={r.batchId}>
                  <td className={td}><p className="font-semibold">{r.medicine}</p><p className="text-xs text-slate-500">Batch {r.batchNumber}</p></td>
                  <td className={td}>{r.quantity}</td>
                  <td className={td}>{r.expiryDate}<p className="text-xs text-slate-500">{r.daysToExpiry} days</p></td>
                  <td className={td}><b>{r.atRiskUnits}</b> units<p className="text-xs text-red-600">{money(r.atRiskValue)}</p></td>
                  <td className={`${td} text-xs text-slate-600`}>{r.advice}</td>
                </tr>
              ))}
              {!data.expiryRisks.length && <tr><td colSpan={5}><Empty text="No stock looks likely to go to waste." /></td></tr>}
            </tbody>
          </TableWrap>
        </Card>

        <Card title="Slow movers: do not reorder">
          <ul>
            {data.slowMovers.length
              ? data.slowMovers.map((s) => (
                  <li key={s.medicine} className="flex items-center justify-between gap-3 border-t border-slate-100 py-2.5 first:border-0">
                    <div><p className="text-sm font-medium">{s.medicine}</p><p className="text-xs text-slate-500">{s.usable} units, nothing used in 60 days</p></div>
                    <b className="text-sm">{money(s.valueTiedUp)}</b>
                  </li>
                ))
              : <Empty text="No slow-moving stock." />}
          </ul>
          <p className="mt-2 text-xs text-slate-500">The amount is the money tied up in that stock.</p>
        </Card>
      </div>
    </>
  );
}