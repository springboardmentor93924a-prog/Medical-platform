import { X } from "lucide-react";

export const fld = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15";
export const btn = "inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700";
export const ghost = "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-teal-800 ring-1 ring-teal-700/25 transition hover:bg-teal-50";
export const th = "px-3 py-2 text-xs font-semibold text-slate-500";
export const td = "border-t border-slate-100 px-3 py-2.5";

const BADGE = {
  green: "bg-emerald-100 text-emerald-800", amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800", blue: "bg-sky-100 text-sky-800", slate: "bg-slate-100 text-slate-700",
};
const TONE = {
  "In stock": "green", "Low stock": "amber", "Out of stock": "red", Safe: "green", "Near expiry": "amber", Expired: "red",
  Pending: "amber", Accepted: "blue", Dispatched: "blue", Received: "green",
};
export const Badge = ({ tone = "slate", children }) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[tone]}`}>{children}</span>
);
export const Tag = ({ s }) => <Badge tone={TONE[s]}>{s}</Badge>;

export const Card = ({ title, action, children, className = "" }) => (
  <section className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/5 sm:p-5 ${className}`}>
    {(title || action) && (
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-bold">{title}</h2>{action}
      </div>
    )}
    {children}
  </section>
);

const STAT = { teal: "bg-teal-100 text-teal-700", amber: "bg-amber-100 text-amber-700", red: "bg-red-100 text-red-700", blue: "bg-sky-100 text-sky-700" };
export const Stat = ({ icon: Icon, label, value, tone }) => (
  <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-teal-900/5">
    <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${STAT[tone]}`}>
      <Icon className="size-5" aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <p className="truncate text-sm text-slate-500">{label}</p>
      <p className="text-xl font-extrabold">{value}</p>
    </div>
  </div>
);

export const PageHeader = ({ title, sub, children }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {sub && <p className="text-slate-600">{sub}</p>}
    </div>
    <div className="flex flex-wrap gap-2 print:hidden">{children}</div>
  </div>
);

export const Row = ({ left, sub, right }) => (
  <li className="flex items-center justify-between gap-3 border-t border-slate-100 py-2.5 first:border-0">
    <div className="min-w-0">
      <p className="truncate text-sm font-medium">{left}</p>
      {sub && <p className="truncate text-xs text-slate-500">{sub}</p>}
    </div>
    {right}
  </li>
);
export const Empty = ({ text }) => <p className="py-4 text-center text-sm text-slate-500">{text}</p>;

export const BarList = ({ items, max }) => {
  const top = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{i.label}</span><span className="font-semibold">{i.text ?? i.value}</span>
          </div>
          <div className="h-2 rounded-full bg-teal-100">
            <div className="h-2 rounded-full bg-teal-600" style={{ width: `${(i.value / top) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

export const Label = ({ text, children }) => (
  <label className="block text-sm font-medium">{text}<div className="mt-1">{children}</div></label>
);

export const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}
      className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-slate-100"><X className="size-5" /></button>
      </div>
      {children}
    </div>
  </div>
);

export const TableWrap = ({ children }) => (
  <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">{children}</table></div>
);