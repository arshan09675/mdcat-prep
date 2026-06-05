import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, X, Minus, Trophy, ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { TestAttempt } from "@/lib/types";

export const metadata = { title: "Result — MDCAT Prep" };

const LETTERS = ["A", "B", "C", "D", "E", "F"];

interface ReviewMcq {
  id: string;
  text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
}

export default async function ResultPage({
  params,
}: {
  params: { attemptId: string };
}) {
  // RLS: test_attempts SELECT is owner-or-staff only, so a non-owner read
  // returns null → notFound (no leak).
  const supabase = createClient();
  const { data: attemptData } = await supabase
    .from("test_attempts")
    .select("*")
    .eq("id", params.attemptId)
    .maybeSingle();
  if (!attemptData) notFound();
  const attempt = attemptData as TestAttempt;

  if (attempt.status !== "completed") {
    redirect(`/test/${attempt.test_id}`);
  }

  const admin = createServiceRoleClient();
  const [{ data: test }, { data: tqs }, { data: answers }] = await Promise.all([
    admin
      .from("tests")
      .select("title, type, past_paper_year")
      .eq("id", attempt.test_id)
      .maybeSingle(),
    admin
      .from("test_questions")
      .select(
        "position, mcq:mcqs(id, text, options, correct_index, explanation)",
      )
      .eq("test_id", attempt.test_id)
      .order("position"),
    admin
      .from("test_answers")
      .select("mcq_id, selected_index, is_correct")
      .eq("attempt_id", attempt.id),
  ]);

  const selectedByMcq = new Map<string, number | null>();
  for (const a of answers ?? []) selectedByMcq.set(a.mcq_id, a.selected_index);

  const questions: ReviewMcq[] = (tqs ?? []).map(
    (r) => r.mcq as unknown as ReviewMcq,
  );

  const total = attempt.total_marks ?? 0;
  const score = attempt.score ?? 0;
  const pct = total > 0 ? Math.round((Math.max(0, score) / total) * 100) : 0;
  const breakdown = attempt.subject_breakdown ?? {};

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--off)" }}>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 py-10 md:px-8">
        <Link
          href="/tests"
          className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted transition-colors hover:text-brand"
        >
          <ChevronLeft className="h-4 w-4" /> All tests
        </Link>

        <div className="mt-3">
          <Badge variant="secondary">
            {test?.past_paper_year
              ? `Past Paper ${test.past_paper_year}`
              : "Result"}
          </Badge>
          <h1 className="mt-2 font-display text-3xl font-bold text-navy">
            {test?.title ?? "Test result"}
          </h1>
          {attempt.submitted_at && (
            <p className="mt-1 text-sm text-ink-muted">
              Submitted {new Date(attempt.submitted_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Score hero */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-[var(--r2)] border border-border bg-white p-6 shadow-card">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <Trophy className="h-7 w-7" />
              </span>
              <div>
                <p className="text-sm text-ink-muted">Net score</p>
                <p className="font-display text-3xl font-bold text-navy">
                  {score}
                  <span className="text-lg font-semibold text-ink-muted">
                    {" "}
                    / {total}
                  </span>
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm text-ink-muted">Percentage</p>
                <p className="font-display text-3xl font-bold text-brand">
                  {pct}%
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Stat
                icon={Check}
                value={attempt.correct_count ?? 0}
                label="Correct"
                tone="success"
              />
              <Stat
                icon={X}
                value={attempt.wrong_count ?? 0}
                label="Wrong"
                tone="destructive"
              />
              <Stat
                icon={Minus}
                value={attempt.skipped_count ?? 0}
                label="Skipped"
                tone="muted"
              />
            </div>
          </div>

          {/* Subject breakdown */}
          <div className="rounded-[var(--r2)] border border-border bg-white p-6 shadow-card">
            <h2 className="text-base font-bold text-navy">Subject breakdown</h2>
            {Object.keys(breakdown).length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">
                No subject data for this test.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {Object.entries(breakdown).map(([subject, s]) => {
                  const p =
                    s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                  return (
                    <div key={subject}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-navy">{subject}</span>
                        <span className="text-ink-muted">
                          {s.correct}/{s.total} · {p}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-brand transition-all"
                          style={{ width: `${p}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Per-question review */}
        <h2 className="mb-4 mt-10 font-display text-2xl font-bold text-navy">
          Review
        </h2>
        <div className="space-y-4">
          {questions.map((q, qi) => {
            const selected = selectedByMcq.has(q.id)
              ? (selectedByMcq.get(q.id) ?? null)
              : null;
            const isCorrect = selected === q.correct_index;
            const skipped = selected === null;
            return (
              <div
                key={q.id}
                className="rounded-[var(--r2)] border border-border bg-white p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-navy">
                    <span className="text-ink-muted">{qi + 1}.</span> {q.text}
                  </p>
                  <Badge
                    variant={
                      skipped
                        ? "outline"
                        : isCorrect
                          ? "success"
                          : "destructive"
                    }
                    className="shrink-0"
                  >
                    {skipped ? "Skipped" : isCorrect ? "Correct" : "Wrong"}
                  </Badge>
                </div>

                <div className="mt-4 space-y-2">
                  {q.options.map((opt, i) => {
                    const isAnswer = i === q.correct_index;
                    const isWrongPick = i === selected && !isCorrect;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 text-sm",
                          isAnswer && "border-success bg-success/10",
                          isWrongPick && "border-destructive bg-destructive/10",
                          !isAnswer && !isWrongPick && "border-border opacity-80",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                            isAnswer &&
                              "border-success bg-success text-success-foreground",
                            isWrongPick &&
                              "border-destructive bg-destructive text-destructive-foreground",
                            !isAnswer &&
                              !isWrongPick &&
                              "border-border text-ink-muted",
                          )}
                        >
                          {isAnswer ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : isWrongPick ? (
                            <X className="h-3.5 w-3.5" />
                          ) : (
                            LETTERS[i]
                          )}
                        </span>
                        <span className="text-navy">{opt}</span>
                        {i === selected && (
                          <span className="ml-auto text-xs font-semibold text-ink-muted">
                            Your answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="mt-3 rounded-lg border border-brand/20 bg-brand/5 p-3 text-sm">
                    <p className="font-semibold text-brand">Explanation</p>
                    <p className="mt-1 whitespace-pre-wrap leading-relaxed text-ink-mid">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/tests">More tests</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Check;
  value: number;
  label: string;
  tone: "success" | "destructive" | "muted";
}) {
  const toneCls =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "destructive"
        ? "bg-destructive/10 text-destructive"
        : "bg-secondary text-ink-muted";
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <span
        className={cn(
          "mx-auto flex h-8 w-8 items-center justify-center rounded-full",
          toneCls,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-1.5 text-xl font-bold text-navy">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}
