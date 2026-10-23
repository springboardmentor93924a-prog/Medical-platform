import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
        setToasts(prev => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
                {toasts.map(toast => {
                    const icons = {
                        success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
                        warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
                        error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
                        info: <Info className="w-5 h-5 text-teal-500 shrink-0" />
                    };
                    const borders = {
                        success: 'border-emerald-200 bg-white text-emerald-900 shadow-lg',
                        warning: 'border-amber-200 bg-white text-amber-900 shadow-lg',
                        error: 'border-rose-200 bg-white text-rose-900 shadow-lg',
                        info: 'border-teal-200 bg-white text-teal-900 shadow-lg'
                    };

                    return (
                        <div
                            key={toast.id}
                            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 transform translate-y-0 ${borders[toast.type] || borders.info}`}
                        >
                            {icons[toast.type] || icons.info}
                            <div className="flex-1 text-sm font-medium leading-snug">
                                {toast.message}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
