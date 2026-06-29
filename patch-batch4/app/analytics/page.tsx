"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingSkeleton } from "@/components/Skeleton";
import { apiFetch } from "@/lib/apiClient";
import type { BehavioralSnapshot, Task } from "@/types";

interface SummaryResponse {
  snapshots: BehavioralSnapshot[];
  stats: { recentCompletionRate: number; procrastinationIndex: number };
}

const CATEGORY_COLORS: Record<Task["category"], string> = {
  assignment: "#6E63FF",
  exam: "#FF3B5C",
  meeting: "#F2B84B",
  bill: "#3DD9A4",
  interview: "#9B93FF",
  personal: "#5A6080",
  work: "#F2654B",
};

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([apiFetch<SummaryResponse>("/api/analytics/summary"), apiFetch<{ tasks: Task[] }>("/api/tasks")])
      .then(([summary, taskData]) => {
        setData(summary);
        setTasks(taskData.tasks);
      })
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || !user || fetching || !data) {
    return <PageLoadingSkeleton />;
  }

  const chartData = data.snapshots.map((s) => ({
    day: new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    completed: s.tasksCompleted,
    missed: s.tasksMissed,
    risk: s.averageRiskScore,
  }));

  const categoryCounts = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(categoryCounts).map(([category, count]) => ({ category, count }));

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <a href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink-muted">
          <ArrowLeft size={12} /> Back to dashboard
        </a>

        <h1 className="font-display text-2xl font-medium text-ink">Behavioral Analytics</h1>
        <p className="mt-1 mb-8 text-sm text-ink-muted">What the Productivity Analyst Agent sees in your last 14 days.</p>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="14-day completion rate" value={`${Math.round(data.stats.recentCompletionRate * 100)}%`} />
          <StatCard label="Procrastination index" value={data.stats.procrastinationIndex.toFixed(2)} />
        </div>

        <div className="mb-6 rounded-2xl border border-white/5 bg-base-800/40 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">Completed vs missed</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2238" />
              <XAxis dataKey="day" stroke="#5A6080" fontSize={11} />
              <YAxis stroke="#5A6080" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#101729", border: "1px solid #1A2238", borderRadius: 8 }} />
              <Bar dataKey="completed" fill="#3DD9A4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="missed" fill="#FF3B5C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mb-6 rounded-2xl border border-white/5 bg-base-800/40 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">Average risk trend</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2238" />
              <XAxis dataKey="day" stroke="#5A6080" fontSize={11} />
              <YAxis stroke="#5A6080" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#101729", border: "1px solid #1A2238", borderRadius: 8 }} />
              <Area type="monotone" dataKey="risk" stroke="#6E63FF" fill="#6E63FF" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {categoryData.length > 0 && (
          <div className="rounded-2xl border border-white/5 bg-base-800/40 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">
              Active tasks by category
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryData} dataKey="count" nameKey="category" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {categoryData.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category as Task["category"]]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#101729", border: "1px solid #1A2238", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-base-800/60 p-4">
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-2xl font-medium text-ink">{value}</p>
    </div>
  );
}
