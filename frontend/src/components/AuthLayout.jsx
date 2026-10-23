import ThemeToggle from "./ThemeToggle";
import { Icon } from "./icons";

const features = [
  {
    title: "Live stock visibility",
    text: "Batches, quantities and locations always up to date.",
  },
  {
    title: "Expiry protection",
    text: "Get warned before medicines reach their expiry date.",
  },
  {
    title: "Orders & reports",
    text: "Raise purchase orders and export audit-ready CSV reports.",
  },
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-ink-800 via-ink-900 to-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="brand-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-900/50">
            <Icon name="cross" className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <div>
            <p className="text-xl font-semibold tracking-tight">MediStock</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-emerald-200/70">
              Pharmacy inventory
            </p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-200/70">
            Calm, controlled pharmacy operations
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
            Every medicine, every batch, under control.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300 xl:text-base">
            MediStock keeps your stock counts honest, flags expiring batches
            early and gives the whole team one shared source of truth.
          </p>

          <ul className="mt-10 space-y-5">
            {features.map((feature) => (
              <li key={feature.title} className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30">
                  <Icon name="check" className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {feature.title}
                  </p>
                  <p className="text-sm text-slate-400">{feature.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Secure, role-based access
          </span>
          <span className="hidden xl:inline">Admin · Pharmacist · Staff · Supplier</span>
        </div>
      </aside>

      <main className="relative flex min-h-screen flex-col px-5 py-8 sm:px-8">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
              <Icon name="cross" className="h-5 w-5" strokeWidth={2.6} />
            </span>
            <div>
              <p className="text-base font-semibold leading-tight text-slate-900 dark:text-white">
                MediStock
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Pharmacy inventory
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md animate-rise">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>

              <div className="mt-6">{children}</div>

              {footer && (
                <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  {footer}
                </div>
              )}
            </div>

            <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
              MediStock · Medical inventory platform
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
