"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { TestType } from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

export interface TestInput {
  id?: string;
  title: string;
  type: TestType;
  subjectId: string | null;
  topicId: string | null;
  durationMinutes: number;
  marksPerCorrect: number;
  negativeMarks: number;
  pastPaperYear: number | null;
  isFree: boolean;
  published: boolean;
}

function validate(input: TestInput): string | null {
  if (!input.title.trim()) return "Title is required.";
  if (!["mock", "topic", "past_paper", "practice"].includes(input.type)) {
    return "Invalid test type.";
  }
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0) {
    return "Duration must be a positive number of minutes.";
  }
  if (!Number.isFinite(input.marksPerCorrect) || input.marksPerCorrect <= 0) {
    return "Marks per correct must be greater than 0.";
  }
  if (!Number.isFinite(input.negativeMarks) || input.negativeMarks < 0) {
    return "Negative marks can't be negative.";
  }
  return null;
}

function toRow(input: TestInput) {
  return {
    title: input.title.trim(),
    type: input.type,
    subject_id: input.subjectId,
    topic_id: input.topicId,
    duration_minutes: Math.round(input.durationMinutes),
    marks_per_correct: input.marksPerCorrect,
    negative_marks: input.negativeMarks,
    past_paper_year: input.pastPaperYear,
    is_free: input.isFree,
    published: input.published,
  };
}

export async function createTest(input: TestInput): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const admin = createServiceRoleClient();
  const { error } = await admin.from("tests").insert(toRow(input));
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/tests");
  return { ok: true };
}

export async function updateTest(input: TestInput): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };
  if (!input.id) return { ok: false, error: "Missing test id." };
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const admin = createServiceRoleClient();
  const { error } = await admin.from("tests").update(toRow(input)).eq("id", input.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/tests");
  revalidatePath(`/admin/tests/${input.id}`);
  return { ok: true };
}

export async function deleteTest(id: string): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };

  const admin = createServiceRoleClient();
  const { error } = await admin.from("tests").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/tests");
  return { ok: true };
}

// ---------------------------------------------------------------------------
//  Test ↔ MCQ wiring
// ---------------------------------------------------------------------------
async function syncTotal(admin: ReturnType<typeof createServiceRoleClient>, testId: string) {
  const { count } = await admin
    .from("test_questions")
    .select("id", { count: "exact", head: true })
    .eq("test_id", testId);
  await admin
    .from("tests")
    .update({ total_questions: count ?? 0 })
    .eq("id", testId);
}

export async function addQuestionsToTest(
  testId: string,
  mcqIds: string[],
): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };
  if (mcqIds.length === 0) return { ok: false, error: "No questions selected." };

  const admin = createServiceRoleClient();

  // Append after the current max position, skipping already-attached MCQs.
  const { data: existing } = await admin
    .from("test_questions")
    .select("mcq_id, position")
    .eq("test_id", testId);

  const have = new Set((existing ?? []).map((r) => r.mcq_id));
  let pos = Math.max(0, ...(existing ?? []).map((r) => r.position)) + 1;

  const rows = mcqIds
    .filter((id) => !have.has(id))
    .map((mcq_id) => ({ test_id: testId, mcq_id, position: pos++ }));

  if (rows.length === 0) {
    return { ok: false, error: "Those questions are already in this test." };
  }

  const { error } = await admin.from("test_questions").insert(rows);
  if (error) return { ok: false, error: error.message };

  await syncTotal(admin, testId);
  revalidatePath(`/admin/tests/${testId}`);
  return { ok: true };
}

export async function removeQuestionFromTest(
  testQuestionId: string,
  testId: string,
): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("test_questions")
    .delete()
    .eq("id", testQuestionId);
  if (error) return { ok: false, error: error.message };

  await syncTotal(admin, testId);
  revalidatePath(`/admin/tests/${testId}`);
  return { ok: true };
}

/** Persist a new order. `orderedIds` are test_questions.id in display order. */
export async function reorderTestQuestions(
  testId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };

  const admin = createServiceRoleClient();
  // Sequential updates keep it simple and correct for typical test sizes.
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await admin
      .from("test_questions")
      .update({ position: i + 1 })
      .eq("id", orderedIds[i])
      .eq("test_id", testId);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/admin/tests/${testId}`);
  return { ok: true };
}
