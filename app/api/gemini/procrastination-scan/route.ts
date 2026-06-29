import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebaseAdmin";
import { detectStagnantTasks } from "@/lib/firestore-service";
import { generateProcrastinationAlerts } from "@/lib/gemini";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request.headers.get("authorization"));
    const stagnant = await detectStagnantTasks(user.uid);
    const alerts = await generateProcrastinationAlerts(stagnant, new Date().toISOString());
    return NextResponse.json({ alerts });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
