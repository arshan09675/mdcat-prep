import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaymentForm } from "@/components/payment/payment-form";
import { createClient } from "@/lib/supabase/server";
import { getActiveSubscription } from "@/lib/subscription";
import { formatPkr } from "@/lib/format";
import type { Plan } from "@/lib/types";

export default async function SubscribePage({
  params,
}: {
  params: { planId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Middleware guarantees an authenticated user on /subscribe.

  const { data: planData } = await supabase
    .from("plans")
    .select("*")
    .eq("id", params.planId)
    .eq("active", true)
    .maybeSingle();

  if (!planData) notFound();
  const plan = planData as Plan;

  const [activeSub, pendingRes] = await Promise.all([
    getActiveSubscription(),
    supabase
      .from("payment_submissions")
      .select("id, created_at")
      .eq("user_id", user!.id)
      .eq("plan_id", plan.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const pending = pendingRes.data;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container flex-1 py-12">
        <Link
          href="/pricing"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← All plans
        </Link>

        <div className="mx-auto mt-4 max-w-xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{plan.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {formatPkr(plan.price_pkr)} · {plan.duration_days} days access
            </p>
          </div>

          {activeSub ? (
            <Card className="border-green-600/40 bg-green-50">
              <CardContent className="space-y-3 py-8 text-center">
                <p className="text-lg font-semibold">
                  You already have active access 🎉
                </p>
                <p className="text-sm text-muted-foreground">
                  {activeSub.ends_at
                    ? `Valid until ${new Date(activeSub.ends_at).toLocaleDateString()}.`
                    : "Your subscription is active."}
                </p>
                <Button asChild>
                  <Link href="/subjects">Start practicing</Link>
                </Button>
              </CardContent>
            </Card>
          ) : pending ? (
            <Card className="border-amber-500/40 bg-amber-50">
              <CardContent className="space-y-2 py-8 text-center">
                <p className="text-lg font-semibold">
                  Payment received — under review
                </p>
                <p className="text-sm text-muted-foreground">
                  We&apos;re verifying your payment. You&apos;ll get access as
                  soon as an admin approves it. Submitted{" "}
                  {new Date(pending.created_at).toLocaleString()}.
                </p>
                <Button asChild variant="outline">
                  <Link href="/dashboard">Go to dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <PaymentForm planId={plan.id} amountPkr={plan.price_pkr} />
          )}
        </div>
      </main>
    </div>
  );
}
