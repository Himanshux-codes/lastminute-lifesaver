"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  Legend, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingSkeleton, ChartSkeleton, CardSkeleton } from "@/components/Skeleton";
import { ErrorRetry } from "@/components/ErrorRetry";
import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/PageShell";
import { CountUp } from "@/components/CountUp";
import { apiFetch } from "@/lib/apiClient";
import type { BehavioralSnapshot, Task } from "@/types";

interface SummaryResponse {
  snapshots: BehavioralSnapshot[];
  stats: { recentCompletionRate: number; procrastinationIndex: number };
}

const CAT_COLOR: Record<Task["category"], string> = {
  assignment: "#9B93FF", exam: "#FF3B5C", meeting: "#FBBF24",
  bill: "#34D399", interview: "#818CF8", personal: "#64748B", work: "#F87171",
};

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "rgb(15,19,35)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.6)",
    fontSize: 12,
  },
  labelStyle: { color: "rgb(132,140,172)", marginBottom: 4 },
};

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!loading && !user) router.replace("/"); }, [loading, user, router]);

  const load = useCallback(async () => {
    setFetching(true); setError(null);
    try {
      const [summary, taskData] = await Promise.all([
        apiFetch<SummaryResponse>("/api/analytics/summary"),
        apiFetch<{ tasks: Task[] }>("/api/tasks"),
      ]);
      setData(summary);
      setTasks(taskData.tasks);
    } catch (e) { setError((e as Error).message); }
    finally { setFetching(false); }
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  if (loading || !user) return <PageLoadingSkeleton />;

  const chartData = data?.snapshots.map((s) => ({
    day: new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    completed: s.tasksCompleted,
    missed: s.tasksMissed,
    risk: s.averageRiskScore,
  })) ?? [];

  const categoryCounts = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1;
    return acc;
  }, {});
  const categoryData = Object.entries(categoryCounts).map(([category, count]) => ({ category, count }));

  return (
    <PageShell
      title="Behavioral Analytics"
      subtitle="What the Productivity Analyst Agent sees in your last 14 days."
      badge={<span className="label-caps flex items-center gap-1.5 text-signal-glow"><BarChart3 size={11} /> 14-day window</span>}
    >
      {fetching ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <CardSkeleton /> <CardSkeleton />
          </div>
          <ChartSkeleton height={220} />
          <ChartSkeleton height={220} />
        </div>
      ) : error ? (
        <ErrorRetry message={`Couldn't load analytics: ${error}`} onRetry={load} />
      ) : !data ? null : (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* KPI strip */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Completion rate" value={`${Math.round(data.stats.recentCompletionRate * 100)}`} suffix="%" />
            <StatCard label="Procrastination index" value={data.stats.procrastinationIndex.toFixed(2)} />
            <StatCard label="Active tasks" value={String(tasks.length)} />
            <StatCard label="Total hours" value={String(Math.round(tasks.reduce((s, t) => s + t.remainingMinutes, 0) / 60))} suffix="h" />
          </div>

          {chartData.length === 0 ? (
            <EmptyState title="Not enough history yet" description="Complete some tasks to see your behavioral patterns here." />
          ) : (
            <>
              <div className="card mb-4 p-5">
                <p className="section-title">Completed vs missed</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="day" stroke="rgba(132,140,172,0.6)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(132,140,172,0.6)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar dataKey="completed" fill="#34D399" radius={[5, 5, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="missed" fill="#FF3B5C" radius={[5, 5, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card mb-4 p-5">
                <p className="section-title">Risk score trend</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6E63FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6E63FF" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="day" stroke="rgba(132,140,172,0.6)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(132,140,172,0.6)" fontSize={11} domain={[0, 100]} tickLine={false} axisLine={false} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="risk" stroke="#9B93FF" strokeWidth={2} fill="url(#riskGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {categoryData.length > 0 && (
                <div className="card p-5">
                  <p className="section-title">Tasks by category</p>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={categoryData} dataKey="count" nameKey="category" innerRadius={55} outerRadius={85} paddingAngle={3}>
                        {categoryData.map((e) => (
                          <Cell key={e.category} fill={CAT_COLOR[e.category as Task["category"]]} />
                        ))}
                      </Pie>
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Legend
                        wrapperStyle={{ fontSize: 11, color: "rgba(132,140,172,0.9)" }}
                        iconType="circle"
                        iconSize={8}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </PageShell>
  );
}

function StatCard({ label, value, suffix = "" }: { label: string; value: string; suffix?: string }) {
  const num = parseFloat(value);
  return (
    <div className="card p-4">
      <p className="label-caps mb-2">{label}</p>
      <p className="font-display text-2xl font-bold leading-none tracking-tight text-ink">
        {!isNaN(num) ? <CountUp value={num} /> : value}
        {suffix && <span className="text-ink-muted">{suffix}</span>}
      </p>
    </div>
  );
}
