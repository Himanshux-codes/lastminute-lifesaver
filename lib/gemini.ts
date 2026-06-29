import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";
import type {
  RiskAssessmentInput,
  RiskAssessmentResult,
  RecoveryPlan,
  GoalPlan,
  PlannedSubtask,
  PrioritizedTask,
  Task,
  AccountabilityNudge,
  Habit,
  LifeRiskScore,
  ProcrastinationAlert,
  SimulationResult,
} from "@/types";

let cachedGenAI: GoogleGenerativeAI | null = null;

/**
 * Lazily constructs the Gemini client. GEMINI_API_KEY is only read and validated the first
 * time a request handler actually needs to call Gemini — never at module import time. This
 * keeps `next build` from crashing on every route that imports this file, even in
 * environments (like local builds, CI, or "next build" without secrets) where the key isn't
 * set yet.
 */
function getGenAI(): GoogleGenerativeAI {
  if (!cachedGenAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY environment variable");
    }
    cachedGenAI = new GoogleGenerativeAI(apiKey);
  }
  return cachedGenAI;
}

const JSON_GENERATION_CONFIG: GenerationConfig = {
  temperature: 0.4,
  responseMimeType: "application/json",
};

function getModel(systemInstruction: string) {
  return getGenAI().getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
    generationConfig: JSON_GENERATION_CONFIG,
  });
}

/** Strips markdown code fences in case the model wraps JSON despite instructions. */
function cleanJson(raw: string): string {
  return raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
}

const RISK_SYSTEM_PROMPT = `You are the Risk Prediction Agent inside an AI Chief of Staff productivity system.
Your sole job is to estimate the probability that a specific task will be completed late or missed,
given its deadline pressure, the user's current workload, and their historical behavior.

Rules:
- Output ONLY valid JSON matching the exact schema given in the user message. No prose, no markdown fences.
- riskScore is an integer 0-100 where 0 = no chance of missing the deadline, 100 = will almost certainly be missed.
- riskLevel must be exactly one of: "low" (0-29), "medium" (30-59), "high" (60-84), "critical" (85-100).
- confidence is 0-1 reflecting how much signal you actually had (low workload/history data = lower confidence).
- primaryDriver is a short label like "time_compression", "workload_overload", "procrastination_pattern", "low_risk_buffer".
- reasoning is 1-2 sentences, concrete, referencing the actual numbers given.
- recommendedAction is one concrete next step the user should take right now, phrased as a direct instruction.`;

export async function assessTaskRisk(input: RiskAssessmentInput): Promise<RiskAssessmentResult> {
  const model = getModel(RISK_SYSTEM_PROMPT);

  const hoursRemaining =
    (new Date(input.task.deadline).getTime() - new Date(input.now).getTime()) / (1000 * 60 * 60);

  const prompt = `Assess this task and return JSON with exactly these keys:
{"riskScore": number, "riskLevel": "low"|"medium"|"high"|"critical", "confidence": number, "primaryDriver": string, "reasoning": string, "recommendedAction": string}

Task: "${input.task.title}" (category: ${input.task.category})
Status: ${input.task.status}
Hours until deadline: ${hoursRemaining.toFixed(1)}
Remaining work required: ${input.task.remainingMinutes} minutes
User's current total active workload across all tasks: ${input.currentWorkloadMinutes} minutes
User's task completion rate over last 14 days: ${(input.recentCompletionRate * 100).toFixed(0)}%
User's procrastination index (0=never delays, 1=always delays until last moment): ${input.procrastinationIndex.toFixed(2)}`;

  const result = await model.generateContent(prompt);
  const text = cleanJson(result.response.text());
  const parsed = JSON.parse(text) as RiskAssessmentResult;
  return parsed;
}

const RECOVERY_SYSTEM_PROMPT = `You are the Emergency Recovery Agent inside an AI Chief of Staff productivity system.
You are activated when a task is at high/critical risk of being missed and the deadline is near.
Your job is to build a minute-by-minute survival plan that makes completion realistic, or to honestly say
it is not feasible and propose the best fallback (partial submission, asking for an extension, triage).

Rules:
- Output ONLY valid JSON matching the exact schema in the user message. No prose, no markdown fences.
- Break remaining work into focus blocks of 25-50 minutes separated by 5-10 minute short breaks.
- Include exactly one "submission_checkpoint" block near the end if feasible, scheduled before the deadline with buffer time.
- distractionsToRemove should be 3-5 concrete, specific items (e.g. "Turn off Instagram notifications", "Close all browser tabs except the assignment doc"), not generic advice.
- accountabilityMessage is a short, direct, motivating message (1-2 sentences) written as if speaking to the user right now — firm but not preachy.
- If the work genuinely cannot fit before the deadline even working continuously with realistic breaks, set feasible=false, explain why in feasibilityReason, and give concrete fallbackAdvice.`;

export async function generateRecoveryPlan(params: {
  taskId: string;
  title: string;
  remainingMinutes: number;
  deadline: string;
  now: string;
}): Promise<RecoveryPlan> {
  const model = getModel(RECOVERY_SYSTEM_PROMPT);

  const hoursUntilDeadline =
    (new Date(params.deadline).getTime() - new Date(params.now).getTime()) / (1000 * 60 * 60);

  const prompt = `Build an emergency recovery plan and return JSON with exactly these keys:
{"feasible": boolean, "feasibilityReason": string, "totalWorkMinutesRequired": number, "blocks": [{"id": string, "label": string, "startMinutesFromNow": number, "durationMinutes": number, "type": "deep_work"|"short_break"|"buffer"|"submission_checkpoint", "instructions": string}], "distractionsToRemove": string[], "accountabilityMessage": string, "fallbackAdvice": string}

Task: "${params.title}"
Remaining work required: ${params.remainingMinutes} minutes
Hours until deadline: ${hoursUntilDeadline.toFixed(2)}
Current time: ${params.now}`;

  const result = await model.generateContent(prompt);
  const text = cleanJson(result.response.text());
  const parsed = JSON.parse(text) as Omit<RecoveryPlan, "taskId" | "generatedAt" | "hoursUntilDeadline">;

  return {
    taskId: params.taskId,
    generatedAt: params.now,
    hoursUntilDeadline,
    ...parsed,
  };
}

const VOICE_SYSTEM_PROMPT = `You are the Voice Assistant Agent inside an AI Chief of Staff productivity system.
The user speaks naturally about everything on their plate in one breath (e.g. "I have an exam in 12 days
and 4 assignments due this week"). Your job is to parse that into distinct goals, each broken into concrete
scheduled subtasks, exactly like the Planner Agent would, but handling MULTIPLE commitments at once and
resolving relative dates ("in 12 days", "this week", "tomorrow") against the given current time.

Rules:
- Output ONLY valid JSON matching the schema in the user message. No prose, no markdown fences.
- If the transcript is too vague to extract a deadline or scope for something mentioned (e.g. "an assignment"
  with no due date at all and no contextual clue), exclude it from goals and instead ask about it in
  clarifyingQuestion. Otherwise leave clarifyingQuestion as an empty string.
- Each goal's subtasks must have order starting at 1, realistic estimatedMinutes, a category from:
  assignment, exam, meeting, bill, interview, personal, work, and a suggestedDeadline ISO datetime that is
  strictly between now and that goal's final deadline, spaced out sensibly.
- Resolve all relative time expressions against "now" using real calendar math.`;

export async function interpretVoiceCommand(params: {
  transcript: string;
  now: string;
}): Promise<{
  goals: { goalTitle: string; finalDeadline: string; subtasks: PlannedSubtask[] }[];
  clarifyingQuestion: string;
}> {
  const model = getModel(VOICE_SYSTEM_PROMPT);

  const prompt = `Parse this spoken request and return JSON with exactly this shape:
{"goals": [{"goalTitle": string, "finalDeadline": string, "subtasks": [{"title": string, "estimatedMinutes": number, "order": number, "category": string, "suggestedDeadline": string}]}], "clarifyingQuestion": string}

Current time: ${params.now}
Transcript: "${params.transcript}"`;

  const result = await model.generateContent(prompt);
  const text = cleanJson(result.response.text());
  return JSON.parse(text);
}

const PLANNER_SYSTEM_PROMPT = `You are the Planner Agent inside an AI Chief of Staff productivity system.
Your job is to decompose a high-level goal (e.g. "exam in 12 days", "launch my side project") into a
concrete, ordered list of subtasks with realistic time estimates and suggested deadlines, each spaced out
sensibly between now and the final deadline so the user never has to cram everything into one session.

Rules:
- Output ONLY valid JSON matching the schema in the user message. No prose, no markdown fences.
- Produce between 3 and 12 subtasks depending on the scope of the goal — don't pad or over-split.
- order starts at 1 and increases sequentially.
- suggestedDeadline must be a real ISO 8601 datetime strictly between "now" and the final deadline, spaced
  out so subtasks don't all cluster right before the deadline.
- category must be one of: assignment, exam, meeting, bill, interview, personal, work.
- planningNotes is 1-2 sentences explaining the overall strategy (e.g. why this order, where buffer was left).`;

export async function generateGoalPlan(params: {
  goalTitle: string;
  finalDeadline: string;
  now: string;
  context?: string;
}): Promise<GoalPlan> {
  const model = getModel(PLANNER_SYSTEM_PROMPT);

  const prompt = `Decompose this goal and return JSON with exactly these keys:
{"subtasks": [{"title": string, "estimatedMinutes": number, "order": number, "category": string, "suggestedDeadline": string}], "totalEstimatedMinutes": number, "planningNotes": string}

Goal: "${params.goalTitle}"
Current time: ${params.now}
Final deadline: ${params.finalDeadline}
${params.context ? `Additional context: ${params.context}` : ""}`;

  const result = await model.generateContent(prompt);
  const text = cleanJson(result.response.text());
  const parsed = JSON.parse(text) as {
    subtasks: PlannedSubtask[];
    totalEstimatedMinutes: number;
    planningNotes: string;
  };

  return {
    goalTitle: params.goalTitle,
    generatedAt: params.now,
    ...parsed,
  };
}

const PRIORITIZATION_SYSTEM_PROMPT = `You are the Prioritization Agent inside an AI Chief of Staff productivity system.
You receive a list of active tasks, each already carrying a risk score from the Risk Prediction Agent, and you
must produce a single ranked action order: what the user should work on first, second, third, etc.

Rules:
- Output ONLY valid JSON matching the schema in the user message. No prose, no markdown fences.
- Consider risk score, urgency (time until deadline), and effort (remaining minutes) together — a high-risk
  task with little remaining work should usually outrank a high-risk task that needs hours of effort but has
  more runway, because the quick win removes risk fastest.
- priorityScore is 0-100, higher = more urgent to act on right now.
- priorityRank is the 1-indexed action order across ALL given tasks, no ties, no gaps.
- reasoning is one short, concrete sentence per task referencing its actual numbers.`;

export async function prioritizeTasks(
  tasks: Pick<Task, "id" | "title" | "deadline" | "remainingMinutes" | "riskScore">[],
  now: string
): Promise<PrioritizedTask[]> {
  const model = getModel(PRIORITIZATION_SYSTEM_PROMPT);

  const taskLines = tasks
    .map((t) => {
      const hoursLeft = (new Date(t.deadline).getTime() - new Date(now).getTime()) / (1000 * 60 * 60);
      return `- id="${t.id}" title="${t.title}" hoursUntilDeadline=${hoursLeft.toFixed(1)} remainingMinutes=${t.remainingMinutes} riskScore=${t.riskScore ?? "unknown"}`;
    })
    .join("\n");

  const prompt = `Rank these tasks and return JSON with exactly this shape:
{"rankings": [{"taskId": string, "priorityScore": number, "priorityRank": number, "reasoning": string}]}

Tasks:
${taskLines}`;

  const result = await model.generateContent(prompt);
  const text = cleanJson(result.response.text());
  const parsed = JSON.parse(text) as { rankings: PrioritizedTask[] };
  return parsed.rankings;
}

const ACCOUNTABILITY_SYSTEM_PROMPT = `You are the Accountability Agent inside an AI Chief of Staff productivity system.
You send the user a short daily check-in nudge based on their actual recent behavior — habit streaks and
task completion patterns. You are not generic and you are not preachy. You speak like a sharp, supportive
chief of staff who has actually looked at the numbers.

Rules:
- Output ONLY valid JSON matching the schema in the user message. No prose, no markdown fences.
- tone must be exactly one of: "encouraging" (struggling but trying), "firm" (slipping, needs a push),
  "celebratory" (strong streak or completion rate).
- message is 1-2 sentences, references the actual streak/completion numbers given, never generic filler
  like "You've got this!" on its own — it must be earned by the data.
- focusSuggestion is one concrete, specific thing to do in the next hour.`;

export async function generateAccountabilityNudge(params: {
  habits: Pick<Habit, "title" | "currentStreak" | "longestStreak">[];
  recentCompletionRate: number;
  overdueTaskCount: number;
  now: string;
}): Promise<AccountabilityNudge> {
  const model = getModel(ACCOUNTABILITY_SYSTEM_PROMPT);

  const habitLines = params.habits
    .map((h) => `- "${h.title}": current streak ${h.currentStreak}, longest streak ${h.longestStreak}`)
    .join("\n") || "(no habits tracked yet)";

  const prompt = `Generate today's check-in and return JSON with exactly these keys:
{"tone": "encouraging"|"firm"|"celebratory", "message": string, "focusSuggestion": string}

Habits:
${habitLines}
Recent 14-day task completion rate: ${(params.recentCompletionRate * 100).toFixed(0)}%
Currently overdue tasks: ${params.overdueTaskCount}`;

  const result = await model.generateContent(prompt);
  const text = cleanJson(result.response.text());
  const parsed = JSON.parse(text) as Omit<AccountabilityNudge, "generatedAt">;

  return { generatedAt: params.now, ...parsed };
}

const LIFE_RISK_SYSTEM_PROMPT = `You are the Life Risk Engine inside an AI Chief of Staff productivity system.
You compute ONE aggregate "Life Risk Score" that represents how close the user's overall schedule is to
falling apart in the near future — not any single task, but the whole picture: total workload, how many
things are simultaneously at high risk, and their historical follow-through.

Rules:
- Output ONLY valid JSON matching the schema in the user message. No prose, no markdown fences.
- overallScore is 0-100. 0-29 = stable, 30-59 = stretched, 60-84 = overloaded, 85-100 = crisis.
- level must exactly match the score band: "low" (0-29), "medium" (30-59), "high" (60-84), "critical" (85-100).
- topContributors is 2-4 entries, each a short label (e.g. "3 tasks at critical risk", "workload exceeds
  available hours before deadlines") with an impact number 0-100 indicating how much that factor drives the
  overall score. Impacts don't need to sum to the overall score.
- summary is 1-2 sentences giving the honest, specific picture.
- recommendation is one concrete action to take right now to reduce the score fastest.`;

export async function computeLifeRiskScore(params: {
  activeTaskCount: number;
  criticalOrHighRiskCount: number;
  totalWorkloadMinutes: number;
  hoursUntilNearestDeadline: number;
  recentCompletionRate: number;
  procrastinationIndex: number;
  now: string;
}): Promise<LifeRiskScore> {
  const model = getModel(LIFE_RISK_SYSTEM_PROMPT);

  const prompt = `Compute the aggregate Life Risk Score and return JSON with exactly these keys:
{"overallScore": number, "level": "low"|"medium"|"high"|"critical", "topContributors": [{"label": string, "impact": number}], "summary": string, "recommendation": string}

Active tasks: ${params.activeTaskCount}
Tasks currently at high/critical risk: ${params.criticalOrHighRiskCount}
Total remaining workload across all tasks: ${params.totalWorkloadMinutes} minutes
Hours until the nearest deadline: ${params.hoursUntilNearestDeadline.toFixed(1)}
14-day completion rate: ${(params.recentCompletionRate * 100).toFixed(0)}%
Procrastination index (0=never delays, 1=always last-minute): ${params.procrastinationIndex.toFixed(2)}`;

  const result = await model.generateContent(prompt);
  const text = cleanJson(result.response.text());
  const parsed = JSON.parse(text) as Omit<LifeRiskScore, "generatedAt">;
  return { generatedAt: params.now, ...parsed };
}

const PROCRASTINATION_SYSTEM_PROMPT = `You are the Procrastination Detection Agent inside an AI Chief of Staff
productivity system. You receive tasks that a deterministic rule layer has already flagged as "stagnant"
(no logged progress despite meaningful time elapsed). Your job is to assess severity and write a short,
specific, non-judgmental nudge for each — the goal is to break the avoidance pattern, not shame the user.

Rules:
- Output ONLY valid JSON matching the schema in the user message. No prose, no markdown fences.
- severity must be exactly one of: "mild" (plenty of runway left), "moderate" (runway shrinking),
  "severe" (deadline close and zero progress).
- observation is one factual sentence referencing the actual stagnant hours and hours until deadline.
- nudge is one short, specific suggestion for the smallest possible next action to break the freeze
  (e.g. "Open the doc and write just the first heading — nothing else."), never generic motivation.`;

export async function generateProcrastinationAlerts(
  stagnantTasks: { taskId: string; taskTitle: string; stagnantHours: number; hoursUntilDeadline: number }[],
  now: string
): Promise<ProcrastinationAlert[]> {
  if (stagnantTasks.length === 0) return [];

  const model = getModel(PROCRASTINATION_SYSTEM_PROMPT);

  const taskLines = stagnantTasks
    .map(
      (t) =>
        `- taskId="${t.taskId}" title="${t.taskTitle}" stagnantHours=${t.stagnantHours.toFixed(1)} hoursUntilDeadline=${t.hoursUntilDeadline.toFixed(1)}`
    )
    .join("\n");

  const prompt = `Assess these stagnant tasks and return JSON with exactly this shape:
{"alerts": [{"taskId": string, "taskTitle": string, "stagnantHours": number, "severity": "mild"|"moderate"|"severe", "observation": string, "nudge": string}]}

Tasks:
${taskLines}`;

  const result = await model.generateContent(prompt);
  const text = cleanJson(result.response.text());
  const parsed = JSON.parse(text) as { alerts: ProcrastinationAlert[] };
  return parsed.alerts;
}

const SIMULATION_SYSTEM_PROMPT = `You are the Future Simulation Engine inside an AI Chief of Staff productivity
system. The user is considering taking on a new commitment before they've actually committed. Your job is to
simulate how adding it would ripple through their existing workload and risk profile, so they can decide with
foresight instead of finding out the hard way.

Rules:
- Output ONLY valid JSON matching the schema in the user message. No prose, no markdown fences.
- projectedLifeRiskDelta is the estimated change in overall life risk score if they add this (positive =
  gets worse, can be 0 if genuinely negligible).
- affectedTasks lists only the existing tasks whose risk would meaningfully shift because of the added
  workload competing for the same time window — estimate riskBefore from the given data and riskAfter as
  your projection. Omit tasks that wouldn't be meaningfully affected.
- feasibleToAdd is true only if the user could realistically take this on without pushing any existing
  task into high/critical risk.
- verdict is 1-2 direct sentences giving the honest bottom line.
- alternativeSuggestion is optional — only include it if feasibleToAdd is false, suggesting what to drop,
  delay, or delegate instead.`;

export async function simulateNewCommitment(params: {
  newCommitmentTitle: string;
  newCommitmentMinutes: number;
  newCommitmentDeadline: string;
  existingTasks: Pick<Task, "id" | "title" | "deadline" | "remainingMinutes" | "riskScore">[];
  now: string;
}): Promise<SimulationResult> {
  const model = getModel(SIMULATION_SYSTEM_PROMPT);

  const taskLines =
    params.existingTasks
      .map((t) => {
        const hoursLeft = (new Date(t.deadline).getTime() - new Date(params.now).getTime()) / (1000 * 60 * 60);
        return `- id="${t.id}" title="${t.title}" hoursUntilDeadline=${hoursLeft.toFixed(1)} remainingMinutes=${t.remainingMinutes} currentRisk=${t.riskScore ?? "unknown"}`;
      })
      .join("\n") || "(no existing active tasks)";

  const hoursUntilNewDeadline =
    (new Date(params.newCommitmentDeadline).getTime() - new Date(params.now).getTime()) / (1000 * 60 * 60);

  const prompt = `Simulate adding this commitment and return JSON with exactly this shape:
{"feasibleToAdd": boolean, "projectedLifeRiskDelta": number, "affectedTasks": [{"taskId": string, "taskTitle": string, "riskBefore": number, "riskAfter": number}], "verdict": string, "alternativeSuggestion": string}

New commitment: "${params.newCommitmentTitle}", ${params.newCommitmentMinutes} minutes of work, due in ${hoursUntilNewDeadline.toFixed(1)} hours

Existing active tasks:
${taskLines}`;

  const result = await model.generateContent(prompt);
  const text = cleanJson(result.response.text());
  const parsed = JSON.parse(text) as Omit<SimulationResult, "generatedAt">;
  return { generatedAt: params.now, ...parsed };
}
