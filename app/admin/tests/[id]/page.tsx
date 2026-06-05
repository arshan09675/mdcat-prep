import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { TestBuilder } from "@/components/admin/test-builder";
import { getSubjectsWithTopics } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Mcq, Test } from "@/lib/types";

export const metadata = { title: "Test questions — Admin" };

export interface AttachedQuestion {
  testQuestionId: string;
  position: number;
  mcq: Mcq;
}

export default async function TestBuilderPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { subject?: string };
}) {
  const admin = createServiceRoleClient();
  const { subjects, topics } = await getSubjectsWithTopics();

  const { data: testData } = await admin
    .from("tests")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!testData) notFound();
  const test = testData as Test;

  const { data: tqData } = await admin
    .from("test_questions")
    .select("id, position, mcq:mcqs(*)")
    .eq("test_id", test.id)
    .order("position");

  const attached: AttachedQuestion[] = (tqData ?? []).map((r) => ({
    testQuestionId: r.id as string,
    position: r.position as number,
    mcq: r.mcq as unknown as Mcq,
  }));
  const attachedIds = new Set(attached.map((a) => a.mcq.id));

  // Candidate pool for the picker. Default to the test's subject when set.
  const subjectFilter =
    searchParams.subject && subjects.some((s) => s.id === searchParams.subject)
      ? searchParams.subject
      : test.subject_id;

  let poolQuery = admin
    .from("mcqs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  if (subjectFilter) poolQuery = poolQuery.eq("subject_id", subjectFilter);
  const { data: poolData } = await poolQuery;
  const pool = ((poolData as Mcq[]) ?? []).filter((m) => !attachedIds.has(m.id));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/tests"
          className="inline-flex items-center gap-1 text-sm font-semibold text-ink-muted transition-colors hover:text-brand"
        >
          <ChevronLeft className="h-4 w-4" /> All tests
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-navy">
          {test.title}
        </h1>
        <p className="mt-1 text-ink-muted">
          {attached.length} question{attached.length === 1 ? "" : "s"} attached ·{" "}
          {test.duration_minutes} min
        </p>
      </div>

      <TestBuilder
        testId={test.id}
        subjects={subjects}
        topics={topics}
        attached={attached}
        pool={pool}
        subjectFilter={subjectFilter}
      />
    </div>
  );
}
