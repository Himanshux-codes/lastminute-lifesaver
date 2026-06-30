"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Loader2, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import type { AccountabilityNudge } from "@/types";

const TONE_ACCENT: Record<AccountabilityNudge["tone"], string> = {
  encouraging: "text-signal-glow",
  firm: "text-risk-high",
  celebratory: "text-risk-low",
};

export function AccountabilityBanner() {
  const [nudge, setNudge] = useState<AccountabilityNudge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ nudge: AccountabilityNudge }>("/api/gemini/accountability", { method: "POST" })
      .then((data) => setNudge(data.nudge))
      .catch(() => setNudge(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card flex h-full min-h-[120px] flex-col justify-center gap-2 p-5">
        <div className="flex items-center gap-2 text-xs text-ink-faint">
          <Loader2 size={12} className="animate-spin" /> Reading your patterns...
        </div>
      </div>
    );
  }

  if (!nudge) {
    return (
      <div className="card flex h-full min-h-[120px] flex-col justify-center gap-1 p-5 text-center">
        <p className="text-xs text-ink-faint">No recommendation yet — add a task to get started.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card flex h-full flex-col justify-center gap-2.5 p-5"
    >
      <p className={`flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider ${TONE_ACCENT[nudge.tone]}`}>
        <Sparkles size={12} /> AI recommendation
      </p>
      <div className="flex items-start gap-3">
        <Flame size={16} className="mt-0.5 shrink-0 text-signal-glow" />
        <div>
          <p className="text-sm leading-relaxed text-ink">{nudge.message}</p>
          <p className="mt-1.5 text-xs text-ink-muted">Next: {nudge.focusSuggestion}</p>
        </div>
      </div>
    </motion.div>
  );
}
