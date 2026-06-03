import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { PracticeRunner } from "@/components/practice/practice-runner";
import { createClient } from "@/lib/supabase/server";
import { getTopicContext } from "@/lib/catalog";
import { hasActiveSubscription } from "@/lib/subscription";
import type { PracticeMcq } from "@/lib/types";

export default async function PracticePage({
  params,
}: {
  params: { topicId: string };
}) {
  const ctx = await getTopicContext(params.topicId);
  if (!ctx) notFound();

  const subscribed = await hasActiveSubscription();

  // RLS returns only MCQs the caller may access (free, or all if subscribed/
  // staff). correct_index/explanation are deliberately NOT selected — answers
  // are revealed one at a time via the server action.
  const supabase = createClient();
  const { data } = await supabase
    .from("mcqs")
    .select("id, text, options, difficulty, is_free")
    .eq("topic_id", params.topicId)
    .order("created_at", { ascending: true });

  const mcqs = (data ?? []) as PracticeMcq[];
  const lockedCount = subscribed
    ? 0
    : Math.max(0, ctx.mcqTotal - mcqs.length);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="container flex-1 py-10">
        <div className="mx-auto max-w-2xl">
          <Link
            href={`/subjects/${ctx.subject.slug}`}
            className="inline-flex items-center gap-1 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ChevronLeft className="h-4 w-4" /> {ctx.subject.name}
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">
            {ctx.topic.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ctx.subject.name} practice
          </p>
        </div>

        <div className="mt-8">
          <PracticeRunner
            mcqs={mcqs}
            lockedCount={lockedCount}
            subscribed={subscribed}
          />
        </div>
      </main>
    </div>
  );
}
