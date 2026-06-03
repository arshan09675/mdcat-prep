"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { formatPkr } from "@/lib/format";
import { PAYMENT_CONFIG, PAYMENT_PROOFS_BUCKET } from "@/lib/payment-config";
import { submitPayment } from "@/app/subscribe/actions";

export function PaymentForm({
  planId,
  amountPkr,
}: {
  planId: string;
  amountPkr: number;
}) {
  const router = useRouter();
  const jc = PAYMENT_CONFIG.jazzcash;

  const [amount, setAmount] = useState(String(amountPkr));
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Please attach a screenshot of your payment.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Your session expired. Please sign in again.");
        setSubmitting(false);
        return;
      }

      // Upload the screenshot directly to the private bucket. RLS sets
      // owner = auth.uid(), so the path must live under the user's folder.
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(PAYMENT_PROOFS_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        setError(`Screenshot upload failed: ${uploadError.message}`);
        setSubmitting(false);
        return;
      }

      const res = await submitPayment({
        planId,
        amountPkr: Number(amount),
        senderNumber,
        transactionId,
        screenshotPath: path,
      });

      if (!res.ok) {
        setError(res.error);
        setSubmitting(false);
        return;
      }

      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <Card className="border-amber-500/40 bg-amber-50">
        <CardContent className="space-y-2 py-8 text-center">
          <p className="text-lg font-semibold">
            Payment received — under review
          </p>
          <p className="text-sm text-muted-foreground">
            We&apos;re verifying your payment. You&apos;ll get access once an
            admin approves it.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Receiving details */}
      <Card className="border-primary/30 bg-secondary/30">
        <CardHeader>
          <CardTitle className="text-base">
            Step 1 — Send {formatPkr(amountPkr)} via JazzCash
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">JazzCash Number</span>
            <span className="font-mono font-semibold">{jc.number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Name</span>
            <span className="font-semibold">{jc.accountName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{formatPkr(amountPkr)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Submission form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Step 2 — Submit your payment proof
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount paid (PKR)</Label>
              <Input
                id="amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sender">Your JazzCash number (sender)</Label>
              <Input
                id="sender"
                type="tel"
                placeholder="03XXXXXXXXX"
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tid">Transaction ID (TID)</Label>
              <Input
                id="tid"
                type="text"
                placeholder="From your JazzCash confirmation SMS"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="screenshot">Payment screenshot</Label>
              <Input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Upload the JazzCash confirmation screenshot (image).
              </p>
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit payment for review"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Easypaisa coming soon — JazzCash only for now.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
