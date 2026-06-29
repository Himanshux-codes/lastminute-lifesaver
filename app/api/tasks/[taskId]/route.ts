import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebaseAdmin";
import { getTask } from "@/lib/firestore-service";
import { adminDb } from "@/lib/firebaseAdmin";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "missed"]).optional(),
  remainingMinutes: z.number().int().min(0).max(10000).optional(),
  title: z.string().min(1).max(200).optional(),
  deadline: z.string().datetime().optional(),
  priorityScore: z.number().min(0).max(100000).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await verifyRequestUser(request.headers.get("authorization"));
    const { taskId } = await params;

    const task = await getTask(taskId);
    if (!task || task.userId !== user.uid) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await adminDb.collection("tasks").doc(taskId).update(parsed.data);
    const updated = await getTask(taskId);

    return NextResponse.json({ task: updated });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const user = await verifyRequestUser(request.headers.get("authorization"));
    const { taskId } = await params;

    const task = await getTask(taskId);
    if (!task || task.userId !== user.uid) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await adminDb.collection("tasks").doc(taskId).delete();
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 401 });
  }
}
