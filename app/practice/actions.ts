"use server";

import { createClient } from "@/lib/supabase/server";

export type CheckResult =
  | {
      ok: true;
      isCorrect: boolean;
      correctIndex: number;
      explanation: string | null;
    }
  | { ok: false; error: string };

/**
 * Grades a single practice MCQ on the server. The correct answer and
 * explanation are only read here (RLS-bound to the caller), so a locked MCQ
 * the user can't access returns an error rather than leaking the key.
 */
export async function checkAnswer(
  mcqId: string,
  selectedIndex: number,
): Promise<CheckResult> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mcqs")
    .select("correct_index, explanation")
    .eq("id", mcqId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "This MCQ is locked or unavailable." };
  }

  return {
    ok: true,
    isCorrect: selectedIndex === data.correct_index,
    correctIndex: data.correct_index,
    explanation: data.explanation,
  };
}
