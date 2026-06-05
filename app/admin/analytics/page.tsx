import {
  Users,
  BadgeCheck,
  Wallet,
  ListChecks,
  FileText,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { formatPkr } from "@/lib/format";

export const metadata = { title: "Analytics — Admin" };

async function headCount(
  admin: ReturnType<typeof createServiceRoleClient>,
  table: string,
  build?: (q: any) => any,
): Promise<number> {
  let q = admin.from(table).select("id", { count: "exact", head: true });
  if (build) q = build(q);
  const { count } = await q;
  return count ?? 0;
}

export default async function AdminAnalyticsPage() {
  const admin = createServiceRoleClient();
  const nowIso = new Date().toISOString();

  const [
    students,
    activeSubs,
    mcqCount,
    testCount,
    publishedTests,
    lectureCount,
    bookCount,
    pendingPayments,
    approvedRes,
    recentPayments,
    recentAttempts,
  ] = await Promise.all([
    headCount(admin, "profiles", (q) => q.eq("role", "student")),
    headCount(admin, "subscriptions", (q) =>
      q.eq("status", "active").or(`ends_at.gt.${nowIso},ends_at.is.null`),
    ),
    headCount(admin, "mcqs"),
    headCount(admin, "tests"),
    headCount(admin, "tests", (q) => q.eq("published", true)),
    headCount(admin, "lectures"),
    headCount(admin, "books"),
    headCount(admin, "payment_submissions", (q) => q.eq("status", "pending")),
    admin
      .from("payment_submissions")
      .select("amount_pkr")
      .eq("status", "approved"),
    admin
      .from("payment_submissions")
      .select(
        "id, amount_pkr, status, created_at, plan:plans(name), profile:profiles(name)",
      )
      .order("created_at", { ascending: false })
      .limit(8),
    admin
      .from("test_attempts")
      .select(
        "id, score, total_marks, status, submitted_at, started_at, test:tests(title), profile:profiles(name)",
      )
      .order("started_at", { ascending: false })
      .limit(8),
  ]);

  const revenue = (approvedRes.data ?? []).reduce(
    (sum, r) => sum + (r.amount_pkr ?? 0),
    0,
  );

  const rel = <T,>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : v;

  const stats = [
    { label: "Students", value: students.toLocaleString(), icon: Users },
    {
      label: "Active subscriptions",
      value: activeSubs.toLocaleString(),
      icon: BadgeCheck,
    },
    { label: "Revenue (approved)", value: formatPkr(revenue), icon: Wallet },
    { label: "MCQs", value: mcqCount.toLocaleString(), icon: ListChecks },
    {
      label: "Tests",
      value: `${testCount} (${publishedTests} live)`,
      icon: FileText,
    },
    {
      label: "Lectures / Books",
      value: `${lectureCount} / ${bookCount}`,
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">Analytics</h1>
        <p className="mt-1 text-ink-muted">
          Overview of students, revenue, and content.
          {pendingPayments > 0 && (
            <>
              {" "}
              <span className="font-semibold text-brand">
                {pendingPayments} payment{pendingPayments === 1 ? "" : "s"}
              </span>{" "}
              awaiting review.
            </>
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 py-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-bold text-navy">{s.value}</p>
                <p className="text-sm text-ink-muted">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent payments */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            <Clock className="h-4 w-4" /> Recent payments
          </h2>
          <div className="divide-y rounded-xl border border-border">
            {(recentPayments.data ?? []).length === 0 ? (
              <p className="p-6 text-center text-sm text-ink-muted">
                No payments yet.
              </p>
            ) : (
              (recentPayments.data ?? []).map((p) => {
                const profile = rel(
                  p.profile as unknown as { name: string | null },
                );
                const plan = rel(p.plan as unknown as { name: string });
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy">
                        {profile?.name ?? "Student"}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {plan?.name ?? "—"} · {formatPkr(p.amount_pkr)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        variant={
                          p.status === "approved"
                            ? "success"
                            : p.status === "rejected"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {p.status}
                      </Badge>
                      <span className="text-xs text-ink-muted">
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Recent attempts */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
            <Clock className="h-4 w-4" /> Recent test attempts
          </h2>
          <div className="divide-y rounded-xl border border-border">
            {(recentAttempts.data ?? []).length === 0 ? (
              <p className="p-6 text-center text-sm text-ink-muted">
                No attempts yet.
              </p>
            ) : (
              (recentAttempts.data ?? []).map((a) => {
                const profile = rel(
                  a.profile as unknown as { name: string | null },
                );
                const test = rel(a.test as unknown as { title: string });
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy">
                        {profile?.name ?? "Student"}
                      </p>
                      <p className="truncate text-xs text-ink-muted">
                        {test?.title ?? "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {a.status === "completed" ? (
                        <Badge variant="secondary">
                          {a.score ?? 0}
                          {a.total_marks ? `/${a.total_marks}` : ""}
                        </Badge>
                      ) : (
                        <Badge variant="outline">in progress</Badge>
                      )}
                      <span className="text-xs text-ink-muted">
                        {new Date(
                          a.submitted_at ?? a.started_at,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
