import { PlanManager } from "@/components/admin/plan-manager";
import { getCurrentProfile } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/types";

export const metadata = { title: "Plans — Admin" };

export default async function AdminPlansPage() {
  const profile = await getCurrentProfile();
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("plans")
    .select("*")
    .order("position")
    .order("price_pkr");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">
          Subscription Plans
        </h1>
        <p className="mt-1 text-ink-muted">
          Pricing shown on the public pricing page.
          {profile?.role !== "admin" && " Editing is admin-only."}
        </p>
      </div>

      <PlanManager
        plans={(data as Plan[]) ?? []}
        canEdit={profile?.role === "admin"}
      />
    </div>
  );
}
