import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Lock, Pill, RefreshCw, Users } from "lucide-react";
import api, { errorOf } from "../api/client.js";
import { Badge, Card, Empty, PageHeader, Row, Stat, TableWrap, btn, ghost, td, th } from "../components/ui.jsx";

const TONE = { UP: "green", DOWN: "red", OFF: "slate" };
const LABEL = { UP: "Running", DOWN: "Down", OFF: "Off" };

function uptime(seconds) {
  const d = Math.floor(seconds / 86400), h = Math.floor((seconds % 86400) / 3600), m = Math.floor((seconds % 3600) / 60);
  return [d && `${d}d`, (d || h) && `${h}h`, `${m}m`].filter(Boolean).join(" ");
}

export default function SystemMonitoring() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await api.get("/api/admin/monitoring");
      setData(res.data);
      setError("");
    } catch (err) {
      setError(errorOf(err).message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);   // refreshes by itself every 30 seconds
    return () => clearInterval(timer);
  }, [load]);

  const header = (
    <PageHeader title="System Monitoring" sub="System health, activity and recorded errors">
      <button className={ghost} onClick={load} disabled={refreshing}><RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</button>
    </PageHeader>
  );

  if (!data) {
    return (
      <>
        {header}
        {error
          ? <div className="p-6 text-center"><p role="alert" className="mb-3 font-medium text-red-700">{error}</p><button className={btn} onClick={load}>Try again</button></div>
          : <p className="p-6 text-center text-slate-500">Loading system status...</p>}
      </>
    );
  }

  const { checks, server, counts, activity, signups, errors } = data;
  const memoryPct = Math.min(100, Math.round((server.memoryUsedMb / server.memoryMaxMb) * 100));

  return (
    <>
      {header}
      <p className="-mt-3 mb-4 text-xs text-slate-500">Last checked {new Date(data.checkedAt).toLocaleTimeString()}. Updates every 30 seconds.</p>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">Could not refresh: {error}</p>}

      <div className="grid gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {checks.map((c) => (
          <div key={c.name} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{c.name}</p>
              <Badge tone={TONE[c.status]}>{LABEL[c.status]}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-600">{c.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label={`Users (${counts.activeUsers} active)`} value={counts.users} tone="blue" />
        <Stat icon={Lock} label="Locked accounts" value={counts.lockedAccounts} tone={counts.lockedAccounts ? "red" : "teal"} />
        <Stat icon={Pill} label="Medicines / batches" value={`${counts.medicines} / ${counts.batches}`} tone="teal" />
        <Stat icon={ClipboardList} label={`Open orders (${counts.awaitingApproval} awaiting approval)`} value={counts.openOrders} tone="amber" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Server">
          <ul>
            <Row left="Started" right={<span className="text-sm font-semibold">{new Date(server.startedAt).toLocaleString()}</span>} />
            <Row left="Running for" right={<span className="text-sm font-semibold">{uptime(server.uptimeSeconds)}</span>} />
            <Row left="Java version" right={<span className="text-sm font-semibold">{server.javaVersion}</span>} />
            <Row left="Processors" right={<span className="text-sm font-semibold">{server.processors}</span>} />
          </ul>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-sm"><span>Memory</span><span className="font-semibold">{server.memoryUsedMb} of {server.memoryMaxMb} MB ({memoryPct}%)</span></div>
            <div className="h-2 rounded-full bg-teal-100" role="img" aria-label={`Memory use ${memoryPct} percent`}>
              <div className={`h-2 rounded-full ${memoryPct > 85 ? "bg-red-500" : "bg-teal-600"}`} style={{ width: `${memoryPct}%` }} />
            </div>
          </div>
        </Card>

        <Card title="Recent stock activity">
          <ul>
            {activity.length
              ? activity.map((a, i) => <Row key={i} left={a.text} sub={`${a.by} · ${new Date(a.time).toLocaleString()}`} />)
              : <Empty text="No activity yet." />}
          </ul>
        </Card>

        <Card title="Newest accounts">
          <ul>
            {signups.map((s) => <Row key={s.username} left={`@${s.username}`} sub={new Date(s.time).toLocaleString()} right={<Badge tone="slate">{s.role}</Badge>} />)}
          </ul>
        </Card>

        <Card title={`Operational errors (${errors.length})`}>
          {errors.length ? (
            <TableWrap>
              <thead><tr>{["When", "Request", "Error"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
              <tbody>
                {errors.map((e, i) => (
                  <tr key={i}>
                    <td className={`${td} whitespace-nowrap`}>{new Date(e.time).toLocaleString()}</td>
                    <td className={td}><p className="font-semibold">{e.method}</p><p className="max-w-40 truncate text-xs text-slate-500" title={e.path}>{e.path}</p></td>
                    <td className={td}><p className="font-semibold text-red-700">{e.type}</p><p className="max-w-56 text-xs text-slate-600">{e.message}</p></td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          ) : <p className="py-4 text-center text-sm font-medium text-emerald-700">No errors recorded since the server started.</p>}
          <p className="mt-2 text-xs text-slate-500">The latest 50 unexpected server errors. The list is cleared when the server restarts.</p>
        </Card>
      </div>
    </>
  );
}