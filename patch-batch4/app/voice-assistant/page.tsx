"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mic, MicOff, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingSkeleton } from "@/components/Skeleton";
import { apiFetch } from "@/lib/apiClient";
import type { PlannedSubtask } from "@/types";

interface VoiceInterpretation {
  goals: { goalTitle: string; finalDeadline: string; subtasks: PlannedSubtask[] }[];
  clarifyingQuestion: string;
}

// The Web Speech API has no official TS types in lib.dom; declare the minimal shape we use.
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
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

export default function VoiceAssistantPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<VoiceInterpretation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setTranscript("");
      setResult(null);
      recognitionRef.current.start();
      setListening(true);
    }
  }

  async function submitTranscript() {
    if (!transcript.trim()) return;
    setProcessing(true);
    setError(null);
    try {
      const { interpretation } = await apiFetch<{ interpretation: VoiceInterpretation }>(
        "/api/gemini/voice-plan",
        { method: "POST", body: JSON.stringify({ transcript, persistAsTasks: true }) }
      );
      setResult(interpretation);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcessing(false);
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

        <h1 className="font-display text-2xl font-medium text-ink">Voice Assistant</h1>
        <p className="mt-1 mb-8 text-sm text-ink-muted">
          Say everything on your plate in one breath. The Voice Agent will split it into scheduled tasks.
        </p>

        <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/5 bg-base-800/60 p-8">
          {supported ? (
            <button
              onClick={toggleListening}
              className={`relative flex h-20 w-20 items-center justify-center rounded-full transition ${
                listening ? "bg-risk-critical shadow-glow" : "bg-signal shadow-glow"
              }`}
            >
              {listening ? <MicOff size={26} className="text-white" /> : <Mic size={26} className="text-white" />}
              {listening && <span className="absolute inset-0 rounded-full bg-risk-critical animate-pulseRing" />}
            </button>
          ) : (
            <p className="text-xs text-ink-faint">
              Voice capture isn&apos;t supported in this browser — type your update below instead.
            </p>
          )}

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder='e.g. "I have an exam in 12 days and 4 assignments due this week"'
            className="w-full rounded-xl bg-base-700/60 px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-faint"
            rows={3}
          />

          <button
            onClick={submitTranscript}
            disabled={processing || !transcript.trim()}
            className="flex items-center gap-2 rounded-full bg-signal px-5 py-2.5 text-sm font-medium text-white shadow-glow disabled:opacity-50"
          >
            {processing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Build my schedule
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-risk-high">{error}</p>}

        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-4">
            {result.clarifyingQuestion && (
              <p className="rounded-xl border border-risk-medium/30 bg-risk-medium/5 p-3 text-xs text-risk-medium">
                {result.clarifyingQuestion}
              </p>
            )}
            {result.goals.map((goal, gi) => (
              <div key={gi} className="rounded-2xl border border-white/5 bg-base-800/40 p-4">
                <p className="font-display text-sm font-medium text-ink">{goal.goalTitle}</p>
                <p className="mb-3 text-xs text-ink-faint">
                  Due {new Date(goal.finalDeadline).toLocaleString()}
                </p>
                <div className="space-y-1.5">
                  {goal.subtasks.map((s, si) => (
                    <div key={si} className="flex items-center justify-between text-xs">
                      <span className="text-ink-muted">
                        {s.order}. {s.title}
                      </span>
                      <span className="text-ink-faint">{s.estimatedMinutes}m</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs text-ink-faint">Added to your dashboard as tasks.</p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
