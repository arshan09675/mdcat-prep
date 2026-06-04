import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSubjectCards } from "@/lib/catalog";
import { subjectStyle } from "@/lib/subject-style";

export const metadata = { title: "Subjects — MDCAT Prep" };

export default async function SubjectsPage() {
  const cards = await getSubjectCards();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <div className="page-head">
        <div className="tag">MDCAT Syllabus</div>
        <h2 className="sec-h">Choose a Subject</h2>
        <p>
          Browse topics and practice MCQs. Free MCQs are open to everyone;
          premium MCQs unlock with a subscription.
        </p>
      </div>

      <section className="sec flex-1" style={{ background: "#fff" }}>
        <div className="sec-in">
          {cards.length === 0 ? (
            <p className="sec-s">No subjects available.</p>
          ) : (
            <div className="sg">
              {cards.map(({ subject, topicCount, mcqTotal, mcqFree }) => {
                const st = subjectStyle(subject.slug);
                const Icon = st.Icon;
                return (
                  <Link
                    key={subject.id}
                    href={`/subjects/${subject.slug}`}
                    className={`sc ${st.sc}`}
                  >
                    <span className="sc-ico">
                      <Icon className="h-6 w-6" style={{ color: st.accent }} />
                    </span>
                    <div className="sc-n">{subject.name}</div>
                    <div className="sc-i">
                      {mcqTotal} MCQ{mcqTotal === 1 ? "" : "s"} · {topicCount}{" "}
                      topic{topicCount === 1 ? "" : "s"}
                    </div>
                    <div className="sc-l" style={{ color: st.accent }}>
                      <ArrowRight className="h-3.5 w-3.5" />
                      {mcqFree > 0 ? `${mcqFree} free to try` : "Start practice"}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
