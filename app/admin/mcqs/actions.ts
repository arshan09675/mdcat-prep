"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };
type Difficulty = "easy" | "medium" | "hard";

export interface McqInput {
  id?: string;
  subjectId: string;
  topicId: string | null;
  text: string;
  options: string[]; // exactly 4
  correctIndex: number; // 0..3
  explanation: string | null;
  difficulty: Difficulty;
  pastPaperYear: number | null;
  isFree: boolean;
}

function validateMcq(input: McqInput): string | null {
  if (!input.subjectId) return "Pick a subject.";
  if (!input.text.trim()) return "Question text is required.";
  const opts = input.options.map((o) => o.trim());
  if (opts.length !== 4 || opts.some((o) => !o)) {
    return "All four options are required.";
  }
  if (
    !Number.isInteger(input.correctIndex) ||
    input.correctIndex < 0 ||
    input.correctIndex > 3
  ) {
    return "Choose which option is correct.";
  }
  if (!["easy", "medium", "hard"].includes(input.difficulty)) {
    return "Invalid difficulty.";
  }
  return null;
}

function rowFromInput(input: McqInput) {
  return {
    subject_id: input.subjectId,
    topic_id: input.topicId,
    text: input.text.trim(),
    options: input.options.map((o) => o.trim()),
    correct_index: input.correctIndex,
    explanation: input.explanation?.trim() || null,
    difficulty: input.difficulty,
    past_paper_year: input.pastPaperYear,
    is_free: input.isFree,
  };
}

export async function createMcq(input: McqInput): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };
  const err = validateMcq(input);
  if (err) return { ok: false, error: err };

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("mcqs")
    .insert({ ...rowFromInput(input), created_by: staff.id });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/mcqs");
  return { ok: true };
}

export async function updateMcq(input: McqInput): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };
  if (!input.id) return { ok: false, error: "Missing MCQ id." };
  const err = validateMcq(input);
  if (err) return { ok: false, error: err };

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("mcqs")
    .update(rowFromInput(input))
    .eq("id", input.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/mcqs");
  return { ok: true };
}

export async function deleteMcq(id: string): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };

  const admin = createServiceRoleClient();
  const { error } = await admin.from("mcqs").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/mcqs");
  return { ok: true };
}

// ---------------------------------------------------------------------------
//  Topics
// ---------------------------------------------------------------------------
export async function createTopic(
  subjectId: string,
  name: string,
): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };
  if (!subjectId) return { ok: false, error: "Pick a subject." };
  if (!name.trim()) return { ok: false, error: "Topic name is required." };

  const admin = createServiceRoleClient();
  const { data: last } = await admin
    .from("topics")
    .select("position")
    .eq("subject_id", subjectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? 0) + 1;

  const { error } = await admin
    .from("topics")
    .insert({ subject_id: subjectId, name: name.trim(), position });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/mcqs");
  return { ok: true };
}

export async function deleteTopic(id: string): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };

  const admin = createServiceRoleClient();
  const { error } = await admin.from("topics").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/mcqs");
  return { ok: true };
}

// ---------------------------------------------------------------------------
//  Bulk import (CSV / paste). One MCQ per line:
//    question, optA, optB, optC, optD, correct, explanation, difficulty, year, free
//  correct = A|B|C|D or 1|2|3|4. explanation/difficulty/year/free optional.
// ---------------------------------------------------------------------------
export interface BulkResult {
  ok: boolean;
  inserted: number;
  errors: { line: number; message: string }[];
}

/** Parse a single CSV line, honouring double-quoted fields with "" escapes. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

function parseCorrectIndex(raw: string): number | null {
  const v = raw.trim().toUpperCase();
  if (["A", "B", "C", "D"].includes(v)) return v.charCodeAt(0) - 65;
  const n = parseInt(v, 10);
  if (n >= 1 && n <= 4) return n - 1;
  return null;
}

export async function bulkImportMcqs(
  subjectId: string,
  topicId: string | null,
  raw: string,
): Promise<BulkResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, inserted: 0, errors: [{ line: 0, message: "Not authorized." }] };
  if (!subjectId) {
    return { ok: false, inserted: 0, errors: [{ line: 0, message: "Pick a subject first." }] };
  }

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { ok: false, inserted: 0, errors: [{ line: 0, message: "Nothing to import." }] };
  }

  const rows: Record<string, unknown>[] = [];
  const errors: { line: number; message: string }[] = [];

  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    // Skip an optional header row.
    if (idx === 0 && /^question\s*,/i.test(line)) return;

    const cols = parseCsvLine(line);
    if (cols.length < 6) {
      errors.push({
        line: lineNo,
        message: "Need at least: question, A, B, C, D, correct.",
      });
      return;
    }
    const [text, a, b, c, d, correctRaw, explanation, diffRaw, yearRaw, freeRaw] =
      cols;
    if (!text || !a || !b || !c || !d) {
      errors.push({ line: lineNo, message: "Question and all 4 options required." });
      return;
    }
    const correctIndex = parseCorrectIndex(correctRaw);
    if (correctIndex === null) {
      errors.push({ line: lineNo, message: `Bad correct answer "${correctRaw}" (use A-D or 1-4).` });
      return;
    }
    const diff = (diffRaw ?? "").toLowerCase();
    const difficulty: Difficulty = ["easy", "medium", "hard"].includes(diff)
      ? (diff as Difficulty)
      : "medium";
    let year: number | null = null;
    if (yearRaw) {
      const y = parseInt(yearRaw, 10);
      if (Number.isInteger(y) && y > 1900 && y < 2100) year = y;
    }
    const free = ["1", "true", "yes", "y", "free"].includes(
      (freeRaw ?? "").toLowerCase(),
    );

    rows.push({
      subject_id: subjectId,
      topic_id: topicId,
      text,
      options: [a, b, c, d],
      correct_index: correctIndex,
      explanation: explanation || null,
      difficulty,
      past_paper_year: year,
      is_free: free,
      created_by: staff.id,
    });
  });

  if (rows.length === 0) {
    return { ok: false, inserted: 0, errors };
  }

  const admin = createServiceRoleClient();
  const { error } = await admin.from("mcqs").insert(rows);
  if (error) {
    return { ok: false, inserted: 0, errors: [{ line: 0, message: error.message }] };
  }

  revalidatePath("/admin/mcqs");
  return { ok: true, inserted: rows.length, errors };
}
