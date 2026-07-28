"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Wand2, CheckCircle2, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { PageLoadingSkeleton } from "@/components/Skeleton";
import { PageShell } from "@/components/PageShell";
import { apiFetch } from "@/lib/apiClient";
import type { GoalPlan } from "@/types";

export default function GoalPlannerPage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [goalTitle, setGoalTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [context, setContext] = useState("");
  const [plan, setPlan] = useState<GoalPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/"); }, [loading, user, router]);

  async function generatePlan() {
    if (!goalTitle || !deadline) return;
    setGenerating(true); setSaved(false);
    try {
      const { plan } = await apiFetch<{ plan: GoalPlan }>("/api/gemini/planner", {
        method: "POST",
        body: JSON.stringify({
          goalTitle,
          finalDeadline: new Date(deadline).toISOString(),
          context: context || undefined,
          persistAsTasks: false,
        }),
      });
      setPlan(plan);
    } catch (e) {
      showToast(`Couldn't generate plan: ${(e as Error).message}`, { variant: "error" });
    } finally { setGenerating(false); }
  }

  async function saveAsTasks() {
    if (!goalTitle || !deadline) return;
    setGenerating(true);
    try {
      await apiFetch("/api/gemini/planner", {
        method: "POST",
        body: JSON.stringify({
          goalTitle,
          finalDeadline: new Date(deadline).toISOString(),
          context: context || undefined,
          persistAsTasks: true,
        }),
      });
      setSaved(true);
      showToast("Subtasks added to your dashboard.", { variant: "success" });
    } catch (e) {
      showToast(`Couldn't save tasks: ${(e as Error).message}`, { variant: "error" });
    } finally { setGenerating(false); }
  }

  if (loading || !user) return <PageLoadingSkeleton />;

  return (
    <PageShell
      title="Goal Command Center"
      subtitle="Give the Planner Agent one big goal and get a realistic, spaced-out subtask schedule back."
      badge={<span className="label-caps flex items-center gap-1.5 text-signal-glow"><Target size={11} /> AI planner</span>}
    >
      <div className="card mb-6 space-y-4 p-5 sm:p-6">
        <div className="relative">
          <input
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="e.g. Ship the hackathon submission"
            className="input-base pb-2 pt-5 peer"
          />
          <label className="pointer-events-none absolute left-4 top-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-faint
                            peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal
                            peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:uppercase peer-focus:tracking-[0.08em] peer-focus:text-signal-glow transition-all">
            Goal title
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative">
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input-base pb-2 pt-5 peer"
            />
            <label className="pointer-events-none absolute left-4 top-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-faint transition-all
                              peer-focus:text-signal-glow">
              Final deadline
            </label>
          </div>
          <div className="relative">
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Optional context or constraints…"
              rows={1}
              className="input-base resize-none pb-2 pt-5 peer"
            />
            <label className="pointer-events-none absolute left-4 top-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-faint transition-all
                              peer-focus:text-signal-glow peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal">
              Context
            </label>
          </div>
        </div>
        <button
          onClick={generatePlan}
          disabled={generating || !goalTitle || !deadline}
          className="btn-primary w-full justify-center py-2.5"
        >
          {generating ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
          {generating ? "Generating…" : "Generate plan"}
        </button>
      </div>

      {plan && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="card mb-4 border-signal/15 bg-signal/[0.04] p-4">
            <p className="label-caps text-signal-glow mb-1.5">Planning notes</p>
            <p className="text-sm leading-relaxed text-ink-muted">{plan.planningNotes}</p>
          </div>

          <div className="mb-5 space-y-2">
            {plan.subtasks.map((s) => (
              <div
                key={s.order}
                className="card flex items-center justify-between gap-4 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal/15 text-xs font-bold text-signal-glow">
                    {s.order}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{s.title}</p>
                    <p className="text-xs text-ink-faint">
                      {new Date(s.suggestedDeadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      {" · "}{s.estimatedMinutes}m
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={saveAsTasks}
            disabled={generating || saved}
            className={saved ? "btn-secondary w-full justify-center" : "btn-primary w-full justify-center py-2.5"}
          >
            {saved ? <CheckCircle2 size={15} /> : <Wand2 size={15} />}
            {saved ? "Added to dashboard" : "Save all as tasks"}
          </button>
        </motion.div>
      )}
    </PageShell>
  );
}
