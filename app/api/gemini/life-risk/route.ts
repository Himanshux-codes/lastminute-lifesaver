import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebaseAdmin";
import { listActiveTasks, getBehavioralStats } from "@/lib/firestore-service";
import { computeLifeRiskScore } from "@/lib/gemini";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request.headers.get("authorization"));
    const [tasks, stats] = await Promise.all([listActiveTasks(user.uid), getBehavioralStats(user.uid)]);

    const now = new Date();
    const totalWorkloadMinutes = tasks.reduce((sum, t) => sum + t.remainingMinutes, 0);
    const criticalOrHighRiskCount = tasks.filter((t) => t.riskLevel === "critical" || t.riskLevel === "high").length;
    const nearestDeadlineMs = tasks.length
      ? Math.min(...tasks.map((t) => new Date(t.deadline).getTime() - now.getTime()))
      : 7 * 24 * 60 * 60 * 1000;

    const score = await computeLifeRiskScore({
      activeTaskCount: tasks.length,
      criticalOrHighRiskCount,
      totalWorkloadMinutes,
      hoursUntilNearestDeadline: Math.max(0, nearestDeadlineMs / (1000 * 60 * 60)),
      recentCompletionRate: stats.recentCompletionRate,
      procrastinationIndex: stats.procrastinationIndex,
      now: now.toISOString(),
    });

    return NextResponse.json({ score });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
