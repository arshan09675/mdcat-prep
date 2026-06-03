import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSubjectCards } from "@/lib/catalog";

export const metadata = { title: "Subjects — MDCAT Prep" };

export default async function SubjectsPage() {
  const cards = await getSubjectCards();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="container flex-1 py-12">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Browse topics and practice MCQs. Free MCQs are open to everyone;
            premium MCQs unlock with a subscription.
          </p>
        </header>

        {cards.length === 0 ? (
          <p className="mt-10 text-muted-foreground">No subjects available.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </main>
    </div>
  );
}
