import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";

import { apiFetch } from "../services/api.js";

const GREETING =
  "Hi! I'm the MediStock assistant. I answer from your own inventory data — no external service. Ask me about low stock, expiry, FEFO, wastage, returns or reordering.";

const DEFAULT_SUGGESTIONS = [
  "Which items are low on stock?",
  "What expires in the next 90 days?",
  "Show expired batches",
  "What is our total wastage?",
  "Which batch should I dispense first?",
  "Show pending returns",
];


function AnswerRows({ rows }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  return (
    <ul className="mt-2 space-y-2 rounded-xl bg-slate-50 p-2 text-xs dark:bg-slate-800/60">
      {rows.map((row, index) => (
        <li
          key={row.reportId ?? row.returnId ?? row.inventoryId ?? index}
          className="space-y-1 text-slate-600 dark:text-slate-300"
        >
          {/* Stock-check reports */}
          {row.reportId != null ? (
            <>
              <p className="font-semibold text-slate-800 dark:text-white">
                Stock Check Report #{row.reportId}
              </p>
              <p>Inventory ID: {row.inventoryId ?? "N/A"}</p>
              <p>System quantity: {row.systemQuantity ?? "N/A"}</p>
              <p>Physical quantity: {row.physicalQuantity ?? "N/A"}</p>
              <p>Difference: {row.difference ?? "N/A"}</p>
              <p>Status: {row.status ?? "N/A"}</p>
              {row.remarks && <p>Remarks: {row.remarks}</p>}
              {row.reviewRemarks && (
                <p>Review remarks: {row.reviewRemarks}</p>
              )}
              {row.reportedAt && (
                <p>
                  Reported: {String(row.reportedAt).replace("T", " ").slice(0, 16)}
                </p>
              )}
            </>
          ) : (
            <>
              {/* Existing medicine and return responses */}
              <p className="font-semibold text-slate-800 dark:text-white">
                {row.medicine ||
                  (row.purchaseOrderId != null
                    ? `Purchase Order #${row.purchaseOrderId}`
                    : row.returnId != null
                      ? `Return #${row.returnId}`
                      : row.inventoryId != null
                        ? `Inventory #${row.inventoryId}`
                        : "Inventory record")}
              </p>

              {row.batch && <span>· {row.batch}</span>}
              {row.quantity != null && <span> · qty {row.quantity}</span>}
              {row.expiryDate && (
                <span> · exp {String(row.expiryDate).slice(0, 10)}</span>
              )}
              {row.action && <span> · {row.action}</span>}
              {row.status && <p>Status: {row.status}</p>}
              {row.orderDate && <p>Order date: {row.orderDate}</p>}
              {row.totalAmount != null && (
                <p>Amount: ₹{row.totalAmount}</p>
              )}
              {row.reason && <p>Reason: {row.reason}</p>}
              {row.remarks && <p>Remarks: {row.remarks}</p>}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}



export default function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [messages, setMessages] = useState([
    { role: "assistant", text: GREETING, rows: [] },
  ]);

  const endRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    let active = true;

    apiFetch("/assistant/suggestions")
      .then((items) => {
        if (active && Array.isArray(items) && items.length > 0) {
          setSuggestions(items);
        }
      })
      .catch(() => { });

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, busy]);

  const ask = useCallback(
    async (question) => {
      const text = (question ?? input).trim();

      if (!text || busy) return;

      setInput("");
      setBusy(true);
      setMessages((prev) => [...prev, { role: "user", text, rows: [] }]);

      try {
        const reply = await apiFetch("/assistant/chat", {
          method: "POST",
          body: JSON.stringify({ message: text }),
        });

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: reply?.answer || "I could not find an answer.",
            rows: reply?.rows || [],
          },
        ]);
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text:
              error.message ||
              "The assistant is unavailable right now. Please try again.",
            rows: [],
            error: true,
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, input]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open MediStock assistant"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/25 transition hover:bg-blue-700"
      >
        {open ? <X size={18} /> : <Sparkles size={18} />}
        <span className="hidden sm:inline">
          {open ? "Close" : "Ask MediStock"}
        </span>
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[30rem] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <header className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-teal-50 px-4 py-3 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Bot size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                MediStock Assistant
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Local inventory answers · no external API
              </p>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-blue-600 px-3 py-2 text-sm text-white"
                    : `mr-auto max-w-[90%] rounded-2xl rounded-bl-sm px-3 py-2 text-sm ${message.error
                      ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    }`
                }
              >
                <p className="whitespace-pre-line leading-5">{message.text}</p>
                <AnswerRows rows={message.rows} />
              </div>
            ))}

            {busy && (
              <p className="mr-auto rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Checking inventory…
              </p>
            )}

            <div ref={endRef} />
          </div>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-3 py-2 dark:border-slate-800">
              {suggestions.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => ask(suggestion)}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask();
            }}
            className="flex items-center gap-2 border-t border-slate-100 px-3 py-2.5 dark:border-slate-800"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about stock, expiry, wastage…"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-50"
              aria-label="Send question"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
