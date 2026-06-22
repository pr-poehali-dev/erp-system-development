import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/icon';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const config: Record<ToastType, { icon: string; border: string; iconBg: string; bar: string }> = {
  success: {
    icon: 'CheckCircle',
    border: 'border-[hsl(142,55%,40%)] bg-[hsl(222,28%,11%)]',
    iconBg: 'text-[hsl(142,55%,58%)] bg-[hsl(142,55%,48%)]/10',
    bar: 'bg-[hsl(142,55%,48%)]',
  },
  error: {
    icon: 'XCircle',
    border: 'border-[hsl(4,80%,50%)] bg-[hsl(222,28%,11%)]',
    iconBg: 'text-[hsl(4,80%,68%)] bg-[hsl(4,80%,60%)]/10',
    bar: 'bg-[hsl(4,80%,60%)]',
  },
  warning: {
    icon: 'AlertTriangle',
    border: 'border-[hsl(38,90%,45%)] bg-[hsl(222,28%,11%)]',
    iconBg: 'text-[hsl(38,90%,65%)] bg-[hsl(38,90%,56%)]/10',
    bar: 'bg-[hsl(38,90%,56%)]',
  },
  info: {
    icon: 'Info',
    border: 'border-[hsl(40,45%,40%)] bg-[hsl(222,28%,11%)]',
    iconBg: 'text-[hsl(40,60%,68%)] bg-[hsl(40,60%,55%)]/10',
    bar: 'bg-gradient-to-r from-[hsl(44,65%,70%)] to-[hsl(36,48%,50%)]',
  },
};

const ToastEl = ({ t, onRemove }: { t: ToastItem; onRemove: (id: string) => void }) => {
  const c = config[t.type];
  const dur = t.duration || 3500;
  return (
    <div
      className={`relative flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-2xl shadow-[hsl(222,40%,4%)]/60 overflow-hidden pointer-events-auto ${c.border} ${t.exiting ? 'animate-toast-out' : 'animate-toast-in'}`}
      style={{ backdropFilter: 'blur(20px)' }}
    >
      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${c.bar} opacity-70`}
        style={{
          width: '100%',
          animation: `progress-shrink ${dur}ms linear forwards`,
          transformOrigin: 'left',
        }}
      />
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${c.iconBg}`}>
        <Icon name={c.icon} size={16} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="text-[13px] font-semibold text-[hsl(210,20%,92%)] leading-tight">{t.title}</div>
        {t.message && <div className="text-[11px] text-[hsl(215,14%,55%)] mt-1 leading-snug">{t.message}</div>}
      </div>
      <button
        onClick={() => onRemove(t.id)}
        className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-[hsl(220,20%,20%)] transition-colors shrink-0 mt-0.5"
      >
        <Icon name="X" size={13} className="text-[hsl(215,14%,55%)]" />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 380);
  }, []);

  const addToast = useCallback((opts: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const duration = opts.duration || 3500;
    setToasts((prev) => [...prev.slice(-4), { ...opts, id }]);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const ctx: ToastContextValue = {
    toast: addToast,
    success: (title, message) => addToast({ type: 'success', title, message }),
    error: (title, message) => addToast({ type: 'error', title, message }),
    warning: (title, message) => addToast({ type: 'warning', title, message }),
    info: (title, message) => addToast({ type: 'info', title, message }),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {createPortal(
        <div className="toast-container">
          {toasts.map((t) => <ToastEl key={t.id} t={t} onRemove={removeToast} />)}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
