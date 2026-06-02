import Link from "next/link";
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
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b bg-secondary/30">
        <div className="container flex flex-col items-center gap-6 py-20 text-center">
          <Badge variant="secondary">Pakistan&apos;s MDCAT prep, online</Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Ace MDCAT with a real MCQ bank, timed mock tests & past papers
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Practice Biology, Chemistry, Physics, English and Logical Reasoning
            with instant explanations. Take full-length mocks with negative
            marking and subject-wise analysis.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/subjects">Start free MCQs</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">
                {cheapest !== null
                  ? `See plans — from ${formatPkr(cheapest)}`
                  : "See pricing"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Subjects grid */}
      <section className="container py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Subjects</h2>
            <p className="text-muted-foreground">
              Pick a subject to browse topics and practice MCQs.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/subjects">View all</Link>
          </Button>
        </div>

        {cards.length === 0 ? (
          <p className="text-muted-foreground">No subjects yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(({ subject, topicCount, mcqTotal, mcqFree }) => (
              <Link key={subject.id} href={`/subjects/${subject.slug}`}>
                <Card className="h-full transition-colors hover:border-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{subject.name}</CardTitle>
                      {mcqFree > 0 && (
                        <Badge variant="success">{mcqFree} free</Badge>
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
      </section>

      {/* Featured tests (only if any are published) */}
      {featuredTests.length > 0 && (
        <section className="border-t bg-secondary/30">
          <div className="container py-16">
            <h2 className="mb-8 text-2xl font-semibold">Featured mock tests</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredTests.map((t) => (
                <Link key={t.id} href={`/test/${t.id}`}>
                  <Card className="h-full transition-colors hover:border-primary">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{t.title}</CardTitle>
                        <Badge variant={t.is_free ? "success" : "secondary"}>
                          {t.is_free ? "Free" : "Premium"}
                        </Badge>
                      </div>
                      <CardDescription>
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

      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          MDCAT Prep — built for Pakistani medical aspirants.
        </div>
      </footer>
    </div>
  );
}
