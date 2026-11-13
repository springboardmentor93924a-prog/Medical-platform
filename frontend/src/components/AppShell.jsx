
import { useState } from "react";

import { Icon } from "./icons";
import ThemeToggle from "./ThemeToggle";
import AssistantChat from "./AssistantChat.jsx";

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

  const canUseAssistant = ["admin", "pharmacist"].includes(
    String(role || "").toLowerCase()
  );

  const select = (id) => {
    setOpen(false);
    onSelect(id);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">

      {/* Mobile Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white text-slate-800 shadow-xl transition-all duration-300 ease-out dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-5 dark:border-slate-800">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/20">
            <Icon name="cross" className="h-6 w-6" strokeWidth={2.4} />
          </span>

          <div className="min-w-0">
            <p className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              MediStock
            </p>
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
              {role} portal
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
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
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-700 dark:group-hover:text-blue-300"
                  }`}
                >
                  <Icon name={item.icon} className="h-4 w-4" />
                </span>

                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-2.5 dark:bg-slate-800">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
              {role?.slice(0, 1) || "U"}
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                {role} account
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Signed in
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
          >
            <Icon name="logout" className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="min-h-screen bg-slate-100 transition-colors duration-300 dark:bg-slate-950 lg:pl-72">

        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 lg:hidden"
              aria-label="Open menu"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                {title}
              </h1>

              <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">
                {subtitle}
              </p>
            </div>

            <span className="hidden items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              {role}
            </span>

            <ThemeToggle />

            <button
              type="button"
              onClick={onLogout}
              className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-rose-500/50 dark:hover:text-rose-400 sm:inline-flex"
            >
              <Icon name="logout" className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-65px)] bg-slate-100 px-4 py-6 transition-colors duration-300 dark:bg-slate-950 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {canUseAssistant && <AssistantChat />}
    </div>
  );
}
