import { adminDb } from "@/lib/firebaseAdmin";
import type { Task, RiskAssessmentResult, BehavioralSnapshot, PushToken } from "@/types";

const TASKS_COLLECTION = "tasks";
const PUSH_TOKENS_COLLECTION = "pushTokens";

export async function createTask(userId: string, data: Omit<Task, "id" | "userId" | "createdAt" | "status">) {
  const docRef = adminDb.collection(TASKS_COLLECTION).doc();
  const task: Task = {
    ...data,
    id: docRef.id,
    userId,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await docRef.set(task);
  return task;
}

export async function listActiveTasks(userId: string): Promise<Task[]> {
  const snapshot = await adminDb
    .collection(TASKS_COLLECTION)
    .where("userId", "==", userId)
    .where("status", "in", ["pending", "in_progress"])
    .get();
  return snapshot.docs.map((d) => d.data() as Task);
}

export async function getTask(taskId: string): Promise<Task | null> {
  const doc = await adminDb.collection(TASKS_COLLECTION).doc(taskId).get();
  return doc.exists ? (doc.data() as Task) : null;
}

export async function updateTaskRisk(taskId: string, risk: RiskAssessmentResult) {
  await adminDb.collection(TASKS_COLLECTION).doc(taskId).update({
    riskScore: risk.riskScore,
    riskLevel: risk.riskLevel,
    riskReason: risk.reasoning,
    riskConfidence: risk.confidence,
  });
}

export async function updateTaskStatus(taskId: string, status: Task["status"]) {
  await adminDb.collection(TASKS_COLLECTION).doc(taskId).update({ status });
}

/**
 * Sums remaining work across all of a user's active tasks.
 * Used as the "currentWorkloadMinutes" signal fed into the Risk Prediction Agent.
 */
export async function getCurrentWorkloadMinutes(userId: string): Promise<number> {
  const tasks = await listActiveTasks(userId);
  return tasks.reduce((sum, t) => sum + (t.remainingMinutes ?? 0), 0);
}

/**
 * Looks at the user's last 14 days of resolved tasks to compute:
 * - recentCompletionRate: fraction completed on time (not missed)
 * - procrastinationIndex: how close to the deadline tasks were typically finished
 */
export async function getBehavioralStats(userId: string): Promise<{
  recentCompletionRate: number;
  procrastinationIndex: number;
}> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Intentionally only two filter fields here (userId equality + createdAt range), which
  // Firestore can serve with its automatic indexes. Adding a third filter like
  // .where("status", "in", [...]) turns this into an equality + range + "in" composite
  // query, which Firestore does NOT auto-index — it throws FAILED_PRECONDITION at runtime
  // on any project that hasn't had that exact composite index manually deployed. Filtering
  // status in memory below avoids that landmine entirely.
  const snapshot = await adminDb
    .collection(TASKS_COLLECTION)
    .where("userId", "==", userId)
    .where("createdAt", ">=", fourteenDaysAgo)
    .get();

  const resolved = snapshot.docs
    .map((d) => d.data() as Task)
    .filter((t) => t.status === "completed" || t.status === "missed");

  if (resolved.length === 0) {
    // No history yet — neutral priors so a new user isn't unfairly flagged.
    return { recentCompletionRate: 0.7, procrastinationIndex: 0.4 };
  }

  const completed = resolved.filter((t) => t.status === "completed");
  const recentCompletionRate = completed.length / resolved.length;

  // Procrastination index: ratio of (estimated minutes / total minutes between
  // creation and deadline) — tasks worked on close to the deadline score higher.
  const ratios = resolved.map((t) => {
    const totalWindowMinutes = Math.max(
      1,
      (new Date(t.deadline).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60)
    );
    return Math.min(1, t.estimatedMinutes / totalWindowMinutes);
  });
  const procrastinationIndex = ratios.reduce((a, b) => a + b, 0) / ratios.length;

  return { recentCompletionRate, procrastinationIndex };
}

/**
 * Procrastination Detection Engine - rule-based signal layer.
 * A task is "stagnant" if meaningful time has passed since it was created but the
 * user hasn't logged any progress (remainingMinutes is unchanged from the original
 * estimate) and the deadline is close enough that this matters.
 */
export async function detectStagnantTasks(userId: string): Promise<
  { taskId: string; taskTitle: string; stagnantHours: number; hoursUntilDeadline: number }[]
> {
  const tasks = await listActiveTasks(userId);
  const now = Date.now();

  return tasks
    .filter((t) => t.status === "pending" && t.remainingMinutes === t.estimatedMinutes)
    .map((t) => {
      const stagnantHours = (now - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
      const hoursUntilDeadline = (new Date(t.deadline).getTime() - now) / (1000 * 60 * 60);
      return { taskId: t.id, taskTitle: t.title, stagnantHours, hoursUntilDeadline };
    })
    .filter((t) => t.stagnantHours >= 12 && t.hoursUntilDeadline > 0 && t.hoursUntilDeadline < 168);
}
export async function getBehavioralSnapshots(userId: string, days: number = 14): Promise<BehavioralSnapshot[]> {
  const windowStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const snapshot = await adminDb
    .collection(TASKS_COLLECTION)
    .where("userId", "==", userId)
    .where("createdAt", ">=", windowStart.toISOString())
    .get();

  const tasks = snapshot.docs.map((d) => d.data() as Task);

  const buckets = new Map<string, { completed: number; missed: number; riskSum: number; riskCount: number }>();

  for (let i = 0; i < days; i++) {
    const day = new Date(windowStart.getTime() + i * 24 * 60 * 60 * 1000);
    buckets.set(day.toDateString(), { completed: 0, missed: 0, riskSum: 0, riskCount: 0 });
  }

  for (const task of tasks) {
    const dayKey = new Date(task.deadline).toDateString();
    const bucket = buckets.get(dayKey);
    if (!bucket) continue;

    if (task.status === "completed") bucket.completed += 1;
    if (task.status === "missed") bucket.missed += 1;
    if (typeof task.riskScore === "number") {
      bucket.riskSum += task.riskScore;
      bucket.riskCount += 1;
    }
  }

  return Array.from(buckets.entries()).map(([dateKey, b]) => ({
    date: new Date(dateKey).toISOString(),
    tasksCompleted: b.completed,
    tasksMissed: b.missed,
    averageRiskScore: b.riskCount > 0 ? Math.round(b.riskSum / b.riskCount) : 0,
    focusMinutes: b.completed * 45, // approximation until Focus Session tracking lands in a later batch
  }));
}

/**
 * Notification Agent support: registers a device's FCM token for the user (idempotent —
 * re-registering the same token just overwrites the existing record) and looks tokens up
 * again when it's time to actually send a push.
 */
export async function savePushToken(userId: string, token: string): Promise<PushToken> {
  const docRef = adminDb.collection(PUSH_TOKENS_COLLECTION).doc(token);
  const record: PushToken = { id: token, userId, token, createdAt: new Date().toISOString() };
  await docRef.set(record);
  return record;
}

export async function getPushTokens(userId: string): Promise<string[]> {
  const snapshot = await adminDb.collection(PUSH_TOKENS_COLLECTION).where("userId", "==", userId).get();
  return snapshot.docs.map((d) => (d.data() as PushToken).token);
}
