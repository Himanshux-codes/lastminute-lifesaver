"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2, ShieldAlert, Coffee, BrainCircuit,
  CheckCircle2, AlertTriangle, Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/apiClient";
import { PageLoadingSkeleton } from "@/components/Skeleton";
import { PageShell } from "@/components/PageShell";
import type { RecoveryPlan, RecoveryBlock } from "@/types";

const BLOCK_ICON: Record<RecoveryBlock["type"], React.ComponentType<{ size?: number; className?: string }>> = {
  deep_work: BrainCircuit,
  short_break: Coffee,
  buffer: Clock,
  submission_checkpoint: CheckCircle2,
};

const BLOCK_STYLE: Record<RecoveryBlock["type"], { bg: string; border: string; color: string }> = {
  deep_work:             { bg: "rgba(110,99,255,0.08)", border: "rgba(110,99,255,0.2)", color: "#9B93FF" },
  short_break:           { bg: "rgba(52,211,153,0.07)", border: "rgba(52,211,153,0.2)", color: "#34D399" },
  buffer:                { bg: "rgba(132,140,172,0.07)", border: "rgba(132,140,172,0.15)", color: "#8893B0" },
  submission_checkpoint: { bg: "rgba(255,59,92,0.08)", border: "rgba(255,59,92,0.25)", color: "#FF3B5C" },
};

function fmt(minutesFromNow: number) {
  const t = new Date(Date.now() + minutesFromNow * 60000);
  return t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function RecoveryContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");
  const [plan, setPlan] = useState<RecoveryPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) router.replace("/"); }, [loading, user, router]);

  async function generate() {
    if (!taskId) return;
    setGenerating(true); setError(null);
    try {
      const { plan } = await apiFetch<{ plan: RecoveryPlan }>("/api/gemini/emergency-recovery", {
        method: "POST", body: JSON.stringify({ taskId }),
      });
      setPlan(plan);
    } catch (e) { setError((e as Error).message); }
    finally { setGenerating(false); }
  }

  if (loading || !user) return <PageLoadingSkeleton />;

  if (!taskId) {
    return (
      <PageShell title="Emergency Recovery" subtitle="Select a critical task from the dashboard to activate recovery.">
        <p className="text-sm text-ink-muted">No task selected.</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Emergency Recovery"
      subtitle="The Recovery Agent builds a minute-by-minute survival plan."
      badge={
        <span className="label-caps flex items-center gap-1.5 text-risk-critical">
          <ShieldAlert size={11} /> Crisis mode
        </span>
      }
    >
      {!plan && !generating && (
        <button
          onClick={generate}
          className="w-full rounded-[18px] py-5 text-sm font-semibold text-white transition"
          style={{
            background: "linear-gradient(145deg,#FF3B5C,#F87171 80%)",
            boxShadow: "0 0 0 1px rgba(255,59,92,0.4), 0 4px 24px -4px rgba(255,59,92,0.5)",
          }}
        >
          Build my survival plan
        </button>
      )}

      {generating && (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 size={24} className="animate-spin text-risk-critical" />
          <p className="text-sm text-ink-muted">Calculating remaining work and building your timeline…</p>
        </div>
      )}

      {error && (
        <div className="card border-risk-critical/20 bg-risk-critical/5 p-4">
          <p className="text-sm text-risk-critical">{error}</p>
        </div>
      )}

      {plan && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Feasibility */}
          <div
            className="rounded-[18px] p-5"
            style={{
              background: plan.feasible ? "rgba(52,211,153,0.07)" : "rgba(255,59,92,0.08)",
              border: `1px solid ${plan.feasible ? "rgba(52,211,153,0.2)" : "rgba(255,59,92,0.25)"}`,
            }}
          >
            <p className={`text-sm font-semibold ${plan.feasible ? "text-risk-low" : "text-risk-critical"}`}>
              {plan.feasible ? "This is recoverable." : "Extremely tight — even with full focus."}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{plan.feasibilityReason}</p>
            {plan.fallbackAdvice && (
              <p className="mt-2 text-xs text-ink-faint">Fallback: {plan.fallbackAdvice}</p>
            )}
          </div>

          {/* Accountability */}
          <div className="card p-5">
            <p className="label-caps mb-2.5 text-risk-critical">Your accountability check</p>
            <p className="text-sm leading-relaxed text-ink">{plan.accountabilityMessage}</p>
          </div>

          {/* Timeline */}
          <div>
            <p className="section-title">Focus timeline</p>
            <div className="space-y-2">
              {plan.blocks.map((block) => {
                const Icon = BLOCK_ICON[block.type];
                const s = BLOCK_STYLE[block.type];
                return (
                  <div
                    key={block.id}
                    className="rounded-[14px] p-4"
                    style={{ background: s.bg, border: `1px solid ${s.border}` }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0" style={{ color: s.color }}>
                        <Icon size={15} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-ink">{block.label}</p>
                          <p className="shrink-0 text-[11px] text-ink-faint">
                            {fmt(block.startMinutesFromNow)} · {block.durationMinutes}m
                          </p>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{block.instructions}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Distractions */}
          <div>
            <p className="section-title flex items-center gap-1.5">
              <AlertTriangle size={10} className="text-risk-critical" /> Remove these right now
            </p>
            <ul className="space-y-2">
              {plan.distractionsToRemove.map((d, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-ink-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-risk-critical" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </PageShell>
  );
}

export default function EmergencyRecoveryPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <RecoveryContent />
    </Suspense>
  );
}
