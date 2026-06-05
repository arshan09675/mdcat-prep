"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FileQuestion,
  Timer,
  ArrowRight,
  Lock,
  Plus,
  Minus,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Subject, TestType } from "@/lib/types";

export interface TestCard {
  id: string;
  title: string;
  type: TestType;
  subject_id: string | null;
  duration_minutes: number;
  total_questions: number;
  marks_per_correct: number;
  negative_marks: number;
  is_free: boolean;
  past_paper_year: number | null;
}

const TYPE_LABELS: Record<TestType, string> = {
  mock: "Full Mock",
  topic: "Topic",
  past_paper: "Past Paper",
  practice: "Practice",
};

export function TestsBrowser({
  tests,
  subjects,
  subscribed,
}: {
  tests: TestCard[];
  subjects: Subject[];
  subscribed: boolean;
}) {
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("");
  const [year, setYear] = useState("");

  const subjectName = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s.name])),
    [subjects],
  );
  const years = useMemo(
    () =>
      Array.from(
        new Set(
          tests
            .map((t) => t.past_paper_year)
            .filter((y): y is number => y != null),
        ),
      ).sort((a, b) => b - a),
    [tests],
  );

  const filtered = tests.filter((t) => {
    if (subject && t.subject_id !== subject) return false;
    if (type && t.type !== type) return false;
    if (year && String(t.past_paper_year) !== year) return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="mb-7 flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Label className="mb-1.5 block text-xs text-ink-muted">Subject</Label>
          <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Label className="mb-1.5 block text-xs text-ink-muted">Type</Label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            <option value="mock">Full Mock</option>
            <option value="topic">Topic</option>
            <option value="past_paper">Past Paper</option>
            <option value="practice">Practice</option>
          </Select>
        </div>
        {years.length > 0 && (
          <div className="w-32">
            <Label className="mb-1.5 block text-xs text-ink-muted">Year</Label>
            <Select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
        )}
        <p className="ml-auto self-center text-sm text-ink-muted">
          {filtered.length} test{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[var(--r2)] border border-border bg-off p-12 text-center">
          <p className="text-[15px] font-semibold text-navy">
            {tests.length === 0
              ? "Mock tests are coming soon"
              : "No tests match these filters"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-ink-muted">
            {tests.length === 0
              ? "Full-length, timed mock tests with negative marking and subject-wise analysis are on the way. Meanwhile, build speed with subject MCQ practice."
              : "Try clearing a filter to see more tests."}
          </p>
          {tests.length === 0 && (
            <Link className="btn btn-blue mt-5" href="/subjects">
              Practice MCQs <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="mg">
          {filtered.map((t) => {
            const locked = !t.is_free && !subscribed;
            return (
              <Link
                key={t.id}
                href={`/test/${t.id}`}
                className="mc block no-underline"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="mc-type capitalize">
                    {t.past_paper_year
                      ? `Past Paper ${t.past_paper_year}`
                      : TYPE_LABELS[t.type]}
                  </span>
                  {t.is_free ? (
                    <span
                      className="mc-type"
                      style={{ background: "#f0fdf4", color: "#22c55e" }}
                    >
                      Free
                    </span>
                  ) : (
                    <span className="mc-type inline-flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Premium
                    </span>
                  )}
                </div>
                <div className="text-[15px] font-bold text-navy">{t.title}</div>
                {t.subject_id && subjectName[t.subject_id] && (
                  <div className="mt-1 text-[13px] text-ink-muted">
                    {subjectName[t.subject_id]}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-[13px] text-ink-muted">
                  <span className="flex items-center gap-1.5">
                    <FileQuestion className="h-4 w-4" /> {t.total_questions} MCQs
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Timer className="h-4 w-4" /> {t.duration_minutes} min
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    {t.marks_per_correct}
                  </span>
                  {t.negative_marks > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Minus className="h-3.5 w-3.5" />
                      {t.negative_marks}
                    </span>
                  )}
                </div>
                {locked && (
                  <p className="mt-3 text-[12px] font-semibold text-brand">
                    Subscribe to attempt
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
