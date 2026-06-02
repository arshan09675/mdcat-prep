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
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container flex-1 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
        <p className="mt-2 text-muted-foreground">
          Browse topics and practice MCQs. Free MCQs are open to everyone;
          premium MCQs unlock with a subscription.
        </p>

        {cards.length === 0 ? (
          <p className="mt-8 text-muted-foreground">No subjects available.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </main>
    </div>
  );
}
