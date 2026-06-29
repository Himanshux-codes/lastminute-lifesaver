"use client";

import { useEffect, useState } from "react";
import { Flame, Plus, Check, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import type { Habit } from "@/types";

export function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [fetching, setFetching] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    apiFetch<{ habits: Habit[] }>("/api/habits")
      .then((data) => setHabits(data.habits))
      .finally(() => setFetching(false));
  }, []);

  async function addHabit() {
    if (!newTitle.trim()) return;
    const { habit } = await apiFetch<{ habit: Habit }>("/api/habits", {
      method: "POST",
      body: JSON.stringify({ title: newTitle, frequency: "daily" }),
    });
    setHabits((prev) => [...prev, habit]);
    setNewTitle("");
    setAdding(false);
  }

  async function complete(habitId: string) {
    const { habit } = await apiFetch<{ habit: Habit }>("/api/habits", {
      method: "PATCH",
      body: JSON.stringify({ habitId }),
    });
    setHabits((prev) => prev.map((h) => (h.id === habitId ? habit : h)));
  }

  if (fetching) {
    return (
      <div className="mb-6 flex items-center gap-2 text-xs text-ink-faint">
        <Loader2 size={12} className="animate-spin" /> Loading habits...
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">Habits</p>
        <button onClick={() => setAdding((a) => !a)} className="text-xs text-signal-glow">
          <Plus size={12} className="inline" /> Add
        </button>
      </div>

      {adding && (
        <div className="mb-3 flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. 30 min DSA practice"
            className="flex-1 rounded-lg bg-base-700/60 px-3 py-1.5 text-xs text-ink outline-none placeholder:text-ink-faint"
          />
          <button onClick={addHabit} className="rounded-lg bg-signal px-3 py-1.5 text-xs font-medium text-white">
            Save
          </button>
        </div>
      )}

      {habits.length === 0 ? (
        <p className="text-xs text-ink-faint">No habits tracked yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {habits.map((h) => (
            <button
              key={h.id}
              onClick={() => complete(h.id)}
              className="flex items-center gap-2 rounded-full border border-white/5 bg-base-800/60 px-3 py-1.5 text-xs text-ink-muted transition hover:border-signal/40"
            >
              <Check size={12} />
              {h.title}
              <span className="flex items-center gap-0.5 text-risk-medium">
                <Flame size={11} /> {h.currentStreak}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
