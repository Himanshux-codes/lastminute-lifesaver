import { AlertCircle, RotateCcw } from "lucide-react";

export function ErrorRetry({
  message = "Something went wrong loading this page.",
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-risk-high/20 bg-risk-high/5 px-6 py-12 text-center"
    >
      <AlertCircle size={20} className="text-risk-high" />
      <p className="text-sm text-ink-muted">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-full border border-risk-high/30 px-4 py-2 text-xs font-medium text-risk-high transition hover:bg-risk-high/10"
      >
        <RotateCcw size={12} /> Try again
      </button>
    </div>
  );
}
