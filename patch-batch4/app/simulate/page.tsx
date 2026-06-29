"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, FlaskConical, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingSkeleton } from "@/components/Skeleton";
import { apiFetch } from "@/lib/apiClient";
import type { SimulationResult } from "@/types";

export default function SimulatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(120);
  const [deadline, setDeadline] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  async function runSimulation() {
    if (!title || !deadline) return;
    setRunning(true);
    setError(null);
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
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  if (loading || !user) {
    return <PageLoadingSkeleton />;
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <a href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink-muted">
          <ArrowLeft size={12} /> Back to dashboard
        </a>

        <h1 className="font-display text-2xl font-medium text-ink">Future Simulation Engine</h1>
        <p className="mt-1 mb-8 text-sm text-ink-muted">
          See how a new commitment would ripple through your existing workload before you say yes.
        </p>

        <div className="space-y-3 rounded-2xl border border-white/5 bg-base-800/60 p-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Volunteer to lead the hackathon demo"
            className="w-full rounded-lg bg-base-700/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              placeholder="Estimated minutes"
              className="w-full rounded-lg bg-base-700/60 px-3 py-2 text-sm text-ink outline-none"
            />
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-lg bg-base-700/60 px-3 py-2 text-sm text-ink outline-none"
            />
          </div>
          <button
            onClick={runSimulation}
            disabled={running || !title || !deadline}
            className="flex items-center gap-2 rounded-full bg-signal px-5 py-2.5 text-sm font-medium text-white shadow-glow disabled:opacity-50"
          >
            {running ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}
            Run simulation
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-risk-high">{error}</p>}

        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
            <div
              className={`flex items-start gap-3 rounded-2xl border p-4 ${
                result.feasibleToAdd ? "border-risk-low/30 bg-risk-low/5" : "border-risk-critical/30 bg-risk-critical/5"
              }`}
            >
              {result.feasibleToAdd ? (
                <CheckCircle2 size={18} className="mt-0.5 text-risk-low" />
              ) : (
                <XCircle size={18} className="mt-0.5 text-risk-critical" />
              )}
              <div>
                <p className="text-sm font-medium text-ink">
                  {result.feasibleToAdd ? "You can take this on." : "This would put you at risk."}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{result.verdict}</p>
                {result.alternativeSuggestion && (
                  <p className="mt-2 text-xs leading-relaxed text-ink-faint">
                    Instead: {result.alternativeSuggestion}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-base-800/40 p-4">
              <p className="text-xs text-ink-faint">Projected change to your Life Risk Score</p>
              <p
                className={`mt-1 font-display text-2xl font-medium ${
                  result.projectedLifeRiskDelta > 0 ? "text-risk-high" : "text-risk-low"
                }`}
              >
                {result.projectedLifeRiskDelta > 0 ? "+" : ""}
                {result.projectedLifeRiskDelta}
              </p>
            </div>

            {result.affectedTasks.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">
                  Tasks that would be affected
                </p>
                <div className="space-y-2">
                  {result.affectedTasks.map((t) => (
                    <div
                      key={t.taskId}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-base-800/40 p-3 text-xs"
                    >
                      <span className="text-ink-muted">{t.taskTitle}</span>
                      <span className="text-ink-faint">
                        {t.riskBefore} → <span className="text-risk-high">{t.riskAfter}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
