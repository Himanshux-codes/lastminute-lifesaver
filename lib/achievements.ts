import type { BehavioralSnapshot, Habit } from "@/types";

export interface Achievement {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
}

export interface ProgressSummary {
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  achievements: Achievement[];
}

const XP_PER_LEVEL = 250;

export function computeProgress(snapshots: BehavioralSnapshot[], habits: Habit[]): ProgressSummary {
  const totalCompleted = snapshots.reduce((sum, s) => sum + s.tasksCompleted, 0);
  const totalMissed = snapshots.reduce((sum, s) => sum + s.tasksMissed, 0);
  const longestHabitStreak = habits.reduce((max, h) => Math.max(max, h.longestStreak), 0);
  const activeStreaks = habits.filter((h) => h.currentStreak > 0).length;

  // Simple, transparent scoring: completions earn XP, missed deadlines cost a little,
  // habit streaks compound. Floors at 0 so a rough week never goes negative.
  const xp = Math.max(0, totalCompleted * 20 - totalMissed * 8 + longestHabitStreak * 5);
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xp % XP_PER_LEVEL;

  const achievements: Achievement[] = [
    {
      id: "first-completion",
      label: "First Save",
      description: "Complete your first task",
      unlocked: totalCompleted >= 1,
    },
    {
      id: "ten-completions",
      label: "Momentum",
      description: "Complete 10 tasks",
      unlocked: totalCompleted >= 10,
    },
    {
      id: "streak-3",
      label: "On a Roll",
      description: "Hit a 3-day habit streak",
      unlocked: longestHabitStreak >= 3,
    },
    {
      id: "streak-7",
      label: "Unbreakable",
      description: "Hit a 7-day habit streak",
      unlocked: longestHabitStreak >= 7,
    },
    {
      id: "no-misses",
      label: "Zero Misses",
      description: "14 days with no missed deadlines",
      unlocked: totalMissed === 0 && totalCompleted > 0,
    },
    {
      id: "multi-streak",
      label: "Juggler",
      description: "Keep 2+ habits active at once",
      unlocked: activeStreaks >= 2,
    },
  ];

  return { xp, level, xpIntoLevel, xpForNextLevel: XP_PER_LEVEL, achievements };
}
