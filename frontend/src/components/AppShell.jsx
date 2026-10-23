import { useState } from "react";

import { Icon } from "./icons";
import ThemeToggle from "./ThemeToggle";

export default function AppShell({
  role,
  menu,
  active,
  onSelect,
  onLogout,
  title,
  subtitle = "MediStock medical inventory",
  children,
}) {
  const [open, setOpen] = useState(false);

  const select = (id) => {
    setOpen(false);
    onSelect(id);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-gradient-to-b from-ink-800 via-ink-900 to-slate-950 text-slate-100 shadow-2xl transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-900/40">
            <Icon name="cross" className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold tracking-tight text-white">
              MediStock
            </p>
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-200/70">
              {role} portal
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menu.map((item) => {
            const isActive = item.id === active;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => select(item.id)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  isActive
                    ? "bg-white/12 text-white shadow-inner ring-1 ring-white/15"
                    : "text-slate-300/85 hover:bg-white/6 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                    isActive
                      ? "bg-blue-500 text-white shadow-md shadow-blue-900/40"
                      : "bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white"
                  }`}
                >
                  <Icon name={item.icon} className="h-4 w-4" />
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/90 text-sm font-semibold text-white">
              {role.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {role} account
              </p>
              <p className="text-[11px] text-emerald-200/60">Signed in</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20 hover:text-white"
          >
            <Icon name="logout" className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 lg:hidden"
              aria-label="Open menu"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg dark:text-white">
                {title}
              </h1>
              <p className="hidden truncate text-xs text-slate-500 sm:block dark:text-slate-400">
                {subtitle}
              </p>
            </div>

            <span className="hidden items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700 sm:inline-flex dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              {role}
            </span>

            <ThemeToggle />

            <button
              type="button"
              onClick={onLogout}
              className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-rose-300 hover:text-rose-600 sm:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-rose-500/50 dark:hover:text-rose-400"
            >
              <Icon name="logout" className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
