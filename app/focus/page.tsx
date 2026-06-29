"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Play, Square, Timer } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingSkeleton } from "@/components/Skeleton";
import { apiFetch } from "@/lib/apiClient";
import type { Task, FocusSession } from "@/types";

const DURATIONS = [25, 45, 60];

export default function FocusModePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [fetchingTasks, setFetchingTasks] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [plannedMinutes, setPlannedMinutes] = useState(25);
  const [session, setSession] = useState<FocusSession | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [ending, setEnding] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    apiFetch<{ tasks: Task[] }>("/api/tasks")
      .then((data) => {
        setTasks(data.tasks);
        if (data.tasks.length > 0) setSelectedTaskId(data.tasks[0].id);
      })
      .finally(() => setFetchingTasks(false));
  }, [user]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function startSession() {
    if (!selectedTaskId) return;
    const { session } = await apiFetch<{ session: FocusSession }>("/api/focus/start", {
      method: "POST",
      body: JSON.stringify({ taskId: selectedTaskId, plannedMinutes }),
    });
    setSession(session);
    setSecondsLeft(plannedMinutes * 60);

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function endSession(completed: boolean) {
    if (!session) return;
    setEnding(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    try {
      await apiFetch("/api/focus/end", {
        method: "POST",
        body: JSON.stringify({ sessionId: session.id, completed }),
      });
      setSession(null);
      setSecondsLeft(0);
    } finally {
      setEnding(false);
    }
  }

  if (loading || !user) {
    return <PageLoadingSkeleton />;
  }

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = session ? 1 - secondsLeft / (session.plannedMinutes * 60) : 0;

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-md">
        <a href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink-muted">
          <ArrowLeft size={12} /> Back to dashboard
        </a>

        <h1 className="font-display text-2xl font-medium text-ink">Smart Focus Mode</h1>
        <p className="mt-1 mb-8 text-sm text-ink-muted">One task, one timer, zero distractions.</p>

        {fetchingTasks ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-ink-faint" />
          </div>
        ) : !session ? (
          tasks.length === 0 ? (
            <p className="text-sm text-ink-muted">No active tasks. Add one from the dashboard first.</p>
          ) : (
            <div className="space-y-4 rounded-2xl border border-white/5 bg-base-800/60 p-5">
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full rounded-lg bg-base-700/60 px-3 py-2 text-sm text-ink outline-none"
              >
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setPlannedMinutes(d)}
                    className={`flex-1 rounded-lg py-2 text-sm transition ${
                      plannedMinutes === d ? "bg-signal text-white" : "bg-base-700/60 text-ink-muted"
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>

              <button
                onClick={startSession}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-signal px-5 py-3 text-sm font-medium text-white shadow-glow"
              >
                <Play size={14} /> Start focus session
              </button>
            </div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center rounded-2xl border border-white/5 bg-base-800/60 p-8"
          >
            <p className="mb-1 text-xs uppercase tracking-wider text-ink-faint">Focusing on</p>
            <p className="mb-6 text-center font-display text-sm font-medium text-ink">{selectedTask?.title}</p>

            <TimerRing progress={progress} />
            <p className="mt-4 font-display text-4xl font-medium text-ink">
              {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
            </p>

            {secondsLeft === 0 ? (
              <button
                onClick={() => endSession(true)}
                disabled={ending}
                className="mt-6 flex items-center gap-2 rounded-full bg-risk-low px-5 py-2.5 text-sm font-medium text-base-950 disabled:opacity-50"
              >
                <Timer size={14} /> Mark session complete
              </button>
            ) : (
              <button
                onClick={() => endSession(false)}
                disabled={ending}
                className="mt-6 flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm text-ink-muted disabled:opacity-50"
              >
                <Square size={14} /> End early
              </button>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}

function TimerRing({ progress }: { progress: number }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - Math.min(1, Math.max(0, progress)) * circumference;

  return (
    <svg width={190} height={190} viewBox="0 0 190 190">
      <circle cx={95} cy={95} r={radius} fill="none" stroke="#1A2238" strokeWidth={10} />
      <circle
        cx={95}
        cy={95}
        r={radius}
        fill="none"
        stroke="#6E63FF"
        strokeWidth={10}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 95 95)"
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
    </svg>
  );
}
