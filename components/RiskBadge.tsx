import type { RiskLevel } from "@/types";
import { clsx } from "clsx";

const RISK_STYLES: Record<RiskLevel, { dot: string; text: string; ring: string; label: string }> = {
  low: { dot: "bg-risk-low", text: "text-risk-low", ring: "ring-risk-low/30", label: "On track" },
  medium: { dot: "bg-risk-medium", text: "text-risk-medium", ring: "ring-risk-medium/30", label: "Watch" },
  high: { dot: "bg-risk-high", text: "text-risk-high", ring: "ring-risk-high/30", label: "At risk" },
  critical: { dot: "bg-risk-critical", text: "text-risk-critical", ring: "ring-risk-critical/40", label: "Critical" },
};

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const style = RISK_STYLES[level];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
        style.ring
      )}
    >
      <span className={clsx("relative h-1.5 w-1.5 rounded-full", style.dot)}>
        {level === "critical" && (
          <span className={clsx("absolute inset-0 rounded-full animate-pulseRing", style.dot)} />
        )}
      </span>
      <span className={style.text}>
        {style.label}
        {typeof score === "number" ? ` · ${score}` : ""}
      </span>
    </span>
  );
}
