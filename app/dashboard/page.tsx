"use client";

import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2, Plus, RefreshCcw, Sparkles, UserCircle2,
  Settings as SettingsIcon, AlertTriangle, Clock3,
  CalendarClock, Timer, ArrowRight, Zap, TrendingUp,
  Activity, ListChecks,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { ThemeToggle } from "@/contexts/ThemeContext";
import { apiFetch } from "@/lib/apiClient";
import { useAutosave } from "@/hooks/useAutosave";
import { TaskCard } from "@/components/TaskCard";
import { AccountabilityBanner } from "@/components/AccountabilityBanner";
import { HabitTracker } from "@/components/HabitTracker";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { EmptyState } from "@/components/EmptyState";
import { TaskListSkeleton, PageLoadingSkeleton } from "@/components/Skeleton";
import { OnboardingWalkthrough } from "@/components/OnboardingWalkthrough";
import { CountUp } from "@/components/CountUp";
import { DEMO_TASKS, DEMO_NUDGE } from "@/lib/demoData";
import type { Task, RiskAssessmentResult } from "@/types";

/* ─── nav links ─────────────────────────────────────────── */
const NAV_LINKS = [
  { href: "/deadline-radar", label: "Deadline radar", icon: "🎯" },
  { href: "/goal-planner", label: "Goal planner", icon: "🗺️" },
  { href: "/voice-assistant", label: "Voice", icon: "🎙️" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/life-risk", label: "Life risk", icon: "⚡" },
  { href: "/simulate", label: "Simulate", icon: "🔬" },
  { href: "/focus", label: "Focus mode", icon: "⏱️" },
];

function getRiskColor(level?: string) {
  switch (level) {
    case "critical": return "#FF3B5C";
    case "high": return "#F87171";
    case "medium": return "#FBBF24";
    default: return "#34D399";
  }
}

/* ─── Main content ────────────────────────────────────────── */
function DashboardContent() {
  const { user, loading, logOut } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [fetching, setFetching] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!isDemo && !loading && !user) router.replace("/");
  }, [loading, user, router, isDemo]);

  const loadTasks = useCallback(async () => {
    if (isDemo) { setTasks(DEMO_TASKS); setFetching(false); return; }
    setFetching(true);
    try {
      const data = await apiFetch<{ tasks: Task[] }>("/api/tasks");
      setTasks(data.tasks);
    } finally { setFetching(false); }
  }, [isDemo]);

  useEffect(() => { if (isDemo || user) loadTasks(); }, [user, isDemo, loadTasks]);

  /* keyboard shortcut: n = new task */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || e.metaKey || e.ctrlKey) return;
      if (e.key.toLowerCase() === "n") { e.preventDefault(); setShowForm(true); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function runRiskScan() {
    if (isDemo) { showToast("Risk scores are pre-computed in demo mode.", { variant: "info" }); return; }
    setScoring(true);
    try {
      const scored = await Promise.all(
        tasks.map(async (task) => {
          const { risk } = await apiFetch<{ risk: RiskAssessmentResult }>("/api/gemini/risk-score", {
            method: "POST",
            body: JSON.stringify({ taskId: task.id }),
          });
          return { ...task, riskScore: risk.riskScore, riskLevel: risk.riskLevel, riskReason: risk.reasoning, riskConfidence: risk.confidence };
        })
      );
      setTasks(scored.sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0)));
      showToast("Risk scan complete.", { variant: "success" });
    } catch (e) {
      showToast(`Risk scan failed: ${(e as Error).message}`, { variant: "error" });
    } finally { setScoring(false); }
  }

  function handleDelete(task: Task) {
    if (isDemo) { setTasks((p) => p.filter((t) => t.id !== task.id)); return; }
    setTasks((p) => p.filter((t) => t.id !== task.id));
    const timer = setTimeout(async () => {
      pendingDeletes.current.delete(task.id);
      try { await apiFetch(`/api/tasks/${task.id}`, { method: "DELETE" }); }
      catch (e) {
        showToast(`Couldn't delete "${task.title}": ${(e as Error).message}`, { variant: "error" });
        setTasks((p) => [...p, task]);
      }
    }, 5000);
    pendingDeletes.current.set(task.id, timer);
    showToast(`Deleted "${task.title}"`, {
      variant: "info", actionLabel: "Undo", durationMs: 5000,
      onAction: () => {
        const p = pendingDeletes.current.get(task.id);
        if (p) { clearTimeout(p); pendingDeletes.current.delete(task.id); }
        setTasks((prev) => [...prev, task].sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0)));
      },
    });
  }

  function handleDragStart(i: number) { setDragIndex(i); }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    setTasks((prev) => {
      const n = [...prev];
      const [m] = n.splice(dragIndex, 1);
      n.splice(i, 0, m);
      return n;
    });
    setDragIndex(i);
  }
  async function handleDragEnd() {
    setDragIndex(null);
    if (isDemo) return;
    const total = tasks.length;
    try {
      await Promise.all(tasks.map((t, i) => apiFetch(`/api/tasks/${t.id}`, {
        method: "PATCH", body: JSON.stringify({ priorityScore: total - i }),
      })));
    } catch (e) { showToast(`Couldn't save order: ${(e as Error).message}`, { variant: "error" }); }
  }

  /* Derived metrics – zero new fetches */
  const scoredTasks = useMemo(() => tasks.filter((t) => t.riskScore != null), [tasks]);
  const criticalCount = useMemo(() => tasks.filter((t) => t.riskLevel === "critical" || t.riskLevel === "high").length, [tasks]);
  const hoursLeft = useMemo(() => Math.round(tasks.reduce((s, t) => s + t.remainingMinutes, 0) / 60), [tasks]);
  const avgRisk = useMemo(() => {
    if (!scoredTasks.length) return null;
    return Math.round(scoredTasks.reduce((s, t) => s + (t.riskScore ?? 0), 0) / scoredTasks.length);
  }, [scoredTasks]);
  const topPriorities = useMemo(() =>
    [...tasks].sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0) || new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).slice(0, 3),
    [tasks]);
  const upcoming = useMemo(() =>
    [...tasks].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).slice(0, 5),
    [tasks]);
  const timeline7 = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today.getTime() + i * 864e5);
      const count = tasks.filter((t) => { const dd = new Date(t.deadline); dd.setHours(0,0,0,0); return dd.getTime() === d.getTime(); }).length;
      return { d, count };
    });
  }, [tasks]);

  if (!isDemo && (loading || !user)) return <PageLoadingSkeleton />;

  const hasTasks = !fetching && tasks.length > 0;
  const name = isDemo ? "Explorer" : (user?.displayName?.split(" ")[0] ?? "there");

  return (
    <main className="min-h-screen pb-20">
      {/* ─── App header / nav bar ──────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-base-950/85 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight text-ink"
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-[8px]"
                style={{ background: "linear-gradient(145deg,#9B93FF,#6E63FF 60%,#4E46BE)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)" }}
              >
                <Activity size={12} className="text-white" />
              </span>
              Life Saver
            </a>
            {/* Inline nav on wider screens */}
            <nav className="hidden items-center gap-0.5 lg:flex">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-ink-faint transition hover:bg-white/[0.06] hover:text-ink"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2.5">
            {!isDemo && <PushNotificationToggle />}
            <ThemeToggle />
            {!isDemo && (
              <>
                <a href="/profile" aria-label="Profile" className="hidden h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] text-ink-faint transition hover:border-white/[0.16] hover:text-ink sm:flex">
                  <UserCircle2 size={14} />
                </a>
                <a href="/settings" aria-label="Settings" className="hidden h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] text-ink-faint transition hover:border-white/[0.16] hover:text-ink sm:flex">
                  <SettingsIcon size={14} />
                </a>
                <button onClick={logOut} className="hidden text-xs text-ink-faint transition hover:text-ink sm:block">
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
        {!isDemo && <OnboardingWalkthrough />}

        {/* ─── Demo banner ──────────────────────────────────────── */}
        {isDemo && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-2.5 rounded-[14px] border border-signal/20 bg-signal/[0.06] px-4 py-2.5 text-xs"
          >
            <Sparkles size={13} className="shrink-0 text-signal-glow" />
            <span className="text-ink-muted">
              Demo mode — explore freely, nothing is saved.
            </span>
            <a href="/" className="ml-auto shrink-0 font-medium text-signal-glow hover:underline">
              Sign in →
            </a>
          </motion.div>
        )}

        {/* ─── Greeting ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p className="label-caps text-signal-glow mb-1">AI Chief of Staff</p>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-ink sm:text-3xl">
              Good {getTimeOfDay()}, {name}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={runRiskScan}
                disabled={scoring || tasks.length === 0}
                className="btn-primary !px-4 !py-2 text-xs"
              >
                {scoring ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                {scoring ? "Scanning..." : "Run risk scan"}
              </button>
              <button onClick={() => setShowForm(true)} className="btn-secondary !px-4 !py-2 text-xs">
                <Plus size={13} /> Add task
              </button>
            </div>
          </div>
        </motion.div>

        {/* ─── KPI cards ───────────────────────────────────────── */}
        {hasTasks && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            <KpiCard
              icon={<ListChecks size={16} />}
              label="Active tasks"
              value={tasks.length}
              trend={null}
            />
            <KpiCard
              icon={<AlertTriangle size={16} className={criticalCount > 0 ? "text-risk-critical" : undefined} />}
              label="At risk"
              value={criticalCount}
              tone={criticalCount > 0 ? "critical" : "default"}
              trend={null}
            />
            <KpiCard
              icon={<Clock3 size={16} />}
              label="Work hours left"
              value={hoursLeft}
              suffix="h"
              trend={null}
            />
            <KpiCard
              icon={<Activity size={16} />}
              label="Avg risk score"
              value={avgRisk ?? 0}
              placeholder={avgRisk === null}
              tone={avgRisk !== null && avgRisk >= 70 ? "critical" : avgRisk !== null && avgRisk >= 40 ? "warn" : "default"}
              trend={null}
            />
          </motion.div>
        )}

        {/* ─── Risk gauge + AI card ─────────────────────────────── */}
        {hasTasks && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5"
          >
            <div className="lg:col-span-2">
              <RiskGaugeCard avgRisk={avgRisk} onScan={runRiskScan} scanning={scoring} />
            </div>
            <div className="lg:col-span-3">
              {isDemo ? <DemoNudgeCard /> : <AccountabilityBanner />}
            </div>
          </motion.div>
        )}

        {/* ─── Priorities + Upcoming ────────────────────────────── */}
        {hasTasks && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2"
          >
            <TodayPrioritiesCard tasks={topPriorities} />
            <UpcomingDeadlinesCard tasks={upcoming} />
          </motion.div>
        )}

        {/* ─── 7-day timeline ────────────────────────────────────── */}
        {hasTasks && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-8"
          >
            <TimelineCard days={timeline7} />
          </motion.div>
        )}

        {/* ─── Habits (real users only) ─────────────────────────── */}
        {!isDemo && <HabitTracker />}

        {/* ─── Mobile nav strip ─────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="pill text-xs">
              <span>{l.icon}</span> {l.label}
            </a>
          ))}
        </div>

        {/* ─── New task form ──────────────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <NewTaskForm onCreated={loadTasks} onClose={() => setShowForm(false)} isDemo={isDemo} />
          )}
        </AnimatePresence>

        {/* ─── Task list ─────────────────────────────────────────── */}
        <div className="mb-4 flex items-center justify-between">
          <p className="section-title">
            All active tasks {tasks.length > 0 && (
              <span className="ml-1.5 rounded-full bg-white/[0.07] px-2 py-0.5 font-normal normal-case text-ink-faint">
                {tasks.length}
              </span>
            )}
          </p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 text-xs text-ink-faint transition hover:text-ink"
            >
              <Plus size={12} /> New <span className="ml-1 rounded border border-white/10 px-1 py-0.5 font-mono text-[9px] text-ink-faint">N</span>
            </button>
          )}
        </div>

        {fetching ? (
          <TaskListSkeleton />
        ) : tasks.length === 0 ? (
          !showForm && (
            <EmptyState
              title="No active commitments yet"
              description="Add your first task and the Risk Prediction Agent will start watching it."
              action={
                <button onClick={() => setShowForm(true)} className="btn-primary !px-4 !py-2 text-sm">
                  <Plus size={14} /> Add your first task
                </button>
              }
            />
          )
        ) : (
          <div className="space-y-2.5" role="list" aria-label="Active tasks">
            <AnimatePresence initial={false}>
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={dragIndex === index ? "opacity-40 scale-[0.99]" : ""}
                >
                  <TaskCard
                    task={task}
                    onDelete={handleDelete}
                    draggable
                    dragHandleProps={{ "aria-grabbed": dragIndex === index }}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  );
}

/* ─── Utility ────────────────────────────────────────────────── */
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

/* ─── KPI card ───────────────────────────────────────────────── */
function KpiCard({
  icon, label, value, suffix = "", trend, tone = "default", placeholder = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  trend: null;
  tone?: "default" | "critical" | "warn";
  placeholder?: boolean;
}) {
  const valueColor =
    tone === "critical" ? "text-risk-critical" :
    tone === "warn" ? "text-risk-medium" : "text-ink";

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-ink-faint">{icon}</span>
        {tone === "critical" && value > 0 && (
          <span className="flex h-1.5 w-1.5 items-center justify-center rounded-full">
            <span className="absolute h-2.5 w-2.5 animate-pulseRing rounded-full bg-risk-critical/50" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-risk-critical" />
          </span>
        )}
      </div>
      <p className="label-caps mb-1.5">{label}</p>
      {placeholder ? (
        <p className="text-sm text-ink-faint">Run a scan</p>
      ) : (
        <p className={`font-display text-2xl font-bold leading-none tracking-tight tabular-nums ${valueColor}`}>
          <CountUp value={value} />{suffix}
        </p>
      )}
    </div>
  );
}

/* ─── Risk gauge ─────────────────────────────────────────────── */
function RiskGaugeCard({
  avgRisk, onScan, scanning,
}: {
  avgRisk: number | null;
  onScan: () => void;
  scanning: boolean;
}) {
  const score = avgRisk ?? 0;
  const color = score >= 85 ? "#FF3B5C" : score >= 60 ? "#F87171" : score >= 30 ? "#FBBF24" : "#34D399";
  const label = score >= 85 ? "Critical" : score >= 60 ? "High risk" : score >= 30 ? "Moderate" : "On track";
  const R = 56;
  const C = 2 * Math.PI * R;
  const filled = avgRisk !== null ? C - (score / 100) * C : C;

  return (
    <div className="card flex h-full flex-col items-center justify-center p-6 text-center">
      <p className="section-title mb-4 w-full text-center">Risk gauge</p>
      <div className="relative mb-4">
        <svg width={144} height={144} viewBox="0 0 144 144" role="img" aria-label={`Risk score: ${score}`}>
          {/* Track */}
          <circle cx={72} cy={72} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} />
          {/* Filled arc */}
          <motion.circle
            cx={72} cy={72} r={R}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            transform="rotate(-90 72 72)"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: filled }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
          />
          {/* Centre text */}
          <text x={72} y={68} textAnchor="middle" fontSize={28} fontWeight={700} fill="rgb(228,231,246)" fontFamily="var(--font-display)">
            {avgRisk !== null ? score : "—"}
          </text>
          <text x={72} y={86} textAnchor="middle" fontSize={11} fill={color} fontFamily="var(--font-body)">
            {avgRisk !== null ? label : "No scan yet"}
          </text>
        </svg>
      </div>
      <button onClick={onScan} disabled={scanning} className="btn-secondary !px-4 !py-1.5 text-xs">
        {scanning ? <Loader2 size={11} className="animate-spin" /> : <RefreshCcw size={11} />}
        {avgRisk === null ? "Run first scan" : "Rescan"}
      </button>
    </div>
  );
}

/* ─── Demo nudge card ────────────────────────────────────────── */
function DemoNudgeCard() {
  return (
    <div className="card flex h-full flex-col justify-center p-5 sm:p-6">
      <p className="label-caps text-signal-glow mb-3">AI recommendation</p>
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-signal/15">
          <Sparkles size={15} className="text-signal-glow" />
        </span>
        <div>
          <p className="text-sm leading-relaxed text-ink">{DEMO_NUDGE.message}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
            <ArrowRight size={11} className="text-signal-glow" /> {DEMO_NUDGE.focusSuggestion}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Today's priorities ─────────────────────────────────────── */
function TodayPrioritiesCard({ tasks }: { tasks: Task[] }) {
  return (
    <div className="card p-5">
      <p className="section-title flex items-center gap-1.5">
        <TrendingUp size={11} className="text-signal-glow" /> Today&apos;s priorities
      </p>
      {tasks.length === 0 ? (
        <p className="text-xs text-ink-faint">Add tasks to see your priorities.</p>
      ) : (
        <ol className="space-y-3.5">
          {tasks.map((t, i) => {
            const color = getRiskColor(t.riskLevel);
            return (
              <li key={t.id} className="flex items-center gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: color, boxShadow: `0 0 8px ${color}50` }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{t.title}</p>
                  <p className="text-[11px] text-ink-faint">
                    {t.riskScore != null ? `Risk ${t.riskScore}` : `${t.remainingMinutes}m`}
                  </p>
                </div>
                {t.riskLevel && (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                    style={{ background: `${color}18`, color }}
                  >
                    {t.riskLevel}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/* ─── Upcoming deadlines ────────────────────────────────────── */
function UpcomingDeadlinesCard({ tasks }: { tasks: Task[] }) {
  return (
    <div className="card p-5">
      <p className="section-title flex items-center gap-1.5">
        <CalendarClock size={11} /> Upcoming deadlines
      </p>
      {tasks.length === 0 ? (
        <p className="text-xs text-ink-faint">No upcoming deadlines.</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((t) => {
            const color = getRiskColor(t.riskLevel);
            const ms = new Date(t.deadline).getTime() - Date.now();
            const hoursLeft = Math.max(0, Math.floor(ms / 36e5));
            const urgent = hoursLeft < 24;
            return (
              <li key={t.id} className="flex items-center gap-3">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
                />
                <p className="min-w-0 flex-1 truncate text-sm text-ink">{t.title}</p>
                <span className={`shrink-0 text-xs ${urgent ? "font-semibold text-risk-critical" : "text-ink-faint"}`}>
                  {urgent ? `${hoursLeft}h` : new Date(t.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ─── 7-day timeline bar chart ──────────────────────────────── */
function TimelineCard({ days }: { days: { d: Date; count: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="card p-5">
      <p className="section-title flex items-center gap-1.5 mb-5">
        <Timer size={11} /> Next 7 days
      </p>
      <div className="flex items-end justify-between gap-2">
        {days.map(({ d, count }, i) => {
          const isToday = i === 0;
          const pct = count / max;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex h-16 w-full items-end justify-center">
                <div className="relative w-full max-w-[32px] overflow-hidden rounded-t-lg bg-base-700/50" style={{ height: "100%" }}>
                  <motion.div
                    className={`absolute bottom-0 w-full rounded-t-lg ${isToday ? "bg-signal" : count > 0 ? "bg-signal/50" : "bg-base-700/30"}`}
                    initial={{ height: 0 }}
                    animate={{ height: count > 0 ? `${Math.max(12, pct * 100)}%` : "6%" }}
                    transition={{ duration: 0.6, delay: i * 0.06, ease: "easeOut" }}
                    style={isToday && count > 0 ? { boxShadow: "0 0 12px rgba(110,99,255,0.5)" } : undefined}
                  />
                  {count > 0 && (
                    <span className="absolute bottom-1 left-0 right-0 text-center text-[9px] font-bold text-white">{count}</span>
                  )}
                </div>
              </div>
              <span className={`text-[10px] ${isToday ? "font-semibold text-signal-glow" : "text-ink-faint"}`}>
                {isToday ? "Today" : d.toLocaleDateString(undefined, { weekday: "narrow" })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── New task form ────────────────────────────────────────────── */
function NewTaskForm({
  onCreated, onClose, isDemo,
}: {
  onCreated: () => void;
  onClose: () => void;
  isDemo: boolean;
}) {
  const { showToast } = useToast();
  const draftKey = "lastminute-new-task-draft";
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { draft, saved, clearDraft } = useAutosave(draftKey, { title, minutes, deadline });

  useEffect(() => {
    if (draft) { setTitle(draft.title); setMinutes(draft.minutes); setDeadline(draft.deadline); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    if (!title || !deadline) return;
    setSubmitting(true);
    try {
      if (isDemo) {
        showToast("Demo mode doesn't save tasks — sign in to add real ones.", { variant: "info" });
      } else {
        await apiFetch("/api/tasks", {
          method: "POST",
          body: JSON.stringify({ title, category: "assignment", estimatedMinutes: minutes, deadline: new Date(deadline).toISOString() }),
        });
        showToast("Task added.", { variant: "success" });
      }
      clearDraft(); setTitle(""); setMinutes(60); setDeadline(""); onClose(); onCreated();
    } catch (e) {
      showToast(`Couldn't add task: ${(e as Error).message}`, { variant: "error" });
    } finally { setSubmitting(false); }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="card mb-6 space-y-4 p-5">
        <p className="font-display text-sm font-semibold text-ink">New task</p>
        <FloatingInput
          id="task-title"
          label="Task title"
          value={title}
          onChange={setTitle}
          autoFocus
          placeholder="e.g. Database Systems assignment"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FloatingInput
            id="task-mins"
            label="Estimated minutes"
            type="number"
            value={String(minutes)}
            onChange={(v) => setMinutes(Number(v) || 0)}
          />
          <FloatingInput
            id="task-deadline"
            label="Deadline"
            type="datetime-local"
            value={deadline}
            onChange={setDeadline}
          />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSubmit}
            disabled={submitting || !title || !deadline}
            className="btn-primary !px-4 !py-2 text-sm"
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            {submitting ? "Adding..." : "Add task"}
          </button>
          <button onClick={onClose} className="text-sm text-ink-faint transition hover:text-ink-muted">
            Cancel
          </button>
          {saved && <span className="text-xs text-ink-faint">Draft saved</span>}
        </div>
      </div>
    </motion.div>
  );
}

function FloatingInput({
  id, label, value, onChange, type = "text", placeholder = " ", autoFocus = false,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; type?: string;
  placeholder?: string; autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <input
        id={id} type={type} autoFocus={autoFocus} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="peer input-base pb-2 pt-5"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-faint
                   transition-all
                   peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case
                   peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-ink-faint/70
                   peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:uppercase peer-focus:tracking-[0.08em] peer-focus:text-signal-glow"
      >
        {label}
      </label>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
