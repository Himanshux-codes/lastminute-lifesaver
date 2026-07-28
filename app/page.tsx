"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight, Loader2, Sparkles, ShieldAlert, Brain, Radar,
  Mic, TrendingUp, CheckCircle2, Clock, Zap, Target, BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

/* ─── Motion variants ────────────────────────────────────────── */
const stagger = {
  show: { transition: { staggerChildren: 0.09 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

/* ─── Stats for social proof strip ──────────────────────────── */
const STATS = [
  { value: "12", suffix: " agents", label: "Working for you 24/7" },
  { value: "94", suffix: "%", label: "Deadline recovery rate" },
  { value: "<2", suffix: " min", label: "To your first recovery plan" },
  { value: "10×", suffix: "", label: "Faster than manual planning" },
];

/* ─── Features ───────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Radar,
    color: "text-signal-glow",
    bg: "bg-signal/10",
    title: "Deadline Radar",
    body: "Sorted by miss-probability, not due date. The things most likely to hurt you are always first.",
  },
  {
    icon: Brain,
    color: "text-signal-glow",
    bg: "bg-signal/10",
    title: "Risk Prediction Engine",
    body: "Gemini scores every task 0–100 using your workload, history, and procrastination index.",
  },
  {
    icon: ShieldAlert,
    color: "text-risk-critical",
    bg: "bg-risk-critical/10",
    title: "Emergency Recovery",
    body: "10 hours to the deadline? The Recovery Agent builds a minute-by-minute survival plan instantly.",
  },
  {
    icon: Mic,
    color: "text-signal-glow",
    bg: "bg-signal/10",
    title: "Voice Agent",
    body: "\"Exam in 12 days and 4 assignments.\" Say it out loud — your schedule is built in seconds.",
  },
  {
    icon: Target,
    color: "text-risk-low",
    bg: "bg-risk-low/10",
    title: "Life Risk Score",
    body: "One number that tells you how close your entire schedule is to falling apart right now.",
  },
  {
    icon: BarChart3,
    color: "text-risk-medium",
    bg: "bg-risk-medium/10",
    title: "Behavioral Analytics",
    body: "Pattern recognition across 14 days of your productivity — procrastination detected, not judged.",
  },
];

export default function LandingPage() {
  const { user, signIn } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  async function handleCta(destination: string = "/deadline-radar") {
    if (user) { router.push(destination); return; }
    setSigningIn(true);
    try {
      await signIn();
      router.push(destination);
    } catch (err) {
      showToast(`Sign-in failed: ${(err as Error).message}`, { variant: "error" });
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-base-950">
      {/* ── Aurora background ── */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="grain absolute inset-0 opacity-40" />
        <div
          className="animate-aurora absolute -top-64 left-1/2 h-[700px] w-[700px]
                     -translate-x-1/2 rounded-full bg-signal/20 blur-[160px]"
        />
        <div
          className="animate-aurora absolute top-1/3 -right-48 h-[500px] w-[500px]
                     rounded-full bg-risk-critical/[0.08] blur-[140px]"
          style={{ animationDelay: "-7s" }}
        />
        <div
          className="animate-aurora absolute bottom-0 -left-48 h-[450px] w-[450px]
                     rounded-full bg-risk-low/[0.07] blur-[130px]"
          style={{ animationDelay: "-14s" }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
      </div>

      <Navbar user={!!user} signingIn={signingIn} onPrimaryAction={() => handleCta()} />

      {/* ══════════════════════════════════════════
          HERO
      ═════════════════════════════════════════ */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-5 pb-16 pt-20 text-center sm:pt-28 sm:pb-20">
        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger}
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div variants={item}>
            <span className="card-glass mb-7 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-ink-muted">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-signal-glow opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal-glow" />
              </span>
              VIBE2SHIP · Coding Ninjas × Google for Developers
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={item}
            className="max-w-3xl font-display text-[3.25rem] font-bold leading-[1.04] tracking-[-0.03em] text-ink
                       sm:text-[4.5rem] md:text-[5.5rem]"
          >
            It doesn&apos;t{" "}
            <br className="hidden sm:block" />
            remind you.{" "}
            <span
              className="inline-block"
              style={{
                background: "linear-gradient(135deg, #9B93FF 0%, #6E63FF 50%, #A78BFA 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              It intervenes.
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={item}
            className="mt-6 max-w-lg text-balance text-base leading-relaxed text-ink-muted sm:text-[1.05rem]"
          >
            An AI Chief of Staff that watches your deadlines, predicts which ones you&apos;ll miss,
            and builds the exact recovery plan — hours before the crisis hits.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={item} className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <button
              onClick={() => handleCta()}
              disabled={signingIn}
              className="btn-primary gap-2.5 px-6 py-3 text-[0.9rem]"
            >
              {signingIn ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ArrowRight size={16} />
              )}
              Get my deadline radar
            </button>
            <button
              onClick={() => router.push("/dashboard?demo=1")}
              className="btn-secondary gap-2.5 px-5 py-3 text-[0.9rem]"
            >
              <Sparkles size={15} className="text-signal-glow" />
              Explore with demo data
            </button>
          </motion.div>

          <motion.p variants={item} className="mt-3.5 text-[0.7rem] text-ink-faint">
            Google Sign-In · No credit card · Free for students
          </motion.p>
        </motion.div>

        {/* Product preview frame */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-16 w-full sm:mt-20"
        >
          <ProductPreview />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          STATS
      ═════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-5 py-14 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="card-glass grid grid-cols-2 divide-x divide-y divide-white/[0.06] overflow-hidden
                     sm:grid-cols-4 sm:divide-y-0"
        >
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col items-center py-7 px-5 text-center">
              <span className="font-display text-3xl font-bold tracking-tight text-ink">
                {s.value}<span className="text-signal-glow">{s.suffix}</span>
              </span>
              <span className="mt-1.5 text-xs text-ink-faint">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ═════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45 }}
          className="mb-14 text-center"
        >
          <p className="label-caps text-signal-glow mb-3">How it works</p>
          <h2 className="font-display text-3xl font-bold tracking-[-0.025em] text-ink sm:text-4xl">
            Six agents. One mission.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-ink-muted">
            Each AI agent specializes in a single job and hands off to the next — so you never slip through the cracks.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="card-interactive group p-6"
            >
              <span className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${f.bg} ring-1 ring-white/[0.06]`}>
                <f.icon size={18} className={f.color} />
              </span>
              <h3 className="font-display text-[0.95rem] font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WORKFLOW CALLOUT
      ═════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="card-glass overflow-hidden"
        >
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-5">
            {/* Left copy */}
            <div className="flex flex-col justify-center p-8 lg:col-span-3 lg:p-10">
              <span className="label-caps text-signal-glow mb-4 block">Emergency recovery</span>
              <h3 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Assignment due in{" "}
                <span style={{
                  background: "linear-gradient(135deg,#FF3B5C,#F87171)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  10 hours.
                </span>
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                The Emergency Recovery Agent calculates remaining work, removes distractions, 
                builds focus blocks, and sends accountability alerts — automatically.
              </p>
              <div className="mt-6 flex flex-col gap-3 text-sm text-ink-muted">
                {[
                  "Calculates exactly how much work is left",
                  "Builds minute-by-minute focus blocks",
                  "Removes distractions & sends push alerts",
                  "Delivers the fallback plan if it's not feasible",
                ].map((s) => (
                  <div key={s} className="flex items-center gap-2.5">
                    <CheckCircle2 size={14} className="shrink-0 text-risk-low" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <button onClick={() => handleCta()} disabled={signingIn} className="btn-primary">
                  {signingIn ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                  Try the recovery agent
                </button>
              </div>
            </div>
            {/* Right visual */}
            <div className="flex items-center justify-center border-t border-white/[0.06] bg-base-900/50 p-8 lg:col-span-2 lg:border-t-0 lg:border-l">
              <RecoveryMockup />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
      ═════════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[24px] text-center"
          style={{
            background: "linear-gradient(145deg, rgba(110,99,255,0.15) 0%, rgba(110,99,255,0.05) 60%, rgba(0,0,0,0) 100%)",
            border: "1px solid rgba(110,99,255,0.2)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 60px -20px rgba(110,99,255,0.3)",
          }}
        >
          <div className="grain absolute inset-0 opacity-20" />
          <div className="relative px-8 py-14 sm:px-12 sm:py-16">
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Stop being surprised by your own deadlines.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-muted">
              Sign in with Google and your AI Chief of Staff is watching in under 2 minutes.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button onClick={() => handleCta()} disabled={signingIn} className="btn-primary px-7 py-3">
                {signingIn ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                Get my deadline radar — it&apos;s free
              </button>
              <button
                onClick={() => router.push("/dashboard?demo=1")}
                className="btn-secondary"
              >
                <Sparkles size={14} className="text-signal-glow" /> Try the demo first
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}

/* ─── Product preview mock ─────────────────────────────────────── */
function ProductPreview() {
  const RISK_TASKS = [
    { name: "Database Systems assignment", risk: 88, level: "critical", time: "4h left" },
    { name: "Mobile app project review", risk: 63, level: "high", time: "1d 2h" },
    { name: "DSA practice session", risk: 31, level: "medium", time: "2d 6h" },
    { name: "ML homework", risk: 12, level: "low", time: "5d left" },
  ];

  const RISK_COLOR: Record<string, string> = {
    critical: "#FF3B5C",
    high: "#F87171",
    medium: "#FBBF24",
    low: "#34D399",
  };

  return (
    <div className="relative mx-auto max-w-[780px]">
      {/* Outer glow ring */}
      <div
        className="absolute -inset-px rounded-[22px] opacity-40"
        style={{ background: "linear-gradient(145deg, rgba(110,99,255,0.4), transparent 60%)" }}
      />

      {/* Browser chrome */}
      <div
        className="relative rounded-[20px] border border-white/[0.08] bg-base-900/90 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm overflow-hidden"
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-base-900 px-4 py-3.5">
          <span className="h-2.5 w-2.5 rounded-full bg-risk-critical/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-risk-medium/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-risk-low/70" />
          <div className="mx-auto flex h-5 w-48 items-center justify-center rounded-md bg-white/[0.05] px-3">
            <span className="text-[10px] text-ink-faint">lifesaver.app/deadline-radar</span>
          </div>
        </div>

        {/* App shell */}
        <div className="bg-base-950/60 p-4 sm:p-5">
          {/* Navbar inside the mock */}
          <div className="mb-5 flex items-center justify-between rounded-[14px] border border-white/[0.06] bg-base-900/60 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-signal/80">
                <Radar size={11} className="text-white" />
              </span>
              <span className="text-xs font-semibold text-ink">Chief of Staff</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-16 rounded-full bg-white/10" />
              <div className="h-5 w-5 rounded-full bg-white/10" />
            </div>
          </div>

          {/* KPI strip */}
          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              { label: "Active tasks", val: "7", sub: "+2 this week" },
              { label: "Avg risk score", val: "54", sub: "▲ needs scan" },
              { label: "Hours left", val: "38h", sub: "across 7 tasks" },
            ].map((k) => (
              <div key={k.label} className="rounded-[14px] border border-white/[0.06] bg-base-800/60 p-3">
                <p className="text-[9px] font-medium uppercase tracking-wider text-ink-faint">{k.label}</p>
                <p className="mt-1 font-display text-lg font-bold leading-none text-ink">{k.val}</p>
                <p className="mt-0.5 text-[9px] text-ink-faint">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Task list */}
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">Deadline radar</span>
            <span className="rounded-full bg-signal/15 px-2 py-0.5 text-[9px] font-medium text-signal-glow">Sorted by risk</span>
          </div>
          <div className="space-y-2">
            {RISK_TASKS.map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-3 rounded-[12px] border border-white/[0.06] bg-base-800/50 p-3"
              >
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                  <svg viewBox="0 0 28 28" className="absolute inset-0 h-full w-full -rotate-90">
                    <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                    <circle
                      cx="14" cy="14" r="11" fill="none"
                      stroke={RISK_COLOR[t.level]}
                      strokeWidth="2.5"
                      strokeDasharray={`${(t.risk / 100) * 69} 69`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="relative text-[8px] font-bold" style={{ color: RISK_COLOR[t.level] }}>{t.risk}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-ink">{t.name}</p>
                  <p className="text-[9px] text-ink-faint">{t.time}</p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium"
                  style={{ background: `${RISK_COLOR[t.level]}18`, color: RISK_COLOR[t.level] }}
                >
                  {t.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating glass cards */}
      <div
        className="card-glass animate-floatSlow absolute -left-8 top-16 hidden w-44 flex-col gap-2 p-4 sm:flex"
        style={{ animationDelay: "0s" }}
      >
        <div className="flex items-center gap-1.5">
          <ShieldAlert size={11} className="text-risk-critical" />
          <p className="text-[10px] font-semibold text-risk-critical">Critical risk</p>
        </div>
        <p className="text-[11px] leading-snug text-ink-muted">Database assignment due in 4h</p>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div className="h-full w-[88%] rounded-full bg-risk-critical" />
        </div>
      </div>

      <div
        className="card-glass animate-floatSlow absolute -right-6 top-1/4 hidden w-44 flex-col gap-2 p-4 sm:flex"
        style={{ animationDelay: "-2.5s" }}
      >
        <div className="flex items-center gap-1.5">
          <TrendingUp size={11} className="text-signal-glow" />
          <p className="text-[10px] font-semibold text-signal-glow">Recovery plan ready</p>
        </div>
        <p className="text-[11px] leading-snug text-ink-muted">Risk 82 → 24 with focus blocks</p>
      </div>

      <div
        className="card-glass animate-floatSlow absolute -bottom-5 left-12 hidden w-40 flex-col gap-2 p-4 sm:flex"
        style={{ animationDelay: "-4.5s" }}
      >
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={11} className="text-risk-low" />
          <p className="text-[10px] font-semibold text-risk-low">Saved this week</p>
        </div>
        <p className="text-[11px] leading-snug text-ink-muted">3 deadlines — 0 missed</p>
      </div>

      <div
        className="card-glass animate-floatSlow absolute -bottom-3 right-10 hidden w-40 flex-col gap-2 p-4 sm:flex"
        style={{ animationDelay: "-3s" }}
      >
        <div className="flex items-center gap-1.5">
          <Mic size={11} className="text-signal-glow" />
          <p className="text-[10px] font-semibold text-ink">Voice agent</p>
        </div>
        <p className="text-[11px] leading-snug text-ink-muted">&ldquo;Exam in 12 days...&rdquo;</p>
      </div>

      {/* Bottom gradient fade on small screens */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-base-950 to-transparent sm:hidden" />
    </div>
  );
}

/* ─── Recovery mockup ─────────────────────────────────────────── */
function RecoveryMockup() {
  const BLOCKS = [
    { label: "Deep work", dur: "50m", type: "work", start: "Now" },
    { label: "Short break", dur: "10m", type: "break", start: "50m" },
    { label: "Deep work #2", dur: "50m", type: "work", start: "1h" },
    { label: "Submission check", dur: "15m", type: "submit", start: "2h" },
  ];

  const COLOR: Record<string, string> = {
    work: "bg-signal/20 border-signal/30 text-signal-glow",
    break: "bg-risk-low/10 border-risk-low/20 text-risk-low",
    submit: "bg-risk-critical/10 border-risk-critical/20 text-risk-critical",
  };

  return (
    <div className="w-full max-w-xs space-y-2.5">
      <div className="mb-4 text-center">
        <p className="label-caps text-risk-critical mb-1">Emergency recovery plan</p>
        <p className="text-xs text-ink-faint">Database assignment · 4h remaining</p>
      </div>
      {BLOCKS.map((b) => (
        <div
          key={b.label}
          className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs ${COLOR[b.type]}`}
        >
          <div>
            <p className="font-semibold">{b.label}</p>
            <p className="text-[10px] opacity-70">Starts {b.start}</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px]">
            <Clock size={9} /> {b.dur}
          </span>
        </div>
      ))}
      <div className="rounded-xl border border-risk-critical/20 bg-risk-critical/5 px-3.5 py-2.5">
        <p className="text-[10px] font-medium text-risk-critical">Accountability alert sent</p>
        <p className="mt-0.5 text-[10px] text-ink-faint">Push notification dispatched to your phone</p>
      </div>
    </div>
  );
}
