"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mic, MicOff, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { PageLoadingSkeleton } from "@/components/Skeleton";
import { PageShell } from "@/components/PageShell";
import { apiFetch } from "@/lib/apiClient";
import type { PlannedSubtask } from "@/types";

interface VoiceInterpretation {
  goals: { goalTitle: string; finalDeadline: string; subtasks: PlannedSubtask[] }[];
  clarifyingQuestion: string;
}

interface SpeechRecognitionResultLike {
  resultIndex: number;
  results: { [key: number]: { [key: number]: { transcript: string } }; length: number };
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionResultLike) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
}

export default function VoiceAssistantPage() {
  const { user, loading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<VoiceInterpretation | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => { if (!loading && !user) router.replace("/"); }, [loading, user, router]);

  useEffect(() => {
    const Ctor = (window as unknown as Record<string, unknown>).SpeechRecognition as (new () => SpeechRecognitionLike) | undefined
      ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition as (new () => SpeechRecognitionLike) | undefined;
    if (!Ctor) { setSupported(false); return; }
    const r = new Ctor();
    r.continuous = false; r.interimResults = true; r.lang = "en-US";
    r.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setTranscript(t);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recognitionRef.current = r;
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (listening) { recognitionRef.current.stop(); setListening(false); }
    else { setTranscript(""); setResult(null); recognitionRef.current.start(); setListening(true); }
  }

  async function submit() {
    if (!transcript.trim()) return;
    setProcessing(true);
    try {
      const { interpretation } = await apiFetch<{ interpretation: VoiceInterpretation }>("/api/gemini/voice-plan", {
        method: "POST",
        body: JSON.stringify({ transcript, persistAsTasks: true }),
      });
      setResult(interpretation);
      showToast("Tasks added to your dashboard.", { variant: "success" });
    } catch (e) {
      showToast(`Couldn't parse: ${(e as Error).message}`, { variant: "error" });
    } finally { setProcessing(false); }
  }

  if (loading || !user) return <PageLoadingSkeleton />;

  return (
    <PageShell
      title="Voice Assistant"
      subtitle='Say everything on your plate in one breath — "exam in 12 days and 4 assignments" — and the Voice Agent builds your schedule.'
      badge={<span className="label-caps flex items-center gap-1.5 text-signal-glow"><Mic size={11} /> Voice input</span>}
    >
      <div className="card mb-6 flex flex-col items-center gap-6 p-8">
        {supported && (
          <div className="relative flex items-center justify-center">
            {listening && (
              <span className="absolute h-24 w-24 animate-pulseRing rounded-full bg-risk-critical/20" />
            )}
            <button
              onClick={toggleListening}
              aria-label={listening ? "Stop listening" : "Start listening"}
              className="relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-200"
              style={{
                background: listening
                  ? "linear-gradient(145deg,#FF3B5C,#F87171)"
                  : "linear-gradient(145deg,#9B93FF,#6E63FF 60%,#4E46BE)",
                boxShadow: listening
                  ? "0 0 0 1px rgba(255,59,92,0.4), 0 8px 32px -4px rgba(255,59,92,0.5)"
                  : "0 0 0 1px rgba(110,99,255,0.4), 0 8px 32px -4px rgba(110,99,255,0.5)",
              }}
            >
              {listening ? <MicOff size={28} className="text-white" /> : <Mic size={28} className="text-white" />}
            </button>
          </div>
        )}

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={supported ? "Or type here instead…" : '"Exam in 12 days and 4 assignments due this week"'}
          rows={3}
          className="input-base w-full resize-none text-center"
        />

        <button
          onClick={submit}
          disabled={processing || !transcript.trim()}
          className="btn-primary w-full max-w-xs justify-center py-3"
        >
          {processing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          {processing ? "Building schedule…" : "Build my schedule"}
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
          {result.clarifyingQuestion && (
            <div className="rounded-[14px] border border-risk-medium/20 bg-risk-medium/5 p-3.5">
              <p className="text-xs text-risk-medium">{result.clarifyingQuestion}</p>
            </div>
          )}
          {result.goals.map((goal, gi) => (
            <div key={gi} className="card p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <p className="font-display text-base font-semibold text-ink">{goal.goalTitle}</p>
                <span className="shrink-0 text-xs text-ink-faint">
                  Due {new Date(goal.finalDeadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="space-y-1.5">
                {goal.subtasks.map((s, si) => (
                  <div key={si} className="flex items-center gap-2.5 text-sm">
                    <ChevronRight size={12} className="shrink-0 text-signal-glow" />
                    <span className="flex-1 text-ink-muted">{s.title}</span>
                    <span className="shrink-0 font-mono text-xs text-ink-faint">{s.estimatedMinutes}m</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-center text-xs text-ink-faint">All tasks added to your dashboard.</p>
        </motion.div>
      )}
    </PageShell>
  );
}
