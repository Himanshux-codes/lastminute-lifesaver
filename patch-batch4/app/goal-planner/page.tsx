"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Wand2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingSkeleton } from "@/components/Skeleton";
import { apiFetch } from "@/lib/apiClient";
import type { GoalPlan } from "@/types";

export default function GoalPlannerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [goalTitle, setGoalTitle] = useState("");
  const [finalDeadline, setFinalDeadline] = useState("");
  const [context, setContext] = useState("");
  const [plan, setPlan] = useState<GoalPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  async function generatePlan() {
    if (!goalTitle || !finalDeadline) return;
    setGenerating(true);
    setError(null);
    setSaved(false);
    try {
      const { plan } = await apiFetch<{ plan: GoalPlan }>("/api/gemini/planner", {
        method: "POST",
        body: JSON.stringify({
          goalTitle,
          finalDeadline: new Date(finalDeadline).toISOString(),
          context: context || undefined,
          persistAsTasks: false,
        }),
      });
      setPlan(plan);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function saveAsTasks() {
    if (!goalTitle || !finalDeadline) return;
    setGenerating(true);
    try {
      await apiFetch("/api/gemini/planner", {
        method: "POST",
        body: JSON.stringify({
          goalTitle,
          finalDeadline: new Date(finalDeadline).toISOString(),
          context: context || undefined,
          persistAsTasks: true,
        }),
      });
      setSaved(true);
    } finally {
      setGenerating(false);
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

        <h1 className="font-display text-2xl font-medium text-ink">Goal Command Center</h1>
        <p className="mt-1 mb-8 text-sm text-ink-muted">
          Hand the Planner Agent one big goal — it comes back with a realistic, spaced-out subtask schedule.
        </p>

        <div className="space-y-3 rounded-2xl border border-white/5 bg-base-800/60 p-5">
          <input
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="e.g. Ship the Pulse hackathon submission"
            className="w-full rounded-lg bg-base-700/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint"
          />
          <input
            type="datetime-local"
            value={finalDeadline}
            onChange={(e) => setFinalDeadline(e.target.value)}
            className="w-full rounded-lg bg-base-700/60 px-3 py-2 text-sm text-ink outline-none"
          />
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Optional context: constraints, what's already done, anything that changes the plan"
            rows={2}
            className="w-full rounded-lg bg-base-700/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint"
          />
          <button
            onClick={generatePlan}
            disabled={generating || !goalTitle || !finalDeadline}
            className="flex items-center gap-2 rounded-full bg-signal px-5 py-2.5 text-sm font-medium text-white shadow-glow disabled:opacity-50"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            Generate plan
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-risk-high">{error}</p>}

        {plan && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <p className="mb-3 text-xs leading-relaxed text-ink-muted">{plan.planningNotes}</p>
            <div className="space-y-2">
              {plan.subtasks.map((s) => (
                <div key={s.order} className="flex items-center justify-between rounded-xl border border-white/5 bg-base-800/40 p-3">
                  <div>
                    <p className="text-sm text-ink">
                      {s.order}. {s.title}
                    </p>
                    <p className="text-xs text-ink-faint">
                      Due {new Date(s.suggestedDeadline).toLocaleDateString()} · {s.estimatedMinutes}m
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={saveAsTasks}
              disabled={generating || saved}
              className="mt-4 flex items-center gap-2 rounded-full border border-signal/40 px-5 py-2.5 text-sm font-medium text-signal-glow disabled:opacity-50"
            >
              {saved ? <CheckCircle2 size={14} /> : <Wand2 size={14} />}
              {saved ? "Added to dashboard" : "Save as tasks"}
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
