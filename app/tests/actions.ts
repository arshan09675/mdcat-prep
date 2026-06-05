"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/subscription";

export type StartResult =
  | { ok: true; attemptId: string }
  | { ok: false; error: string };
export type SimpleResult = { ok: true } | { ok: false; error: string };
export type SubmitResult =
  | { ok: true; attemptId: string }
  | { ok: false; error: string };

/** ms a test is valid for, from started_at. */
function durationMs(durationMinutes: number) {
  return Math.max(1, durationMinutes) * 60 * 1000;
}

async function currentUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Create (or resume) an in-progress attempt. Paid tests are gated here: the
 * caller must have an active subscription (or the test must be free, or the
 * caller is staff). RLS on test_attempts enforces the same rule as a backstop.
 */
export async function startAttempt(testId: string): Promise<StartResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in." };

  const admin = createServiceRoleClient();
  const { data: test } = await admin
    .from("tests")
    .select("id, published, is_free")
    .eq("id", testId)
    .maybeSingle();
  if (!test) return { ok: false, error: "Test not found." };

  const profile = await getCurrentProfile();
  const isStaff = profile?.role === "admin" || profile?.role === "instructor";
  if (!test.published && !isStaff) {
    return { ok: false, error: "This test isn't available." };
  }

  const subscribed = (await getActiveSubscription()) !== null;
  if (!test.is_free && !subscribed && !isStaff) {
    return {
      ok: false,
      error: "This test requires an active subscription.",
    };
  }

  // Resume an existing in-progress attempt instead of creating a duplicate.
  const { data: existing } = await admin
    .from("test_attempts")
    .select("id")
    .eq("user_id", userId)
    .eq("test_id", testId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return { ok: true, attemptId: existing.id };

  const { data: created, error } = await admin
    .from("test_attempts")
    .insert({
      user_id: userId,
      test_id: testId,
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !created) {
    return { ok: false, error: error?.message ?? "Could not start the test." };
  }

  revalidatePath(`/test/${testId}`);
  return { ok: true, attemptId: created.id };
}

/** Persist the student's selection so a refresh/resume keeps their progress. */
export async function saveAnswer(
  attemptId: string,
  mcqId: string,
  selectedIndex: number | null,
): Promise<SimpleResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in." };

  const admin = createServiceRoleClient();
  const { data: attempt } = await admin
    .from("test_attempts")
    .select("id, user_id, test_id, status, started_at, test:tests(duration_minutes)")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt || attempt.user_id !== userId) {
    return { ok: false, error: "Attempt not found." };
  }
  if (attempt.status !== "in_progress") {
    return { ok: false, error: "This attempt is already submitted." };
  }

  const test = attempt.test as unknown as { duration_minutes: number } | null;
  const ends =
    new Date(attempt.started_at).getTime() +
    durationMs(test?.duration_minutes ?? 0);
  if (Date.now() > ends + 5000) {
    return { ok: false, error: "Time is up." };
  }

  const { error } = await admin.from("test_answers").upsert(
    {
      attempt_id: attemptId,
      mcq_id: mcqId,
      selected_index: selectedIndex,
      is_correct: null,
    },
    { onConflict: "attempt_id,mcq_id" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Grade an attempt on the server (the ONLY place the answer key is read) and
 * mark it completed. Idempotent: a completed attempt is returned as-is, so it
 * can't be re-graded or double-submitted. Also used to force-submit on timeout.
 */
export async function submitAttempt(attemptId: string): Promise<SubmitResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in." };

  const admin = createServiceRoleClient();

  const { data: attempt } = await admin
    .from("test_attempts")
    .select("id, user_id, test_id, status")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt || attempt.user_id !== userId) {
    return { ok: false, error: "Attempt not found." };
  }
  if (attempt.status === "completed") {
    return { ok: true, attemptId }; // already graded — no re-submit
  }

  const { data: test } = await admin
    .from("tests")
    .select("marks_per_correct, negative_marks")
    .eq("id", attempt.test_id)
    .maybeSingle();
  if (!test) return { ok: false, error: "Test not found." };

  const marks = Number(test.marks_per_correct) || 1;
  const negative = Number(test.negative_marks) || 0;

  // The answer key — read with the service role so it never reaches the client.
  const { data: tqs } = await admin
    .from("test_questions")
    .select("mcq_id, mcq:mcqs(id, correct_index, subject_id)")
    .eq("test_id", attempt.test_id)
    .order("position");

  const questions = (tqs ?? []).map((r) => {
    const mcq = r.mcq as unknown as {
      id: string;
      correct_index: number;
      subject_id: string | null;
    };
    return { mcqId: r.mcq_id as string, ...mcq };
  });

  const { data: answerRows } = await admin
    .from("test_answers")
    .select("mcq_id, selected_index")
    .eq("attempt_id", attemptId);
  const selectedByMcq = new Map<string, number | null>();
  for (const a of answerRows ?? []) {
    selectedByMcq.set(a.mcq_id, a.selected_index);
  }

  // Subject names for the breakdown.
  const subjectIds = Array.from(
    new Set(questions.map((q) => q.subject_id).filter(Boolean) as string[]),
  );
  const subjectName = new Map<string, string>();
  if (subjectIds.length > 0) {
    const { data: subs } = await admin
      .from("subjects")
      .select("id, name")
      .in("id", subjectIds);
    for (const s of subs ?? []) subjectName.set(s.id, s.name);
  }

  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  const breakdown: Record<string, { correct: number; total: number }> = {};
  const gradedRows: {
    attempt_id: string;
    mcq_id: string;
    selected_index: number | null;
    is_correct: boolean | null;
  }[] = [];

  for (const q of questions) {
    const selected = selectedByMcq.has(q.mcqId)
      ? (selectedByMcq.get(q.mcqId) ?? null)
      : null;
    const key = q.subject_id ? (subjectName.get(q.subject_id) ?? "Other") : "Other";
    if (!breakdown[key]) breakdown[key] = { correct: 0, total: 0 };
    breakdown[key].total += 1;

    let isCorrect: boolean | null = null;
    if (selected === null) {
      skipped += 1;
    } else if (selected === q.correct_index) {
      correct += 1;
      isCorrect = true;
      breakdown[key].correct += 1;
    } else {
      wrong += 1;
      isCorrect = false;
    }
    gradedRows.push({
      attempt_id: attemptId,
      mcq_id: q.mcqId,
      selected_index: selected,
      is_correct: isCorrect,
    });
  }

  const score = correct * marks - wrong * negative;
  const totalMarks = questions.length * marks;

  if (gradedRows.length > 0) {
    const { error: ansErr } = await admin
      .from("test_answers")
      .upsert(gradedRows, { onConflict: "attempt_id,mcq_id" });
    if (ansErr) return { ok: false, error: ansErr.message };
  }

  const { error: updErr } = await admin
    .from("test_attempts")
    .update({
      status: "completed",
      submitted_at: new Date().toISOString(),
      score,
      total_marks: totalMarks,
      correct_count: correct,
      wrong_count: wrong,
      skipped_count: skipped,
      subject_breakdown: breakdown,
    })
    .eq("id", attemptId)
    .eq("status", "in_progress"); // guard against a concurrent submit
  if (updErr) return { ok: false, error: updErr.message };

  revalidatePath(`/result/${attemptId}`);
  revalidatePath("/dashboard");
  return { ok: true, attemptId };
}
