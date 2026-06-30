"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Radar, ShieldAlert, Brain, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

export default function LandingPage() {
  const { user, signIn } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  /**
   * Root cause of the "Get my deadline radar" button doing nothing: it only ever called
   * signIn() and never navigated anywhere afterward, and gave zero feedback if the auth
   * popup was blocked or dismissed. This wraps it with a real loading state, a redirect to
   * the deadline radar on success, and a toast on failure instead of silent nothing.
   */
  async function handlePrimaryCta() {
    if (user) {
      router.push("/deadline-radar");
      return;
    }
    setSigningIn(true);
    try {
      await signIn();
      router.push("/deadline-radar");
    } catch (error) {
      showToast(`Sign-in didn't go through: ${(error as Error).message}`, { variant: "error" });
    } finally {
      setSigningIn(false);
    }
  }

  async function handleNavCta() {
    if (user) {
      router.push("/dashboard");
      return;
    }
    setSigningIn(true);
    try {
      await signIn();
      router.push("/dashboard");
    } catch (error) {
      showToast(`Sign-in didn't go through: ${(error as Error).message}`, { variant: "error" });
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grain opacity-30" />
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-signal/25 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/3 right-0 h-[420px] w-[420px] rounded-full bg-risk-critical/10 blur-[120px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-6">
        <span className="font-display text-sm font-medium tracking-wide text-ink">
          LAST-MINUTE LIFE SAVER
        </span>
        {user ? (
          <Link
            href="/dashboard"
            className="rounded-full bg-signal px-4 py-2 text-sm font-medium text-white shadow-glow-sm transition hover:bg-signal-dim hover:shadow-glow"
          >
            Open dashboard
          </Link>
        ) : (
          <button
            onClick={handleNavCta}
            disabled={signingIn}
            className="flex items-center gap-2 rounded-full bg-signal px-4 py-2 text-sm font-medium text-white shadow-glow-sm transition hover:bg-signal-dim hover:shadow-glow disabled:opacity-60"
          >
            {signingIn && <Loader2 size={13} className="animate-spin" />}
            Sign in with Google
          </button>
        )}
      </nav>

      <section className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 pt-16 pb-24 text-center sm:px-6 sm:pt-24">
        <motion.span
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-ink-muted shadow-card"
        >
          <Radar size={12} className="text-signal-glow" />
          VIBE2SHIP · The Last-Minute Life Saver
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="font-display text-balance text-[2.6rem] font-medium leading-[1.08] text-ink sm:text-6xl md:text-[4.2rem]"
        >
          It doesn&apos;t remind you.
          <br />
          <span className="bg-gradient-to-r from-signal-glow to-signal bg-clip-text text-transparent">
            It intervenes.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="mt-7 max-w-xl text-balance text-base leading-relaxed text-ink-muted sm:text-lg"
        >
          A superhuman executive assistant that never sleeps — it predicts which deadlines you&apos;re
          about to miss, and builds the exact plan to save them, hours before the crisis hits.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <button
            onClick={handlePrimaryCta}
            disabled={signingIn}
            className="group flex items-center gap-2 rounded-full bg-signal px-6 py-3.5 text-sm font-medium text-white shadow-glow transition hover:bg-signal-dim hover:shadow-elevated disabled:opacity-60"
          >
            {signingIn ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
            )}
            Get my deadline radar
          </button>
          <span className="text-xs text-ink-faint">No setup. Connects to your calendar in one tap.</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.6 }}
          className="mt-20 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-3"
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
    <div className="card-interactive p-5 sm:p-6">
      <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-white/[0.06]">
        {icon}
      </span>
      <h3 className="font-display text-sm font-medium text-ink">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-ink-muted">{copy}</p>
    </div>
  );
}
