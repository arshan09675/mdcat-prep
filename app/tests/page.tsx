import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TestsBrowser, type TestCard } from "@/components/tests/tests-browser";
import { createClient } from "@/lib/supabase/server";
import { hasActiveSubscription } from "@/lib/subscription";
import type { Subject } from "@/lib/types";

export const metadata = { title: "Mock Tests — MDCAT Prep" };

export default async function TestsPage() {
  const supabase = createClient();

  const [{ data: testData }, { data: subjectData }, subscribed] =
    await Promise.all([
      supabase
        .from("tests")
        .select(
          "id, title, type, subject_id, duration_minutes, total_questions, marks_per_correct, negative_marks, is_free, past_paper_year",
        )
        .eq("published", true)
        .order("created_at", { ascending: false }),
      supabase.from("subjects").select("*").order("position"),
      hasActiveSubscription(),
    ]);

  const tests = (testData as TestCard[]) ?? [];
  const subjects = (subjectData as Subject[]) ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <div className="page-head">
        <div className="tag">Practice Tests</div>
        <h2 className="sec-h">Mock Tests &amp; Past Papers</h2>
        <p>
          Full-length, timed, PMC-pattern tests with negative marking and a
          subject-wise breakdown.
        </p>
      </div>

      <section className="sec flex-1" style={{ background: "#fff" }}>
        <div className="sec-in">
          <TestsBrowser
            tests={tests}
            subjects={subjects}
            subscribed={subscribed}
          />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
