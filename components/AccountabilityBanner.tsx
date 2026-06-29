"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import type { AccountabilityNudge } from "@/types";

const TONE_STYLES: Record<AccountabilityNudge["tone"], string> = {
  encouraging: "border-signal/30 bg-signal/5",
  firm: "border-risk-high/30 bg-risk-high/5",
  celebratory: "border-risk-low/30 bg-risk-low/5",
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
      <div className="mb-6 flex items-center gap-2 rounded-2xl border border-white/5 bg-base-800/40 p-4 text-xs text-ink-faint">
        <Loader2 size={12} className="animate-spin" /> Reading your patterns...
      </div>
    );
  }

  if (!nudge) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${TONE_STYLES[nudge.tone]}`}
    >
      <Flame size={16} className="mt-0.5 text-signal-glow" />
      <div>
        <p className="text-sm text-ink">{nudge.message}</p>
        <p className="mt-1 text-xs text-ink-muted">Next: {nudge.focusSuggestion}</p>
      </div>
    </motion.div>
  );
}
