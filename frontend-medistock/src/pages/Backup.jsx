import { useCallback, useEffect, useState } from "react";
import { Download, HardDrive, Upload } from "lucide-react";
import api, { errorOf } from "../api/client.js";
import { Badge, Card, PageHeader, TableWrap, btn, ghost, td, th } from "../components/ui.jsx";

const stamp = () => new Date().toISOString().slice(0, 10);

function saveBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Backup() {
  const [info, setInfo] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);
  const [sure, setSure] = useState(false);
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/api/admin/backup/files");
      setInfo(data);
    } catch (err) {
      setError(errorOf(err).message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (work) => {
    setBusy(true); setMessage(""); setError("");
    try { await work(); } catch (err) { setError(errorOf(err)?.message ?? "Something went wrong. Please try again."); } finally { setBusy(false); }
  };

  const downloadNow = () => run(async () => {
    const res = await api.get("/api/admin/backup/download", { responseType: "blob" });
    saveBlob(res.data, `medistock-backup-${stamp()}.json`);
    setMessage("Backup downloaded. Keep the file private: it contains password hashes.");
  });

  const saveOnServer = () => run(async () => {
    const { data } = await api.post("/api/admin/backup/now");
    setMessage(data.message);
    await load();
  });

  const downloadFile = (name) => run(async () => {
    const res = await api.get(`/api/admin/backup/files/${encodeURIComponent(name)}`, { responseType: "blob" });
    saveBlob(res.data, name);
  });

  const restore = () => run(async () => {
    setResult(null);
    let backup;
    try { backup = JSON.parse(await file.text()); } catch { throw { response: { data: { message: "That file is not a valid backup." } } }; }
    const { data } = await api.post("/api/admin/backup/restore", backup);
    setResult(data);
    setFile(null); setSure(false);
    await load();
  });

  return (
    <>
      <PageHeader title="Backup & Restore" sub="Keep a safe copy of all your data, and bring it back if needed" />

      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Back up now">
          <p className="text-sm text-slate-600">One file with everything: users, medicines, batches, orders, returns, stock history and settings.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={btn} onClick={downloadNow} disabled={busy}><Download className="size-4" />Download backup</button>
            <button className={ghost} onClick={saveOnServer} disabled={busy}><HardDrive className="size-4" />Save a copy on the server</button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {info?.dailyOn ? "A backup is also saved on the server every night at 02:00. The newest 14 are kept." : "Nightly backups are switched off."}
          </p>
        </Card>

        <Card title="Restore from a backup file">
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            Restoring replaces ALL current data with the file. A copy of the current data is saved on the server first, and if anything fails nothing is changed.
          </p>
          <input type="file" accept=".json,application/json" onChange={(e) => { setFile(e.target.files[0] ?? null); setSure(false); setResult(null); }}
            className="mt-3 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:font-semibold file:text-teal-800" />
          {file && (
            <>
              <label className="mt-3 flex items-start gap-2 text-sm">
                <input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} className="mt-1 size-4 accent-teal-700" />
                <span>I understand that this replaces all current data with <b>{file.name}</b>.</span>
              </label>
              <button className={`${btn} mt-3 disabled:opacity-50`} onClick={restore} disabled={!sure || busy}><Upload className="size-4" />{busy ? "Restoring..." : "Restore"}</button>
            </>
          )}
          {result && (
            <div role="status" className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="font-semibold">Restored. Safety copy of the old data: {result.safetyCopy}</p>
              <p className="mt-1">{Object.entries(result.restored).map(([t, n]) => `${t}: ${n}`).join(" · ")}</p>
              <p className="mt-1">Reload the page to see the restored data everywhere.</p>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
        <p className="px-3 pt-2 font-bold">Backups on the server</p>
        <p className="px-3 text-xs text-slate-500">{info?.folder}</p>
        <TableWrap>
          <thead><tr>{["File", "Type", "Size", "Saved", ""].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>
            {info?.files.map((f) => (
              <tr key={f.name}>
                <td className={`${td} font-semibold`}>{f.name}</td>
                <td className={td}><Badge tone="slate">{f.name.startsWith("auto-") ? "Nightly" : f.name.startsWith("before-") ? "Before restore" : "Manual"}</Badge></td>
                <td className={td}>{f.sizeKb} KB</td>
                <td className={td}>{new Date(f.modified).toLocaleString()}</td>
                <td className={td}><button className={ghost} onClick={() => downloadFile(f.name)} disabled={busy}>Download</button></td>
              </tr>
            ))}
            {info && !info.files.length && <tr><td colSpan={5} className="p-6 text-center text-slate-500">No backups on the server yet.</td></tr>}
          </tbody>
        </TableWrap>
      </div>
    </>
  );
}   