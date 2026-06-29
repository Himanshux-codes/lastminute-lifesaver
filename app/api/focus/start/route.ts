import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebaseAdmin";
import { startFocusSession } from "@/lib/focus-service";
import { z } from "zod";

const requestSchema = z.object({
  taskId: z.string().min(1),
  plannedMinutes: z.number().int().positive().max(180).default(25),
});

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request.headers.get("authorization"));
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const session = await startFocusSession(user.uid, parsed.data.taskId, parsed.data.plannedMinutes);
    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
