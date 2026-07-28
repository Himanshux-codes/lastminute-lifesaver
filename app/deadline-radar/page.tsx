"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Radar, RefreshCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingSkeleton, TaskListSkeleton } from "@/components/Skeleton";
import { ErrorRetry } from "@/components/ErrorRetry";
import { EmptyState } from "@/components/EmptyState";
import { apiFetch } from "@/lib/apiClient";
import { TaskCard } from "@/components/TaskCard";
import { ProcrastinationAlerts } from "@/components/ProcrastinationAlerts";
import { PageShell } from "@/components/PageShell";
import type { Task } from "@/types";

const RISK_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;

export default function DeadlineRadarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) router.replace("/"); }, [loading, user, router]);

  const load = useCallback(async () => {
    setFetching(true); setError(null);
    try {
      const data = await apiFetch<{ tasks: Task[] }>("/api/tasks");
      setTasks(
        [...data.tasks].sort((a, b) => {
          const ra = a.riskLevel ? RISK_ORDER[a.riskLevel] : 4;
          const rb = b.riskLevel ? RISK_ORDER[b.riskLevel] : 4;
          return ra - rb;
        })
      );
    } catch (e) { setError((e as Error).message); }
    finally { setFetching(false); }
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  if (loading || !user) return <PageLoadingSkeleton />;

  const critical = tasks.filter((t) => t.riskLevel === "critical" || t.riskLevel === "high");
  const rest = tasks.filter((t) => !critical.includes(t));

  return (
    <PageShell
      title="Deadline Radar"
      subtitle="Sorted by likelihood of being missed — not by due date."
      badge={
        <span className="label-caps flex items-center gap-1.5 text-signal-glow">
          <Radar size={11} /> Live risk view
        </span>
      }
      action={
        <button onClick={load} disabled={fetching} className="btn-secondary !px-4 !py-2 text-xs">
          <RefreshCcw size={12} className={fetching ? "animate-spin" : ""} /> Refresh
        </button>
      }
    >
      {fetching ? (
        <TaskListSkeleton />
      ) : error ? (
        <ErrorRetry message={`Couldn't load the radar: ${error}`} onRetry={load} />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="Nothing on the radar yet"
          description="Add tasks from the dashboard, then run a risk scan to populate the radar."
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <ProcrastinationAlerts />
          {critical.length > 0 && (
            <section className="mb-8">
              <p className="label-caps mb-3 text-risk-critical">Needs intervention</p>
              <div className="space-y-2.5">
                {critical.map((t) => <TaskCard key={t.id} task={t} />)}
              </div>
            </section>
          )}
          {rest.length > 0 && (
            <section>
              <p className="label-caps mb-3">Under control</p>
              <div className="space-y-2.5">
                {rest.map((t) => <TaskCard key={t.id} task={t} />)}
              </div>
            </section>
          )}
        </motion.div>
      )}
    </PageShell>
  );
}
