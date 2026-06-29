import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebaseAdmin";
import { getTask } from "@/lib/firestore-service";
import { generateRecoveryPlan } from "@/lib/gemini";
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

    const plan = await generateRecoveryPlan({
      taskId: task.id,
      title: task.title,
      remainingMinutes: task.remainingMinutes,
      deadline: task.deadline,
      now: new Date().toISOString(),
    });

    return NextResponse.json({ plan });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
