"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingSkeleton } from "@/components/Skeleton";
import { ErrorRetry } from "@/components/ErrorRetry";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  const load = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const data = await apiFetch<{ score: LifeRiskScore }>("/api/gemini/life-risk");
      setScore(data.score);
    } catch (e) {
      // Previously unhandled — a failed fetch left `score` null forever with the page stuck
      // showing a spinner with no way out. Now it surfaces a real retry UI.
      setError((e as Error).message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (loading || !user) {
    return <PageLoadingSkeleton />;
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <a href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-xs text-ink-faint transition hover:text-ink-muted">
          <ArrowLeft size={12} /> Back to dashboard
        </a>

        <h1 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">Life Risk Score</h1>
        <p className="mt-1.5 mb-8 text-sm leading-relaxed text-ink-muted">
          One number for how close your whole schedule is to falling apart — not any single task.
        </p>

        {fetching ? (
          <PageLoadingSkeleton />
        ) : error ? (
          <ErrorRetry message={`Couldn't compute your Life Risk Score: ${error}`} onRetry={load} />
        ) : !score ? null : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="card flex flex-col items-center p-8 sm:p-10">
              <Gauge score={score.overallScore} color={LEVEL_COLOR[score.level]} />
              <p
                className="mt-5 text-xs font-semibold uppercase tracking-wider"
                style={{ color: LEVEL_COLOR[score.level] }}
              >
                {score.level} risk
              </p>
              <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-ink-muted">{score.summary}</p>
            </div>

            <div className="card mt-6 border-signal/20 bg-signal/5 p-4 sm:p-5">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-signal-glow">
                <Activity size={12} /> Fastest way to bring this down
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-ink">{score.recommendation}</p>
            </div>

            <div className="mt-8">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">Top contributors</p>
              <div className="space-y-2.5">
                {score.topContributors.map((c, i) => (
                  <div key={i} className="card p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-muted">{c.label}</span>
                      <span className="font-medium text-ink-faint">{c.impact}%</span>
                    </div>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-base-700">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${c.impact}%` }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 * i }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: LEVEL_COLOR[score.level] }}
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
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={180} height={180} viewBox="0 0 180 180" role="img" aria-label={`Life risk score: ${score} out of 100`}>
      <circle cx={90} cy={90} r={radius} fill="none" stroke="#1A2238" strokeWidth={13} />
      <motion.circle
        cx={90}
        cy={90}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={13}
        strokeLinecap="round"
        transform="rotate(-90 90 90)"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      <text x={90} y={98} textAnchor="middle" fontSize={40} fontWeight={600} fill="#E7E9F5" fontFamily="var(--font-display)">
        {score}
      </text>
    </svg>
  );
}
