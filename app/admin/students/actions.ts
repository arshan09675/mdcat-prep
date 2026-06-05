"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };
type Role = "student" | "instructor" | "admin";

/** Change a user's role. Admin-only (matches profiles RLS is_admin()). */
export async function updateUserRole(
  userId: string,
  role: Role,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only." };
  if (!["student", "instructor", "admin"].includes(role)) {
    return { ok: false, error: "Invalid role." };
  }
  if (userId === admin.id && role !== "admin") {
    return { ok: false, error: "You can't remove your own admin role." };
  }

  const db = createServiceRoleClient();
  const { error } = await db.from("profiles").update({ role }).eq("id", userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/students");
  return { ok: true };
}
