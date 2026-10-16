import { motion } from "framer-motion";
import { Activity } from "lucide-react";

// A blister pack of 28 slots: filled capsules = stock, empty slots = gaps to restock
const EMPTY = new Set([3, 9, 10, 17, 22]);
const SLOTS = Array.from({ length: 28 }, (_, i) => i);

function Logo({ className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white">
        <Activity className="size-6" aria-hidden="true" />
      </span>
      <span className="text-xl font-extrabold tracking-tight">MediStock</span>
    </div>
  );
}

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[5fr_6fr]">
      {/* Brand panel: desktop and large tablets only */}
      <aside className="hidden flex-col justify-between bg-teal-900 p-10 text-teal-50 lg:flex xl:p-14">
        <Logo />

        <div>
          <div
            className="grid grid-cols-7 gap-3 rounded-3xl bg-teal-950/60 p-5 xl:gap-4 xl:p-6"
            aria-hidden="true"
          >
            {SLOTS.map((i) => (
              <div
                key={i}
                className="grid aspect-square place-items-center rounded-full bg-teal-950 shadow-inner"
              >
                {!EMPTY.has(i) && (
                  <motion.span
                    initial={{ scale: 0, rotate: -40 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.25 + i * 0.025, type: "spring", stiffness: 260, damping: 18 }}
                    className="block h-[62%] w-[38%] rounded-full bg-gradient-to-b from-teal-200 from-50% to-white to-50% shadow"
                  />
                )}
              </div>
            ))}
          </div>

          <h2 className="mt-10 max-w-sm text-3xl font-bold leading-tight xl:text-4xl">
            Know what is on every shelf.
          </h2>
          <p className="mt-3 max-w-sm text-teal-100/80">
            Track stock, expiry dates and suppliers for your pharmacy or hospital in one place.
          </p>
        </div>

        <p className="text-sm text-teal-100/60">MediStock Portal</p>
      </aside>

      {/* Form side */}
      <section className="flex items-center justify-center bg-teal-50 px-4 py-8 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Logo className="mb-6 justify-center lg:hidden" />
          <div className="rounded-3xl bg-white p-6 shadow-xl shadow-teal-900/10 ring-1 ring-teal-900/5 sm:p-9">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-2 text-slate-600">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}