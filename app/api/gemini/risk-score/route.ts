import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebaseAdmin";
import { getTask, updateTaskRisk, getCurrentWorkloadMinutes, getBehavioralStats } from "@/lib/firestore-service";
import { assessTaskRisk } from "@/lib/gemini";
import { sendPushNotification } from "@/lib/push-service";
import { z } from "zod";

const requestSchema = z.object({
  taskId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request.headers.get("authorization"));
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const task = await getTask(parsed.data.taskId);
    if (!task || task.userId !== user.uid) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const [currentWorkloadMinutes, behavioralStats] = await Promise.all([
      getCurrentWorkloadMinutes(user.uid),
      getBehavioralStats(user.uid),
    ]);

    const risk = await assessTaskRisk({
      task: {
        title: task.title,
        category: task.category,
        estimatedMinutes: task.estimatedMinutes,
        remainingMinutes: task.remainingMinutes,
        deadline: task.deadline,
        status: task.status,
      },
      now: new Date().toISOString(),
      currentWorkloadMinutes,
      recentCompletionRate: behavioralStats.recentCompletionRate,
      procrastinationIndex: behavioralStats.procrastinationIndex,
    });

    await updateTaskRisk(task.id, risk);

    if (risk.riskLevel === "critical") {
      // Best-effort — the Notification Agent should never block the risk-scan response.
      void sendPushNotification(user.uid, {
        title: "Critical deadline risk",
        body: `"${task.title}" is at critical risk of being missed. ${risk.recommendedAction}`,
        data: { taskId: task.id, type: "critical_risk" },
      });
    }

    return NextResponse.json({ risk });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
