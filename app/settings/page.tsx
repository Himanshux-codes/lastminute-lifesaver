"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Download, FileText, Upload, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingSkeleton } from "@/components/Skeleton";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { apiFetch } from "@/lib/apiClient";
import { exportTasksToCSV, exportTasksToPDF } from "@/lib/export";
import { importTasksFromCsv } from "@/lib/importCsv";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { SHORTCUT_LIST } from "@/hooks/useKeyboardShortcuts";
import type { Task } from "@/types";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  async function handleExport(format: "csv" | "pdf") {
    setExporting(format);
    try {
      const { tasks } = await apiFetch<{ tasks: Task[] }>("/api/tasks");
      if (format === "csv") exportTasksToCSV(tasks);
      else exportTasksToPDF(tasks);
    } catch (e) {
      showToast(`Export failed: ${(e as Error).message}`, { variant: "error" });
    } finally {
      setExporting(null);
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const { imported, errors } = await importTasksFromCsv(text);
      showToast(
        errors.length > 0
          ? `Imported ${imported} task(s), ${errors.length} skipped.`
          : `Imported ${imported} task(s).`,
        { variant: errors.length > 0 ? "info" : "success" }
      );
    } catch (e) {
      showToast(`Import failed: ${(e as Error).message}`, { variant: "error" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (loading || !user) {
    return <PageLoadingSkeleton />;
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <a href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink-muted">
          <ArrowLeft size={12} /> Back to dashboard
        </a>

        <h1 className="font-display text-2xl font-medium text-ink">Settings</h1>
        <p className="mt-1 mb-8 text-sm text-ink-muted">Appearance, alerts, and your data.</p>

        <section className="mb-6 rounded-2xl border border-white/5 bg-base-800/60 p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">Appearance</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink">Theme</span>
            <button
              onClick={toggleTheme}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
            >
              {theme === "dark" ? "Switch to light" : "Switch to dark"}
            </button>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-white/5 bg-base-800/60 p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">Notifications</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink">Push alerts for critical risk</span>
            <PushNotificationToggle />
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-white/5 bg-base-800/60 p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">Your data</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleExport("csv")}
              disabled={exporting !== null}
              className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-muted hover:text-ink disabled:opacity-50"
            >
              {exporting === "csv" ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              Export CSV
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting !== null}
              className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-muted hover:text-ink disabled:opacity-50"
            >
              {exporting === "pdf" ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
              Export PDF
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-ink-muted hover:text-ink disabled:opacity-50"
            >
              {importing ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              Import CSV
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            CSV import expects columns: title, category, estimatedMinutes, deadline.
          </p>
        </section>

        <section className="mb-6 rounded-2xl border border-signal/20 bg-signal/5 p-5">
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-signal-glow">
            <Sparkles size={12} /> Demo mode
          </p>
          <p className="mb-3 text-sm text-ink-muted">
            See the dashboard populated with sample tasks and risk scores — no setup, no sign-in needed.
          </p>
          <a
            href="/dashboard?demo=1"
            className="inline-flex items-center rounded-full bg-signal px-4 py-2 text-xs font-medium text-white shadow-glow"
          >
            Open demo dashboard
          </a>
        </section>

        <section className="rounded-2xl border border-white/5 bg-base-800/60 p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-faint">Keyboard shortcuts</p>
          <div className="space-y-1.5">
            {SHORTCUT_LIST.map((s) => (
              <div key={s.keys} className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">{s.description}</span>
                <kbd className="rounded-md border border-white/10 bg-base-700 px-2 py-1 font-mono text-[10px] text-ink">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
