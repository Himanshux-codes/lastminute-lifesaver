"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { computeProgress, type ProgressSummary } from "@/lib/achievements";
import type { BehavioralSnapshot, Habit } from "@/types";

export function AchievementsPanel() {
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<{ snapshots: BehavioralSnapshot[] }>("/api/analytics/summary"),
      apiFetch<{ habits: Habit[] }>("/api/habits"),
    ])
      .then(([analytics, habitsData]) => {
        setProgress(computeProgress(analytics.snapshots, habitsData.habits));
      })
      .catch(() => setProgress(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink-faint">
        <Loader2 size={12} className="animate-spin" /> Calculating progress...
      </div>
    );
  }

  if (!progress) return null;

  const percentToNextLevel = Math.round((progress.xpIntoLevel / progress.xpForNextLevel) * 100);

  return (
    <div>
      <div className="rounded-2xl border border-signal/20 bg-signal/5 p-5">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-medium text-ink">Level {progress.level}</p>
          <p className="text-xs text-ink-faint">{progress.xp} XP total</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-base-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentToNextLevel}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full bg-signal"
          />
        </div>
        <p className="mt-1.5 text-xs text-ink-faint">
          {progress.xpIntoLevel} / {progress.xpForNextLevel} XP to level {progress.level + 1}
        </p>
      </div>

      <p className="mb-3 mt-6 text-xs font-medium uppercase tracking-wider text-ink-faint">Badges</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {progress.achievements.map((a) => (
          <div
            key={a.id}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center ${
              a.unlocked ? "border-signal/30 bg-signal/5" : "border-white/5 bg-base-800/30 opacity-50"
            }`}
          >
            <Award size={18} className={a.unlocked ? "text-signal-glow" : "text-ink-faint"} />
            <p className="text-xs font-medium text-ink">{a.label}</p>
            <p className="text-[10px] leading-snug text-ink-faint">{a.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
