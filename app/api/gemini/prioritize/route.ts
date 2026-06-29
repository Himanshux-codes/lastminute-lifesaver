import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebaseAdmin";
import { listActiveTasks } from "@/lib/firestore-service";
import { prioritizeTasks } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request.headers.get("authorization"));
    const tasks = await listActiveTasks(user.uid);

    if (tasks.length === 0) {
      return NextResponse.json({ rankings: [] });
    }

    const rankings = await prioritizeTasks(
      tasks.map((t) => ({
        id: t.id,
        title: t.title,
        deadline: t.deadline,
        remainingMinutes: t.remainingMinutes,
        riskScore: t.riskScore,
      })),
      new Date().toISOString()
    );

    return NextResponse.json({ rankings });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
