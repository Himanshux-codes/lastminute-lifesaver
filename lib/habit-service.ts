import { adminDb } from "@/lib/firebaseAdmin";
import type { Habit, HabitFrequency } from "@/types";

const HABITS_COLLECTION = "habits";

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function isYesterday(a: Date, b: Date): boolean {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const diff = Math.round((b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0)) / oneDayMs);
  return diff === 1;
}

export async function createHabit(userId: string, title: string, frequency: HabitFrequency): Promise<Habit> {
  const docRef = adminDb.collection(HABITS_COLLECTION).doc();
  const habit: Habit = {
    id: docRef.id,
    userId,
    title,
    frequency,
    createdAt: new Date().toISOString(),
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedAt: null,
    completionLog: [],
  };
  await docRef.set(habit);
  return habit;
}

export async function listHabits(userId: string): Promise<Habit[]> {
  const snapshot = await adminDb.collection(HABITS_COLLECTION).where("userId", "==", userId).get();
  return snapshot.docs.map((d) => d.data() as Habit);
}

/**
 * Marks a habit complete for "today" and recalculates the streak.
 * Streak increments if the last completion was yesterday, stays the same if it's
 * already today (idempotent double-tap), and resets to 1 if there was a gap.
 */
export async function completeHabit(habitId: string): Promise<Habit> {
  const docRef = adminDb.collection(HABITS_COLLECTION).doc(habitId);
  const doc = await docRef.get();
  if (!doc.exists) throw new Error("Habit not found");

  const habit = doc.data() as Habit;
  const now = new Date();
  const last = habit.lastCompletedAt ? new Date(habit.lastCompletedAt) : null;

  let nextStreak = habit.currentStreak;

  if (!last) {
    nextStreak = 1;
  } else if (isSameDay(new Date(last), now)) {
    nextStreak = habit.currentStreak; // already logged today
  } else if (isYesterday(new Date(last), new Date(now))) {
    nextStreak = habit.currentStreak + 1;
  } else {
    nextStreak = 1; // streak broken
  }

  const updated: Habit = {
    ...habit,
    currentStreak: nextStreak,
    longestStreak: Math.max(habit.longestStreak, nextStreak),
    lastCompletedAt: now.toISOString(),
    completionLog: [...habit.completionLog, now.toISOString()],
  };

  await docRef.set(updated);
  return updated;
}
