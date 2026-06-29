"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ShieldAlert, Coffee, BrainCircuit, CheckCircle2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingSkeleton } from "@/components/Skeleton";
import { apiFetch } from "@/lib/apiClient";
import type { RecoveryPlan, RecoveryBlock } from "@/types";

const BLOCK_ICON: Record<RecoveryBlock["type"], React.ComponentType<{ size?: number; className?: string }>> = {
  deep_work: BrainCircuit,
  short_break: Coffee,
  buffer: Loader2,
  submission_checkpoint: CheckCircle2,
};

function formatOffset(minutesFromNow: number): string {
  const target = new Date(Date.now() + minutesFromNow * 60 * 1000);
  return target.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function EmergencyRecoveryContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");

  const [plan, setPlan] = useState<RecoveryPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  async function generate() {
    if (!taskId) return;
    setGenerating(true);
    setError(null);
    try {
      const { plan } = await apiFetch<{ plan: RecoveryPlan }>("/api/gemini/emergency-recovery", {
        method: "POST",
        body: JSON.stringify({ taskId }),
      });
      setPlan(plan);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  if (loading || !user) {
    return <PageLoadingSkeleton />;
  }

  if (!taskId) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-sm text-ink-muted">No task selected. Go to the dashboard and activate recovery from a critical task.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <a href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink-muted">
          <ArrowLeft size={12} /> Back to dashboard
        </a>

        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-risk-critical/10 ring-1 ring-risk-critical/30">
            <ShieldAlert size={18} className="text-risk-critical" />
          </span>
          <div>
            <h1 className="font-display text-xl font-medium text-ink">Emergency Recovery</h1>
            <p className="text-xs text-ink-muted">Built live by the Recovery Agent for this task</p>
          </div>
        </div>

        {!plan && !generating && (
          <button
            onClick={generate}
            className="w-full rounded-2xl bg-risk-critical/90 px-6 py-4 text-sm font-medium text-white shadow-glow transition hover:bg-risk-critical"
          >
            Build my survival plan
          </button>
        )}

        {generating && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="animate-spin text-risk-critical" />
            <p className="text-xs text-ink-muted">Calculating remaining work and building your timeline...</p>
          </div>
        )}

        {error && <p className="text-sm text-risk-high">{error}</p>}

        {plan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div
              className={`rounded-2xl border p-4 ${
                plan.feasible
                  ? "border-risk-low/30 bg-risk-low/5"
                  : "border-risk-critical/30 bg-risk-critical/5"
              }`}
            >
              <p className="text-sm font-medium text-ink">
                {plan.feasible ? "This is recoverable." : "This is at serious risk even with full focus."}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{plan.feasibilityReason}</p>
              {plan.fallbackAdvice && (
                <p className="mt-2 text-xs leading-relaxed text-ink-faint">
                  Fallback: {plan.fallbackAdvice}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-risk-critical/20 bg-base-800/60 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
                Accountability check
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink">{plan.accountabilityMessage}</p>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">Timeline</p>
              <div className="space-y-2">
                {plan.blocks.map((block) => {
                  const Icon = BLOCK_ICON[block.type];
                  return (
                    <div
                      key={block.id}
                      className="flex items-start gap-3 rounded-xl border border-white/5 bg-base-800/40 p-3"
                    >
                      <Icon size={16} className="mt-0.5 text-signal-glow" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-ink">{block.label}</p>
                          <p className="text-xs text-ink-faint">
                            {formatOffset(block.startMinutesFromNow)} · {block.durationMinutes}m
                          </p>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{block.instructions}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">
                Remove these distractions right now
              </p>
              <ul className="space-y-1.5">
                {plan.distractionsToRemove.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-ink-muted">
                    <span className="mt-1 h-1 w-1 rounded-full bg-signal-glow" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}

export default function EmergencyRecoveryPage() {
  return (
    <Suspense
      fallback={<PageLoadingSkeleton />}
    >
      <EmergencyRecoveryContent />
    </Suspense>
  );
}
