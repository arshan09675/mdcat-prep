"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { approvePayment, rejectPayment } from "@/app/admin/payments/actions";

export function PaymentReview({
  id,
  studentName,
  email,
  planName,
  planPrice,
  durationDays,
  method,
  amount,
  senderNumber,
  transactionId,
  createdAt,
  screenshotUrl,
}: {
  id: string;
  studentName: string | null;
  email: string | null;
  planName: string;
  planPrice: string;
  durationDays: number;
  method: string;
  amount: string;
  senderNumber: string | null;
  transactionId: string | null;
  createdAt: string;
  screenshotUrl: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "approve" | "reject">(null);
  const [error, setError] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [note, setNote] = useState("");

  async function onApprove() {
    setError(null);
    setBusy("approve");
    const res = await approvePayment(id);
    if (!res.ok) {
      setError(res.error);
      setBusy(null);
      return;
    }
    router.refresh();
  }

  async function onReject() {
    setError(null);
    setBusy("reject");
    const res = await rejectPayment(id, note);
    if (!res.ok) {
      setError(res.error);
      setBusy(null);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="grid gap-6 pt-6 md:grid-cols-[1fr_220px]">
        {/* Details */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{studentName ?? "Student"}</span>
            {email && (
              <span className="text-sm text-muted-foreground">{email}</span>
            )}
            <Badge variant="secondary" className="uppercase">
              {method}
            </Badge>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Plan</dt>
              <dd className="font-medium">
                {planName} · {planPrice} · {durationDays} days
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Amount paid</dt>
              <dd className="font-medium">{amount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sender number</dt>
              <dd className="font-mono font-medium">{senderNumber ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Transaction ID</dt>
              <dd className="font-mono font-medium">{transactionId ?? "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Submitted</dt>
              <dd>{new Date(createdAt).toLocaleString()}</dd>
            </div>
          </dl>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={onApprove} disabled={busy !== null}>
              {busy === "approve" ? "Approving…" : "Approve & grant access"}
            </Button>
            {!showReject ? (
              <Button
                variant="outline"
                onClick={() => setShowReject(true)}
                disabled={busy !== null}
              >
                Reject
              </Button>
            ) : null}
          </div>

          {showReject && (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <Textarea
                placeholder="Optional note to record why this was rejected…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={onReject}
                  disabled={busy !== null}
                >
                  {busy === "reject" ? "Rejecting…" : "Confirm reject"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowReject(false)}
                  disabled={busy !== null}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Screenshot proof */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Payment proof
          </p>
          {screenshotUrl ? (
            <a
              href={screenshotUrl}
              target="_blank"
              rel="noreferrer"
              className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshotUrl}
                alt="JazzCash payment screenshot submitted by the student"
                className="max-h-64 w-full rounded-lg border border-border bg-surface object-contain transition-colors group-hover:border-primary/40"
              />
              <span className="mt-1.5 block text-center text-xs text-muted-foreground group-hover:text-foreground">
                Open full size
              </span>
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">No screenshot.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
