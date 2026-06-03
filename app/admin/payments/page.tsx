import { Badge } from "@/components/ui/badge";
import { PaymentReview } from "@/components/admin/payment-review";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { formatPkr } from "@/lib/format";

export const metadata = { title: "Payments — Admin" };

interface SubmissionRow {
  id: string;
  user_id: string;
  method: string;
  amount_pkr: number;
  sender_number: string | null;
  transaction_id: string | null;
  screenshot_path: string | null;
  status: string;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  plan: { name: string; price_pkr: number; duration_days: number } | null;
  profile: { name: string | null } | null;
}

export default async function AdminPaymentsPage() {
  const admin = createServiceRoleClient();

  const [{ data: pendingData }, { data: reviewedData }] = await Promise.all([
    admin
      .from("payment_submissions")
      .select(
        "*, plan:plans(name, price_pkr, duration_days), profile:profiles(name)",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    admin
      .from("payment_submissions")
      .select("*, plan:plans(name, price_pkr, duration_days), profile:profiles(name)")
      .in("status", ["approved", "rejected"])
      .order("reviewed_at", { ascending: false })
      .limit(10),
  ]);

  const pending = (pendingData ?? []) as SubmissionRow[];
  const reviewed = (reviewedData ?? []) as SubmissionRow[];

  // Enrich pending rows with a signed screenshot URL + student email.
  const enriched = await Promise.all(
    pending.map(async (s) => {
      let screenshotUrl: string | null = null;
      if (s.screenshot_path) {
        const { data } = await admin.storage
          .from("payment-proofs")
          .createSignedUrl(s.screenshot_path, 3600);
        screenshotUrl = data?.signedUrl ?? null;
      }
      const { data: userRes } = await admin.auth.admin.getUserById(s.user_id);
      return {
        ...s,
        screenshotUrl,
        email: userRes?.user?.email ?? null,
      };
    }),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="mt-1 text-muted-foreground">
          Verify manual JazzCash payments. Approving creates an active
          subscription immediately.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase text-muted-foreground">
          Pending ({enriched.length})
        </h2>
        {enriched.length === 0 ? (
          <p className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
            No pending payments. 🎉
          </p>
        ) : (
          <div className="space-y-4">
            {enriched.map((s) => (
              <PaymentReview
                key={s.id}
                id={s.id}
                studentName={s.profile?.name ?? null}
                email={s.email}
                planName={s.plan?.name ?? "—"}
                planPrice={s.plan ? formatPkr(s.plan.price_pkr) : "—"}
                durationDays={s.plan?.duration_days ?? 0}
                method={s.method}
                amount={formatPkr(s.amount_pkr)}
                senderNumber={s.sender_number}
                transactionId={s.transaction_id}
                createdAt={s.created_at}
                screenshotUrl={s.screenshotUrl}
              />
            ))}
          </div>
        )}
      </section>

      {reviewed.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase text-muted-foreground">
            Recently reviewed
          </h2>
          <div className="divide-y rounded-md border">
            {reviewed.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-medium">
                    {s.profile?.name ?? "Student"}
                  </span>{" "}
                  · {s.plan?.name ?? "—"} · {formatPkr(s.amount_pkr)}
                </div>
                <div className="flex items-center gap-3">
                  {s.reviewed_at && (
                    <span className="text-muted-foreground">
                      {new Date(s.reviewed_at).toLocaleDateString()}
                    </span>
                  )}
                  <Badge
                    variant={s.status === "approved" ? "success" : "destructive"}
                  >
                    {s.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
