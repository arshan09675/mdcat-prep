import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { Subject, Topic } from "@/lib/types";

export interface SubjectCard {
  subject: Subject;
  topicCount: number;
  mcqTotal: number;
  mcqFree: number;
}

export interface TopicStat {
  topic: Topic;
  mcqTotal: number;
  mcqFree: number;
}

/**
 * Counts use the service-role client because RLS hides locked (non-free) MCQs
 * from unsubscribed users — we want true totals for catalog display. Counts
 * are not sensitive; MCQ *content* is never fetched here.
 */
export async function getSubjectCards(): Promise<SubjectCard[]> {
  const admin = createServiceRoleClient();
  const { data: subjects } = await admin
    .from("subjects")
    .select("*")
    .order("position");

  if (!subjects) return [];

  return Promise.all(
    (subjects as Subject[]).map(async (subject) => {
      const [topics, total, free] = await Promise.all([
        admin
          .from("topics")
          .select("id", { count: "exact", head: true })
          .eq("subject_id", subject.id),
        admin
          .from("mcqs")
          .select("id", { count: "exact", head: true })
          .eq("subject_id", subject.id),
        admin
          .from("mcqs")
          .select("id", { count: "exact", head: true })
          .eq("subject_id", subject.id)
          .eq("is_free", true),
      ]);
      return {
        subject,
        topicCount: topics.count ?? 0,
        mcqTotal: total.count ?? 0,
        mcqFree: free.count ?? 0,
      };
    }),
  );
}

export async function getSubjectBySlug(
  slug: string,
): Promise<{ subject: Subject; topics: TopicStat[] } | null> {
  const supabase = createClient();
  const { data: subject } = await supabase
    .from("subjects")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!subject) return null;

  const admin = createServiceRoleClient();
  const { data: topics } = await admin
    .from("topics")
    .select("*")
    .eq("subject_id", subject.id)
    .order("position");

  const stats = await Promise.all(
    ((topics as Topic[]) ?? []).map(async (topic) => {
      const [total, free] = await Promise.all([
        admin
          .from("mcqs")
          .select("id", { count: "exact", head: true })
          .eq("topic_id", topic.id),
        admin
          .from("mcqs")
          .select("id", { count: "exact", head: true })
          .eq("topic_id", topic.id)
          .eq("is_free", true),
      ]);
      return {
        topic,
        mcqTotal: total.count ?? 0,
        mcqFree: free.count ?? 0,
      };
    }),
  );

  return { subject: subject as Subject, topics: stats };
}

export interface TopicContext {
  topic: Topic;
  subject: Subject;
  mcqTotal: number;
  mcqFree: number;
}

export async function getTopicContext(
  topicId: string,
): Promise<TopicContext | null> {
  const supabase = createClient();
  const { data: topic } = await supabase
    .from("topics")
    .select("*, subject:subjects(*)")
    .eq("id", topicId)
    .maybeSingle();

  if (!topic) return null;

  const admin = createServiceRoleClient();
  const [total, free] = await Promise.all([
    admin
      .from("mcqs")
      .select("id", { count: "exact", head: true })
      .eq("topic_id", topicId),
    admin
      .from("mcqs")
      .select("id", { count: "exact", head: true })
      .eq("topic_id", topicId)
      .eq("is_free", true),
  ]);

  const { subject, ...rest } = topic as Topic & { subject: Subject };
  return {
    topic: rest as Topic,
    subject,
    mcqTotal: total.count ?? 0,
    mcqFree: free.count ?? 0,
  };
}
