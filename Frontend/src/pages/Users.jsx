import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { Badge, Card, PageHeader, Row, TableWrap, fld, td, th } from "../components/ui.jsx";
import { usersSeed } from "../data/mock.js";

export default function Users() {
  const { logs, log } = useApp();
  const [users, setUsers] = useState(usersSeed);
  const patch = (id, change, text) => { setUsers((l) => l.map((u) => (u.id === id ? { ...u, ...change } : u))); log(text); };

  return (
    <>
      <PageHeader title="Users" sub="Role management and user activity" />
      <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-teal-900/5">
        <TableWrap>
          <thead><tr>{["User", "Email", "Role", "Status"].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className={td}><p className="font-semibold">{u.name}</p><p className="text-xs text-slate-500">@{u.username}</p></td>
                <td className={td}>{u.email}</td>
                <td className={td}>
                  <select aria-label={`Role for ${u.username}`} value={u.role} className={`${fld} w-auto py-1.5`}
                    onChange={(e) => patch(u.id, { role: e.target.value }, `Role changed: ${u.username} → ${e.target.value}`)}>
                    {["Admin", "Pharmacist", "Staff", "Supplier"].map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td className={td}>
                  <button onClick={() => patch(u.id, { active: !u.active }, `${u.username} ${u.active ? "deactivated" : "activated"}`)}>
                    <Badge tone={u.active ? "green" : "slate"}>{u.active ? "Active" : "Inactive"}</Badge>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
      <Card title="Recent activity" className="mt-4">
        <ul>{logs.slice(0, 8).map((l) => <Row key={l.id} left={l.text} sub={`${l.by} · ${l.time}`} />)}</ul>
      </Card>
    </>
  );
}