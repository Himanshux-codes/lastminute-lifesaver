"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Keyboard } from "lucide-react";
import { SHORTCUT_LIST } from "@/hooks/useKeyboardShortcuts";

export function KeyboardShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-base-900 p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="flex items-center gap-2 font-display text-sm font-medium text-ink">
                <Keyboard size={16} className="text-signal-glow" /> Keyboard shortcuts
              </p>
              <button onClick={onClose} aria-label="Close" className="text-ink-faint hover:text-ink-muted">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {SHORTCUT_LIST.map((s) => (
                <div key={s.keys} className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted">{s.description}</span>
                  <kbd className="rounded-md border border-white/10 bg-base-800 px-2 py-1 font-mono text-[10px] text-ink">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
