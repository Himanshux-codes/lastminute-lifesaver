import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebaseAdmin";
import { createHabit, listHabits, completeHabit } from "@/lib/habit-service";
import { z } from "zod";

const createHabitSchema = z.object({
  title: z.string().min(1).max(120),
  frequency: z.enum(["daily", "weekdays", "weekly"]),
});

const completeHabitSchema = z.object({
  habitId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request.headers.get("authorization"));
    const habits = await listHabits(user.uid);
    return NextResponse.json({ habits });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequestUser(request.headers.get("authorization"));
    const body = await request.json();
    const parsed = createHabitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const habit = await createHabit(user.uid, parsed.data.title, parsed.data.frequency);
    return NextResponse.json({ habit }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await verifyRequestUser(request.headers.get("authorization"));
    const body = await request.json();
    const parsed = completeHabitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const habit = await completeHabit(parsed.data.habitId);
    return NextResponse.json({ habit });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 401 });
  }
}
