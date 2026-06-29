import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebaseAdmin";
import { createTask, listActiveTasks } from "@/lib/firestore-service";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(["assignment", "exam", "meeting", "bill", "interview", "personal", "work"]),
  estimatedMinutes: z.number().int().positive().max(10000),
  deadline: z.string().datetime(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request.headers.get("authorization"));
    const tasks = await listActiveTasks(user.uid);
    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request.headers.get("authorization"));
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const task = await createTask(user.uid, {
      ...parsed.data,
      remainingMinutes: parsed.data.estimatedMinutes,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 401 });
  }
}
