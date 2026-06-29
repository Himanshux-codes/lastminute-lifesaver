import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebaseAdmin";
import { interpretVoiceCommand } from "@/lib/gemini";
import { createTask } from "@/lib/firestore-service";
import { z } from "zod";

const requestSchema = z.object({
  transcript: z.string().min(1).max(2000),
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
    const interpretation = await interpretVoiceCommand({ transcript: parsed.data.transcript, now });

    if (parsed.data.persistAsTasks) {
      await Promise.all(
        interpretation.goals.flatMap((goal) =>
          goal.subtasks.map((s) =>
            createTask(user.uid, {
              title: `${goal.goalTitle}: ${s.title}`,
              category: s.category,
              estimatedMinutes: s.estimatedMinutes,
              remainingMinutes: s.estimatedMinutes,
              deadline: s.suggestedDeadline,
            })
          )
        )
      );
    }

    return NextResponse.json({ interpretation });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
