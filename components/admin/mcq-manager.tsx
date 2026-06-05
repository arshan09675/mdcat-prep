"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Upload, FolderTree, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Mcq, Subject, Topic, Difficulty } from "@/lib/types";
import {
  createMcq,
  updateMcq,
  deleteMcq,
  createTopic,
  deleteTopic,
  bulkImportMcqs,
  type McqInput,
  type BulkResult,
} from "@/app/admin/mcqs/actions";

type Tab = "questions" | "bulk" | "topics";
const LETTERS = ["A", "B", "C", "D"];

export function McqManager({
  subjects,
  topics,
  mcqs,
  subjectFilter,
  totalCount,
}: {
  subjects: Subject[];
  topics: Topic[];
  mcqs: Mcq[];
  subjectFilter: string | null;
  totalCount: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("questions");

  const subjectName = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s.name])),
    [subjects],
  );
  const topicName = useMemo(
    () => Object.fromEntries(topics.map((t) => [t.id, t.name])),
    [topics],
  );

  function setSubjectFilter(id: string) {
    router.push(id ? `/admin/mcqs?subject=${id}` : "/admin/mcqs");
  }

  const tabs: { id: Tab; label: string; icon: typeof Plus }[] = [
    { id: "questions", label: "Questions", icon: ListChecks },
    { id: "bulk", label: "Bulk import", icon: Upload },
    { id: "topics", label: "Topics", icon: FolderTree },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
              tab === t.id
                ? "border-brand text-brand"
                : "border-transparent text-ink-muted hover:text-navy",
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "questions" && (
        <QuestionsPanel
          subjects={subjects}
          topics={topics}
          mcqs={mcqs}
          subjectFilter={subjectFilter}
          setSubjectFilter={setSubjectFilter}
          subjectName={subjectName}
          topicName={topicName}
        />
      )}
      {tab === "bulk" && (
        <BulkPanel
          subjects={subjects}
          topics={topics}
          subjectFilter={subjectFilter}
        />
      )}
      {tab === "topics" && (
        <TopicsPanel
          subjects={subjects}
          topics={topics}
          subjectFilter={subjectFilter}
          setSubjectFilter={setSubjectFilter}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Questions list + create/edit form
// ---------------------------------------------------------------------------
function QuestionsPanel({
  subjects,
  topics,
  mcqs,
  subjectFilter,
  setSubjectFilter,
  subjectName,
  topicName,
}: {
  subjects: Subject[];
  topics: Topic[];
  mcqs: Mcq[];
  subjectFilter: string | null;
  setSubjectFilter: (id: string) => void;
  subjectName: Record<string, string>;
  topicName: Record<string, string>;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [topicId, setTopicId] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [editing, setEditing] = useState<Mcq | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = mcqs.filter((m) => {
    if (topicId && m.topic_id !== topicId) return false;
    if (difficulty && m.difficulty !== difficulty) return false;
    if (search && !m.text.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  async function onDelete(id: string) {
    if (!confirm("Delete this MCQ? This also removes it from any tests.")) return;
    setBusyId(id);
    const res = await deleteMcq(id);
    setBusyId(null);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  const topicsForFilter = subjectFilter
    ? topics.filter((t) => t.subject_id === subjectFilter)
    : topics;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <Label className="mb-1.5 block text-xs text-ink-muted">Subject</Label>
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
        <div className="w-44">
          <Label className="mb-1.5 block text-xs text-ink-muted">Topic</Label>
          <Select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
            <option value="">All topics</option>
            {topicsForFilter.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-36">
          <Label className="mb-1.5 block text-xs text-ink-muted">Difficulty</Label>
          <Select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="">All</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
        </div>
        <div className="min-w-[180px] flex-1">
          <Label className="mb-1.5 block text-xs text-ink-muted">Search</Label>
          <Input
            placeholder="Search question text…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
        >
          <Plus className="h-4 w-4" /> New question
        </Button>
      </div>

      {(creating || editing) && (
        <McqForm
          subjects={subjects}
          topics={topics}
          mcq={editing}
          defaultSubject={subjectFilter}
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
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-ink-muted">
            No questions yet. Add one above or use Bulk import.
          </p>
        ) : (
          filtered.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium text-navy">
                    {m.text}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                    <Badge variant="secondary">
                      {subjectName[m.subject_id] ?? "—"}
                    </Badge>
                    {m.topic_id && topicName[m.topic_id] && (
                      <Badge variant="outline">{topicName[m.topic_id]}</Badge>
                    )}
                    <Badge variant="outline">{m.difficulty}</Badge>
                    {m.past_paper_year && (
                      <Badge variant="outline">{m.past_paper_year}</Badge>
                    )}
                    {m.is_free && <Badge variant="free">Free</Badge>}
                    <span className="text-ink-muted">
                      · Correct: {LETTERS[m.correct_index]}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(m);
                      setCreating(false);
                    }}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(m.id)}
                    disabled={busyId === m.id}
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

function McqForm({
  subjects,
  topics,
  mcq,
  defaultSubject,
  onClose,
  onSaved,
}: {
  subjects: Subject[];
  topics: Topic[];
  mcq: Mcq | null;
  defaultSubject: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [subjectId, setSubjectId] = useState(
    mcq?.subject_id ?? defaultSubject ?? subjects[0]?.id ?? "",
  );
  const [topicId, setTopicId] = useState(mcq?.topic_id ?? "");
  const [text, setText] = useState(mcq?.text ?? "");
  const [options, setOptions] = useState<string[]>(
    mcq?.options ?? ["", "", "", ""],
  );
  const [correctIndex, setCorrectIndex] = useState(mcq?.correct_index ?? 0);
  const [explanation, setExplanation] = useState(mcq?.explanation ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(
    mcq?.difficulty ?? "medium",
  );
  const [year, setYear] = useState(
    mcq?.past_paper_year ? String(mcq.past_paper_year) : "",
  );
  const [isFree, setIsFree] = useState(mcq?.is_free ?? false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const subjectTopics = topics.filter((t) => t.subject_id === subjectId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const payload: McqInput = {
      id: mcq?.id,
      subjectId,
      topicId: topicId || null,
      text,
      options,
      correctIndex,
      explanation: explanation || null,
      difficulty,
      pastPaperYear: year ? parseInt(year, 10) : null,
      isFree,
    };
    const res = mcq ? await updateMcq(payload) : await createMcq(payload);
    setBusy(false);
    if (!res.ok) setError(res.error);
    else onSaved();
  }

  return (
    <Card className="border-brand/30">
      <CardContent className="py-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setTopicId("");
                }}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Topic (optional)</Label>
              <Select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
                <option value="">— No topic —</option>
                {subjectTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Question</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the question text…"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Options — select the correct one</Label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectIndex(i)}
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold transition-colors",
                    correctIndex === i
                      ? "border-success bg-success text-success-foreground"
                      : "border-border text-ink-muted hover:border-brand",
                  )}
                  aria-label={`Mark option ${LETTERS[i]} correct`}
                >
                  {LETTERS[i]}
                </button>
                <Input
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                  placeholder={`Option ${LETTERS[i]}`}
                  required
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>Explanation (optional)</Label>
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Shown to students after they answer…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </Select>
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
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Free sample
              </label>
            </div>
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : mcq ? "Save changes" : "Create question"}
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

// ---------------------------------------------------------------------------
//  Bulk import
// ---------------------------------------------------------------------------
function BulkPanel({
  subjects,
  topics,
  subjectFilter,
}: {
  subjects: Subject[];
  topics: Topic[];
  subjectFilter: string | null;
}) {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState(
    subjectFilter ?? subjects[0]?.id ?? "",
  );
  const [topicId, setTopicId] = useState("");
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);

  const subjectTopics = topics.filter((t) => t.subject_id === subjectId);

  async function onImport() {
    setBusy(true);
    setResult(null);
    const res = await bulkImportMcqs(subjectId, topicId || null, raw);
    setBusy(false);
    setResult(res);
    if (res.inserted > 0) {
      setRaw("");
      router.refresh();
    }
  }

  const example =
    'What is the powerhouse of the cell?,Nucleus,Mitochondria,Ribosome,Golgi,B,Mitochondria produce ATP,easy,2022,true';

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Subject (applied to all rows)</Label>
            <Select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setTopicId("");
              }}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Topic (optional, applied to all rows)</Label>
            <Select value={topicId} onChange={(e) => setTopicId(e.target.value)}>
              <option value="">— No topic —</option>
              {subjectTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-off p-3 text-xs text-ink-mid">
          <p className="font-semibold text-navy">
            One question per line, comma-separated:
          </p>
          <p className="mt-1 font-mono">
            question, A, B, C, D, correct, explanation, difficulty, year, free
          </p>
          <p className="mt-2">
            <span className="font-semibold">correct</span> = A–D or 1–4 ·{" "}
            <span className="font-semibold">difficulty</span> = easy/medium/hard
            (default medium) · <span className="font-semibold">year</span> &{" "}
            <span className="font-semibold">free</span> optional (free =
            true/1/yes). Wrap fields containing commas in &quot;double
            quotes&quot;. A header row is auto-skipped.
          </p>
          <p className="mt-2 font-mono text-[11px] text-ink-muted">{example}</p>
        </div>

        <div className="space-y-1.5">
          <Label>Paste rows</Label>
          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={example}
            className="min-h-[180px] font-mono text-xs"
          />
        </div>

        {result && (
          <div
            className={cn(
              "rounded-lg border p-3 text-sm",
              result.inserted > 0
                ? "border-success/30 bg-success/5"
                : "border-destructive/30 bg-destructive/5",
            )}
          >
            <p className="font-semibold">
              {result.inserted > 0
                ? `Imported ${result.inserted} question${result.inserted === 1 ? "" : "s"}.`
                : "Nothing imported."}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-destructive">
                {result.errors.slice(0, 20).map((er, i) => (
                  <li key={i}>
                    {er.line > 0 ? `Line ${er.line}: ` : ""}
                    {er.message}
                  </li>
                ))}
                {result.errors.length > 20 && (
                  <li>…and {result.errors.length - 20} more.</li>
                )}
              </ul>
            )}
          </div>
        )}

        <Button onClick={onImport} disabled={busy || !raw.trim()}>
          {busy ? "Importing…" : "Import questions"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
//  Topics manager
// ---------------------------------------------------------------------------
function TopicsPanel({
  subjects,
  topics,
  subjectFilter,
  setSubjectFilter,
}: {
  subjects: Subject[];
  topics: Topic[];
  subjectFilter: string | null;
  setSubjectFilter: (id: string) => void;
}) {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState(
    subjectFilter ?? subjects[0]?.id ?? "",
  );
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = topics.filter((t) => t.subject_id === subjectId);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await createTopic(subjectId, name);
    setBusy(false);
    if (!res.ok) setError(res.error);
    else {
      setName("");
      router.refresh();
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this topic? MCQs keep their subject but lose the topic."))
      return;
    const res = await deleteTopic(id);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-4 py-5">
        <div className="w-56 space-y-1.5">
          <Label>Subject</Label>
          <Select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>

        <form onSubmit={onAdd} className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label>New topic / chapter</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cell Structure"
            />
          </div>
          <Button type="submit" disabled={busy}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </form>
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}

        <div className="divide-y rounded-lg border border-border">
          {list.length === 0 ? (
            <p className="p-6 text-center text-sm text-ink-muted">
              No topics in this subject yet.
            </p>
          ) : (
            list.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="font-medium text-navy">{t.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(t.id)}
                  aria-label="Delete topic"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
