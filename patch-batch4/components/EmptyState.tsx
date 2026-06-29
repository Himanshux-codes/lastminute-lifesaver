import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
      <RadarIllustration />
      <p className="mt-6 font-display text-sm font-medium text-ink">{title}</p>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-ink-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function RadarIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="46" stroke="#1A2238" strokeWidth="2" />
      <circle cx="60" cy="60" r="30" stroke="#1A2238" strokeWidth="2" />
      <circle cx="60" cy="60" r="14" stroke="#1A2238" strokeWidth="2" />
      <line x1="60" y1="14" x2="60" y2="106" stroke="#1A2238" strokeWidth="2" />
      <line x1="14" y1="60" x2="106" y2="60" stroke="#1A2238" strokeWidth="2" />
      <circle cx="60" cy="60" r="4" fill="#6E63FF" />
      <circle cx="60" cy="60" r="46" stroke="#6E63FF" strokeWidth="2" strokeDasharray="4 10" opacity="0.5">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 60 60"
          to="360 60 60"
          dur="6s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
