"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingSkeleton } from "@/components/Skeleton";
import { ErrorRetry } from "@/components/ErrorRetry";
import { PageShell } from "@/components/PageShell";
import { apiFetch } from "@/lib/apiClient";
import type { LifeRiskScore, RiskLevel } from "@/types";

const LEVEL: Record<RiskLevel, { color: string; label: string; bg: string }> = {
  low:      { color: "#34D399", label: "You're on track",   bg: "rgba(52,211,153,0.08)" },
  medium:   { color: "#FBBF24", label: "Needs attention",   bg: "rgba(251,191,36,0.08)" },
  high:     { color: "#F87171", label: "High pressure",     bg: "rgba(248,113,113,0.08)" },
  critical: { color: "#FF3B5C", label: "Critical load",     bg: "rgba(255,59,92,0.10)" },
};

export default function LifeRiskPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [score, setScore] = useState<LifeRiskScore | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) router.replace("/"); }, [loading, user, router]);

  const load = useCallback(async () => {
    setFetching(true); setError(null);
    try {
      const d = await apiFetch<{ score: LifeRiskScore }>("/api/gemini/life-risk");
      setScore(d.score);
    } catch (e) { setError((e as Error).message); }
    finally { setFetching(false); }
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  if (loading || !user) return <PageLoadingSkeleton />;

  return (
    <PageShell
      title="Life Risk Score"
      subtitle="One number for how close your entire schedule is to collapse — not any single task."
      badge={<span className="label-caps flex items-center gap-1.5 text-signal-glow"><Zap size={11} /> AI-computed</span>}
    >
      {fetching ? (
        <div className="flex justify-center py-16">
          <div className="h-32 w-32 animate-pulse rounded-full bg-base-800/60" />
        </div>
      ) : error ? (
        <ErrorRetry message={`Couldn't compute your Life Risk Score: ${error}`} onRetry={load} />
      ) : !score ? null : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {/* Gauge hero card */}
          <div className="card mb-6 flex flex-col items-center p-8 sm:p-10">
            <AnimatedGauge score={score.overallScore} level={score.level} />
            <p className="mt-5 font-display text-base font-semibold text-ink">{score.summary}</p>
          </div>

          {/* Recommendation */}
          <div
            className="mb-6 rounded-[18px] p-5"
            style={{
              background: LEVEL[score.level].bg,
              border: `1px solid ${LEVEL[score.level].color}28`,
            }}
          >
            <p className="label-caps mb-2.5 flex items-center gap-1.5" style={{ color: LEVEL[score.level].color }}>
              <Activity size={11} /> Fastest way to improve this
            </p>
            <p className="text-sm leading-relaxed text-ink">{score.recommendation}</p>
          </div>

          {/* Contributors */}
          <div>
            <p className="section-title">Top contributors</p>
            <div className="space-y-3">
              {score.topContributors.map((c, i) => (
                <div key={i} className="card p-4">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{c.label}</span>
                    <span className="label-caps">{c.impact}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-700">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: LEVEL[score.level].color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${c.impact}%` }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 * i }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </PageShell>
  );
}

function AnimatedGauge({ score, level }: { score: number; level: RiskLevel }) {
  const { color, label } = LEVEL[level];
  const R = 80;
  const C = 2 * Math.PI * R;

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow ring */}
      <div
        className="absolute rounded-full opacity-20 blur-2xl"
        style={{ width: 180, height: 180, background: color }}
      />
      <svg width={200} height={200} viewBox="0 0 200 200" role="img" aria-label={`Life risk: ${score}/100`}>
        <circle cx={100} cy={100} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={12} />
        <motion.circle
          cx={100} cy={100} r={R}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C - (score / 100) * C }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 12px ${color}70)` }}
        />
        <text x={100} y={95} textAnchor="middle" fontSize={40} fontWeight={700} fill="rgb(228,231,246)" fontFamily="var(--font-display)">
          {score}
        </text>
        <text x={100} y={116} textAnchor="middle" fontSize={12} fill={color} fontFamily="var(--font-body)" fontWeight={600}>
          {label}
        </text>
      </svg>
    </div>
  );
}
