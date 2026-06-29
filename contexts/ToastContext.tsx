"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

type ToastVariant = "success" | "info" | "error";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  durationMs: number;
}

interface ToastOptions {
  variant?: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANT_ICON: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  error: AlertTriangle,
};

const VARIANT_COLOR: Record<ToastVariant, string> = {
  success: "text-risk-low",
  info: "text-signal-glow",
  error: "text-risk-high",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = Math.random().toString(36).slice(2);
      const durationMs = options.durationMs ?? 5000;
      const toast: ToastItem = {
        id,
        message,
        variant: options.variant ?? "info",
        actionLabel: options.actionLabel,
        onAction: options.onAction,
        durationMs,
      };
      setToasts((prev) => [...prev, toast]);
      const timer = setTimeout(() => dismiss(id), durationMs);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="fixed bottom-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = VARIANT_ICON[toast.variant];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-base-800 px-4 py-3 shadow-lg"
              >
                <Icon size={16} className={VARIANT_COLOR[toast.variant]} />
                <p className="flex-1 text-sm text-ink">{toast.message}</p>
                {toast.actionLabel && toast.onAction && (
                  <button
                    onClick={() => {
                      toast.onAction?.();
                      dismiss(toast.id);
                    }}
                    className="text-xs font-medium text-signal-glow hover:underline"
                  >
                    {toast.actionLabel}
                  </button>
                )}
                <button
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="text-ink-faint hover:text-ink-muted"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
