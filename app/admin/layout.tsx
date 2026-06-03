import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { getCurrentProfile } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth — middleware already gates /admin to staff.
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "instructor")) {
    redirect("/dashboard");
  }

  const admin = createServiceRoleClient();
  const { count } = await admin
    .from("payment_submissions")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <div className="container flex flex-1 flex-col gap-6 py-8 md:flex-row md:gap-8">
        <aside className="md:w-52 md:shrink-0">
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:px-3">
            Admin
          </h2>
          <AdminNav pendingPayments={count ?? 0} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
