import Link from "next/link";
import { notFound } from "next/navigation";
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
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container flex-1 py-10">
        <Link
          href={`/subjects/${ctx.subject.slug}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← {ctx.subject.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {ctx.topic.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ctx.subject.name} practice
        </p>

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
