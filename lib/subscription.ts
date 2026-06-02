import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/types";

export interface ActiveSubscription {
  id: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  plan: Plan | null;
}

/**
 * Returns the current user's active, unexpired subscription (with its plan),
 * or null. RLS-bound — only ever reads the caller's own subscriptions.
 */
export async function getActiveSubscription(): Promise<ActiveSubscription | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("subscriptions")
    .select("id, status, starts_at, ends_at, plan:plans(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  if (data.ends_at && new Date(data.ends_at) < new Date()) return null;

  return data as unknown as ActiveSubscription;
}

export async function hasActiveSubscription(): Promise<boolean> {
  return (await getActiveSubscription()) !== null;
}
