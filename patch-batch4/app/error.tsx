"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div role="alert" className="flex max-w-sm flex-col items-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-risk-critical/10 ring-1 ring-risk-critical/30">
          <AlertTriangle size={20} className="text-risk-critical" />
        </span>
        <p className="font-display text-lg font-medium text-ink">Something broke</p>
        <p className="text-sm text-ink-muted">
          This page hit an unexpected error. It&apos;s been logged — try again, or head back to the dashboard.
        </p>
        <div className="mt-2 flex gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-full bg-signal px-4 py-2 text-sm font-medium text-white shadow-glow"
          >
            <RotateCcw size={14} /> Try again
          </button>
          <a href="/dashboard" className="rounded-full border border-white/10 px-4 py-2 text-sm text-ink-muted">
            Go to dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
