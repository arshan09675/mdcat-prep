"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Timer, FileQuestion, Plus, Minus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { startAttempt } from "@/app/tests/actions";
import type { TestType } from "@/lib/types";

const TYPE_LABELS: Record<TestType, string> = {
  mock: "Full Mock",
  topic: "Topic Test",
  past_paper: "Past Paper",
  practice: "Practice",
};

export function TestIntro({
  testId,
  title,
  type,
  durationMinutes,
  totalQuestions,
  marksPerCorrect,
  negativeMarks,
  isFree,
  pastPaperYear,
}: {
  testId: string;
  title: string;
  type: TestType;
  durationMinutes: number;
  totalQuestions: number;
  marksPerCorrect: number;
  negativeMarks: number;
  isFree: boolean;
  pastPaperYear: number | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onStart() {
    setBusy(true);
    setError(null);
    const res = await startAttempt(testId);
    if (!res.ok) {
      setError(res.error);
      setBusy(false);
      return;
    }
    // The page re-renders into the runner once an in-progress attempt exists.
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-6 py-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary">
              {pastPaperYear ? `Past Paper ${pastPaperYear}` : TYPE_LABELS[type]}
            </Badge>
            {isFree && <Badge variant="free">Free</Badge>}
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold text-navy">
            {title}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat icon={FileQuestion} label="Questions" value={String(totalQuestions)} />
          <Stat icon={Timer} label="Duration" value={`${durationMinutes} min`} />
          <Stat icon={Plus} label="Per correct" value={`+${marksPerCorrect}`} />
          <Stat
            icon={Minus}
            label="Negative"
            value={negativeMarks > 0 ? `−${negativeMarks}` : "None"}
          />
        </div>

        <div className="rounded-lg border border-border bg-off p-4 text-sm text-ink-mid">
          <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-navy">
            <AlertCircle className="h-4 w-4 text-brand" /> Before you start
          </p>
          <ul className="list-inside list-disc space-y-1 text-ink-muted">
            <li>The timer starts as soon as you begin and won&apos;t pause.</li>
            <li>
              Your answers are saved automatically — you can leave and resume
              within the time limit.
            </li>
            <li>
              When time runs out the test is submitted and graded
              automatically.
            </li>
            {negativeMarks > 0 && (
              <li>
                Wrong answers lose {negativeMarks} mark
                {negativeMarks === 1 ? "" : "s"} — skip if unsure.
              </li>
            )}
          </ul>
        </div>

        {error && (
          <p className="text-center text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <Button onClick={onStart} disabled={busy} className="w-full" size="lg">
          {busy ? "Starting…" : "Start test"}
        </Button>
      </CardContent>
    </Card>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Timer;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-white p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="font-semibold text-navy">{value}</p>
        <p className="text-xs text-ink-muted">{label}</p>
      </div>
    </div>
  );
}
