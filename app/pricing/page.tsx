import Link from "next/link";
import { Check } from "lucide-react";
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
import { cn } from "@/lib/utils";
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
  // Highlight the higher-tier plan as "Most popular".
  const popularId = plans.length > 1 ? plans[plans.length - 1].id : plans[0]?.id;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="container flex-1 py-12">
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Simple, one-time subscription
          </h1>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Unlock the full MCQ bank, mock tests, past papers and lectures. Pay
            once via JazzCash — access starts the moment we verify it.
          </p>
        </header>

        {plans.length === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">
            No plans available yet. Check back soon.
          </p>
        ) : (
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
            {plans.map((plan) => {
              const popular = plan.id === popularId;
              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col",
                    popular && "border-primary shadow-card-hover ring-1 ring-primary",
                  )}
                >
                  {popular && (
                    <Badge className="absolute -top-2.5 left-6">
                      Most popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.description && (
                      <CardDescription className="leading-relaxed">
                        {plan.description}
                      </CardDescription>
                    )}
                    <div className="pt-3">
                      <span className="text-3xl font-bold tracking-tight text-foreground">
                        {formatPkr(plan.price_pkr)}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        / {plan.duration_days} days
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-6">
                    {Array.isArray(plan.features) &&
                      plan.features.length > 0 && (
                        <ul className="space-y-2.5 text-sm text-muted-foreground">
                          {plan.features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    <Button
                      asChild
                      variant={popular ? "default" : "outline"}
                      className="w-full"
                    >
                      <Link href={`/subscribe/${plan.id}`}>Subscribe</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-border bg-surface p-5 text-center">
          <Badge variant="secondary">Manual payment via JazzCash</Badge>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Pick a plan, pay to our JazzCash account, then submit your
            transaction details and a screenshot. Once an admin verifies your
            payment, your access unlocks instantly.
          </p>
        </div>
      </main>
    </div>
  );
}
