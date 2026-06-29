import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebaseAdmin";
import { listHabits } from "@/lib/habit-service";
import { listActiveTasks, getBehavioralStats } from "@/lib/firestore-service";
import { generateAccountabilityNudge } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request.headers.get("authorization"));

    const [habits, activeTasks, stats] = await Promise.all([
      listHabits(user.uid),
      listActiveTasks(user.uid),
      getBehavioralStats(user.uid),
    ]);

    const now = new Date();
    const overdueTaskCount = activeTasks.filter((t) => new Date(t.deadline) < now).length;

    const nudge = await generateAccountabilityNudge({
      habits: habits.map((h) => ({
        title: h.title,
        currentStreak: h.currentStreak,
        longestStreak: h.longestStreak,
      })),
      recentCompletionRate: stats.recentCompletionRate,
      overdueTaskCount,
      now: now.toISOString(),
    });

    return NextResponse.json({ nudge });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
