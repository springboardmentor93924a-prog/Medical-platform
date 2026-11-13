import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import api, { errorOf } from "../api/client.js";
import { useApp } from "../context/AppContext.jsx";
import { titleFor } from "../menus.js";
import { PageHeader, TableWrap, btn, fld, ghost, td, th } from "../components/ui.jsx";

// The third item marks the reports that only the Admin can open
const ALL_TYPES = [
  ["inventory", "Inventory report"], ["analytics", "Inventory analytics", true], ["stock", "Stock data"],
  ["movements", "Stock movement", true], ["expiry", "Expiry report"], ["suppliers", "Supplier analytics", true],
  ["purchases", "Purchase history"], ["wastage", "Wastage report"],
];

// A leading = + or @ could be run as a formula when the file is opened in Excel, so it is neutralised
const cell = (v) => {
  const text = String(v);
  return `"${(/^[=+@]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
};
const toCsv = (cols, rows) => [cols, ...rows].map((r) => r.map(cell).join(",")).join("\n");

export default function Reports() {
  const { user } = useApp();
  const types = ALL_TYPES.filter(([, , adminOnly]) => !adminOnly || user.role === "Admin");
  const [type, setType] = useState("inventory");
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.get(`/api/reports/${type}`)
      .then((res) => { if (!cancelled) setReport(res.data); })
      .catch((err) => { if (!cancelled) setError(errorOf(err).message); });
    return () => { cancelled = true; };
  }, [type]);

  const choose = (e) => { setReport(null); setError(""); setType(e.target.value); };

  // Real Excel and PDF files made by the backend
  const download = async (format) => {
    setActionError("");
    try {
      const res = await api.get(`/api/reports/${type}/download`, { params: { format }, responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medistock-${type}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      let msg = "Download failed. Please try again.";
      const data = err.response?.data;
      if (data instanceof Blob) {
        try { msg = JSON.parse(await data.text()).message || msg; } catch { /* keep the default message */ }
      } else if (!err.response) {
        msg = errorOf(err).message;
      }
      setActionError(msg);
    }
  };

  const downloadCsv = () => {
    const blob = new Blob(["\uFEFF" + toCsv(report.columns, report.rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `medistock-${type}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <PageHeader title={titleFor(user.role, "/reports", "Inventory Reports")} sub="Generate, export and print inventory data">
        <select aria-label="Report type" value={type} onChange={choose} className={`${fld} w-auto`}>
          {types.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <button className={btn} onClick={() => download("xlsx")} disabled={!report}><Download className="size-4" />Excel</button>
        <button className={btn} onClick={() => download("pdf")} disabled={!report}><FileText className="size-4" />PDF</button>
        <button className={ghost} onClick={downloadCsv} disabled={!report}>CSV</button>
      </PageHeader>

      {actionError && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{actionError}</p>}

      <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
        {error ? (
          <p role="alert" className="p-6 text-center font-medium text-red-700">{error}</p>
        ) : !report ? (
          <p className="p-6 text-center text-slate-500">Loading report...</p>
        ) : (
          <>
            <p className="px-3 pt-2 font-bold">
              {report.title} <span className="font-normal text-slate-500">· {new Date(report.generatedAt).toLocaleString()}</span>
            </p>
            <TableWrap>
              <thead><tr>{report.columns.map((c) => <th key={c} className={th}>{c}</th>)}</tr></thead>
              <tbody>
                {report.rows.map((row, i) => (
                  <tr key={i}>{row.map((v, j) => <td key={j} className={td}>{v}</td>)}</tr>
                ))}
              </tbody>
            </TableWrap>
            {!report.rows.length && <p className="p-6 text-center text-slate-500">Nothing to report.</p>}
          </>
        )}
      </div>
    </>
  );
}