import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const ToastContainer = () => {
  const { toasts, removeToast } = useNotification();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-emerald-500 shrink-0" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50/90 text-emerald-900';
      case 'warning':
        return 'border-amber-200 bg-amber-50/90 text-amber-900';
      case 'error':
        return 'border-rose-200 bg-rose-50/90 text-rose-900';
      default:
        return 'border-sky-200 bg-sky-50/90 text-sky-900';
    }
  };

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none p-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl border shadow-lg backdrop-blur-md ${getBorderColor(
              toast.type
            )}`}
          >
            <div className="flex items-center gap-3">
              {getIcon(toast.type)}
              <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast && removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-black/5 transition-colors ml-3 shrink-0"
            >
              <X className="w-4 h-4 opacity-60 hover:opacity-100" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const Toast = ToastContainer;
export default ToastContainer;
