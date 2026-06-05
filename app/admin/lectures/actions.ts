"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export interface LectureInput {
  id?: string;
  subjectId: string;
  topicId: string | null;
  title: string;
  videoUrl: string | null; // YouTube/Vimeo embed
  videoPath: string | null; // lecture-videos bucket
  notesBody: string | null;
  notesPath: string | null; // notes bucket (PDF)
  isFree: boolean;
  position: number;
}

function validate(input: LectureInput): string | null {
  if (!input.subjectId) return "Pick a subject.";
  if (!input.title.trim()) return "Title is required.";
  return null;
}

function toRow(input: LectureInput) {
  return {
    subject_id: input.subjectId,
    topic_id: input.topicId,
    title: input.title.trim(),
    video_url: input.videoUrl?.trim() || null,
    video_path: input.videoPath || null,
    notes_body: input.notesBody?.trim() || null,
    notes_path: input.notesPath || null,
    is_free: input.isFree,
    position: Number.isFinite(input.position) ? input.position : 0,
  };
}

export async function createLecture(input: LectureInput): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const admin = createServiceRoleClient();
  const { error } = await admin.from("lectures").insert(toRow(input));
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/lectures");
  return { ok: true };
}

export async function updateLecture(input: LectureInput): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };
  if (!input.id) return { ok: false, error: "Missing lecture id." };
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("lectures")
    .update(toRow(input))
    .eq("id", input.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/lectures");
  return { ok: true };
}

export async function deleteLecture(id: string): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };

  const admin = createServiceRoleClient();

  // Best-effort cleanup of uploaded files (service role bypasses RLS).
  const { data: lec } = await admin
    .from("lectures")
    .select("video_path, notes_path")
    .eq("id", id)
    .maybeSingle();
  if (lec?.video_path) {
    await admin.storage.from("lecture-videos").remove([lec.video_path]);
  }
  if (lec?.notes_path) {
    await admin.storage.from("notes").remove([lec.notes_path]);
  }

  const { error } = await admin.from("lectures").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/lectures");
  return { ok: true };
}
