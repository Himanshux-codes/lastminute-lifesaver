"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingSkeleton } from "@/components/Skeleton";
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

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ tasks: Task[] }>("/api/tasks")
      .then((data) =>
        setTasks(
          [...data.tasks].sort((a, b) => {
            const ra = a.riskLevel ? RISK_ORDER[a.riskLevel] : 4;
            const rb = b.riskLevel ? RISK_ORDER[b.riskLevel] : 4;
            return ra - rb;
          })
        )
      )
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || !user) {
    return <PageLoadingSkeleton />;
  }

  const critical = tasks.filter((t) => t.riskLevel === "critical" || t.riskLevel === "high");
  const rest = tasks.filter((t) => !critical.includes(t));

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <a href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink-muted">
          <ArrowLeft size={12} /> Back to dashboard
        </a>

        <h1 className="font-display text-2xl font-medium text-ink">Deadline Radar</h1>
        <p className="mt-1 mb-8 text-sm text-ink-muted">
          Sorted by likelihood of being missed — not by due date. Run a risk scan from the dashboard to refresh.
        </p>

        {fetching ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-ink-faint" />
          </div>
        ) : (
          <>
            <ProcrastinationAlerts />
            {critical.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-risk-critical">
                  Needs intervention
                </h2>
                <div className="space-y-3">
                  {critical.map((t) => (
                    <TaskCard key={t.id} task={t} />
                  ))}
                </div>
              </section>
            )}
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">
                Under control
              </h2>
              <div className="space-y-3">
                {rest.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
