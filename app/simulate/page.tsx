"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, FlaskConical, CheckCircle2, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { PageLoadingSkeleton } from "@/components/Skeleton";
import { PageShell } from "@/components/PageShell";
import { apiFetch } from "@/lib/apiClient";
import type { SimulationResult } from "@/types";

export default function SimulatePage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(120);
  const [deadline, setDeadline] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/"); }, [loading, user, router]);

  async function run() {
    if (!title || !deadline) return;
    setRunning(true);
    try {
      const { result } = await apiFetch<{ result: SimulationResult }>("/api/gemini/simulate", {
        method: "POST",
        body: JSON.stringify({
          newCommitmentTitle: title,
          newCommitmentMinutes: minutes,
          newCommitmentDeadline: new Date(deadline).toISOString(),
        }),
      });
      setResult(result);
    } catch (e) {
      showToast(`Simulation failed: ${(e as Error).message}`, { variant: "error" });
    } finally { setRunning(false); }
  }

  if (loading || !user) return <PageLoadingSkeleton />;

  const delta = result?.projectedLifeRiskDelta ?? 0;

  return (
    <PageShell
      title="Future Simulation Engine"
      subtitle="See how a new commitment ripples through your existing workload — before you say yes."
      badge={<span className="label-caps flex items-center gap-1.5 text-signal-glow"><FlaskConical size={11} /> What-if engine</span>}
    >
      <div className="card mb-6 space-y-4 p-5 sm:p-6">
        <div className="relative">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Volunteer to lead the hackathon demo"
            className="input-base pb-2 pt-5 peer"
          />
          <label className="pointer-events-none absolute left-4 top-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-faint transition-all
                            peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal
                            peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:uppercase peer-focus:tracking-[0.08em] peer-focus:text-signal-glow">
            New commitment
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="input-base pb-2 pt-5 peer"
            />
            <label className="pointer-events-none absolute left-4 top-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-faint transition-all
                              peer-focus:text-signal-glow">
              Est. minutes
            </label>
          </div>
          <div className="relative">
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input-base pb-2 pt-5 peer"
            />
            <label className="pointer-events-none absolute left-4 top-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-faint transition-all
                              peer-focus:text-signal-glow">
              Deadline
            </label>
          </div>
        </div>
        <button
          onClick={run}
          disabled={running || !title || !deadline}
          className="btn-primary w-full justify-center py-2.5"
        >
          {running ? <Loader2 size={15} className="animate-spin" /> : <FlaskConical size={15} />}
          {running ? "Simulating…" : "Run simulation"}
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
          {/* Verdict */}
          <div
            className="flex items-start gap-4 rounded-[18px] p-5"
            style={{
              background: result.feasibleToAdd ? "rgba(52,211,153,0.07)" : "rgba(255,59,92,0.08)",
              border: `1px solid ${result.feasibleToAdd ? "rgba(52,211,153,0.2)" : "rgba(255,59,92,0.25)"}`,
            }}
          >
            {result.feasibleToAdd
              ? <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-risk-low" />
              : <XCircle size={20} className="mt-0.5 shrink-0 text-risk-critical" />
            }
            <div>
              <p className={`font-semibold ${result.feasibleToAdd ? "text-risk-low" : "text-risk-critical"}`}>
                {result.feasibleToAdd ? "You can take this on." : "This would put you at risk."}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{result.verdict}</p>
              {result.alternativeSuggestion && (
                <p className="mt-2 text-xs text-ink-faint">Instead: {result.alternativeSuggestion}</p>
              )}
            </div>
          </div>

          {/* Delta */}
          <div className="card flex items-center justify-between p-5">
            <div>
              <p className="label-caps mb-1">Life Risk Score change</p>
              <p className="text-xs text-ink-muted">Projected impact on your overall schedule</p>
            </div>
            <div className="flex items-center gap-2">
              {delta > 0
                ? <TrendingUp size={18} className="text-risk-critical" />
                : <TrendingDown size={18} className="text-risk-low" />
              }
              <span
                className={`font-display text-2xl font-bold leading-none tabular-nums ${
                  delta > 0 ? "text-risk-critical" : "text-risk-low"
                }`}
              >
                {delta > 0 ? "+" : ""}{delta}
              </span>
            </div>
          </div>

          {/* Affected tasks */}
          {result.affectedTasks.length > 0 && (
            <div>
              <p className="section-title">Tasks that would be affected</p>
              <div className="space-y-2">
                {result.affectedTasks.map((t) => (
                  <div key={t.taskId} className="card flex items-center justify-between gap-3 p-3.5">
                    <p className="min-w-0 flex-1 truncate text-sm text-ink-muted">{t.taskTitle}</p>
                    <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
                      <span className="text-ink-faint">{t.riskBefore}</span>
                      <span className="text-ink-faint">→</span>
                      <span className="font-semibold text-risk-high">{t.riskAfter}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </PageShell>
  );
}
