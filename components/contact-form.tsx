"use client";

import { useState } from "react";
import { Send, Check } from "lucide-react";

/**
 * Illustrative contact form — not wired to a backend yet. On submit it shows
 * local confirmation feedback only.
 */
export function ContactForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div className="rounded-[var(--r2)] border border-border bg-off p-8">
      <h3 className="mb-6 text-lg font-bold text-navy">Send a Message</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cf-name" className="field-label">Full Name</label>
            <input id="cf-name" className="field" type="text" placeholder="Your full name" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cf-phone" className="field-label">Phone Number</label>
            <input id="cf-phone" className="field" type="tel" placeholder="+92 3XX XXXXXXX" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cf-email" className="field-label">Email Address</label>
          <input id="cf-email" className="field" type="email" placeholder="you@example.com" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cf-subject" className="field-label">Subject</label>
          <select id="cf-subject" className="field">
            <option>Subscription &amp; payment</option>
            <option>MCQ practice</option>
            <option>Mock tests</option>
            <option>Technical support</option>
            <option>Other</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cf-msg" className="field-label">Message</label>
          <textarea
            id="cf-msg"
            className="field min-h-[110px] resize-y"
            placeholder="How can we help you?"
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-blue w-full justify-center"
          style={sent ? { background: "#22c55e" } : undefined}
        >
          {sent ? (
            <>
              <Check className="h-4 w-4" /> Message noted
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Send Message
            </>
          )}
        </button>
        <p className="text-center text-xs text-ink-muted">
          This form isn&apos;t connected to email yet — please reach out via the
          details on the left.
        </p>
      </form>
    </div>
  );
}
