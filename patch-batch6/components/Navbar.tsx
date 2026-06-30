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
    <nav className="sticky top-0 z-30 border-b border-white/[0.06] bg-base-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-signal-glow to-signal shadow-glow-sm">
            <Radar size={14} className="text-white" />
          </span>
          <span className="font-display text-sm font-semibold tracking-tight text-ink">
            Last-Minute Life Saver
          </span>
        </Link>

        {user ? (
          <Link href="/dashboard" className="btn-secondary !py-2 text-xs sm:text-sm">
            Open dashboard
          </Link>
        ) : (
          <button onClick={onPrimaryAction} disabled={signingIn} className="btn-secondary !py-2 text-xs sm:text-sm">
            {signingIn && <Loader2 size={13} className="animate-spin" />}
            Sign in with Google
          </button>
        )}
      </div>
    </nav>
  );
}
