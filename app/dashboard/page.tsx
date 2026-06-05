import Link from "next/link";
import { CheckCircle2, Clock, ArrowRight, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getActiveSubscription } from "@/lib/subscription";

export const metadata = { title: "Dashboard — MDCAT Prep" };

interface AttemptRow {
  id: string;
  status: string;
  score: number | null;
  total_marks: number | null;
  started_at: string;
  test_id: string;
  test: { title: string } | { title: string }[] | null;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, activeSub, { data: pending }, { data: attemptsData }] =
    await Promise.all([
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
      supabase
        .from("test_attempts")
        .select("id, status, score, total_marks, started_at, test_id, test:tests(title)")
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false })
        .limit(8),
    ]);

  const attempts = (attemptsData as AttemptRow[]) ?? [];
  const testTitle = (a: AttemptRow) =>
    Array.isArray(a.test) ? (a.test[0]?.title ?? "Test") : (a.test?.title ?? "Test");

  const completed = attempts.filter(
    (a) => a.status === "completed" && (a.total_marks ?? 0) > 0,
  );
  const pctOf = (a: AttemptRow) =>
    Math.max(0, Math.round(((a.score ?? 0) / (a.total_marks ?? 1)) * 100));
  const bestPct = completed.length
    ? Math.max(...completed.map(pctOf))
    : null;
  const avgPct = completed.length
    ? Math.round(completed.reduce((s, a) => s + pctOf(a), 0) / completed.length)
    : null;

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

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
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

          {/* Performance (real) */}
          <div className="rounded-[var(--r2)] border border-border bg-white p-6 shadow-card">
            <h2 className="text-base font-bold text-navy">Performance</h2>
            {completed.length > 0 ? (
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="font-display text-2xl font-bold text-brand">
                    {completed.length}
                  </p>
                  <p className="text-xs text-ink-muted">Tests</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-navy">
                    {avgPct}%
                  </p>
                  <p className="text-xs text-ink-muted">Average</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-green-600">
                    {bestPct}%
                  </p>
                  <p className="text-xs text-ink-muted">Best</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink-muted">
                Your scores and weak subjects will appear here as you take
                tests.
              </p>
            )}
          </div>
        </div>

        {/* Recent attempts (real) */}
        <div className="mt-6 rounded-[var(--r2)] border border-border bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-navy">Recent attempts</h2>
            <Link
              href="/tests"
              className="text-sm font-semibold text-brand hover:underline"
            >
              Take a test
            </Link>
          </div>

          {attempts.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">
              You haven&apos;t attempted any tests yet. Start a mock test to see
              your scores here.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {attempts.map((a) => {
                const isDone = a.status === "completed";
                const pct =
                  isDone && (a.total_marks ?? 0) > 0 ? pctOf(a) : null;
                return (
                  <Link
                    key={a.id}
                    href={isDone ? `/result/${a.id}` : `/test/${a.test_id}`}
                    className="flex items-center justify-between gap-3 py-3 no-underline transition-colors hover:bg-off/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy">
                        {testTitle(a)}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {new Date(a.started_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {isDone ? (
                        <span className="flex items-center gap-1.5 text-sm font-bold text-navy">
                          <Trophy className="h-4 w-4 text-brand" />
                          {a.score ?? 0}
                          <span className="font-normal text-ink-muted">
                            /{a.total_marks ?? 0}
                          </span>
                          {pct !== null && (
                            <Badge variant="secondary">{pct}%</Badge>
                          )}
                        </span>
                      ) : (
                        <Badge variant="outline">Resume</Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-ink-muted" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
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
