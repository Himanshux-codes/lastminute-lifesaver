"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Radar, ShieldAlert, Brain } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const { user, signIn } = useAuth();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grain opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-signal/20 blur-[120px]" />

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-sm font-medium tracking-wide text-ink">
          LAST-MINUTE LIFE SAVER
        </span>
        {user ? (
          <Link
            href="/dashboard"
            className="rounded-full bg-signal px-4 py-2 text-sm font-medium text-white shadow-glow"
          >
            Open dashboard
          </Link>
        ) : (
          <button
            onClick={signIn}
            className="rounded-full bg-signal px-4 py-2 text-sm font-medium text-white shadow-glow"
          >
            Sign in with Google
          </button>
        )}
      </nav>

      <section className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 pt-20 pb-24 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-ink-muted">
          <Radar size={12} className="text-signal-glow" />
          VIBE2SHIP · The Last-Minute Life Saver
        </span>

        <h1 className="font-display text-balance text-4xl font-medium leading-[1.1] text-ink sm:text-6xl">
          It doesn&apos;t remind you.
          <br />
          <span className="text-signal-glow">It intervenes.</span>
        </h1>

        <p className="mt-6 max-w-xl text-balance text-base leading-relaxed text-ink-muted sm:text-lg">
          A superhuman executive assistant that never sleeps — it predicts which deadlines you&apos;re
          about to miss, and builds the exact plan to save them, hours before the crisis hits.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <button
            onClick={signIn}
            className="rounded-full bg-signal px-6 py-3 text-sm font-medium text-white shadow-glow transition hover:bg-signal-dim"
          >
            Get my deadline radar
          </button>
          <span className="text-xs text-ink-faint">No setup. Connects to your calendar in one tap.</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-16 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-3"
        >
          <SignatureCard
            icon={<Radar size={18} className="text-signal-glow" />}
            title="Deadline Radar"
            copy="Every active commitment, sorted by how likely it is to be missed — not by due date."
          />
          <SignatureCard
            icon={<Brain size={18} className="text-signal-glow" />}
            title="Risk Prediction Engine"
            copy="Gemini scores each task 0–100 using your workload, history, and procrastination pattern."
          />
          <SignatureCard
            icon={<ShieldAlert size={18} className="text-risk-critical" />}
            title="Emergency Recovery"
            copy="10 hours to deadline? It builds the minute-by-minute survival plan automatically."
          />
        </motion.div>
      </section>
    </main>
  );
}

function SignatureCard({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-base-800/40 p-5">
      <div className="mb-3">{icon}</div>
      <h3 className="font-display text-sm font-medium text-ink">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{copy}</p>
    </div>
  );
}
