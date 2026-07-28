"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Square, CheckCircle2, Timer } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { PageLoadingSkeleton } from "@/components/Skeleton";
import { ErrorRetry } from "@/components/ErrorRetry";
import { PageShell } from "@/components/PageShell";
import { apiFetch } from "@/lib/apiClient";
import type { Task, FocusSession } from "@/types";

const DURATIONS = [25, 45, 60];

export default function FocusModePage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fetchingTasks, setFetchingTasks] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [plannedMinutes, setPlannedMinutes] = useState(25);
  const [session, setSession] = useState<FocusSession | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { if (!loading && !user) router.replace("/"); }, [loading, user, router]);

  const loadTasks = useCallback(async () => {
    setFetchingTasks(true); setLoadError(null);
    try {
      const d = await apiFetch<{ tasks: Task[] }>("/api/tasks");
      setTasks(d.tasks);
      if (d.tasks.length > 0) setSelectedTaskId(d.tasks[0].id);
    } catch (e) { setLoadError((e as Error).message); }
    finally { setFetchingTasks(false); }
  }, []);

  useEffect(() => { if (user) loadTasks(); }, [user, loadTasks]);
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  async function startSession() {
    setStarting(true);
    try {
      const { session } = await apiFetch<{ session: FocusSession }>("/api/focus/start", {
        method: "POST", body: JSON.stringify({ taskId: selectedTaskId, plannedMinutes }),
      });
      setSession(session);
      setSecondsLeft(plannedMinutes * 60);
      intervalRef.current = setInterval(() => {
        setSecondsLeft((p) => { if (p <= 1) { clearInterval(intervalRef.current!); return 0; } return p - 1; });
      }, 1000);
    } catch (e) { showToast(`Couldn't start: ${(e as Error).message}`, { variant: "error" }); }
    finally { setStarting(false); }
  }

  async function endSession(completed: boolean) {
    if (!session) return;
    setEnding(true);
    clearInterval(intervalRef.current!);
    try {
      await apiFetch("/api/focus/end", {
        method: "POST", body: JSON.stringify({ sessionId: session.id, completed }),
      });
      setSession(null); setSecondsLeft(0);
    } catch (e) { showToast(`Couldn't end session: ${(e as Error).message}`, { variant: "error" }); }
    finally { setEnding(false); }
  }

  if (loading || !user) return <PageLoadingSkeleton />;

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = session ? 1 - secondsLeft / (session.plannedMinutes * 60) : 0;
  const done = secondsLeft === 0 && session;

  return (
    <PageShell
      title="Smart Focus Mode"
      subtitle="One task, one timer, zero distractions."
      badge={<span className="label-caps flex items-center gap-1.5 text-signal-glow"><Timer size={11} /> Pomodoro-style</span>}
    >
      {fetchingTasks ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-signal/30 border-t-signal" />
        </div>
      ) : loadError ? (
        <ErrorRetry message={`Couldn't load tasks: ${loadError}`} onRetry={loadTasks} />
      ) : !session ? (
        tasks.length === 0 ? (
          <p className="text-sm text-ink-muted">No active tasks. Add one from the dashboard first.</p>
        ) : (
          <div className="card space-y-5 p-6">
            <div>
              <label className="label-caps mb-2 block">Select task</label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="input-base"
              >
                {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div>
              <label className="label-caps mb-2 block">Duration</label>
              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setPlannedMinutes(d)}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                      plannedMinutes === d
                        ? "bg-signal text-white shadow-glow"
                        : "border border-white/[0.08] bg-white/[0.03] text-ink-muted hover:text-ink"
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>
            <button onClick={startSession} disabled={starting} className="btn-primary w-full justify-center py-3">
              <Play size={15} /> {starting ? "Starting…" : "Start focus session"}
            </button>
          </div>
        )
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card flex flex-col items-center p-8 sm:p-10"
        >
          <p className="label-caps mb-1.5">Focusing on</p>
          <p className="mb-7 max-w-xs text-center font-display text-base font-semibold text-ink">
            {selectedTask?.title}
          </p>
          <TimerRing progress={progress} done={!!done} />
          <p className="mt-5 font-display text-5xl font-bold tracking-tighter text-ink tabular-nums">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </p>
          {done ? (
            <button
              onClick={() => endSession(true)}
              disabled={ending}
              className="mt-6 btn-primary"
              style={{ background: "linear-gradient(145deg,#34D399,#059669)" }}
            >
              <CheckCircle2 size={15} /> Mark complete
            </button>
          ) : (
            <button onClick={() => endSession(false)} disabled={ending} className="mt-6 btn-secondary">
              <Square size={14} /> End early
            </button>
          )}
        </motion.div>
      )}
    </PageShell>
  );
}

function TimerRing({ progress, done }: { progress: number; done: boolean }) {
  const R = 88, C = 2 * Math.PI * R;
  const color = done ? "#34D399" : "#6E63FF";
  return (
    <svg width={210} height={210} viewBox="0 0 210 210">
      <circle cx={105} cy={105} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={10} />
      <circle
        cx={105} cy={105} r={R}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C - progress * C}
        transform="rotate(-90 105 105)"
        style={{
          transition: "stroke-dashoffset 1s linear",
          filter: `drop-shadow(0 0 10px ${color}60)`,
        }}
      />
    </svg>
  );
}
