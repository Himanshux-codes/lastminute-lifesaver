"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlarmClockOff } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import type { ProcrastinationAlert } from "@/types";

const SEVERITY_STYLES: Record<ProcrastinationAlert["severity"], string> = {
  mild: "border-risk-medium/20 bg-risk-medium/5 text-risk-medium",
  moderate: "border-risk-high/25 bg-risk-high/5 text-risk-high",
  severe: "border-risk-critical/30 bg-risk-critical/5 text-risk-critical",
};

export function ProcrastinationAlerts() {
  const [alerts, setAlerts] = useState<ProcrastinationAlert[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ alerts: ProcrastinationAlert[] }>("/api/gemini/procrastination-scan")
      .then((data) => setAlerts(data.alerts))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mb-6 flex items-center gap-2 text-xs text-ink-faint">
        <Loader2 size={12} className="animate-spin" /> Scanning for stalled tasks...
      </div>
    );
  }

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">
        Procrastination detected
      </p>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <motion.div
            key={alert.taskId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-3 ${SEVERITY_STYLES[alert.severity]}`}
          >
            <div className="flex items-start gap-2">
              <AlarmClockOff size={14} className="mt-0.5" />
              <div>
                <p className="text-xs font-medium text-ink">{alert.taskTitle}</p>
                <p className="mt-1 text-xs leading-relaxed opacity-90">{alert.observation}</p>
                <p className="mt-1 text-xs font-medium leading-relaxed">{alert.nudge}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
