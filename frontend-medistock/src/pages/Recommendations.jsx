import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import api, { errorOf } from "../api/client.js";
import { Badge, Card, Empty, PageHeader, TableWrap, btn, fld, ghost, td, th } from "../components/ui.jsx";

const money = (v) => `₹${Number(v).toLocaleString("en-IN")}`;

const PRIORITY = { High: "red", Medium: "amber", Low: "slate" };

// Asks the AI model for advice and keeps the chat, so a follow-up question remembers the earlier ones.
// The chat is saved in this browser tab only (sessionStorage) and is tied to the current login: a new login gives a new
// token, so the old chat is not shown again. Nothing is stored on the server.
const CHAT_KEY = "ms_ai_chat";
const tokenTag = () => { try { return (localStorage.getItem("ms_token") || "").slice(-24); } catch { return ""; } };
const loadChat = () => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(CHAT_KEY));
    if (saved && saved.tag === tokenTag() && Array.isArray(saved.chat)) return saved.chat;
  } catch { /* nothing saved */ }
  return [];
};
const saveChat = (chat) => { try { sessionStorage.setItem(CHAT_KEY, JSON.stringify({ tag: tokenTag(), chat })); } catch { /* storage unavailable */ } };

// A JSON list is shown as cards. Anything else is shown as plain text.
const parseCards = (answer) => {
  try {
    const parsed = JSON.parse(answer.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, ""));
    return Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
};

function AiAdvisor() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState(loadChat);
  const [error, setError] = useState("");

  const ask = async () => {
    const q = question.trim();
    setLoading(true); setError("");
    // the last 3 exchanges are sent so the AI remembers what was said
    const history = chat.slice(-3).flatMap((c) => [
      { role: "user", text: c.q || "Give general stock advice" },
      { role: "model", text: String(c.a).slice(0, 1500) },
    ]);
    try {
      const { data } = await api.post("/api/recommendations/ai", { question: q, history });
      const next = [...chat, { q, a: data.answer, model: data.model }].slice(-20);
      setChat(next); saveChat(next); setQuestion("");
    } catch (err) {
      setError(errorOf(err).message);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => { setChat([]); saveChat([]); setError(""); };

  return (
    <Card title="AI advisor" className="mb-4">
      <p className="text-sm text-slate-600">
        Asks an AI model to look at your stock, today's date and the usual seasonal demand, and suggest what to do. It uses general knowledge as well as your data, and remembers this chat until you sign out.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input aria-label="Optional question" maxLength={300} value={question} onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !loading) ask(); }}
          placeholder="Optional question, e.g. What should I stock for the monsoon?" className={`${fld} min-w-64 flex-1`} />
        <button className={btn} onClick={ask} disabled={loading}><Sparkles className="size-4" />{loading ? "Thinking..." : "Ask AI"}</button>
        {chat.length > 0 && <button className={ghost} onClick={clear} disabled={loading}>Clear chat</button>}
      </div>
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      {[...chat].map((c, i) => ({ c, i })).reverse().map(({ c, i }) => {
        const cards = parseCards(c.a);
        return (
          <div key={i} className="mt-4">
            <p className="text-sm font-semibold text-teal-800">You: {c.q || "General stock advice"}</p>
            {cards ? (
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                {cards.map((it, j) => (
                  <div key={j} className="rounded-xl bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={PRIORITY[it.priority] ?? "slate"}>{it.priority ?? "Note"}</Badge>
                      {it.category && <Badge tone="blue">{it.category}</Badge>}
                    </div>
                    <p className="mt-2 font-semibold">{it.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{it.advice}</p>
                    {Array.isArray(it.medicines) && it.medicines.length > 0 && <p className="mt-2 text-xs text-slate-500">{it.medicines.join(", ")}</p>}
                  </div>
                ))}
              </div>
            ) : <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm">{c.a}</pre>}
          </div>
        );
      })}
      {chat.length > 0 && <p className="mt-3 text-xs text-slate-500">Written by the AI model ({chat[chat.length - 1].model}). It is advice about stock and ordering, not medical advice. Please check it before acting.</p>}
    </Card>
  );
}

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

      <AiAdvisor />

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
