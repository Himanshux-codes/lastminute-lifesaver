"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const ROUTES: Record<string, string> = {
  d: "/dashboard",
  r: "/deadline-radar",
  a: "/analytics",
  l: "/life-risk",
  f: "/focus",
  v: "/voice-assistant",
  g: "/goal-planner",
  s: "/settings",
  p: "/profile",
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || target.isContentEditable;
}

/**
 * "g" then a letter navigates (e.g. "g" "d" -> dashboard), mirroring the Gmail/Linear
 * convention. "?" opens the shortcuts help modal via onOpenHelp.
 */
export function useKeyboardShortcuts(onOpenHelp: () => void) {
  const router = useRouter();
  const awaitingSecondKey = useRef(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === "?") {
        event.preventDefault();
        onOpenHelp();
        return;
      }

      if (awaitingSecondKey.current) {
        awaitingSecondKey.current = false;
        const path = ROUTES[event.key.toLowerCase()];
        if (path) {
          event.preventDefault();
          router.push(path);
        }
        return;
      }

      if (event.key.toLowerCase() === "g") {
        awaitingSecondKey.current = true;
        setTimeout(() => {
          awaitingSecondKey.current = false;
        }, 1500);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, onOpenHelp]);
}

export const SHORTCUT_LIST: { keys: string; description: string }[] = [
  { keys: "g d", description: "Go to dashboard" },
  { keys: "g r", description: "Go to deadline radar" },
  { keys: "g a", description: "Go to analytics" },
  { keys: "g l", description: "Go to life risk score" },
  { keys: "g f", description: "Go to focus mode" },
  { keys: "g v", description: "Go to voice assistant" },
  { keys: "g g", description: "Go to goal planner" },
  { keys: "g s", description: "Go to settings" },
  { keys: "g p", description: "Go to profile" },
  { keys: "?", description: "Open this shortcuts list" },
];
