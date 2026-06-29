import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebaseAdmin";
import { savePushToken } from "@/lib/firestore-service";
import { z } from "zod";

const requestSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request.headers.get("authorization"));
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const record = await savePushToken(user.uid, parsed.data.token);
    return NextResponse.json({ registered: true, record });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 401 });
  }
}
