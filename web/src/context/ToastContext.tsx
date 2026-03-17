import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type ToastContextValue = {
  show: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback((msg: string) => {
    setMessage(msg);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <ToastContainer message={message} onDismiss={() => setMessage(null)} duration={TOAST_DURATION_MS} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  message,
  onDismiss,
  duration,
}: {
  message: string | null;
  onDismiss: () => void;
  duration: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 200);
    }, duration);
    return () => clearTimeout(t);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`app-toast ${visible ? 'app-toast-visible' : ''}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) return { show: () => {} };
  return ctx;
}
