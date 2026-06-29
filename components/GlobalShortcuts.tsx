"use client";

import { useState } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";

export function GlobalShortcuts() {
  const [helpOpen, setHelpOpen] = useState(false);
  useKeyboardShortcuts(() => setHelpOpen(true));

  return <KeyboardShortcutsModal open={helpOpen} onClose={() => setHelpOpen(false)} />;
}
