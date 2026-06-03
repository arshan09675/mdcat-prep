import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatPkr } from "@/lib/format";
import type { Plan } from "@/lib/types";

export const metadata = { title: "Pricing — MDCAT Prep" };

export default async function PricingPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("plans")
    .select("*")
    .eq("active", true)
    .order("position");

  const plans = (data ?? []) as Plan[];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container flex-1 py-12">
        <h1 className="text-3xl font-bold tracking-tight">
          Subscription plans
        </h1>
        <p className="mt-2 text-muted-foreground">
          Unlock the full MCQ bank, mock tests, past papers and lectures.
        </p>

        {plans.length === 0 ? (
          <p className="mt-8 text-muted-foreground">
            No plans available yet. Check back soon.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-2">
                    <span className="text-3xl font-bold">
                      {formatPkr(plan.price_pkr)}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      / {plan.duration_days} days
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-6">
                  {Array.isArray(plan.features) && plan.features.length > 0 && (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-green-600">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button asChild className="w-full">
                    <Link href={`/subscribe/${plan.id}`}>Subscribe</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-10">
          <Badge variant="secondary">Manual payment via JazzCash</Badge>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Pick a plan, pay to our JazzCash account, then submit your
            transaction details and a screenshot. Once an admin verifies your
            payment, your access unlocks instantly.
          </p>
        </div>
      </main>
    </div>
  );
}
