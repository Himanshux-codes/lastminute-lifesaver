import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebaseAdmin";
import { endFocusSession } from "@/lib/focus-service";
import { z } from "zod";

const requestSchema = z.object({
  sessionId: z.string().min(1),
  completed: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    await verifyRequestUser(request.headers.get("authorization"));
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const session = await endFocusSession(parsed.data.sessionId, parsed.data.completed);
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
