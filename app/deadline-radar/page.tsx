"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingSkeleton, TaskListSkeleton } from "@/components/Skeleton";
import { ErrorRetry } from "@/components/ErrorRetry";
import { EmptyState } from "@/components/EmptyState";
import { apiFetch } from "@/lib/apiClient";
import { TaskCard } from "@/components/TaskCard";
import { ProcrastinationAlerts } from "@/components/ProcrastinationAlerts";
import type { Task } from "@/types";

const RISK_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;

export default function DeadlineRadarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  const load = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const data = await apiFetch<{ tasks: Task[] }>("/api/tasks");
      setTasks(
        [...data.tasks].sort((a, b) => {
          const ra = a.riskLevel ? RISK_ORDER[a.riskLevel] : 4;
          const rb = b.riskLevel ? RISK_ORDER[b.riskLevel] : 4;
          return ra - rb;
        })
      );
    } catch (e) {
      // Previously unhandled — a failed fetch left the page on its loading state forever
      // with no error path. Now it surfaces a real retry UI instead.
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

  const critical = tasks.filter((t) => t.riskLevel === "critical" || t.riskLevel === "high");
  const rest = tasks.filter((t) => !critical.includes(t));

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <a href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-xs text-ink-faint transition hover:text-ink-muted">
          <ArrowLeft size={12} /> Back to dashboard
        </a>

        <h1 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">Deadline Radar</h1>
        <p className="mt-1.5 mb-8 text-sm leading-relaxed text-ink-muted">
          Sorted by likelihood of being missed — not by due date. Run a risk scan from the dashboard to refresh.
        </p>

        {fetching ? (
          <TaskListSkeleton />
        ) : error ? (
          <ErrorRetry message={`Couldn't load the radar: ${error}`} onRetry={load} />
        ) : tasks.length === 0 ? (
          <EmptyState
            title="Nothing on the radar yet"
            description="Add tasks from the dashboard and they'll show up here, sorted by how likely they are to be missed."
          />
        ) : (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <ProcrastinationAlerts />
            {critical.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-risk-critical">
                  Needs intervention
                </h2>
                <div className="space-y-3">
                  {critical.map((t) => (
                    <TaskCard key={t.id} task={t} />
                  ))}
                </div>
              </section>
            )}
            {rest.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">Under control</h2>
                <div className="space-y-3">
                  {rest.map((t) => (
                    <TaskCard key={t.id} task={t} />
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
