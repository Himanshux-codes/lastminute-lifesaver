"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Loader2, Plus, RefreshCcw, Sparkles, UserCircle2, Settings as SettingsIcon } from "lucide-react";
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
import { DEMO_TASKS, DEMO_NUDGE } from "@/lib/demoData";
import type { Task, RiskAssessmentResult } from "@/types";

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

  if (!isDemo && (loading || !user)) {
    return <PageLoadingSkeleton />;
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        {!isDemo && <OnboardingWalkthrough />}

        {isDemo && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-signal/30 bg-signal/10 px-4 py-2.5 text-xs text-signal-glow">
            <Sparkles size={14} />
            You&apos;re viewing demo data — nothing here is saved.{" "}
            <a href="/" className="underline">
              Sign in
            </a>{" "}
            to use your own tasks.
          </div>
        )}

        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-faint">Chief of Staff</p>
            <h1 className="font-display text-xl font-medium text-ink sm:text-2xl">
              Good to see you, {isDemo ? "explorer" : user?.displayName?.split(" ")[0] ?? "there"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {!isDemo && (
              <>
                <a href="/profile" aria-label="Profile" className="text-ink-faint hover:text-ink-muted">
                  <UserCircle2 size={18} />
                </a>
                <a href="/settings" aria-label="Settings" className="text-ink-faint hover:text-ink-muted">
                  <SettingsIcon size={18} />
                </a>
                <button onClick={logOut} className="text-xs text-ink-faint hover:text-ink-muted">
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

        <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={runRiskScan}
            disabled={scoring || tasks.length === 0}
            className="flex items-center gap-2 rounded-full bg-signal px-4 py-2 text-sm font-medium text-white shadow-glow transition disabled:opacity-50"
          >
            {scoring ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
            Run risk scan
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-ink-muted transition hover:text-ink"
          >
            <Plus size={14} /> Add task
          </button>
          <a href="/deadline-radar" className="rounded-full border border-white/10 px-4 py-2 text-sm text-ink-muted transition hover:text-ink">
            Deadline radar
          </a>
          <a href="/goal-planner" className="rounded-full border border-white/10 px-4 py-2 text-sm text-ink-muted transition hover:text-ink">
            Goal planner
          </a>
          <a href="/voice-assistant" className="rounded-full border border-white/10 px-4 py-2 text-sm text-ink-muted transition hover:text-ink">
            Voice assistant
          </a>
          <a href="/analytics" className="rounded-full border border-white/10 px-4 py-2 text-sm text-ink-muted transition hover:text-ink">
            Analytics
          </a>
          <a href="/life-risk" className="rounded-full border border-white/10 px-4 py-2 text-sm text-ink-muted transition hover:text-ink">
            Life risk score
          </a>
          <a href="/simulate" className="rounded-full border border-white/10 px-4 py-2 text-sm text-ink-muted transition hover:text-ink">
            Simulate commitment
          </a>
          <a href="/focus" className="rounded-full border border-white/10 px-4 py-2 text-sm text-ink-muted transition hover:text-ink">
            Focus mode
          </a>
        </div>

        {isDemo ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-signal/30 bg-signal/5 p-4">
            <Sparkles size={16} className="mt-0.5 text-signal-glow" />
            <div>
              <p className="text-sm text-ink">{DEMO_NUDGE.message}</p>
              <p className="mt-1 text-xs text-ink-muted">Next: {DEMO_NUDGE.focusSuggestion}</p>
            </div>
          </div>
        ) : (
          <>
            <AccountabilityBanner />
            <HabitTracker />
          </>
        )}

        {showForm && <NewTaskForm onCreated={loadTasks} onClose={() => setShowForm(false)} isDemo={isDemo} />}

        {fetching ? (
          <TaskListSkeleton />
        ) : tasks.length === 0 ? (
          !showForm && (
            <EmptyState
              title="No active commitments yet"
              description="Add your first task and the Risk Prediction Agent will start watching it for you."
              action={
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-signal px-4 py-2 text-sm font-medium text-white shadow-glow"
                >
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

  return (
    <div className="mb-6 rounded-2xl border border-white/5 bg-base-800/60 p-5">
      <label htmlFor="new-task-title" className="sr-only">
        Task title
      </label>
      <input
        id="new-task-title"
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Database Systems assignment"
        className="mb-3 w-full rounded-lg bg-base-700/60 px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint"
      />
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="new-task-minutes" className="sr-only">
            Estimated minutes
          </label>
          <input
            id="new-task-minutes"
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            placeholder="Estimated minutes"
            className="w-full rounded-lg bg-base-700/60 px-3 py-2 text-sm text-ink outline-none"
          />
        </div>
        <div>
          <label htmlFor="new-task-deadline" className="sr-only">
            Deadline
          </label>
          <input
            id="new-task-deadline"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full rounded-lg bg-base-700/60 px-3 py-2 text-sm text-ink outline-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-full bg-signal px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add task"}
        </button>
        <button onClick={onClose} className="px-4 py-2 text-sm text-ink-faint">
          Cancel
        </button>
        <span className="text-xs text-ink-faint" aria-live="polite">
          {saved ? "Draft saved" : ""}
        </span>
      </div>
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
