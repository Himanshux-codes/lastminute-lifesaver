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
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`;
  return `${hours}h ${minutes}m left`;
}

interface TaskCardProps {
  task: Task;
  onDelete?: (task: Task) => void;
  draggable?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}

export function TaskCard({ task, onDelete, draggable, dragHandleProps }: TaskCardProps) {
  const isCritical = task.riskLevel === "critical" || task.riskLevel === "high";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      role="listitem"
      aria-label={`Task: ${task.title}`}
      className="rounded-2xl border border-white/5 bg-base-800/60 p-4 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {draggable && (
            <span
              {...dragHandleProps}
              aria-label="Drag to reorder"
              className="mt-0.5 cursor-grab text-ink-faint hover:text-ink-muted active:cursor-grabbing"
            >
              <GripVertical size={14} />
            </span>
          )}
          <div>
            <p className="font-display text-sm font-medium text-ink">{task.title}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
              <Clock size={12} aria-hidden="true" />
              {formatTimeRemaining(task.deadline)} · {task.remainingMinutes}m remaining
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {task.riskLevel && <RiskBadge level={task.riskLevel} score={task.riskScore} />}
          {onDelete && (
            <button
              onClick={() => onDelete(task)}
              aria-label={`Delete task: ${task.title}`}
              className="text-ink-faint transition hover:text-risk-high"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {task.riskReason && (
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">{task.riskReason}</p>
      )}

      {typeof task.riskConfidence === "number" && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-ink-faint">Confidence</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-base-700">
            <div
              className="h-full rounded-full bg-signal-glow/70"
              style={{ width: `${Math.round(task.riskConfidence * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-ink-faint">{Math.round(task.riskConfidence * 100)}%</span>
        </div>
      )}

      {isCritical && (
        <Link
          href={`/emergency-recovery?taskId=${task.id}`}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-risk-critical/10 px-3 py-1.5 text-xs font-medium text-risk-critical ring-1 ring-risk-critical/30 transition hover:bg-risk-critical/20"
        >
          <AlertTriangle size={12} aria-hidden="true" />
          Activate emergency recovery
        </Link>
      )}
    </motion.div>
  );
}
