import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebaseAdmin";
import { generateGoalPlan } from "@/lib/gemini";
import { createTask } from "@/lib/firestore-service";
import { z } from "zod";

const requestSchema = z.object({
  goalTitle: z.string().min(1).max(200),
  finalDeadline: z.string().datetime(),
  context: z.string().max(1000).optional(),
  persistAsTasks: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request.headers.get("authorization"));
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const now = new Date().toISOString();
    const plan = await generateGoalPlan({
      goalTitle: parsed.data.goalTitle,
      finalDeadline: parsed.data.finalDeadline,
      now,
      context: parsed.data.context,
    });

    if (parsed.data.persistAsTasks) {
      await Promise.all(
        plan.subtasks.map((s) =>
          createTask(user.uid, {
            title: s.title,
            category: s.category,
            estimatedMinutes: s.estimatedMinutes,
            remainingMinutes: s.estimatedMinutes,
            deadline: s.suggestedDeadline,
          })
        )
      );
    }

    return NextResponse.json({ plan });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
