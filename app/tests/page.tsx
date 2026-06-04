import Link from "next/link";
import { ArrowRight, FileQuestion, Timer } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Mock Tests — MDCAT Prep" };

export default async function TestsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("tests")
    .select("id, title, type, duration_minutes, total_questions, is_free, past_paper_year")
    .eq("published", true)
    .order("created_at", { ascending: false });

  const tests = data ?? [];

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
          {tests.length > 0 ? (
            <div className="mg">
              {tests.map((t) => (
                <Link key={t.id} href={`/test/${t.id}`} className="mc block no-underline">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="mc-type capitalize">
                      {t.past_paper_year
                        ? `Past paper ${t.past_paper_year}`
                        : t.type}
                    </span>
                    {t.is_free && (
                      <span
                        className="mc-type"
                        style={{ background: "#f0fdf4", color: "#22c55e" }}
                      >
                        Free
                      </span>
                    )}
                  </div>
                  <div className="text-[15px] font-bold text-navy">{t.title}</div>
                  <div className="mt-2 flex flex-wrap gap-3 text-[13px] text-ink-muted">
                    <span className="flex items-center gap-1.5">
                      <FileQuestion className="h-4 w-4" /> {t.total_questions} MCQs
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Timer className="h-4 w-4" /> {t.duration_minutes} min
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[var(--r2)] border border-border bg-off p-12 text-center">
              <p className="text-[15px] font-semibold text-navy">
                Mock tests are coming soon
              </p>
              <p className="mx-auto mt-2 max-w-md text-[14px] text-ink-muted">
                Full-length, timed mock tests with negative marking and
                subject-wise analysis are on the way. Meanwhile, build your speed
                with subject MCQ practice.
              </p>
              <Link className="btn btn-blue mt-5" href="/subjects">
                Practice MCQs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
