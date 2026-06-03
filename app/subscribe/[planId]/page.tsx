import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, CheckCircle2, Clock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="container flex-1 py-12">
        <div className="mx-auto max-w-xl">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-4 w-4" /> All plans
          </Link>

          <div className="mt-3 space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{plan.name}</h1>
              <p className="mt-1 text-muted-foreground">
                {formatPkr(plan.price_pkr)} · {plan.duration_days} days access
              </p>
            </div>

            {activeSub ? (
              <Card className="border-success/30 bg-success/5">
                <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                  <p className="text-lg font-semibold text-foreground">
                    You already have active access
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
              <Card className="border-primary/20 bg-surface">
                <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                  <Clock className="h-10 w-10 text-primary" />
                  <p className="text-lg font-semibold text-foreground">
                    Payment received — under review
                  </p>
                  <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
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
        </div>
      </main>
    </div>
  );
}
