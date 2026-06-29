import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebaseAdmin";
import { getBehavioralSnapshots, getBehavioralStats } from "@/lib/firestore-service";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request.headers.get("authorization"));
    const [snapshots, stats] = await Promise.all([
      getBehavioralSnapshots(user.uid, 14),
      getBehavioralStats(user.uid),
    ]);
    return NextResponse.json({ snapshots, stats });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
