import { Radar } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] px-5 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.05] ring-1 ring-white/[0.06]">
            <Radar size={12} className="text-signal-glow" />
          </span>
          <span className="text-xs text-ink-faint">
            Built for VIBE2SHIP · Coding Ninjas × Google for Developers
          </span>
        </div>
        <p className="text-xs text-ink-faint">Powered by Gemini, Firebase, and a healthy fear of deadlines.</p>
      </div>
    </footer>
  );
}
