import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebaseAdmin";
import { listActiveTasks } from "@/lib/firestore-service";
import { simulateNewCommitment } from "@/lib/gemini";
import { z } from "zod";

const requestSchema = z.object({
  newCommitmentTitle: z.string().min(1).max(200),
  newCommitmentMinutes: z.number().int().positive().max(10000),
  newCommitmentDeadline: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request.headers.get("authorization"));
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existingTasks = await listActiveTasks(user.uid);
    const now = new Date().toISOString();

    const result = await simulateNewCommitment({
      ...parsed.data,
      existingTasks: existingTasks.map((t) => ({
        id: t.id,
        title: t.title,
        deadline: t.deadline,
        remainingMinutes: t.remainingMinutes,
        riskScore: t.riskScore,
      })),
      now,
    });

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
