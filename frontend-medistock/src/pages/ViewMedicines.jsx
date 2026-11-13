import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import api, { errorOf } from "../api/client.js";
import { Badge, PageHeader, TableWrap, Tag, btn, td, th } from "../components/ui.jsx";
import { useFirstIds } from "../api/fefo.js";

export default function ViewMedicines() {
  const [rows, setRows] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/inventory");
      setRows(data);
      setLoadError("");
    } catch (err) {
      setLoadError(errorOf(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const firstOut = useMemo(() => useFirstIds(rows), [rows]);   // batches to use or sell first

  // One line per medicine, with its batches underneath. Read only.
  const medicines = useMemo(() => {
    const byId = new Map();
    rows.forEach((r) => {
      const m = byId.get(r.medicineId) ?? { id: r.medicineId, name: r.name, category: r.category, reorder: r.reorderLevel, usable: 0, batches: [] };
      if (r.daysToExpiry >= 0) m.usable += r.quantity;   // expired batches are not usable stock
      m.batches.push(r);
      byId.set(r.medicineId, m);
    });
    return [...byId.values()]
      .map((m) => {
        const withStock = m.batches.filter((b) => b.quantity > 0).map((b) => b.expiryDate).sort();
        return { ...m, status: m.usable === 0 ? "Out of stock" : m.usable <= m.reorder ? "Low stock" : "In stock", nextExpiry: withStock[0] ?? "—" };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  return (
    <>
      <PageHeader title="View Medicines" sub="Medicine details, available quantities, batch numbers and expiry dates. Click a medicine to see its batches." />

      <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
        {loading ? (
          <p className="p-6 text-center text-slate-500">Loading medicines...</p>
        ) : loadError ? (
          <div className="p-6 text-center">
            <p role="alert" className="mb-3 font-medium text-red-700">{loadError}</p>
            <button className={btn} onClick={() => { setLoading(true); load(); }}>Try again</button>
          </div>
        ) : (
          <TableWrap>
            <thead><tr>{["Medicine", "Category", "Units available", "Batches", "Next expiry", "Status"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>
              {medicines.map((m) => {
                const isOpen = openId === m.id;
                return (
                  <Fragment key={m.id}>
                    <tr>
                      <td className={td}>
                        <button onClick={() => setOpenId(isOpen ? null : m.id)} aria-expanded={isOpen} className="flex items-center gap-1.5 font-semibold hover:text-teal-700">
                          {isOpen ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}
                          {m.name}
                        </button>
                      </td>
                      <td className={td}>{m.category}</td>
                      <td className={`${td} font-semibold`}>{m.usable}</td>
                      <td className={td}>{m.batches.length}</td>
                      <td className={td}>{m.nextExpiry}</td>
                      <td className={td}><Tag s={m.status} /></td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={6} className="bg-slate-50 px-4 py-3">
                          <TableWrap>
                            <thead><tr>{["Batch number", "Supplier", "Quantity", "Expiry date", "Expiry status"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                            <tbody>
                              {m.batches.map((b) => (
                                <tr key={b.batchId}>
                                  <td className={`${td} font-semibold`}>{b.batchNumber} {firstOut.has(b.batchId) && <Badge tone="blue">Use first</Badge>}</td>
                                  <td className={td}>{b.supplier}</td>
                                  <td className={td}>{b.quantity}</td>
                                  <td className={td}>{b.expiryDate}</td>
                                  <td className={td}><Tag s={b.expiryStatus} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </TableWrap>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {!medicines.length && <tr><td colSpan={6} className="p-6 text-center text-slate-500">No medicines yet.</td></tr>}
            </tbody>
          </TableWrap>
        )}
      </div>
    </>
  );
}