"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SubmitPaymentInput {
  planId: string;
  amountPkr: number;
  senderNumber: string;
  transactionId: string;
  screenshotPath: string;
}

export type SubmitResult = { ok: true } | { ok: false; error: string };

/**
 * Records a manual JazzCash payment submission (status 'pending') for the
 * current user. The screenshot is uploaded client-side directly to the
 * payment-proofs bucket (owner = auth.uid()); here we only persist its path.
 * RLS enforces user_id = auth.uid() on insert.
 */
export async function submitPayment(
  input: SubmitPaymentInput,
): Promise<SubmitResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const senderNumber = input.senderNumber.trim();
  const transactionId = input.transactionId.trim();
  const amountPkr = Math.round(Number(input.amountPkr));

  if (!senderNumber || !transactionId) {
    return { ok: false, error: "Sender number and transaction ID are required." };
  }
  if (!Number.isFinite(amountPkr) || amountPkr <= 0) {
    return { ok: false, error: "Enter a valid amount." };
  }
  // Integrity: the proof must live under the user's own folder.
  if (!input.screenshotPath || !input.screenshotPath.startsWith(`${user.id}/`)) {
    return { ok: false, error: "Please attach a payment screenshot." };
  }

  // Confirm the plan exists (RLS allows reading plans).
  const { data: plan } = await supabase
    .from("plans")
    .select("id")
    .eq("id", input.planId)
    .maybeSingle();
  if (!plan) return { ok: false, error: "That plan no longer exists." };

  const { error } = await supabase.from("payment_submissions").insert({
    user_id: user.id,
    plan_id: input.planId,
    method: "jazzcash",
    amount_pkr: amountPkr,
    sender_number: senderNumber,
    transaction_id: transactionId,
    screenshot_path: input.screenshotPath,
    status: "pending",
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/subscribe/${input.planId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}
