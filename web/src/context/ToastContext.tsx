import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ToastVariant = 'default' | 'success' | 'error';

type ToastPayload = { message: string; variant: ToastVariant };

type ToastContextValue = {
  /** Phase 4.1 / 4.2 — auto-dismiss toast; use variant `success` or `error` for emphasis */
  show: (message: string, options?: { variant?: ToastVariant }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  const show = useCallback((msg: string, options?: { variant?: ToastVariant }) => {
    setToast({ message: msg, variant: options?.variant ?? 'default' });
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastContainer toast={toast} onDismiss={() => setToast(null)} duration={TOAST_DURATION_MS} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toast,
  onDismiss,
  duration,
}: {
  toast: ToastPayload | null;
  onDismiss: () => void;
  duration: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 200);
    }, duration);
    return () => clearTimeout(t);
  }, [toast, duration, onDismiss]);

  if (!toast) return null;

  const variantClass =
    toast.variant === 'success' ? 'app-toast--success' : toast.variant === 'error' ? 'app-toast--error' : '';

  return (
    <div
      className={`app-toast ${variantClass} ${visible ? 'app-toast-visible' : ''}`}
      role="status"
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
    >
      {toast.message}
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) return { show: () => {} };
  return ctx;
}
