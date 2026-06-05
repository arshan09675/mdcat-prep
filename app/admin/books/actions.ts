"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { BookType } from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

export interface BookInput {
  id?: string;
  title: string;
  description: string | null;
  subjectId: string | null;
  type: BookType;
  filePath: string; // books bucket (PDF) — required
  coverUrl: string | null;
  fileSizeMb: number | null;
  isFree: boolean;
  position: number;
}

function validate(input: BookInput): string | null {
  if (!input.title.trim()) return "Title is required.";
  if (!["book", "notes"].includes(input.type)) return "Invalid type.";
  if (!input.filePath) return "A PDF file is required.";
  return null;
}

function toRow(input: BookInput) {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    subject_id: input.subjectId,
    type: input.type,
    file_path: input.filePath,
    cover_url: input.coverUrl?.trim() || null,
    file_size_mb: input.fileSizeMb,
    is_free: input.isFree,
    position: Number.isFinite(input.position) ? input.position : 0,
  };
}

export async function createBook(input: BookInput): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const admin = createServiceRoleClient();
  const { error } = await admin.from("books").insert(toRow(input));
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/books");
  return { ok: true };
}

export async function updateBook(input: BookInput): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };
  if (!input.id) return { ok: false, error: "Missing id." };
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const admin = createServiceRoleClient();
  const { error } = await admin.from("books").update(toRow(input)).eq("id", input.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/books");
  return { ok: true };
}

export async function deleteBook(id: string): Promise<ActionResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };

  const admin = createServiceRoleClient();
  const { data: book } = await admin
    .from("books")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();
  if (book?.file_path) {
    await admin.storage.from("books").remove([book.file_path]);
  }

  const { error } = await admin.from("books").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/books");
  return { ok: true };
}
