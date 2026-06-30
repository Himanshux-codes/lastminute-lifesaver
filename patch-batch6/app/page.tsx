"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Radar,
  ShieldAlert,
  Brain,
  ArrowRight,
  Loader2,
  Sparkles,
  Mic,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const { user, signIn } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  /**
   * Unchanged from the previous fix: signIn() alone never navigated anywhere, so the
   * button looked broken. This still redirects on success and toasts on failure — only
   * the surrounding visual design changed in this pass.
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

  return (
    <main className="relative min-h-screen overflow-hidden">
      <AuroraBackground />
      <Navbar user={!!user} signingIn={signingIn} onPrimaryAction={handlePrimaryCta} />

      {/* ---------- Hero ---------- */}
      <section className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 pt-20 pb-16 text-center sm:px-6 sm:pt-28">
        <motion.span
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="glass mb-7 inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-ink-muted"
        >
          <Radar size={12} className="text-signal-glow" />
          VIBE2SHIP · The Last-Minute Life Saver
        </motion.span>

        <motion.h1
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="font-display text-balance text-[2.75rem] font-semibold leading-[1.05] text-ink sm:text-6xl md:text-[4.5rem]"
        >
          It doesn&apos;t remind you.
          <br />
          <span className="bg-gradient-to-r from-signal-glow via-signal to-signal-glow bg-clip-text text-transparent">
            It intervenes.
          </span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="mt-7 max-w-xl text-balance text-base leading-relaxed text-ink-muted sm:text-lg"
        >
          A superhuman executive assistant that never sleeps — it predicts which deadlines you&apos;re
          about to miss, and builds the exact plan to save them, hours before the crisis hits.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <button onClick={handlePrimaryCta} disabled={signingIn} className="btn-primary">
            {signingIn ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
            Get my deadline radar
          </button>
          <button onClick={() => router.push("/dashboard?demo=1")} className="btn-secondary">
            <Sparkles size={14} /> Explore with demo data
          </button>
        </motion.div>
        <p className="mt-4 text-xs text-ink-faint">No setup. Connects to your calendar in one tap.</p>

        {/* ---------- Product preview: floating glass cards over a mock dashboard frame ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative mt-20 w-full"
        >
          <ProductPreview />
        </motion.div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-28 pt-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-xl text-center"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-signal-glow">How it works</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Three agents, one job: don&apos;t let you miss it.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: <Radar size={18} className="text-signal-glow" />,
              title: "Deadline Radar",
              copy: "Every active commitment, sorted by how likely it is to be missed — not by due date.",
            },
            {
              icon: <Brain size={18} className="text-signal-glow" />,
              title: "Risk Prediction Engine",
              copy: "Gemini scores each task 0–100 using your workload, history, and procrastination pattern.",
            },
            {
              icon: <ShieldAlert size={18} className="text-risk-critical" />,
              title: "Emergency Recovery",
              copy: "10 hours to deadline? It builds the minute-by-minute survival plan automatically.",
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="card-interactive p-6"
            >
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-white/[0.06]">
                {card.icon}
              </span>
              <h3 className="font-display text-base font-medium text-ink">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{card.copy}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass mt-8 flex flex-col items-center gap-4 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left"
        >
          <div>
            <h3 className="font-display text-lg font-medium text-ink">Ready to stop missing things?</h3>
            <p className="mt-1 text-sm text-ink-muted">Sign in once, and the radar starts watching.</p>
          </div>
          <button onClick={handlePrimaryCta} disabled={signingIn} className="btn-primary shrink-0">
            {signingIn ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
            Get started
          </button>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}

function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="grain absolute inset-0 opacity-30" />
      <div
        className="animate-aurora absolute -top-56 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-signal/25 blur-[140px]"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="animate-aurora absolute top-1/4 right-[-160px] h-[460px] w-[460px] rounded-full bg-risk-critical/[0.12] blur-[130px]"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="animate-aurora absolute bottom-[-120px] left-[-120px] h-[420px] w-[420px] rounded-full bg-risk-low/[0.10] blur-[120px]"
        style={{ animationDelay: "-12s" }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
}

/**
 * A stylized, static mock of the dashboard used purely as a hero visual — not live user
 * data. Framed like a browser/app window with floating glass stat cards around it, in the
 * style of a typical Linear/Vercel marketing hero "product screenshot."
 */
function ProductPreview() {
  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="glass relative overflow-hidden p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-1.5 px-1">
          <span className="h-2.5 w-2.5 rounded-full bg-risk-critical/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-risk-medium/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-risk-low/60" />
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-base-900/80 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-3 w-32 rounded-full bg-white/10" />
            <div className="h-6 w-20 rounded-full bg-signal/30" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["Active tasks", "Avg. risk", "Hours saved"].map((label) => (
              <div key={label} className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="h-2 w-12 rounded-full bg-white/10" />
                <div className="mt-2 h-4 w-8 rounded-full bg-signal-glow/40" />
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {[88, 64, 41].map((width, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                <div className="h-2 rounded-full bg-white/10" style={{ width: `${width}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="glass animate-floatSlow absolute -left-6 top-10 hidden w-44 flex-col gap-1 p-3.5 sm:flex"
        style={{ "--float-rot": "-2deg" } as React.CSSProperties}
      >
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-risk-critical">
          <ShieldAlert size={12} /> Critical risk
        </p>
        <p className="text-xs text-ink-muted">&quot;Database assignment&quot; — 4h left</p>
      </div>

      <div
        className="glass animate-floatSlow absolute -right-4 top-1/3 hidden w-48 flex-col gap-1 p-3.5 sm:flex"
        style={{ animationDelay: "-2s", "--float-rot": "1.5deg" } as React.CSSProperties}
      >
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-signal-glow">
          <TrendingUp size={12} /> Risk score
        </p>
        <p className="text-xs text-ink-muted">82 → 31 after recovery plan</p>
      </div>

      <div
        className="glass animate-floatSlow absolute bottom-4 left-6 hidden w-40 flex-col gap-1 p-3.5 sm:flex"
        style={{ animationDelay: "-4s", "--float-rot": "-1deg" } as React.CSSProperties}
      >
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-risk-low">
          <CheckCircle2 size={12} /> Saved
        </p>
        <p className="text-xs text-ink-muted">3 deadlines this week</p>
      </div>

      <div
        className="glass animate-floatSlow absolute -bottom-6 right-10 hidden w-40 flex-col gap-1 p-3.5 sm:flex"
        style={{ animationDelay: "-3s", "--float-rot": "2deg" } as React.CSSProperties}
      >
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink">
          <Mic size={12} className="text-signal-glow" /> Voice agent
        </p>
        <p className="text-xs text-ink-muted">&quot;Exam in 12 days...&quot;</p>
      </div>
    </div>
  );
}
