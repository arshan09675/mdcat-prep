import { Mail, MessageCircle, Clock } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ContactForm } from "@/components/contact-form";

export const metadata = { title: "Contact — MDCAT Prep" };

const INFO = [
  { Icon: Mail, label: "Email", value: "info@mdcatprep.pk" },
  { Icon: MessageCircle, label: "WhatsApp", value: "Coming soon" },
  { Icon: Clock, label: "Support hours", value: "Mon–Sat, 9 AM – 9 PM" },
];

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <div className="page-head">
        <div className="tag">Get in Touch</div>
        <h2 className="sec-h">Contact Us</h2>
        <p>Questions about MDCAT prep, subscriptions or payments? We&apos;re here to help.</p>
      </div>

      <section className="sec flex-1" style={{ background: "#fff" }}>
        <div className="sec-in">
          <div className="grid items-start gap-12 md:grid-cols-2">
            <div>
              <div className="tag">Reach Out</div>
              <h2 className="sec-h mt-1">We&apos;d Love to Hear From You</h2>
              <p className="sec-s mb-8">
                Have questions about practice, mock tests or unlocking premium
                access? Send us a message and we&apos;ll get back to you.
              </p>
              <div className="flex flex-col gap-5">
                {INFO.map(({ Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-sky-50 text-brand">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                        {label}
                      </div>
                      <div className="text-[15px] font-semibold text-navy">
                        {value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
