import { adminDb } from "@/lib/firebaseAdmin";
import { getTask } from "@/lib/firestore-service";
import type { FocusSession } from "@/types";

const FOCUS_COLLECTION = "focusSessions";

export async function startFocusSession(userId: string, taskId: string, plannedMinutes: number): Promise<FocusSession> {
  const task = await getTask(taskId);
  if (!task || task.userId !== userId) throw new Error("Task not found");

  const docRef = adminDb.collection(FOCUS_COLLECTION).doc();
  const session: FocusSession = {
    id: docRef.id,
    userId,
    taskId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    plannedMinutes,
    actualMinutes: null,
    completed: false,
  };
  await docRef.set(session);

  await adminDb.collection("tasks").doc(taskId).update({ status: "in_progress" });

  return session;
}

export async function endFocusSession(sessionId: string, completed: boolean): Promise<FocusSession> {
  const docRef = adminDb.collection(FOCUS_COLLECTION).doc(sessionId);
  const doc = await docRef.get();
  if (!doc.exists) throw new Error("Focus session not found");

  const session = doc.data() as FocusSession;
  const endedAt = new Date();
  const actualMinutes = Math.round((endedAt.getTime() - new Date(session.startedAt).getTime()) / (1000 * 60));

  const updated: FocusSession = { ...session, endedAt: endedAt.toISOString(), actualMinutes, completed };
  await docRef.set(updated);

  if (completed) {
    const task = await getTask(session.taskId);
    if (task) {
      const newRemaining = Math.max(0, task.remainingMinutes - actualMinutes);
      await adminDb
        .collection("tasks")
        .doc(session.taskId)
        .update({
          remainingMinutes: newRemaining,
          status: newRemaining === 0 ? "completed" : "in_progress",
        });
    }
  }

  return updated;
}
