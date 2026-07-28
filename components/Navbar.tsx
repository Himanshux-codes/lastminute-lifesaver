"use client";

import Link from "next/link";
import { Loader2, Radar } from "lucide-react";

export function Navbar({
  user,
  signingIn,
  onPrimaryAction,
}: {
  user: boolean;
  signingIn: boolean;
  onPrimaryAction: () => void;
}) {
  return (
    <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-base-950/80 backdrop-blur-2xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5 sm:px-6">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-2.5">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-shadow duration-200 group-hover:shadow-glow"
            style={{
              background: "linear-gradient(145deg, #9B93FF 0%, #6E63FF 60%, #4E46BE 100%)",
              boxShadow: "0 0 0 1px rgba(110,99,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <Radar size={14} className="text-white" />
          </span>
          <span className="font-display text-sm font-semibold tracking-[-0.02em] text-ink">
            Life Saver
            <span className="ml-1 text-ink-faint font-normal">· AI</span>
          </span>
        </Link>

        {/* Right action */}
        {user ? (
          <Link href="/dashboard" className="btn-primary !px-4 !py-2 text-xs sm:text-sm">
            Open dashboard →
          </Link>
        ) : (
          <button
            onClick={onPrimaryAction}
            disabled={signingIn}
            className="btn-secondary !px-4 !py-2 text-xs sm:text-sm"
          >
            {signingIn && <Loader2 size={12} className="animate-spin" />}
            Sign in with Google
          </button>
        )}
      </div>
    </nav>
  );
}
