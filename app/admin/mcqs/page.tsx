import { McqManager } from "@/components/admin/mcq-manager";
import { getSubjectsWithTopics } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Mcq } from "@/lib/types";

export const metadata = { title: "MCQs — Admin" };

const PAGE_LIMIT = 500;

export default async function AdminMcqsPage({
  searchParams,
}: {
  searchParams: { subject?: string };
}) {
  const { subjects, topics } = await getSubjectsWithTopics();
  const admin = createServiceRoleClient();

  const subjectFilter =
    searchParams.subject && subjects.some((s) => s.id === searchParams.subject)
      ? searchParams.subject
      : null;

  let query = admin
    .from("mcqs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(PAGE_LIMIT);
  if (subjectFilter) query = query.eq("subject_id", subjectFilter);

  const { data, count } = await query;
  const mcqs = (data as Mcq[]) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">MCQ Bank</h1>
        <p className="mt-1 text-ink-muted">
          Create, edit, and bulk-import questions. {count ?? 0} total
          {subjectFilter ? " in this subject" : ""}
          {mcqs.length >= PAGE_LIMIT
            ? ` — showing the latest ${PAGE_LIMIT}.`
            : "."}
        </p>
      </div>

      <McqManager
        subjects={subjects}
        topics={topics}
        mcqs={mcqs}
        subjectFilter={subjectFilter}
        totalCount={count ?? 0}
      />
    </div>
  );
}
