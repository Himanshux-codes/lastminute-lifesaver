import type { CSSProperties } from "react";

export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={style}
      className={`relative overflow-hidden rounded-lg bg-base-800/60 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.6s_infinite]" />
    </div>
  );
}

/** Generic auth-gate loading replacement, used by every page while session/user resolves. */
export function PageLoadingSkeleton() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </main>
  );
}

export function TaskListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/5 bg-base-800/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-base-800/40 p-4" aria-hidden="true">
      <Skeleton className="mb-3 h-3 w-32" />
      <Skeleton style={{ height }} className="w-full" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-base-800/60 p-4" aria-hidden="true">
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="h-7 w-16" />
    </div>
  );
}
