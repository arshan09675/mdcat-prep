import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PracticeRunner } from "@/components/practice/practice-runner";
import { subjectStyle } from "@/lib/subject-style";
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
  const st = subjectStyle(ctx.subject.slug);
  const Icon = st.Icon;

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--off)" }}>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 py-10 md:px-8">
        <div className="mx-auto max-w-2xl">
          <Link
            href={`/subjects/${ctx.subject.slug}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted transition-colors hover:text-brand"
          >
            <ChevronLeft className="h-4 w-4" /> {ctx.subject.name}
          </Link>
          <h1 className="mt-3 flex items-center gap-2.5 font-display text-3xl font-bold text-navy">
            <Icon className="h-7 w-7" style={{ color: st.accent }} />
            {ctx.topic.name}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {ctx.subject.name} · MCQ practice
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
      <SiteFooter />
    </div>
  );
}
