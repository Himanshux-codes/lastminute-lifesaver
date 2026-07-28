"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import type { AccountabilityNudge } from "@/types";

const TONE_STYLE: Record<AccountabilityNudge["tone"], { accent: string; bg: string; border: string }> = {
  encouraging: { accent: "#9B93FF", bg: "rgba(110,99,255,0.07)", border: "rgba(110,99,255,0.2)" },
  firm:        { accent: "#F87171", bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.2)" },
  celebratory: { accent: "#34D399", bg: "rgba(52,211,153,0.07)",  border: "rgba(52,211,153,0.2)" },
};

export function AccountabilityBanner() {
  const [nudge, setNudge] = useState<AccountabilityNudge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ nudge: AccountabilityNudge }>("/api/gemini/accountability", { method: "POST" })
      .then((d) => setNudge(d.nudge))
      .catch(() => setNudge(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card flex h-full min-h-[120px] flex-col items-center justify-center gap-2 p-6">
        <Loader2 size={16} className="animate-spin text-signal-glow" />
        <p className="text-xs text-ink-faint">Reading your patterns…</p>
      </div>
    );
  }

  if (!nudge) {
    return (
      <div className="card flex h-full min-h-[120px] flex-col justify-center p-6">
        <p className="text-xs text-ink-faint">
          Add tasks and run a risk scan to get your first AI recommendation.
        </p>
      </div>
    );
  }

  const style = TONE_STYLE[nudge.tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex h-full flex-col justify-between rounded-[18px] p-5 sm:p-6"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: "0 1px 1px rgba(0,0,0,0.2), 0 4px 16px -4px rgba(0,0,0,0.35)",
      }}
    >
      <div>
        <p
          className="label-caps mb-3 flex items-center gap-1.5"
          style={{ color: style.accent }}
        >
          <Sparkles size={11} /> AI recommendation
        </p>
        <p className="text-sm leading-relaxed text-ink">{nudge.message}</p>
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-muted">
        <ArrowRight size={11} style={{ color: style.accent }} />
        {nudge.focusSuggestion}
      </p>
    </motion.div>
  );
}
