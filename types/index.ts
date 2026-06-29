export type TaskStatus = "pending" | "in_progress" | "completed" | "missed";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: "assignment" | "exam" | "meeting" | "bill" | "interview" | "personal" | "work";
  estimatedMinutes: number;
  remainingMinutes: number;
  deadline: string; // ISO 8601
  createdAt: string;
  status: TaskStatus;
  priorityScore?: number;
  riskScore?: number;
  riskLevel?: RiskLevel;
  riskReason?: string;
  riskConfidence?: number; // 0-1, from the Risk Prediction Agent's confidence in its own score
}

export interface RiskAssessmentInput {
  task: Pick<Task, "title" | "category" | "estimatedMinutes" | "remainingMinutes" | "deadline" | "status">;
  now: string;
  recentCompletionRate: number; // 0-1, last 14 days
  currentWorkloadMinutes: number; // sum of remaining work across all active tasks
  procrastinationIndex: number; // 0-1, derived from historical edit/delay patterns
}

export interface RiskAssessmentResult {
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  confidence: number; // 0-1
  primaryDriver: string;
  reasoning: string;
  recommendedAction: string;
}

export interface RecoveryBlock {
  id: string;
  label: string;
  startMinutesFromNow: number;
  durationMinutes: number;
  type: "deep_work" | "short_break" | "buffer" | "submission_checkpoint";
  instructions: string;
}

export interface RecoveryPlan {
  taskId: string;
  generatedAt: string;
  hoursUntilDeadline: number;
  feasible: boolean;
  feasibilityReason: string;
  totalWorkMinutesRequired: number;
  blocks: RecoveryBlock[];
  distractionsToRemove: string[];
  accountabilityMessage: string;
  fallbackAdvice?: string;
}

export interface PrioritizedTask {
  taskId: string;
  priorityScore: number; // 0-100, higher = act on first
  priorityRank: number; // 1 = do this first
  reasoning: string;
}

export interface PlannedSubtask {
  title: string;
  estimatedMinutes: number;
  order: number;
  category: Task["category"];
  suggestedDeadline: string; // ISO 8601
}

export interface GoalPlan {
  goalTitle: string;
  generatedAt: string;
  subtasks: PlannedSubtask[];
  totalEstimatedMinutes: number;
  planningNotes: string;
}

export type HabitFrequency = "daily" | "weekdays" | "weekly";

export interface Habit {
  id: string;
  userId: string;
  title: string;
  frequency: HabitFrequency;
  createdAt: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedAt: string | null;
  completionLog: string[]; // ISO date strings, one per completion
}

export interface AccountabilityNudge {
  generatedAt: string;
  tone: "encouraging" | "firm" | "celebratory";
  message: string;
  focusSuggestion: string;
}

export interface CalendarImportEvent {
  externalId: string;
  title: string;
  start: string;
  end: string;
  description?: string;
}

export interface BehavioralSnapshot {
  date: string; // ISO date (day granularity)
  tasksCompleted: number;
  tasksMissed: number;
  averageRiskScore: number;
  focusMinutes: number;
}

export interface FocusSession {
  id: string;
  userId: string;
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  plannedMinutes: number;
  actualMinutes: number | null;
  completed: boolean;
}

export interface LifeRiskScore {
  generatedAt: string;
  overallScore: number; // 0-100, higher = more of life is at risk of falling apart
  level: RiskLevel;
  topContributors: { label: string; impact: number }[];
  summary: string;
  recommendation: string;
}

export interface ProcrastinationAlert {
  taskId: string;
  taskTitle: string;
  stagnantHours: number;
  severity: "mild" | "moderate" | "severe";
  observation: string;
  nudge: string;
}

export interface SimulationResult {
  generatedAt: string;
  feasibleToAdd: boolean;
  projectedLifeRiskDelta: number; // positive = gets worse
  affectedTasks: { taskId: string; taskTitle: string; riskBefore: number; riskAfter: number }[];
  verdict: string;
  alternativeSuggestion?: string;
}

export interface PushToken {
  id: string;
  userId: string;
  token: string;
  createdAt: string;
}
