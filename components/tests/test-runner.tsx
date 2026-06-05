"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { saveAnswer, submitAttempt } from "@/app/tests/actions";
import type { RunnerQuestion } from "@/lib/types";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function fmt(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function TestRunner({
  testTitle,
  attemptId,
  questions,
  savedAnswers,
  endsAtISO,
  // durationMinutes is accepted for completeness; the timer uses endsAtISO.
  marksPerCorrect,
  negativeMarks,
}: {
  testTitle: string;
  attemptId: string;
  questions: RunnerQuestion[];
  savedAnswers: Record<string, number | null>;
  endsAtISO: string;
  durationMinutes: number;
  marksPerCorrect: number;
  negativeMarks: number;
}) {
  const router = useRouter();
  const endsAt = new Date(endsAtISO).getTime();

  const [answers, setAnswers] = useState<Record<string, number | null>>(
    () => ({ ...savedAnswers }),
  );
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(() => endsAt - Date.now());
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const current = questions[index];
  const answeredCount = questions.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== null,
  ).length;

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    const res = await submitAttempt(attemptId);
    if (res.ok) {
      router.push(`/result/${res.attemptId}`);
    } else {
      // Most likely already submitted elsewhere — go to the result anyway.
      router.push(`/result/${attemptId}`);
    }
  }, [attemptId, router]);

  // Server-authoritative countdown — auto-submits at zero.
  useEffect(() => {
    const id = setInterval(() => {
      const left = endsAt - Date.now();
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        doSubmit();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt, doSubmit]);

  function select(optionIndex: number) {
    if (!current) return;
    const next = answers[current.id] === optionIndex ? null : optionIndex;
    setAnswers((a) => ({ ...a, [current.id]: next }));
    // Persist in the background; the timer is the source of truth for time.
    void saveAnswer(attemptId, current.id, next);
  }

  function toggleMark() {
    if (!current) return;
    setMarked((m) => {
      const n = new Set(m);
      if (n.has(current.id)) n.delete(current.id);
      else n.add(current.id);
      return n;
    });
  }

  function go(i: number) {
    setIndex(Math.max(0, Math.min(i, questions.length - 1)));
    setPaletteOpen(false);
  }

  const urgent = remaining <= 60_000;

  const palette = (
    <Palette
      questions={questions}
      answers={answers}
      marked={marked}
      index={index}
      onJump={go}
    />
  );

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--off)" }}>
      {/* Sticky header with timer */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1100px] items-center justify-between gap-3 px-4">
          <p className="min-w-0 truncate text-sm font-bold text-navy">
            {testTitle}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-sm font-bold tabular-nums",
                urgent
                  ? "animate-pulse bg-destructive/10 text-destructive"
                  : "bg-brand/10 text-brand",
              )}
            >
              <Clock className="h-4 w-4" />
              {fmt(remaining)}
            </span>
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-sm font-semibold text-navy lg:hidden"
              aria-label="Question palette"
            >
              <LayoutGrid className="h-4 w-4" />
              {index + 1}/{questions.length}
            </button>
            <Button
              size="sm"
              onClick={() => setShowConfirm(true)}
              disabled={submitting}
            >
              Submit
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1100px] flex-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_280px]">
        {/* Question */}
        <section className="min-w-0">
          {current && (
            <div className="rounded-[var(--r2)] border border-border bg-white p-5 shadow-card sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink-muted">
                  Question {index + 1}{" "}
                  <span className="font-normal">of {questions.length}</span>
                </span>
                <button
                  onClick={toggleMark}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                    marked.has(current.id)
                      ? "border-gold bg-gold/10 text-[#9a7400]"
                      : "border-border text-ink-muted hover:border-brand hover:text-brand",
                  )}
                >
                  <Flag className="h-3.5 w-3.5" />
                  {marked.has(current.id) ? "Marked" : "Mark for review"}
                </button>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-base font-medium leading-relaxed text-navy">
                {current.text}
              </p>

              <div className="mt-5 space-y-2.5">
                {current.options.map((opt, i) => {
                  const selected = answers[current.id] === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => select(i)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border p-3.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        selected
                          ? "border-brand bg-brand/5 ring-1 ring-brand"
                          : "border-border hover:border-brand/40 hover:bg-secondary",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                          selected
                            ? "border-brand bg-brand text-white"
                            : "border-border text-ink-muted",
                        )}
                      >
                        {LETTERS[i]}
                      </span>
                      <span className="text-navy">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Nav controls */}
              <div className="mt-6 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={() => go(index - 1)}
                  disabled={index === 0}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                {answers[current.id] !== undefined &&
                  answers[current.id] !== null && (
                    <button
                      onClick={() => select(answers[current.id]!)}
                      className="text-xs font-medium text-ink-muted hover:text-destructive"
                    >
                      Clear answer
                    </button>
                  )}
                {index === questions.length - 1 ? (
                  <Button onClick={() => setShowConfirm(true)}>
                    Finish
                  </Button>
                ) : (
                  <Button onClick={() => go(index + 1)}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Desktop palette */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-[var(--r2)] border border-border bg-white p-4 shadow-card">
            {palette}
          </div>
        </aside>
      </main>

      {/* Mobile palette drawer */}
      {paletteOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-navy/40"
            onClick={() => setPaletteOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-bold text-navy">Questions</p>
              <button onClick={() => setPaletteOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-ink-muted" />
              </button>
            </div>
            {palette}
          </div>
        </div>
      )}

      {/* Submit confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-navy/50"
            onClick={() => !submitting && setShowConfirm(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-xl font-bold text-navy">
              Submit test?
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              You&apos;ve answered{" "}
              <span className="font-semibold text-navy">
                {answeredCount}/{questions.length}
              </span>{" "}
              questions.
              {answeredCount < questions.length &&
                ` ${questions.length - answeredCount} left unanswered.`}{" "}
              You can&apos;t change answers after submitting.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge variant="success">+{marksPerCorrect} correct</Badge>
              {negativeMarks > 0 && (
                <Badge variant="destructive">−{negativeMarks} wrong</Badge>
              )}
            </div>
            <div className="mt-5 flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Keep going
              </Button>
              <Button
                className="flex-1"
                onClick={doSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit & grade"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Time-up overlay */}
      {submitting && remaining <= 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4">
          <div className="rounded-2xl bg-white px-6 py-5 text-center shadow-xl">
            <Clock className="mx-auto h-7 w-7 text-brand" />
            <p className="mt-2 font-semibold text-navy">Time&apos;s up</p>
            <p className="text-sm text-ink-muted">Grading your test…</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Palette({
  questions,
  answers,
  marked,
  index,
  onJump,
}: {
  questions: RunnerQuestion[];
  answers: Record<string, number | null>;
  marked: Set<string>;
  index: number;
  onJump: (i: number) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-6 gap-2 lg:grid-cols-5">
        {questions.map((q, i) => {
          const answered = answers[q.id] !== undefined && answers[q.id] !== null;
          const isMarked = marked.has(q.id);
          const isCurrent = i === index;
          return (
            <button
              key={q.id}
              onClick={() => onJump(i)}
              className={cn(
                "relative flex h-9 items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
                isCurrent && "ring-2 ring-brand ring-offset-1",
                answered
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-ink-muted hover:border-brand",
              )}
            >
              {i + 1}
              {isMarked && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-white" />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-4 space-y-1.5 text-xs text-ink-muted">
        <Legend className="border-brand bg-brand" label="Answered" />
        <Legend className="border-border bg-white" label="Not answered" />
        <Legend dot label="Marked for review" />
      </div>
    </div>
  );
}

function Legend({
  className,
  label,
  dot,
}: {
  className?: string;
  label: string;
  dot?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {dot ? (
        <span className="h-3 w-3 rounded-full bg-gold" />
      ) : (
        <span className={cn("h-3.5 w-3.5 rounded border", className)} />
      )}
      {label}
    </div>
  );
}
