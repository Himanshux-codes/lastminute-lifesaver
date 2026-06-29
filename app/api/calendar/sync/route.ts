import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebaseAdmin";
import { fetchUpcomingCalendarEvents } from "@/lib/googleCalendar";
import { createTask } from "@/lib/firestore-service";
import { z } from "zod";

const requestSchema = z.object({
  googleAccessToken: z.string().min(1),
  daysAhead: z.number().int().positive().max(60).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request.headers.get("authorization"));
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const events = await fetchUpcomingCalendarEvents(parsed.data.googleAccessToken, parsed.data.daysAhead ?? 14);

    const imported = await Promise.all(
      events.map((event) => {
        const durationMinutes = Math.max(
          15,
          Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60))
        );
        return createTask(user.uid, {
          title: event.title,
          description: event.description,
          category: "meeting",
          estimatedMinutes: durationMinutes,
          remainingMinutes: durationMinutes,
          deadline: event.start,
        });
      })
    );

    return NextResponse.json({ imported: imported.length, tasks: imported });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
