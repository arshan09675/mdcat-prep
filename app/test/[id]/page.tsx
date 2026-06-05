import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TestIntro } from "@/components/tests/test-intro";
import { TestRunner } from "@/components/tests/test-runner";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/subscription";
import { submitAttempt } from "@/app/tests/actions";
import type { RunnerQuestion, Test } from "@/lib/types";

export const metadata = { title: "Test — MDCAT Prep" };

export default async function TestRunnerPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/test/${params.id}`);

  const admin = createServiceRoleClient();
  const { data: testData } = await admin
    .from("tests")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  const profile = await getCurrentProfile();
  const isStaff = profile?.role === "admin" || profile?.role === "instructor";

  if (!testData || (!(testData as Test).published && !isStaff)) notFound();
  const test = testData as Test;

  // Resume an in-progress attempt if one exists.
  const { data: attempt } = await admin
    .from("test_attempts")
    .select("id, started_at, status")
    .eq("user_id", user.id)
    .eq("test_id", test.id)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (attempt) {
    const endsAtMs =
      new Date(attempt.started_at).getTime() + test.duration_minutes * 60 * 1000;

    // Time already elapsed → grade now and send to the result page.
    if (Date.now() > endsAtMs) {
      await submitAttempt(attempt.id);
      redirect(`/result/${attempt.id}`);
    }

    const [{ data: tqs }, { data: saved }] = await Promise.all([
      admin
        .from("test_questions")
        .select("position, mcq:mcqs(id, text, options, difficulty, subject_id)")
        .eq("test_id", test.id)
        .order("position"),
      admin
        .from("test_answers")
        .select("mcq_id, selected_index")
        .eq("attempt_id", attempt.id),
    ]);

    const questions: RunnerQuestion[] = (tqs ?? []).map((r) => {
      const m = r.mcq as unknown as RunnerQuestion & { subject_id: string | null };
      return {
        id: m.id,
        text: m.text,
        options: m.options,
        difficulty: m.difficulty,
        subjectId: m.subject_id ?? null,
      };
    });

    const savedAnswers: Record<string, number | null> = {};
    for (const a of saved ?? []) savedAnswers[a.mcq_id] = a.selected_index;

    if (questions.length === 0) {
      return (
        <CenteredShell>
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-lg font-semibold text-navy">
                This test has no questions yet
              </p>
              <p className="max-w-sm text-sm text-ink-muted">
                Please check back later.
              </p>
              <Button asChild variant="outline">
                <Link href="/tests">Back to tests</Link>
              </Button>
            </CardContent>
          </Card>
        </CenteredShell>
      );
    }

    return (
      <TestRunner
        testTitle={test.title}
        attemptId={attempt.id}
        questions={questions}
        savedAnswers={savedAnswers}
        endsAtISO={new Date(endsAtMs).toISOString()}
        durationMinutes={test.duration_minutes}
        marksPerCorrect={Number(test.marks_per_correct)}
        negativeMarks={Number(test.negative_marks)}
      />
    );
  }

  // No active attempt — gate paid tests, then show the start screen.
  const subscribed = (await getActiveSubscription()) !== null;
  const allowed = test.is_free || subscribed || isStaff;

  if (!allowed) {
    return (
      <CenteredShell>
        <Card className="border-brand/20">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Lock className="h-6 w-6" />
            </span>
            <p className="text-lg font-semibold text-navy">
              This test is for subscribers
            </p>
            <p className="max-w-sm text-sm text-ink-muted">
              Unlock all mock tests, past papers, and explanations with an
              active plan.
            </p>
            <Button asChild>
              <Link href="/pricing">View plans</Link>
            </Button>
          </CardContent>
        </Card>
      </CenteredShell>
    );
  }

  return (
    <CenteredShell>
      <TestIntro
        testId={test.id}
        title={test.title}
        type={test.type}
        durationMinutes={test.duration_minutes}
        totalQuestions={test.total_questions}
        marksPerCorrect={Number(test.marks_per_correct)}
        negativeMarks={Number(test.negative_marks)}
        isFree={test.is_free}
        pastPaperYear={test.past_paper_year}
      />
    </CenteredShell>
  );
}

function CenteredShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "var(--off)" }}
    >
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 items-center px-5 py-12">
        <div className="w-full">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
