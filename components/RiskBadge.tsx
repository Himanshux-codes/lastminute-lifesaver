import type { RiskLevel } from "@/types";

const RISK: Record<RiskLevel, { label: string; bg: string; text: string; dot: string; glow: string }> = {
  low:      { label: "On track",  bg: "rgba(52,211,153,0.1)",  text: "#34D399", dot: "#34D399", glow: "0 0 6px rgba(52,211,153,0.4)" },
  medium:   { label: "Watch",     bg: "rgba(251,191,36,0.1)",  text: "#FBBF24", dot: "#FBBF24", glow: "0 0 6px rgba(251,191,36,0.4)" },
  high:     { label: "At risk",   bg: "rgba(248,113,113,0.1)", text: "#F87171", dot: "#F87171", glow: "0 0 6px rgba(248,113,113,0.4)" },
  critical: { label: "Critical",  bg: "rgba(255,59,92,0.12)",  text: "#FF3B5C", dot: "#FF3B5C", glow: "0 0 8px rgba(255,59,92,0.5)" },
};

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const s = RISK[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.text}28`,
      }}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {level === "critical" && (
          <span
            className="absolute inset-0 animate-pulseRing rounded-full"
            style={{ background: s.dot, opacity: 0.6 }}
          />
        )}
        <span className="relative h-1.5 w-1.5 rounded-full" style={{ background: s.dot, boxShadow: s.glow }} />
      </span>
      {s.label}{typeof score === "number" ? ` · ${score}` : ""}
    </span>
  );
}
