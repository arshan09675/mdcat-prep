import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Faq } from "@/components/faq";
import { createClient } from "@/lib/supabase/server";
import { formatPkr } from "@/lib/format";
import type { Plan } from "@/lib/types";

export const metadata = { title: "Pricing — MDCAT Prep" };

const PRICING_FAQS = [
  { q: "How do I pay?", a: "Payments are made manually via JazzCash. Choose a plan, send the fee to our JazzCash account, then submit your transaction details and a screenshot. An admin verifies it and your access unlocks. (JazzCash only for now.)" },
  { q: "What unlocks with a subscription?", a: "The full premium MCQ bank, mock tests and past papers for the duration of your plan. Free MCQs stay open to everyone." },
  { q: "How long until my access is active?", a: "Access unlocks as soon as an admin approves your payment submission. You can track the status on your account." },
];

export default async function PricingPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("plans")
    .select("*")
    .eq("active", true)
    .order("position");

  const plans = (data ?? []) as Plan[];
  const popularId = plans.length > 1 ? plans[plans.length - 1].id : plans[0]?.id;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <div className="page-head">
        <div className="tag">Simple Pricing</div>
        <h2 className="sec-h">Choose Your Plan</h2>
        <p>
          No hidden fees. Unlock the full MCQ bank, mock tests and past papers.
          Secure manual payment via JazzCash.
        </p>
      </div>

      <section className="sec flex-1" style={{ background: "#fff" }}>
        <div className="sec-in">
          {plans.length === 0 ? (
            <p className="sec-s text-center">No plans available yet.</p>
          ) : (
            <div className="price-grid">
              {plans.map((plan) => {
                const feat = plan.id === popularId;
                const features = Array.isArray(plan.features)
                  ? plan.features
                  : [];
                return (
                  <div key={plan.id} className={`pc ${feat ? "feat" : ""}`}>
                    {feat && <div className="pop-b">Most Popular</div>}
                    <div className="pn">{plan.name}</div>
                    <div className="pp">
                      {formatPkr(plan.price_pkr)}{" "}
                      <span className="pr">/ {plan.duration_days} days</span>
                    </div>
                    {plan.description && <div className="pd">{plan.description}</div>}
                    <hr className="dv" />
                    <div className="pf-list">
                      {features.length > 0 ? (
                        features.map((f, i) => (
                          <div className="pf-i" key={i}>
                            <CheckCircle2 className="h-[15px] w-[15px]" /> {f}
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="pf-i">
                            <CheckCircle2 className="h-[15px] w-[15px]" /> Full
                            premium MCQ bank
                          </div>
                          <div className="pf-i">
                            <CheckCircle2 className="h-[15px] w-[15px]" /> All mock
                            tests &amp; past papers
                          </div>
                        </>
                      )}
                    </div>
                    <div style={{ marginTop: "auto" }}>
                      <Link
                        href={`/subscribe/${plan.id}`}
                        className={`btn ${feat ? "btn-blue" : "btn-ghost"} w-full justify-center`}
                      >
                        Subscribe
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: "4rem", textAlign: "center" }}>
            <div className="tag">FAQs</div>
            <h2 className="sec-h">Payment &amp; Access</h2>
          </div>
          <Faq items={PRICING_FAQS} />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
