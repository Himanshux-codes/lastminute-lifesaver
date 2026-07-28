import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-[18px] border border-dashed border-white/[0.08] bg-base-900/30 px-8 py-16 text-center">
      <div className="mb-6">
        {icon ?? <RadarIllustration />}
      </div>
      <p className="font-display text-base font-semibold tracking-tight text-ink">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

function RadarIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      {/* Rings */}
      <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
      <circle cx="40" cy="40" r="22" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
      <circle cx="40" cy="40" r="10" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" />
      {/* Crosshairs */}
      <line x1="40" y1="6" x2="40" y2="74" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
      <line x1="6" y1="40" x2="74" y2="40" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
      {/* Sweep */}
      <circle
        cx="40" cy="40" r="34"
        stroke="#6E63FF"
        strokeWidth="1.5"
        strokeDasharray="6 12"
        opacity="0.5"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 40 40"
          to="360 40 40"
          dur="5s"
          repeatCount="indefinite"
        />
      </circle>
      {/* Center dot */}
      <circle cx="40" cy="40" r="3" fill="#6E63FF" opacity="0.9" />
      {/* Glow */}
      <circle cx="40" cy="40" r="3" fill="#9B93FF" opacity="0.5">
        <animate attributeName="r" values="3;6;3" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
