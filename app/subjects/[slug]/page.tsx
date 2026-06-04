import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ArrowRight, Lock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSubjectBySlug } from "@/lib/catalog";
import { hasActiveSubscription } from "@/lib/subscription";
import { subjectStyle } from "@/lib/subject-style";

export default async function SubjectPage({
  params,
}: {
  params: { slug: string };
}) {
  const [data, subscribed] = await Promise.all([
    getSubjectBySlug(params.slug),
    hasActiveSubscription(),
  ]);

  if (!data) notFound();
  const { subject, topics } = data;
  const st = subjectStyle(subject.slug);
  const Icon = st.Icon;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <div className="page-head">
        <div className="tag">MDCAT Subject</div>
        <h2 className="sec-h flex items-center justify-center gap-3">
          <Icon className="h-8 w-8" style={{ color: st.accent }} />
          {subject.name}
        </h2>
        <p>
          {topics.length} topic{topics.length === 1 ? "" : "s"}.{" "}
          {subscribed
            ? "Your subscription is active — all MCQs unlocked."
            : "Free MCQs are open. Subscribe to unlock all MCQs."}
        </p>
      </div>

      <section className="sec flex-1" style={{ background: "#fff" }}>
        <div className="sec-in">
          <Link
            href="/subjects"
            className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-ink-muted hover:text-brand"
          >
            <ChevronLeft className="h-4 w-4" /> All subjects
          </Link>

          {topics.length === 0 ? (
            <p className="sec-s">No topics added to this subject yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {topics.map(({ topic, mcqTotal, mcqFree }) => {
                const lockedCount = subscribed ? 0 : mcqTotal - mcqFree;
                const accessible = subscribed ? mcqTotal : mcqFree;
                return (
                  <div
                    key={topic.id}
                    className="flex flex-col justify-between rounded-[var(--r2)] border-[1.5px] border-border bg-off p-5 transition-all hover:-translate-y-[3px] hover:border-brand hover:shadow-[0_12px_40px_rgba(26,86,219,0.1)]"
                  >
                    <div className="mb-4 flex items-start gap-3">
                      <span
                        className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: st.accent }}
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-navy">{topic.name}</h3>
                        <p className="mt-1 text-[13px] text-ink-muted">
                          {mcqTotal} MCQ{mcqTotal === 1 ? "" : "s"}
                          {mcqFree > 0 && (
                            <span className="text-green-600"> · {mcqFree} free</span>
                          )}
                          {lockedCount > 0 && (
                            <span className="inline-flex items-center gap-1">
                              {" "}
                              · <Lock className="h-3 w-3" /> {lockedCount} premium
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/practice/${topic.id}`}
                      className={`btn ${accessible > 0 ? "btn-blue" : "btn-ghost"} w-full justify-center`}
                    >
                      {accessible > 0 ? "Practice" : "View"}{" "}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {!subscribed && (
            <div className="mt-10 rounded-[var(--r2)] border border-border bg-off p-8 text-center">
              <p className="font-bold text-navy">
                Unlock every MCQ, mock test and past paper
              </p>
              <Link className="btn btn-blue mt-4" href="/pricing">
                View subscription plans <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
