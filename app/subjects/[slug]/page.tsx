import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getSubjectBySlug } from "@/lib/catalog";
import { hasActiveSubscription } from "@/lib/subscription";

export default async function SubjectPage({
  params,
}: {
  params: { slug: string };
}) {
  const [data, subscribed] = await Promise.all([
    getSubjectBySlug(params.slug),
    hasActiveSubscription(),
  ]);

  if (!data) notFound();
  const { subject, topics } = data;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="container flex-1 py-12">
        <Link
          href="/subjects"
          className="inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ChevronLeft className="h-4 w-4" /> All subjects
        </Link>
        <header className="mt-3 max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight">{subject.name}</h1>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            {topics.length} topic{topics.length === 1 ? "" : "s"}.{" "}
            {subscribed
              ? "Your subscription is active — all MCQs unlocked."
              : "Free MCQs are open. Subscribe to unlock all MCQs."}
          </p>
        </header>

        {topics.length === 0 ? (
          <p className="mt-10 text-muted-foreground">
            No topics added to this subject yet.
          </p>
        ) : (
          <div className="mt-8 space-y-3">
            {topics.map(({ topic, mcqTotal, mcqFree }) => {
              const lockedCount = subscribed ? 0 : mcqTotal - mcqFree;
              const accessible = subscribed ? mcqTotal : mcqFree;
              return (
                <Card key={topic.id} className="hover:shadow-card-hover">
                  <CardHeader className="flex-row items-center justify-between gap-4 space-y-0 py-5">
                    <div className="min-w-0">
                      <h2 className="font-semibold tracking-tight">
                        {topic.name}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {mcqTotal} MCQ{mcqTotal === 1 ? "" : "s"}
                        {mcqFree > 0 && (
                          <>
                            {" · "}
                            <span className="text-primary">{mcqFree} free</span>
                          </>
                        )}
                        {lockedCount > 0 && <> · {lockedCount} premium</>}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {lockedCount > 0 && <Badge variant="premium">Premium</Badge>}
                      <Button
                        asChild
                        variant={accessible > 0 ? "default" : "outline"}
                        size="sm"
                      >
                        <Link href={`/practice/${topic.id}`}>
                          {accessible > 0 ? "Practice" : "View"}
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}

        {!subscribed && (
          <Card className="mt-10 border-primary/20 bg-surface">
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="font-medium text-foreground">
                Unlock every MCQ, mock test and lecture
              </p>
              <Button asChild>
                <Link href="/pricing">View subscription plans</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
