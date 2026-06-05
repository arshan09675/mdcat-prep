"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Mcq, Subject, Topic } from "@/lib/types";
import type { AttachedQuestion } from "@/app/admin/tests/[id]/page";
import {
  addQuestionsToTest,
  removeQuestionFromTest,
  reorderTestQuestions,
} from "@/app/admin/tests/actions";

const LETTERS = ["A", "B", "C", "D"];

export function TestBuilder({
  testId,
  subjects,
  topics,
  attached,
  pool,
  subjectFilter,
}: {
  testId: string;
  subjects: Subject[];
  topics: Topic[];
  attached: AttachedQuestion[];
  pool: Mcq[];
  subjectFilter: string | null;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(attached);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [topicId, setTopicId] = useState("");

  const subjectName = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s.name])),
    [subjects],
  );
  const topicsForFilter = subjectFilter
    ? topics.filter((t) => t.subject_id === subjectFilter)
    : topics;

  // The displayed order can drift from the server until "Save order" is pressed.
  const dirty =
    order.map((o) => o.testQuestionId).join(",") !==
    attached.map((o) => o.testQuestionId).join(",");

  function move(index: number, dir: -1 | 1) {
    const next = [...order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  }

  async function saveOrder() {
    setBusy(true);
    const res = await reorderTestQuestions(
      testId,
      order.map((o) => o.testQuestionId),
    );
    setBusy(false);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  async function remove(testQuestionId: string) {
    setBusy(true);
    const res = await removeQuestionFromTest(testQuestionId, testId);
    setBusy(false);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  async function addSelected() {
    if (selected.size === 0) return;
    setBusy(true);
    const res = await addQuestionsToTest(testId, Array.from(selected));
    setBusy(false);
    if (!res.ok) {
      alert(res.error);
      return;
    }
    setSelected(new Set());
    router.refresh();
  }

  const filteredPool = pool.filter((m) => {
    if (topicId && m.topic_id !== topicId) return false;
    if (search && !m.text.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  function setSubjectFilter(id: string) {
    const base = `/admin/tests/${testId}`;
    router.push(id ? `${base}?subject=${id}` : base);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Attached questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            In this test ({order.length})
          </h2>
          {dirty && (
            <Button size="sm" onClick={saveOrder} disabled={busy}>
              Save order
            </Button>
          )}
        </div>

        {order.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-ink-muted">
            No questions yet. Add some from the bank →
          </p>
        ) : (
          <div className="space-y-2">
            {order.map((q, i) => (
              <Card key={q.testQuestionId}>
                <CardContent className="flex items-start gap-3 py-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-bold text-navy">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm text-navy">{q.mcq.text}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                      <Badge variant="outline">{q.mcq.difficulty}</Badge>
                      <span className="text-ink-muted">
                        Correct: {LETTERS[q.mcq.correct_index]}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col">
                    <button
                      onClick={() => move(i, -1)}
                      disabled={i === 0 || busy}
                      className="text-ink-muted hover:text-brand disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      disabled={i === order.length - 1 || busy}
                      className="text-ink-muted hover:text-brand disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => remove(q.testQuestionId)}
                    disabled={busy}
                    className="shrink-0 text-destructive hover:opacity-70"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Question bank picker */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Add from bank
          </h2>
          <Button size="sm" onClick={addSelected} disabled={busy || selected.size === 0}>
            <Plus className="h-4 w-4" /> Add {selected.size || ""}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="w-40">
            <Label className="mb-1 block text-xs text-ink-muted">Subject</Label>
            <Select
              value={subjectFilter ?? ""}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="">All subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-36">
            <Label className="mb-1 block text-xs text-ink-muted">Topic</Label>
            <Select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
              <option value="">All topics</option>
              {topicsForFilter.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[140px] flex-1">
            <Label className="mb-1 block text-xs text-ink-muted">Search</Label>
            <Input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="max-h-[520px] space-y-1.5 overflow-y-auto pr-1">
          {filteredPool.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-ink-muted">
              No available questions. Add more in the MCQ bank.
            </p>
          ) : (
            filteredPool.map((m) => {
              const checked = selected.has(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    const next = new Set(selected);
                    if (next.has(m.id)) next.delete(m.id);
                    else next.add(m.id);
                    setSelected(next);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    checked
                      ? "border-brand bg-brand/5"
                      : "border-border bg-white hover:border-brand/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold",
                      checked
                        ? "border-brand bg-brand text-white"
                        : "border-border",
                    )}
                  >
                    {checked ? "✓" : ""}
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm text-navy">{m.text}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                      <Badge variant="secondary">
                        {subjectName[m.subject_id] ?? "—"}
                      </Badge>
                      <Badge variant="outline">{m.difficulty}</Badge>
                      {m.is_free && <Badge variant="free">Free</Badge>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
