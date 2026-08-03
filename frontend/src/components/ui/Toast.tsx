import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

let toastListener: ((toast: ToastMessage) => void) | null = null;

export const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
  if (toastListener) {
    toastListener({
      id: Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
    });
  }
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListener = (newToast: ToastMessage) => {
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    return () => {
      toastListener = null;
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl animate-in slide-in-from-bottom-5 duration-200 text-xs font-medium',
            t.type === 'success' && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-card',
            t.type === 'error' && 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 bg-card',
            t.type === 'warning' && 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-card',
            t.type === 'info' && 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-card'
          )}
        >
          {t.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />}
          {t.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />}
          {t.type === 'warning' && <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />}
          {t.type === 'info' && <Info className="w-5 h-5 shrink-0 text-blue-500 mt-0.5" />}

          <div className="flex-1">
            <h4 className="font-bold text-foreground">{t.title}</h4>
            {t.message && <p className="text-muted-foreground mt-0.5">{t.message}</p>}
          </div>

          <button onClick={() => removeToast(t.id)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
