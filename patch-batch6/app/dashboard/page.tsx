"use client";

import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  Plus,
  RefreshCcw,
  Sparkles,
  UserCircle2,
  Settings as SettingsIcon,
  ListChecks,
  AlertTriangle,
  Clock3,
  Gauge as GaugeIcon,
  CalendarClock,
  Type as TypeIcon,
  Timer,
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

const NAV_LINKS = [
  { href: "/deadline-radar", label: "Deadline radar" },
  { href: "/goal-planner", label: "Goal planner" },
  { href: "/voice-assistant", label: "Voice assistant" },
  { href: "/analytics", label: "Analytics" },
  { href: "/life-risk", label: "Life risk score" },
  { href: "/simulate", label: "Simulate commitment" },
  { href: "/focus", label: "Focus mode" },
];

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
    if (isDemo) {
      setTasks(DEMO_TASKS);
      setFetching(false);
      return;
    }
    setFetching(true);
    try {
      const data = await apiFetch<{ tasks: Task[] }>("/api/tasks");
      setTasks(data.tasks);
    } finally {
      setFetching(false);
    }
  }, [isDemo]);

  useEffect(() => {
    if (isDemo || user) loadTasks();
  }, [user, isDemo, loadTasks]);

  // "n" opens the new-task form from anywhere on the dashboard, unless the user is typing.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      const isTyping = target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      if (isTyping || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        setShowForm(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function runRiskScan() {
    if (isDemo) {
      showToast("Risk scores are pre-computed in demo mode.", { variant: "info" });
      return;
    }
    setScoring(true);
    try {
      const scored = await Promise.all(
        tasks.map(async (task) => {
          const { risk } = await apiFetch<{ risk: RiskAssessmentResult }>("/api/gemini/risk-score", {
            method: "POST",
            body: JSON.stringify({ taskId: task.id }),
          });
          return {
            ...task,
            riskScore: risk.riskScore,
            riskLevel: risk.riskLevel,
            riskReason: risk.reasoning,
            riskConfidence: risk.confidence,
          };
        })
      );
      setTasks(scored.sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0)));
      showToast("Risk scan complete.", { variant: "success" });
    } catch (e) {
      showToast(`Risk scan failed: ${(e as Error).message}`, { variant: "error" });
    } finally {
      setScoring(false);
    }
  }

  function handleDelete(task: Task) {
    if (isDemo) {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      return;
    }

    // Optimistic remove, with a real undo window before the delete actually hits the server.
    setTasks((prev) => prev.filter((t) => t.id !== task.id));

    const timer = setTimeout(async () => {
      pendingDeletes.current.delete(task.id);
      try {
        await apiFetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      } catch (e) {
        showToast(`Couldn't delete "${task.title}": ${(e as Error).message}`, { variant: "error" });
        setTasks((prev) => [...prev, task]);
      }
    }, 5000);

    pendingDeletes.current.set(task.id, timer);

    showToast(`Deleted "${task.title}"`, {
      variant: "info",
      actionLabel: "Undo",
      durationMs: 5000,
      onAction: () => {
        const pending = pendingDeletes.current.get(task.id);
        if (pending) {
          clearTimeout(pending);
          pendingDeletes.current.delete(task.id);
        }
        setTasks((prev) => [...prev, task].sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0)));
      },
    });
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(event: React.DragEvent, index: number) {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setTasks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  }

  async function handleDragEnd() {
    setDragIndex(null);
    if (isDemo) return;

    // Persist the new manual order as descending priorityScore so it survives a reload
    // and plays nicely with risk-based sorting (manual order wins until the next scan).
    const total = tasks.length;
    try {
      await Promise.all(
        tasks.map((task, index) =>
          apiFetch(`/api/tasks/${task.id}`, {
            method: "PATCH",
            body: JSON.stringify({ priorityScore: total - index }),
          })
        )
      );
    } catch (e) {
      showToast(`Couldn't save new order: ${(e as Error).message}`, { variant: "error" });
    }
  }

  // Pure presentational derivations from the already-fetched `tasks` array. No new network
  // calls, no new backend surface — this is purely about giving the existing data a richer
  // dashboard layout (KPI strip, risk gauge, priorities, upcoming, 7-day timeline).
  const scoredTasks = useMemo(() => tasks.filter((t) => typeof t.riskScore === "number"), [tasks]);
  const criticalCount = useMemo(
    () => tasks.filter((t) => t.riskLevel === "critical" || t.riskLevel === "high").length,
    [tasks]
  );
  const totalHoursRemaining = useMemo(
    () => Math.round(tasks.reduce((sum, t) => sum + t.remainingMinutes, 0) / 60),
    [tasks]
  );
  const avgRiskScore = useMemo(() => {
    if (scoredTasks.length === 0) return null;
    return Math.round(scoredTasks.reduce((sum, t) => sum + (t.riskScore ?? 0), 0) / scoredTasks.length);
  }, [scoredTasks]);
  const todaysPriorities = useMemo(() => {
    return [...tasks]
      .sort((a, b) => {
        if (a.riskScore != null && b.riskScore != null) return b.riskScore - a.riskScore;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      })
      .slice(0, 3);
  }, [tasks]);
  const upcomingDeadlines = useMemo(() => {
    return [...tasks].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).slice(0, 5);
  }, [tasks]);

  if (!isDemo && (loading || !user)) {
    return <PageLoadingSkeleton />;
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        {!isDemo && <OnboardingWalkthrough />}

        {isDemo && (
          <div className="glass mb-6 flex items-center gap-2 px-4 py-2.5 text-xs text-signal-glow">
            <Sparkles size={14} />
            You&apos;re viewing demo data — nothing here is saved.{" "}
            <a href="/" className="underline">
              Sign in
            </a>{" "}
            to use your own tasks.
          </div>
        )}

        {/* ---------- Header ---------- */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-signal-glow to-signal text-base font-semibold text-white shadow-glow-sm">
              {(isDemo ? "E" : user?.displayName?.[0] ?? "U").toUpperCase()}
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">Chief of Staff</p>
              <h1 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                Good to see you, {isDemo ? "explorer" : user?.displayName?.split(" ")[0] ?? "there"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!isDemo && (
              <>
                <a href="/profile" aria-label="Profile" className="text-ink-faint transition hover:text-ink-muted">
                  <UserCircle2 size={18} />
                </a>
                <a href="/settings" aria-label="Settings" className="text-ink-faint transition hover:text-ink-muted">
                  <SettingsIcon size={18} />
                </a>
                <button onClick={logOut} className="text-xs text-ink-faint transition hover:text-ink-muted">
                  Sign out
                </button>
              </>
            )}
          </div>
        </header>

        {!isDemo && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <PushNotificationToggle />
          </div>
        )}

        {/* ---------- KPI strip ---------- */}
        {!fetching && tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          >
            <KpiCard icon={<ListChecks size={15} />} label="Active tasks" value={tasks.length} />
            <KpiCard
              icon={<AlertTriangle size={15} />}
              label="At risk"
              value={criticalCount}
              tone={criticalCount > 0 ? "critical" : "default"}
            />
            <KpiCard icon={<Clock3 size={15} />} label="Hours of work left" value={totalHoursRemaining} suffix="h" />
            <KpiCard
              icon={<GaugeIcon size={15} />}
              label="Avg. risk score"
              value={avgRiskScore ?? 0}
              placeholder={avgRiskScore === null}
            />
          </motion.div>
        )}

        {/* ---------- Risk gauge + AI recommendation ---------- */}
        {!fetching && tasks.length > 0 && (
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <RiskGaugeCard score={avgRiskScore} onRunScan={runRiskScan} scanning={scoring} />
            </div>
            <div className="lg:col-span-3">
              {isDemo ? (
                <div className="card flex h-full flex-col justify-center gap-2 p-5">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-signal-glow">
                    <Sparkles size={12} /> AI recommendation
                  </p>
                  <p className="text-sm text-ink">{DEMO_NUDGE.message}</p>
                  <p className="text-xs text-ink-muted">Next: {DEMO_NUDGE.focusSuggestion}</p>
                </div>
              ) : (
                <AccountabilityBanner />
              )}
            </div>
          </div>
        )}

        {/* ---------- Today's priorities + Upcoming deadlines ---------- */}
        {!fetching && tasks.length > 0 && (
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PriorityListCard tasks={todaysPriorities} />
            <UpcomingDeadlinesCard tasks={upcomingDeadlines} />
          </div>
        )}

        {/* ---------- 7-day timeline ---------- */}
        {!fetching && tasks.length > 0 && (
          <div className="mb-6">
            <TimelineCard tasks={tasks} />
          </div>
        )}

        {!isDemo && <HabitTracker />}

        {/* ---------- Quick actions ---------- */}
        <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={runRiskScan}
            disabled={scoring || tasks.length === 0}
            className="btn-primary !px-4 !py-2 text-sm disabled:opacity-50"
          >
            {scoring ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
            Run risk scan
          </button>
          <button onClick={() => setShowForm(true)} className="pill">
            <Plus size={14} /> Add task
          </button>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="pill">
              {link.label}
            </a>
          ))}
        </div>

        {showForm && <NewTaskForm onCreated={loadTasks} onClose={() => setShowForm(false)} isDemo={isDemo} />}

        {/* ---------- Task list ---------- */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">All active tasks</p>
        </div>

        {fetching ? (
          <TaskListSkeleton />
        ) : tasks.length === 0 ? (
          !showForm && (
            <EmptyState
              title="No active commitments yet"
              description="Add your first task and the Risk Prediction Agent will start watching it for you."
              action={
                <button onClick={() => setShowForm(true)} className="btn-primary !px-4 !py-2 text-sm">
                  <Plus size={14} /> Add your first task
                </button>
              }
            />
          )
        ) : (
          <div className="space-y-3" role="list" aria-label="Active tasks, drag to reorder">
            <AnimatePresence initial={false}>
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={dragIndex === index ? "opacity-50" : ""}
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

/* ---------------------------------------------------------------------------------- */
/* Presentational widgets — all derived from props only, no data fetching of their own */
/* ---------------------------------------------------------------------------------- */

function KpiCard({
  icon,
  label,
  value,
  suffix = "",
  tone = "default",
  placeholder = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  tone?: "default" | "critical";
  placeholder?: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center gap-1.5 text-ink-faint">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      {placeholder ? (
        <p className="text-sm text-ink-faint">Run a scan</p>
      ) : (
        <p className={`stat-figure ${tone === "critical" && value > 0 ? "text-risk-critical" : ""}`}>
          <CountUp value={value} />
          {suffix}
        </p>
      )}
    </div>
  );
}

function RiskGaugeCard({
  score,
  onRunScan,
  scanning,
}: {
  score: number | null;
  onRunScan: () => void;
  scanning: boolean;
}) {
  const color = score === null ? "#5A6080" : score >= 85 ? "#FF3B5C" : score >= 60 ? "#F2654B" : score >= 30 ? "#F2B84B" : "#3DD9A4";
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = score === null ? circumference : circumference - (score / 100) * circumference;

  return (
    <div className="card flex h-full flex-col items-center justify-center p-6 text-center">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-ink-faint">Average active risk</p>
      <svg width={132} height={132} viewBox="0 0 132 132">
        <circle cx={66} cy={66} r={radius} fill="none" stroke="#1A2238" strokeWidth={10} />
        <motion.circle
          cx={66}
          cy={66}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          transform="rotate(-90 66 66)"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <text x={66} y={73} textAnchor="middle" fontSize={26} fontWeight={600} fill="#E7E9F5" fontFamily="var(--font-display)">
          {score ?? "—"}
        </text>
      </svg>
      <button onClick={onRunScan} disabled={scanning} className="btn-secondary mt-4 !py-1.5 text-xs">
        {scanning ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
        {score === null ? "Run first scan" : "Rescan"}
      </button>
    </div>
  );
}

function PriorityListCard({ tasks }: { tasks: Task[] }) {
  return (
    <div className="card p-5">
      <p className="mb-4 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-faint">
        <TypeIcon size={12} /> Today&apos;s priorities
      </p>
      {tasks.length === 0 ? (
        <p className="text-xs text-ink-faint">Nothing queued up yet.</p>
      ) : (
        <ol className="space-y-3">
          {tasks.map((task, i) => (
            <li key={task.id} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-signal/15 text-xs font-medium text-signal-glow">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{task.title}</p>
                <p className="text-xs text-ink-faint">
                  {task.riskScore != null ? `Risk ${task.riskScore}` : `${task.remainingMinutes}m remaining`}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function UpcomingDeadlinesCard({ tasks }: { tasks: Task[] }) {
  return (
    <div className="card p-5">
      <p className="mb-4 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-faint">
        <CalendarClock size={12} /> Upcoming deadlines
      </p>
      {tasks.length === 0 ? (
        <p className="text-xs text-ink-faint">Nothing on the calendar.</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-3">
              <p className="min-w-0 flex-1 truncate text-sm text-ink">{task.title}</p>
              <span className="shrink-0 text-xs text-ink-faint">
                {new Date(task.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TimelineCard({ tasks }: { tasks: Task[] }) {
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      const count = tasks.filter((t) => {
        const d = new Date(t.deadline);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === day.getTime();
      }).length;
      return { day, count };
    });
  }, [tasks]);

  const max = Math.max(1, ...days.map((d) => d.count));

  return (
    <div className="card p-5">
      <p className="mb-4 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-faint">
        <Timer size={12} /> Next 7 days
      </p>
      <div className="flex items-end justify-between gap-2">
        {days.map(({ day, count }, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-20 w-full items-end justify-center">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(count / max) * 100}%` }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                className={`w-full max-w-[28px] rounded-t-md ${count > 0 ? "bg-signal" : "bg-base-700"}`}
                style={{ minHeight: count > 0 ? 6 : 3 }}
              />
            </div>
            <span className="text-[10px] text-ink-faint">{day.toLocaleDateString(undefined, { weekday: "narrow" })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewTaskForm({
  onCreated,
  onClose,
  isDemo,
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
    if (draft) {
      setTitle(draft.title);
      setMinutes(draft.minutes);
      setDeadline(draft.deadline);
    }
    // Only ever hydrate from the draft once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    if (!title || !deadline) return;
    setSubmitting(true);
    try {
      if (isDemo) {
        showToast("Demo mode doesn't save new tasks — sign in to add real ones.", { variant: "info" });
      } else {
        await apiFetch("/api/tasks", {
          method: "POST",
          body: JSON.stringify({
            title,
            category: "assignment",
            estimatedMinutes: minutes,
            deadline: new Date(deadline).toISOString(),
          }),
        });
        showToast("Task added.", { variant: "success" });
      }
      clearDraft();
      setTitle("");
      setMinutes(60);
      setDeadline("");
      onClose();
      onCreated();
    } catch (e) {
      showToast(`Couldn't add task: ${(e as Error).message}`, { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  const titleValid = title.trim().length > 0;
  const deadlineValid = deadline.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="card mb-6 space-y-4 p-5"
    >
      <FloatingLabelInput
        id="new-task-title"
        label="Task title"
        value={title}
        onChange={setTitle}
        autoFocus
        placeholder="e.g. Database Systems assignment"
        valid={titleValid}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FloatingLabelInput
          id="new-task-minutes"
          label="Estimated minutes"
          type="number"
          value={String(minutes)}
          onChange={(v) => setMinutes(Number(v) || 0)}
          valid={minutes > 0}
        />
        <FloatingLabelInput
          id="new-task-deadline"
          label="Deadline"
          type="datetime-local"
          value={deadline}
          onChange={setDeadline}
          valid={deadlineValid}
        />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleSubmit} disabled={submitting || !titleValid || !deadlineValid} className="btn-primary !px-4 !py-2 text-sm">
          {submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          {submitting ? "Adding..." : "Add task"}
        </button>
        <button onClick={onClose} className="px-4 py-2 text-sm text-ink-faint transition hover:text-ink-muted">
          Cancel
        </button>
        <span className="text-xs text-ink-faint" aria-live="polite">
          {saved ? "Draft saved" : ""}
        </span>
      </div>
    </motion.div>
  );
}

/** Floating-label text input with inline validity state — pure presentation, no new logic. */
function FloatingLabelInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder = " ",
  autoFocus = false,
  valid,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoFocus?: boolean;
  valid: boolean;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`peer w-full rounded-xl border bg-base-700/50 px-3.5 pb-2 pt-5 text-sm text-ink outline-none transition focus:border-signal/50 ${
          value && !valid ? "border-risk-high/50" : "border-white/[0.06]"
        }`}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3.5 top-1.5 text-[10px] font-medium uppercase tracking-wider text-ink-faint transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-ink-faint peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-wider peer-focus:text-signal-glow"
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
