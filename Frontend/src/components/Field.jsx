// Shared input style + labelled field wrapper used by both pages
export const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-base text-ink " +
  "placeholder:text-slate-400 outline-none transition " +
  "focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15";

export default function Field({ id, label, icon: Icon, right, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-teal-700/70"
        />
        {children}
        {right}
      </div>
    </div>
  );
}