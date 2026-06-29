"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Radar, Brain, ShieldAlert, ChevronRight, X } from "lucide-react";

const STORAGE_KEY = "lastminute-onboarding-complete";

const STEPS = [
  {
    icon: Radar,
    title: "Welcome to your AI Chief of Staff",
    body: "This isn't a to-do list. It predicts which deadlines you're about to miss and steps in before the crisis hits.",
  },
  {
    icon: Brain,
    title: "Run a risk scan anytime",
    body: 'Click "Run risk scan" on your dashboard and Gemini scores every task 0–100 using your workload and history.',
  },
  {
    icon: ShieldAlert,
    title: "When things get critical",
    body: 'A task at high or critical risk gets an "Activate emergency recovery" button — a minute-by-minute survival plan, generated live.',
  },
];

export function OnboardingWalkthrough() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setOpen(true);
  }, []);

  function close() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      close();
    }
  }

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Welcome walkthrough"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-base-900 p-6 shadow-glow"
          >
            <button
              onClick={close}
              aria-label="Skip walkthrough"
              className="absolute right-4 top-4 text-ink-faint hover:text-ink-muted"
            >
              <X size={16} />
            </button>

            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/10 ring-1 ring-signal/30">
              <Icon size={20} className="text-signal-glow" />
            </span>

            <p className="mt-4 font-display text-base font-medium text-ink">{current.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{current.body}</p>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-5 rounded-full transition ${i === step ? "bg-signal" : "bg-base-700"}`}
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="flex items-center gap-1.5 rounded-full bg-signal px-4 py-2 text-xs font-medium text-white shadow-glow"
              >
                {step < STEPS.length - 1 ? "Next" : "Get started"}
                <ChevronRight size={12} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
