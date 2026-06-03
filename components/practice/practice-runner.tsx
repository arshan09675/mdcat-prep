"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { checkAnswer, type CheckResult } from "@/app/practice/actions";
import type { PracticeMcq } from "@/lib/types";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function PracticeRunner({
  mcqs,
  lockedCount,
  subscribed,
}: {
  mcqs: PracticeMcq[];
  lockedCount: number;
  subscribed: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [pending, setPending] = useState(false);
  const [correctTally, setCorrectTally] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  if (mcqs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <p className="text-lg font-medium text-foreground">
            {lockedCount > 0
              ? "All MCQs in this topic are premium"
              : "No MCQs in this topic yet"}
          </p>
          {lockedCount > 0 && (
            <>
              <p className="max-w-sm text-muted-foreground">
                {lockedCount} premium MCQ{lockedCount === 1 ? "" : "s"} are
                waiting. Subscribe to unlock them.
              </p>
              <Button asChild>
                <Link href="/pricing">View plans</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const mcq = mcqs[index];
  const isLast = index === mcqs.length - 1;
  const revealed = result?.ok === true;

  async function submit() {
    if (selected === null || pending) return;
    setPending(true);
    const res = await checkAnswer(mcq.id, selected);
    setPending(false);
    setResult(res);
    if (res.ok) {
      setAnsweredCount((c) => c + 1);
      if (res.isCorrect) setCorrectTally((c) => c + 1);
    }
  }

  function next() {
    setIndex((i) => Math.min(i + 1, mcqs.length - 1));
    setSelected(null);
    setResult(null);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Progress header */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          Question {index + 1}{" "}
          <span className="text-muted-foreground">of {mcqs.length}</span>
        </span>
        <span className="text-muted-foreground">
          {correctTally}/{answeredCount} correct
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${((index + 1) / mcqs.length) * 100}%` }}
        />
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <div className="flex items-start justify-between gap-3">
            <p className="text-base font-medium leading-relaxed text-foreground">
              {mcq.text}
            </p>
            <Badge variant="secondary" className="shrink-0 capitalize">
              {mcq.difficulty}
            </Badge>
          </div>

          <div className="space-y-2.5">
            {mcq.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrectChoice = revealed && result.correctIndex === i;
              const isWrongChoice =
                revealed && isSelected && !result.isCorrect;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={revealed}
                  onClick={() => setSelected(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    !revealed &&
                      isSelected &&
                      "border-primary bg-primary/5 ring-1 ring-primary",
                    !revealed &&
                      !isSelected &&
                      "border-border hover:border-primary/40 hover:bg-secondary",
                    isCorrectChoice &&
                      "border-success bg-success/10 text-foreground",
                    isWrongChoice && "border-destructive bg-destructive/10",
                    revealed && !isCorrectChoice && !isWrongChoice && "opacity-70",
                    revealed && "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                      isCorrectChoice &&
                        "border-success bg-success text-success-foreground",
                      isWrongChoice &&
                        "border-destructive bg-destructive text-destructive-foreground",
                      !revealed && isSelected && "border-primary text-primary",
                    )}
                  >
                    {isCorrectChoice ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : isWrongChoice ? (
                      <X className="h-3.5 w-3.5" />
                    ) : (
                      LETTERS[i]
                    )}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {result && !result.ok && (
            <p className="text-sm font-medium text-destructive">
              {result.error}
            </p>
          )}
          {revealed && (
            <div
              className={cn(
                "rounded-lg border p-4 text-sm",
                result.isCorrect
                  ? "border-success/30 bg-success/5"
                  : "border-destructive/30 bg-destructive/5",
              )}
            >
              <p
                className={cn(
                  "font-semibold",
                  result.isCorrect ? "text-success" : "text-destructive",
                )}
              >
                {result.isCorrect ? "Correct" : "Incorrect"}
                {!result.isCorrect && (
                  <span className="text-foreground">
                    {" "}
                    — correct answer is {LETTERS[result.correctIndex]}.
                  </span>
                )}
              </p>
              {result.explanation && (
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {result.explanation}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            {!revealed ? (
              <Button onClick={submit} disabled={selected === null || pending}>
                {pending ? "Checking…" : "Submit answer"}
              </Button>
            ) : isLast ? (
              <span className="text-sm text-muted-foreground">
                You&apos;ve reached the last MCQ.
              </span>
            ) : (
              <Button onClick={next}>Next question</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {lockedCount > 0 && (
        <Card className="border-primary/20 bg-surface">
          <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              {lockedCount} more premium MCQ{lockedCount === 1 ? "" : "s"} in
              this topic.
            </p>
            <Button asChild size="sm">
              <Link href="/pricing">Subscribe to unlock</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!subscribed && lockedCount === 0 && mcqs.every((m) => m.is_free) && (
        <p className="text-center text-xs text-muted-foreground">
          You&apos;re practicing the free MCQs for this topic.
        </p>
      )}
    </div>
  );
}
