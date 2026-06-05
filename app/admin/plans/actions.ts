"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

export interface PlanInput {
  id?: string;
  name: string;
  description: string | null;
  pricePkr: number;
  durationDays: number;
  features: string[];
  active: boolean;
  position: number;
}

function validate(input: PlanInput): string | null {
  if (!input.name.trim()) return "Name is required.";
  if (!Number.isInteger(input.pricePkr) || input.pricePkr < 0) {
    return "Price must be a whole number of rupees.";
  }
  if (!Number.isInteger(input.durationDays) || input.durationDays <= 0) {
    return "Duration must be a positive number of days.";
  }
  return null;
}

function toRow(input: PlanInput) {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    price_pkr: input.pricePkr,
    duration_days: input.durationDays,
    features: input.features.filter((f) => f.trim()).length
      ? input.features.map((f) => f.trim()).filter(Boolean)
      : null,
    active: input.active,
    position: Number.isFinite(input.position) ? input.position : 0,
  };
}

export async function createPlan(input: PlanInput): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only." };
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const db = createServiceRoleClient();
  const { error } = await db.from("plans").insert(toRow(input));
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  return { ok: true };
}

export async function updatePlan(input: PlanInput): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only." };
  if (!input.id) return { ok: false, error: "Missing id." };
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const db = createServiceRoleClient();
  const { error } = await db.from("plans").update(toRow(input)).eq("id", input.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  return { ok: true };
}

export async function deletePlan(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Admins only." };

  const db = createServiceRoleClient();
  // Don't orphan subscriptions/payments that reference this plan.
  const [{ count: subCount }, { count: payCount }] = await Promise.all([
    db.from("subscriptions").select("id", { count: "exact", head: true }).eq("plan_id", id),
    db.from("payment_submissions").select("id", { count: "exact", head: true }).eq("plan_id", id),
  ]);
  if ((subCount ?? 0) > 0 || (payCount ?? 0) > 0) {
    return {
      ok: false,
      error:
        "This plan has subscriptions or payments linked to it. Deactivate it instead of deleting.",
    };
  }

  const { error } = await db.from("plans").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
  return { ok: true };
}
