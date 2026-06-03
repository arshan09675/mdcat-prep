"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export type ReviewResult = { ok: true } | { ok: false; error: string };

/**
 * Approve a pending payment submission: create an ACTIVE subscription
 * (now → now + plan.duration_days) and mark the submission approved.
 * Caller must be staff; all writes go through the service-role client
 * (subscriptions has no user-facing insert policy by design).
 */
export async function approvePayment(
  submissionId: string,
): Promise<ReviewResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };

  const admin = createServiceRoleClient();

  const { data: sub } = await admin
    .from("payment_submissions")
    .select("id, user_id, plan_id, status")
    .eq("id", submissionId)
    .maybeSingle();

  if (!sub) return { ok: false, error: "Submission not found." };
  if (sub.status !== "pending") {
    return { ok: false, error: `Already ${sub.status}.` };
  }

  const { data: plan } = await admin
    .from("plans")
    .select("duration_days")
    .eq("id", sub.plan_id)
    .maybeSingle();
  if (!plan) return { ok: false, error: "Plan not found." };

  const startsAt = new Date();
  const endsAt = new Date(
    startsAt.getTime() + plan.duration_days * 24 * 60 * 60 * 1000,
  );

  const { error: subErr } = await admin.from("subscriptions").insert({
    user_id: sub.user_id,
    plan_id: sub.plan_id,
    status: "active",
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
  });
  if (subErr) return { ok: false, error: subErr.message };

  const { error: updErr } = await admin
    .from("payment_submissions")
    .update({
      status: "approved",
      reviewed_by: staff.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);
  if (updErr) return { ok: false, error: updErr.message };

  revalidatePath("/admin/payments");
  return { ok: true };
}

/** Reject a pending submission with an optional admin note. */
export async function rejectPayment(
  submissionId: string,
  note: string,
): Promise<ReviewResult> {
  const staff = await requireStaff();
  if (!staff) return { ok: false, error: "Not authorized." };

  const admin = createServiceRoleClient();

  const { data: sub } = await admin
    .from("payment_submissions")
    .select("status")
    .eq("id", submissionId)
    .maybeSingle();

  if (!sub) return { ok: false, error: "Submission not found." };
  if (sub.status !== "pending") {
    return { ok: false, error: `Already ${sub.status}.` };
  }

  const { error } = await admin
    .from("payment_submissions")
    .update({
      status: "rejected",
      admin_note: note.trim() || null,
      reviewed_by: staff.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/payments");
  return { ok: true };
}
