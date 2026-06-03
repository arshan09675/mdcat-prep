import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSubjectCards } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { formatPkr } from "@/lib/format";
import type { Plan } from "@/lib/types";

export default async function HomePage() {
  const supabase = createClient();
  const [cards, plansRes, testsRes] = await Promise.all([
    getSubjectCards(),
    supabase.from("plans").select("price_pkr").eq("active", true),
    supabase
      .from("tests")
      .select("id, title, type, duration_minutes, is_free")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const plans = (plansRes.data ?? []) as Pick<Plan, "price_pkr">[];
  const cheapest =
    plans.length > 0 ? Math.min(...plans.map((p) => p.price_pkr)) : null;
  const featuredTests = testsRes.data ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      {/* Hero */}
      <section>
        <div className="container flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <Badge variant="free">Pakistan&apos;s MDCAT prep, online</Badge>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
            Ace MDCAT with a real MCQ bank, timed mocks & past papers
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Practice Biology, Chemistry, Physics, English and Logical Reasoning
            with instant explanations — then sit full-length mock tests with
            negative marking and subject-wise analysis.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/subjects">Start practicing</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">
                {cheapest !== null
                  ? `View pricing — from ${formatPkr(cheapest)}`
                  : "View pricing"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="border-y border-border bg-surface">
        <div className="container py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Subjects
              </h2>
              <p className="mt-1 text-muted-foreground">
                Pick a subject to browse topics and practice MCQs.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link href="/subjects">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {cards.length === 0 ? (
            <p className="text-muted-foreground">No subjects yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map(({ subject, topicCount, mcqTotal, mcqFree }) => (
                <Link
                  key={subject.id}
                  href={`/subjects/${subject.slug}`}
                  className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Card className="h-full hover:shadow-card-hover">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle>{subject.name}</CardTitle>
                        {mcqFree > 0 && (
                          <Badge variant="free">{mcqFree} free</Badge>
                        )}
                      </div>
                      <CardDescription>
                        {topicCount} topic{topicCount === 1 ? "" : "s"} ·{" "}
                        {mcqTotal} MCQ{mcqTotal === 1 ? "" : "s"}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured tests (only if published) */}
      {featuredTests.length > 0 && (
        <section className="border-b border-border">
          <div className="container py-16">
            <h2 className="mb-8 text-2xl font-semibold tracking-tight">
              Featured mock tests
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredTests.map((t) => (
                <Link
                  key={t.id}
                  href={`/test/${t.id}`}
                  className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Card className="h-full hover:shadow-card-hover">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">{t.title}</CardTitle>
                        <Badge variant={t.is_free ? "free" : "premium"}>
                          {t.is_free ? "Free" : "Premium"}
                        </Badge>
                      </div>
                      <CardDescription className="capitalize">
                        {t.type} · {t.duration_minutes} min
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing teaser */}
      <section className="bg-surface">
        <div className="container py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            One subscription, everything unlocked
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
            All MCQs, mock tests, past papers and lectures
            {cheapest !== null ? ` — starting at ${formatPkr(cheapest)}.` : "."}
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/pricing">View plans</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-2 py-8 text-sm text-muted-foreground sm:flex-row">
          <span className="font-medium text-foreground">MDCAT Prep</span>
          <span>Built for Pakistani medical aspirants.</span>
        </div>
      </footer>
    </div>
  );
}
