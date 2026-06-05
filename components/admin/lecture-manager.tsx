"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Video, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { Lecture, Subject, Topic } from "@/lib/types";
import {
  createLecture,
  updateLecture,
  deleteLecture,
  type LectureInput,
} from "@/app/admin/lectures/actions";

export function LectureManager({
  subjects,
  topics,
  lectures,
}: {
  subjects: Subject[];
  topics: Topic[];
  lectures: Lecture[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Lecture | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const subjectName = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s.name])),
    [subjects],
  );
  const topicName = useMemo(
    () => Object.fromEntries(topics.map((t) => [t.id, t.name])),
    [topics],
  );

  async function onDelete(id: string) {
    if (!confirm("Delete this lecture and its uploaded files?")) return;
    setBusyId(id);
    const res = await deleteLecture(id);
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
          <Plus className="h-4 w-4" /> New lecture
        </Button>
      </div>

      {(creating || editing) && (
        <LectureForm
          subjects={subjects}
          topics={topics}
          lecture={editing}
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
        {lectures.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-ink-muted">
            No lectures yet. Add one above.
          </p>
        ) : (
          lectures.map((l) => (
            <Card key={l.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-navy">{l.title}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                    <Badge variant="secondary">
                      {subjectName[l.subject_id] ?? "—"}
                    </Badge>
                    {l.topic_id && topicName[l.topic_id] && (
                      <Badge variant="outline">{topicName[l.topic_id]}</Badge>
                    )}
                    {(l.video_url || l.video_path) && (
                      <Badge variant="outline">
                        <Video className="mr-1 h-3 w-3" />
                        {l.video_url ? "Embed" : "Upload"}
                      </Badge>
                    )}
                    {(l.notes_body || l.notes_path) && (
                      <Badge variant="outline">
                        <FileText className="mr-1 h-3 w-3" /> Notes
                      </Badge>
                    )}
                    {l.is_free && <Badge variant="free">Free</Badge>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(l);
                      setCreating(false);
                    }}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(l.id)}
                    disabled={busyId === l.id}
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

function LectureForm({
  subjects,
  topics,
  lecture,
  onClose,
  onSaved,
}: {
  subjects: Subject[];
  topics: Topic[];
  lecture: Lecture | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [subjectId, setSubjectId] = useState(
    lecture?.subject_id ?? subjects[0]?.id ?? "",
  );
  const [topicId, setTopicId] = useState(lecture?.topic_id ?? "");
  const [title, setTitle] = useState(lecture?.title ?? "");
  const [videoUrl, setVideoUrl] = useState(lecture?.video_url ?? "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPath, setVideoPath] = useState(lecture?.video_path ?? "");
  const [notesBody, setNotesBody] = useState(lecture?.notes_body ?? "");
  const [notesFile, setNotesFile] = useState<File | null>(null);
  const [notesPath, setNotesPath] = useState(lecture?.notes_path ?? "");
  const [isFree, setIsFree] = useState(lecture?.is_free ?? false);
  const [position, setPosition] = useState(String(lecture?.position ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");

  const subjectTopics = topics.filter((t) => t.subject_id === subjectId);

  async function upload(bucket: string, file: File): Promise<string> {
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) throw new Error(`${bucket} upload failed: ${upErr.message}`);
    return path;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      let finalVideoPath = videoPath || null;
      let finalNotesPath = notesPath || null;

      if (videoFile) {
        setStage("Uploading video…");
        finalVideoPath = await upload("lecture-videos", videoFile);
      }
      if (notesFile) {
        setStage("Uploading notes PDF…");
        finalNotesPath = await upload("notes", notesFile);
      }
      setStage("Saving…");

      const payload: LectureInput = {
        id: lecture?.id,
        subjectId,
        topicId: topicId || null,
        title,
        videoUrl: videoUrl || null,
        videoPath: finalVideoPath,
        notesBody: notesBody || null,
        notesPath: finalNotesPath,
        isFree,
        position: Number(position) || 0,
      };
      const res = lecture
        ? await updateLecture(payload)
        : await createLecture(payload);
      if (!res.ok) {
        setError(res.error);
        setBusy(false);
        setStage("");
        return;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setBusy(false);
      setStage("");
    }
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
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cell Structure — Part 1"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Video embed URL (YouTube / Vimeo)</Label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/embed/…"
            />
            <p className="text-xs text-ink-muted">
              Or upload a video file below. An embed URL is preferred for large
              videos.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Upload video (optional)</Label>
              <Input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              />
              {videoPath && !videoFile && (
                <p className="text-xs text-success">
                  Video uploaded ✓ — choose a file to replace.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Notes PDF (optional)</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setNotesFile(e.target.files?.[0] ?? null)}
              />
              {notesPath && !notesFile && (
                <p className="text-xs text-success">
                  PDF uploaded ✓ — choose a file to replace.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Written notes (Markdown supported, optional)</Label>
            <Textarea
              value={notesBody}
              onChange={(e) => setNotesBody(e.target.value)}
              placeholder="Key points, summary, formulae…"
              className="min-h-[120px]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Order position</Label>
              <Input
                type="number"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
            <div className="flex items-end pb-2.5 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Free (no subscription needed)
              </label>
            </div>
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={busy}>
              {busy
                ? stage || "Saving…"
                : lecture
                  ? "Save changes"
                  : "Create lecture"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
