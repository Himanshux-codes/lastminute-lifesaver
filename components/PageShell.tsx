import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageShell({
  title,
  subtitle,
  back = "/dashboard",
  badge,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen px-4 pb-20 pt-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <a
          href={back}
          className="mb-7 inline-flex items-center gap-1.5 text-xs font-medium text-ink-faint
                     transition hover:text-ink"
        >
          <ArrowLeft size={13} />
          Back to dashboard
        </a>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
          <div>
            {badge && <div className="mb-2">{badge}</div>}
            <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-ink sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>

        {children}
      </div>
    </main>
  );
}
