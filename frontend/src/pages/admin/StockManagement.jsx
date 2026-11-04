import { useState } from "react";
import { ArrowLeftRight, Boxes } from "lucide-react";

import Inventory from "./Inventory.jsx";
import StockMovements from "./StockMovements.jsx";

const TABS = [
  { id: "stock", label: "Stock levels", icon: Boxes },
  { id: "movements", label: "Stock movements", icon: ArrowLeftRight },
];

export default function StockManagement() {
  const [tab, setTab] = useState("stock");

  return (
    <div>
      <div className="border-b border-slate-200 bg-white/70 px-4 pt-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 md:px-7 lg:px-8">
        <div className="flex w-full flex-col gap-1 sm:flex-row">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center justify-center gap-2 rounded-t-xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "border-b-2 border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300"
                    : "border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "stock" ? <Inventory /> : <StockMovements />}
    </div>
  );
}
