"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle, Clock, GripVertical, Trash2 } from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import type { Task } from "@/types";

function formatTimeRemaining(deadline: string): string {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Overdue";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours >= 48) return `${Math.floor(hours / 24)}d left`;
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours === 0) return `${mins}m left`;
  return `${hours}h ${mins}m left`;
}

const URGENCY_GLOW: Record<string, string> = {
  critical: "hover:shadow-[0_0_0_1px_rgba(255,59,92,0.2),0_8px_24px_-8px_rgba(255,59,92,0.25)]",
  high: "hover:shadow-[0_0_0_1px_rgba(248,113,113,0.15),0_8px_24px_-8px_rgba(248,113,113,0.2)]",
  medium: "",
  low: "",
};

interface TaskCardProps {
  task: Task;
  onDelete?: (task: Task) => void;
  draggable?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}

export function TaskCard({ task, onDelete, draggable, dragHandleProps }: TaskCardProps) {
  const isCritical = task.riskLevel === "critical" || task.riskLevel === "high";
  const urgencyGlow = task.riskLevel ? (URGENCY_GLOW[task.riskLevel] ?? "") : "";
  const isOverdue = new Date(task.deadline).getTime() < Date.now();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10, height: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      role="listitem"
      aria-label={`Task: ${task.title}`}
      className={`card group transition-all duration-200
        hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-elevated
        ${urgencyGlow}`}
    >
      <div className="flex items-start gap-3 p-4 sm:p-5">
        {/* Drag handle */}
        {draggable && (
          <span
            {...dragHandleProps}
            aria-label="Drag to reorder"
            className="mt-0.5 shrink-0 cursor-grab text-ink-faint opacity-0 transition group-hover:opacity-100 active:cursor-grabbing"
          >
            <GripVertical size={14} />
          </span>
        )}

        {/* Risk mini-ring */}
        {task.riskScore != null && (
          <div className="relative mt-0.5 h-7 w-7 shrink-0">
            <svg viewBox="0 0 28 28" className="h-full w-full -rotate-90">
              <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
              <circle
                cx="14" cy="14" r="11" fill="none"
                stroke={
                  task.riskLevel === "critical" ? "#FF3B5C" :
                  task.riskLevel === "high" ? "#F87171" :
                  task.riskLevel === "medium" ? "#FBBF24" : "#34D399"
                }
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${(task.riskScore / 100) * 69} 69`}
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center font-mono text-[8px] font-bold"
              style={{
                color: task.riskLevel === "critical" ? "#FF3B5C" :
                       task.riskLevel === "high" ? "#F87171" :
                       task.riskLevel === "medium" ? "#FBBF24" : "#34D399"
              }}
            >
              {task.riskScore}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display text-[0.9rem] font-semibold leading-snug text-ink">
              {task.title}
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              {task.riskLevel && task.riskScore == null && (
                <RiskBadge level={task.riskLevel} score={task.riskScore} />
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(task)}
                  aria-label={`Delete ${task.title}`}
                  className="text-ink-faint opacity-0 transition group-hover:opacity-100 hover:text-risk-high"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className={`flex items-center gap-1 text-xs ${
                isOverdue ? "font-semibold text-risk-critical" : "text-ink-muted"
              }`}
            >
              <Clock size={11} aria-hidden />
              {formatTimeRemaining(task.deadline)}
            </span>
            <span className="text-xs text-ink-faint">
              {task.remainingMinutes}m of work
            </span>
          </div>

          {/* Risk reason */}
          {task.riskReason && (
            <p className="mt-2.5 rounded-lg border border-white/[0.05] bg-base-900/50 px-3 py-2 text-xs leading-relaxed text-ink-faint">
              {task.riskReason}
            </p>
          )}

          {/* Confidence bar */}
          {typeof task.riskConfidence === "number" && (
            <div className="mt-2.5 flex items-center gap-2">
              <span className="label-caps">Confidence</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-base-700">
                <div
                  className="h-full rounded-full bg-signal-glow/60 transition-all duration-700"
                  style={{ width: `${Math.round(task.riskConfidence * 100)}%` }}
                />
              </div>
              <span className="label-caps">{Math.round(task.riskConfidence * 100)}%</span>
            </div>
          )}

          {/* Emergency CTA */}
          {isCritical && (
            <div className="mt-3">
              <Link
                href={`/emergency-recovery?taskId=${task.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-risk-critical/25
                           bg-risk-critical/[0.08] px-3 py-1.5 text-xs font-semibold text-risk-critical
                           transition hover:border-risk-critical/40 hover:bg-risk-critical/[0.14]"
              >
                <AlertTriangle size={11} aria-hidden />
                Activate emergency recovery
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
