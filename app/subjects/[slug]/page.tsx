import Link from "next/link";
import { notFound } from "next/navigation";
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
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container flex-1 py-12">
        <Link
          href="/subjects"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← All subjects
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {subject.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {topics.length} topic{topics.length === 1 ? "" : "s"}.{" "}
          {subscribed
            ? "Your subscription is active — all MCQs unlocked."
            : "Free MCQs are open. Subscribe to unlock all MCQs."}
        </p>

        {topics.length === 0 ? (
          <p className="mt-8 text-muted-foreground">
            No topics added to this subject yet.
          </p>
        ) : (
          <div className="mt-8 space-y-3">
            {topics.map(({ topic, mcqTotal, mcqFree }) => {
              const lockedCount = subscribed ? 0 : mcqTotal - mcqFree;
              const accessible = subscribed ? mcqTotal : mcqFree;
              return (
                <Card key={topic.id}>
                  <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
                    <div>
                      <CardTitle className="text-lg">{topic.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {mcqTotal} MCQ{mcqTotal === 1 ? "" : "s"}
                        {mcqFree > 0 && (
                          <>
                            {" "}
                            · <span className="text-green-600">
                              {mcqFree} free
                            </span>
                          </>
                        )}
                        {lockedCount > 0 && (
                          <> · {lockedCount} premium</>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {lockedCount > 0 && (
                        <Badge variant="secondary">Premium</Badge>
                      )}
                      <Button
                        asChild
                        variant={accessible > 0 ? "default" : "outline"}
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
          <Card className="mt-10 border-primary/30 bg-secondary/30">
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="font-medium">
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
