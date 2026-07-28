import { Radar, Github, Twitter } from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/dashboard?demo=1" },
  { label: "Deadline Radar", href: "/deadline-radar" },
  { label: "Analytics", href: "/analytics" },
  { label: "Focus Mode", href: "/focus" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-5 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{
                  background: "linear-gradient(145deg, #9B93FF 0%, #6E63FF 60%, #4E46BE 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                <Radar size={12} className="text-white" />
              </span>
              <span className="font-display text-sm font-semibold tracking-tight text-ink">
                Last-Minute Life Saver
              </span>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-ink-faint">
              An AI productivity operating system that predicts missed deadlines and intervenes before they happen.
            </p>
            <div className="flex items-center gap-1 mt-1">
              <a
                href="https://github.com"
                aria-label="GitHub"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-ink-faint transition hover:border-white/20 hover:text-ink"
              >
                <Github size={13} />
              </a>
              <a
                href="https://twitter.com"
                aria-label="Twitter/X"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-ink-faint transition hover:border-white/20 hover:text-ink"
              >
                <Twitter size={13} />
              </a>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex flex-col gap-2.5">
            <p className="label-caps mb-1">Product</p>
            {NAV.map((n) => (
              <a
                key={n.label}
                href={n.href}
                className="text-sm text-ink-muted transition hover:text-ink"
              >
                {n.label}
              </a>
            ))}
          </div>

          {/* Stack */}
          <div className="flex flex-col gap-2.5">
            <p className="label-caps mb-1">Built with</p>
            {[
              "Google Gemini 2.5 Flash",
              "Firebase Firestore",
              "Next.js 15 App Router",
              "Framer Motion",
            ].map((s) => (
              <span key={s} className="text-sm text-ink-muted">{s}</span>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-ink-faint">
            Built for VIBE2SHIP · Coding Ninjas × Google for Developers
          </p>
          <p className="text-xs text-ink-faint">
            Powered by Gemini, Firebase, and a healthy fear of deadlines.
          </p>
        </div>
      </div>
    </footer>
  );
}
