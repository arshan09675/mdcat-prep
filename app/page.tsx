import Link from "next/link";
import {
  Play,
  FileText,
  ArrowRight,
  BookOpenCheck,
  Timer,
  Lightbulb,
  BarChart3,
  Brain,
  Video,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Faq } from "@/components/faq";
import { getSubjectCards } from "@/lib/catalog";
import { subjectStyle } from "@/lib/subject-style";
import { createClient } from "@/lib/supabase/server";
import { formatPkr } from "@/lib/format";
import type { Plan } from "@/lib/types";

const SAMPLE_ROWS = [
  { name: "Biology", pct: 82, grad: "linear-gradient(90deg,#22d3ee,#06b6d4)", color: "#22d3ee" },
  { name: "Chemistry", pct: 74, grad: "linear-gradient(90deg,#818cf8,#6366f1)", color: "#818cf8" },
  { name: "Physics", pct: 68, grad: "linear-gradient(90deg,#fb923c,#f97316)", color: "#fb923c" },
  { name: "English", pct: 90, grad: "linear-gradient(90deg,#4ade80,#22c55e)", color: "#4ade80" },
  { name: "Logical Reasoning", pct: 71, grad: "linear-gradient(90deg,#f472b6,#ec4899)", color: "#f472b6" },
];

const FEATURES = [
  { fi: "fi-b", Icon: Video, t: "Subject-wise MCQ bank", d: "Practice Biology, Chemistry, Physics, English and Logical Reasoning, organised chapter by chapter." },
  { fi: "fi-c", Icon: FileText, t: "Full-length mock tests", d: "PMC-pattern timed mocks with negative marking, auto-scoring and a subject-wise breakdown." },
  { fi: "fi-g", Icon: Lightbulb, t: "Instant explanations", d: "Every MCQ is graded on the server and comes with a clear explanation the moment you answer." },
  { fi: "fi-o", Icon: BookOpenCheck, t: "Past papers", d: "Practice with real past-paper questions tagged by year as they are added to the bank." },
  { fi: "fi-p", Icon: BarChart3, t: "Performance analytics", d: "See your scores, accuracy and weak subjects so you know exactly what to revise next." },
  { fi: "fi-y", Icon: Brain, t: "Built for MDCAT", d: "Focused entirely on the Pakistani MDCAT — no clutter, just the practice that moves your score." },
];

const VALUES = [
  { Icon: BookOpenCheck, t: "All 5 subjects", s: "Biology to Logical Reasoning" },
  { Icon: Timer, t: "Timed mocks", s: "Real exam conditions" },
  { Icon: Lightbulb, t: "Instant feedback", s: "Explanations on every MCQ" },
  { Icon: BarChart3, t: "Track progress", s: "Subject-wise analysis" },
];

const FAQS = [
  { q: "Is the practice organised by the MDCAT syllabus?", a: "Yes — practice is grouped by the five MDCAT subjects and their chapters, with an instant explanation on every MCQ so you learn as you go." },
  { q: "How do I pay, and what methods are accepted?", a: "Payments are made manually via JazzCash. After you send the fee, you submit your transaction details and a screenshot; an admin verifies it and your access unlocks. (JazzCash only for now.)" },
  { q: "Can I try it for free?", a: "Yes. Free MCQs are open to everyone without any payment. A subscription unlocks the full premium MCQ bank, mock tests and past papers." },
  { q: "What do I get with a subscription?", a: "Full access to the premium MCQ bank, mock tests and past papers for the duration of your plan." },
  { q: "How long does payment verification take?", a: "We verify payments manually. Your access unlocks as soon as an admin approves your submission — you'll see the status update on your account." },
];

export default async function HomePage() {
  const supabase = createClient();
  const [cards, plansRes, testsRes] = await Promise.all([
    getSubjectCards(),
    supabase.from("plans").select("*").eq("active", true).order("position"),
    supabase
      .from("tests")
      .select("id, title, type, duration_minutes, total_questions, is_free")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const plans = (plansRes.data ?? []) as Plan[];
  const cheapest =
    plans.length > 0 ? Math.min(...plans.map((p) => p.price_pkr)) : null;
  const featuredTests = testsRes.data ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-glow" />
        <div className="hero-glow2" />
        <div className="hero-inner">
          <div>
            <div className="hero-pill">
              <span className="pill-dot" /> MDCAT 2025 — Pakistan
            </div>
            <h1>
              Your Path to
              <br />
              <span className="hl">Medical College</span>
              <br />
              Starts Here
            </h1>
            <p>
              Subject-wise MCQ practice with instant explanations, full-length
              mock tests with negative marking, and past papers — focused
              entirely on the Pakistani MDCAT.
            </p>
            <div className="hero-btns">
              <Link className="btn btn-blue btn-lg" href="/subjects">
                <Play className="h-4 w-4" /> Start Free Practice
              </Link>
              <Link className="btn btn-white btn-lg" href="/pricing">
                <FileText className="h-4 w-4" /> View Pricing
              </Link>
            </div>
            <div className="hero-trust">
              <div className="t-avs" aria-hidden="true">
                <span className="tav" style={{ background: "#1a56db" }}>Bi</span>
                <span className="tav" style={{ background: "#06b6d4" }}>Ch</span>
                <span className="tav" style={{ background: "#22c55e" }}>Ph</span>
                <span className="tav" style={{ background: "#f97316" }}>En</span>
                <span className="tav" style={{ background: "#ec4899" }}>LR</span>
              </div>
              <div className="t-txt">
                <strong>All 5 MDCAT subjects covered</strong>
                <span>Instant explanations on every MCQ</span>
              </div>
            </div>
          </div>

          {/* Decorative sample dashboard */}
          <div className="hero-right">
            <div className="dash-card" aria-hidden="true">
              <div className="dc-head">
                <div className="dc-title">Score Tracker</div>
                <div className="dc-live">SAMPLE</div>
              </div>
              <div className="subj-rows">
                {SAMPLE_ROWS.map((r) => (
                  <div className="sr" key={r.name}>
                    <div className="sr-top">
                      <span className="sr-name">{r.name}</span>
                      <span className="sr-pct" style={{ color: r.color }}>
                        {r.pct}%
                      </span>
                    </div>
                    <div className="prog">
                      <div
                        className="prog-fill"
                        style={{ width: `${r.pct}%`, background: r.grad }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="dc-foot">
                <div>
                  <div className="dc-score-lbl">Predicted Score</div>
                  <div className="dc-score-val">
                    1058 <span>/ 1100</span>
                  </div>
                </div>
                <span className="btn btn-blue" style={{ padding: "9px 18px", fontSize: 13 }}>
                  Take Mock →
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUBJECTS (real) */}
      <section className="sec" style={{ background: "#fff" }}>
        <div className="sec-in">
          <div className="sec-top">
            <div>
              <div className="tag">MDCAT Syllabus</div>
              <h2 className="sec-h">Master Every Subject</h2>
              <p className="sec-s">
                Aligned with the MDCAT 2025 subjects. Browse topics and practice
                MCQs with instant explanations.
              </p>
            </div>
            <Link className="btn btn-ghost" href="/subjects">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {cards.length === 0 ? (
            <p className="sec-s">No subjects available yet.</p>
          ) : (
            <div className="sg">
              {cards.map(({ subject, topicCount, mcqTotal }) => {
                const st = subjectStyle(subject.slug);
                return (
                  <Link
                    key={subject.id}
                    href={`/subjects/${subject.slug}`}
                    className={`sc ${st.sc}`}
                  >
                    <span className="sc-em" aria-hidden="true">
                      {st.emoji}
                    </span>
                    <div className="sc-n">{subject.name}</div>
                    <div className="sc-i">
                      {topicCount} topic{topicCount === 1 ? "" : "s"} ·{" "}
                      {mcqTotal} MCQ{mcqTotal === 1 ? "" : "s"}
                    </div>
                    <div className="sc-l" style={{ color: st.accent }}>
                      Start practicing <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FEATURES (dark) */}
      <section className="feat-sec">
        <div className="sec-in">
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 1rem" }}>
            <div className="tag">Why MDCAT Prep?</div>
            <h2 className="sec-h">
              Everything Built to{" "}
              <em className="font-display" style={{ fontStyle: "italic", color: "#93b4ff" }}>
                Get You In
              </em>
            </h2>
          </div>
          <div className="fg">
            {FEATURES.map(({ fi, Icon, t, d }) => (
              <div className="fc2" key={t}>
                <div className={`fi ${fi}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="fc2-t">{t}</div>
                <div className="fc2-d">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MOCK TESTS teaser (real or coming soon) */}
      <section className="sec" style={{ background: "#fff" }}>
        <div className="sec-in">
          <div className="sec-top">
            <div>
              <div className="tag">Practice Tests</div>
              <h2 className="sec-h">Mock Tests &amp; Past Papers</h2>
              <p className="sec-s">
                Full-length, timed, PMC-pattern tests with negative marking and a
                subject-wise breakdown.
              </p>
            </div>
            <Link className="btn btn-ghost" href="/tests">
              All tests <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredTests.length > 0 ? (
            <div className="mg">
              {featuredTests.map((t) => (
                <Link key={t.id} href={`/test/${t.id}`} className="mc block no-underline">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="mc-type">{t.type}</span>
                    {t.is_free && (
                      <span className="mc-type" style={{ background: "#f0fdf4", color: "#22c55e" }}>
                        Free
                      </span>
                    )}
                  </div>
                  <div className="text-[15px] font-bold text-navy">{t.title}</div>
                  <div className="mt-1.5 text-[13px] text-ink-muted">
                    {t.total_questions} MCQs · {t.duration_minutes} min
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] border border-border bg-off p-12 text-center">
              <p className="text-[15px] font-semibold text-navy">
                Mock tests are coming soon
              </p>
              <p className="mx-auto mt-2 max-w-md text-[14px] text-ink-muted">
                Full-length timed mocks with negative marking and subject-wise
                analysis are on the way. In the meantime, sharpen up with
                subject MCQ practice.
              </p>
              <Link className="btn btn-blue mt-5" href="/subjects">
                Practice MCQs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* VALUE strip (honest, non-numeric) */}
      <section className="vbar">
        <div className="vbar-grid">
          {VALUES.map(({ Icon, t, s }) => (
            <div className="vcard" key={t}>
              <Icon className="vi h-7 w-7" />
              <div className="vcard-t">{t}</div>
              <div className="vcard-s">{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING teaser (real plans) */}
      <section className="sec" style={{ background: "var(--off)" }}>
        <div className="sec-in" style={{ textAlign: "center" }}>
          <div className="tag">Simple Pricing</div>
          <h2 className="sec-h">One Subscription, Everything Unlocked</h2>
          <p className="sec-s" style={{ margin: "0 auto" }}>
            Unlock the full MCQ bank, mock tests and past papers
            {cheapest !== null ? ` — starting at ${formatPkr(cheapest)}.` : "."}
          </p>
          <Link className="btn btn-blue btn-lg" href="/pricing" style={{ marginTop: "1.5rem" }}>
            View plans <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="sec" style={{ background: "#fff" }}>
        <div className="sec-in">
          <div style={{ textAlign: "center" }}>
            <div className="tag">FAQs</div>
            <h2 className="sec-h">Common Questions</h2>
          </div>
          <Faq items={FAQS} />
        </div>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-glow" />
        <div className="sec-in">
          <h2>
            Start Preparing for
            <br />
            MDCAT 2025 Today
          </h2>
          <p>Begin with free MCQs — no card needed. Subscribe whenever you&apos;re ready.</p>
          <div className="hero-btns" style={{ justifyContent: "center" }}>
            <Link className="btn btn-blue btn-xl" href="/register">
              Get Started
            </Link>
            <Link className="btn btn-white btn-xl" href="/subjects">
              Try Free MCQs
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
