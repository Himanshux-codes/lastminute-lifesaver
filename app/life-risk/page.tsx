"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingSkeleton } from "@/components/Skeleton";
import { apiFetch } from "@/lib/apiClient";
import type { LifeRiskScore, RiskLevel } from "@/types";

const LEVEL_COLOR: Record<RiskLevel, string> = {
  low: "#3DD9A4",
  medium: "#F2B84B",
  high: "#F2654B",
  critical: "#FF3B5C",
};

export default function LifeRiskPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [score, setScore] = useState<LifeRiskScore | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ score: LifeRiskScore }>("/api/gemini/life-risk")
      .then((data) => setScore(data.score))
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || !user) {
    return <PageLoadingSkeleton />;
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <a href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink-muted">
          <ArrowLeft size={12} /> Back to dashboard
        </a>

        <h1 className="font-display text-2xl font-medium text-ink">Life Risk Score</h1>
        <p className="mt-1 mb-8 text-sm text-ink-muted">
          One number for how close your whole schedule is to falling apart — not any single task.
        </p>

        {fetching || !score ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-ink-faint" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col items-center rounded-2xl border border-white/5 bg-base-800/60 p-8">
              <Gauge score={score.overallScore} color={LEVEL_COLOR[score.level]} />
              <p className="mt-4 text-xs uppercase tracking-wider" style={{ color: LEVEL_COLOR[score.level] }}>
                {score.level}
              </p>
              <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-ink-muted">{score.summary}</p>
            </div>

            <div className="mt-6 rounded-2xl border border-signal/20 bg-signal/5 p-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-signal-glow">
                <Activity size={12} /> Fastest way to bring this down
              </p>
              <p className="mt-2 text-sm text-ink">{score.recommendation}</p>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">Top contributors</p>
              <div className="space-y-2">
                {score.topContributors.map((c, i) => (
                  <div key={i} className="rounded-xl border border-white/5 bg-base-800/40 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-muted">{c.label}</span>
                      <span className="text-ink-faint">{c.impact}</span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-base-700">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${c.impact}%`, backgroundColor: LEVEL_COLOR[score.level] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}

function Gauge({ score, color }: { score: number; color: string }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={170} height={170} viewBox="0 0 170 170">
      <circle cx={85} cy={85} r={radius} fill="none" stroke="#1A2238" strokeWidth={12} />
      <circle
        cx={85}
        cy={85}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 85 85)"
      />
      <text x={85} y={92} textAnchor="middle" fontSize={36} fontWeight={600} fill="#E7E9F5">
        {score}
      </text>
    </svg>
  );
}
