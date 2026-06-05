"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Subject, Topic, Test, TestType } from "@/lib/types";
import {
  createTest,
  updateTest,
  deleteTest,
  type TestInput,
} from "@/app/admin/tests/actions";

const TYPE_LABELS: Record<TestType, string> = {
  mock: "Full Mock",
  topic: "Topic",
  past_paper: "Past Paper",
  practice: "Practice",
};

export function TestManager({
  subjects,
  topics,
  tests,
}: {
  subjects: Subject[];
  topics: Topic[];
  tests: Test[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Test | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const subjectName = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s.name])),
    [subjects],
  );

  async function onDelete(id: string) {
    if (!confirm("Delete this test? Its question list and attempts are removed."))
      return;
    setBusyId(id);
    const res = await deleteTest(id);
    setBusyId(null);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
        >
          <Plus className="h-4 w-4" /> New test
        </Button>
      </div>

      {(creating || editing) && (
        <TestForm
          subjects={subjects}
          topics={topics}
          test={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      <div className="space-y-2">
        {tests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-ink-muted">
            No tests yet. Create one above.
          </p>
        ) : (
          tests.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-navy">{t.title}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                    <Badge variant="secondary">{TYPE_LABELS[t.type]}</Badge>
                    {t.subject_id && (
                      <Badge variant="outline">
                        {subjectName[t.subject_id] ?? "—"}
                      </Badge>
                    )}
                    <Badge variant="outline">{t.total_questions} Qs</Badge>
                    <Badge variant="outline">{t.duration_minutes} min</Badge>
                    {t.negative_marks > 0 && (
                      <Badge variant="outline">−{t.negative_marks} neg</Badge>
                    )}
                    {t.past_paper_year && (
                      <Badge variant="outline">{t.past_paper_year}</Badge>
                    )}
                    {t.is_free && <Badge variant="free">Free</Badge>}
                    <Badge variant={t.published ? "success" : "destructive"}>
                      {t.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/tests/${t.id}`}>
                      <ListChecks className="h-4 w-4" /> Questions
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(t);
                      setCreating(false);
                    }}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(t.id)}
                    disabled={busyId === t.id}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function TestForm({
  subjects,
  topics,
  test,
  onClose,
  onSaved,
}: {
  subjects: Subject[];
  topics: Topic[];
  test: Test | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(test?.title ?? "");
  const [type, setType] = useState<TestType>(test?.type ?? "mock");
  const [subjectId, setSubjectId] = useState(test?.subject_id ?? "");
  const [topicId, setTopicId] = useState(test?.topic_id ?? "");
  const [duration, setDuration] = useState(String(test?.duration_minutes ?? 60));
  const [marks, setMarks] = useState(String(test?.marks_per_correct ?? 1));
  const [negative, setNegative] = useState(String(test?.negative_marks ?? 0));
  const [year, setYear] = useState(
    test?.past_paper_year ? String(test.past_paper_year) : "",
  );
  const [isFree, setIsFree] = useState(test?.is_free ?? false);
  const [published, setPublished] = useState(test?.published ?? false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const subjectTopics = topics.filter((t) => t.subject_id === subjectId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const payload: TestInput = {
      id: test?.id,
      title,
      type,
      subjectId: subjectId || null,
      topicId: topicId || null,
      durationMinutes: Number(duration),
      marksPerCorrect: Number(marks),
      negativeMarks: Number(negative),
      pastPaperYear: year ? parseInt(year, 10) : null,
      isFree,
      published,
    };
    const res = test ? await updateTest(payload) : await createTest(payload);
    setBusy(false);
    if (!res.ok) setError(res.error);
    else onSaved();
  }

  return (
    <Card className="border-brand/30">
      <CardContent className="py-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Biology Full Mock #1"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as TestType)}
              >
                <option value="mock">Full Mock</option>
                <option value="topic">Topic</option>
                <option value="past_paper">Past Paper</option>
                <option value="practice">Practice</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subject (optional)</Label>
              <Select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setTopicId("");
                }}
              >
                <option value="">— Mixed / full —</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Topic (optional)</Label>
              <Select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                disabled={!subjectId}
              >
                <option value="">— None —</option>
                {subjectTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Marks / correct</Label>
              <Input
                type="number"
                step="0.25"
                min={0}
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Negative marks</Label>
              <Input
                type="number"
                step="0.25"
                min={0}
                value={negative}
                onChange={(e) => setNegative(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Past paper year</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2023"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Free (no subscription needed)
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              Published (visible to students)
            </label>
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : test ? "Save changes" : "Create test"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
