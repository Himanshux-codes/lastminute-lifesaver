import type { CSSProperties } from "react";

export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={style}
      className={`relative overflow-hidden rounded-xl bg-base-800/50 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shimmer" />
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-[18px]" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 rounded-[18px]" />
          <Skeleton className="h-40 rounded-[18px]" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-[18px]" />
        ))}
      </div>
    </main>
  );
}

export function TaskListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-[18px] border border-white/[0.05] bg-base-800/40 p-4 sm:p-5"
        >
          <Skeleton className="mt-0.5 h-7 w-7 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-4" style={{ width: `${55 + (i % 3) * 15}%` }} />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="card p-5" aria-hidden="true">
      <Skeleton className="mb-4 h-3 w-28" />
      <Skeleton style={{ height }} className="w-full" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-4" aria-hidden="true">
      <Skeleton className="mb-3 h-2.5 w-16" />
      <Skeleton className="h-8 w-20" />
    </div>
  );
}
