import Link from "next/link";
import { CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getActiveSubscription } from "@/lib/subscription";

export const metadata = { title: "Dashboard — MDCAT Prep" };

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, activeSub, { data: pending }] = await Promise.all([
    supabase.from("profiles").select("name, role").eq("id", user!.id).single(),
    getActiveSubscription(),
    supabase
      .from("payment_submissions")
      .select("id, created_at, plan:plans(name)")
      .eq("user_id", user!.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--off)" }}>
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 py-12 md:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-navy">
              Welcome, {profile?.name ?? user?.email}
            </h1>
            <p className="mt-1 text-ink-muted">{user?.email}</p>
          </div>
          <Badge variant="secondary" className="capitalize">
            {profile?.role ?? "student"}
          </Badge>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Subscription (real) */}
          <div className="rounded-[var(--r2)] border border-border bg-white p-6 shadow-card">
            <h2 className="text-base font-bold text-navy">Subscription</h2>
            {activeSub ? (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Active</span>
                </div>
                <p className="text-sm text-ink-muted">
                  {activeSub.plan?.name ?? "Premium"}
                  {activeSub.ends_at
                    ? ` · valid until ${new Date(activeSub.ends_at).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
            ) : pending ? (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-brand">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Payment under review</span>
                </div>
                <p className="text-sm text-ink-muted">
                  {(pending.plan as { name?: string } | null)?.name ?? "Your plan"} —
                  we&apos;ll unlock access once it&apos;s approved.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-ink-muted">
                  You don&apos;t have an active subscription yet.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline"
                >
                  View plans <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Recent attempts (placeholder) */}
          <div className="rounded-[var(--r2)] border border-border bg-white p-6 shadow-card">
            <h2 className="text-base font-bold text-navy">Recent attempts</h2>
            <p className="mt-4 text-sm text-ink-muted">
              Your mock-test attempts will appear here once the test engine is
              live.
            </p>
          </div>

          {/* Performance (placeholder) */}
          <div className="rounded-[var(--r2)] border border-border bg-white p-6 shadow-card">
            <h2 className="text-base font-bold text-navy">Performance</h2>
            <p className="mt-4 text-sm text-ink-muted">
              Your scores and weak subjects will appear here as you take tests.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn btn-blue" href="/subjects">
            Practice MCQs <ArrowRight className="h-4 w-4" />
          </Link>
          <Link className="btn btn-ghost" href="/tests">
            Mock tests
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
