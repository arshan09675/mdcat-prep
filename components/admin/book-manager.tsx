"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, BookOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { Book, BookType, Subject } from "@/lib/types";
import {
  createBook,
  updateBook,
  deleteBook,
  type BookInput,
} from "@/app/admin/books/actions";

export function BookManager({
  subjects,
  books,
}: {
  subjects: Subject[];
  books: Book[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Book | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const subjectName = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s.name])),
    [subjects],
  );

  async function onDelete(id: string) {
    if (!confirm("Delete this item and its PDF?")) return;
    setBusyId(id);
    const res = await deleteBook(id);
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
          <Plus className="h-4 w-4" /> New item
        </Button>
      </div>

      {(creating || editing) && (
        <BookForm
          subjects={subjects}
          book={editing}
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
        {books.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-ink-muted">
            No books or notes yet. Add one above.
          </p>
        ) : (
          books.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  {b.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.cover_url}
                      alt=""
                      className="h-14 w-11 shrink-0 rounded border border-border object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-11 shrink-0 items-center justify-center rounded border border-border bg-secondary text-ink-muted">
                      {b.type === "book" ? (
                        <BookOpen className="h-5 w-5" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-navy">{b.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                      <Badge variant="secondary">
                        {b.type === "book" ? "Book" : "Notes"}
                      </Badge>
                      {b.subject_id && (
                        <Badge variant="outline">
                          {subjectName[b.subject_id] ?? "—"}
                        </Badge>
                      )}
                      {b.file_size_mb != null && (
                        <Badge variant="outline">
                          {b.file_size_mb.toFixed(1)} MB
                        </Badge>
                      )}
                      {b.is_free && <Badge variant="free">Free</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(b);
                      setCreating(false);
                    }}
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(b.id)}
                    disabled={busyId === b.id}
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

function BookForm({
  subjects,
  book,
  onClose,
  onSaved,
}: {
  subjects: Subject[];
  book: Book | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(book?.title ?? "");
  const [description, setDescription] = useState(book?.description ?? "");
  const [subjectId, setSubjectId] = useState(book?.subject_id ?? "");
  const [type, setType] = useState<BookType>(book?.type ?? "book");
  const [filePath, setFilePath] = useState(book?.file_path ?? "");
  const [fileSizeMb, setFileSizeMb] = useState<number | null>(
    book?.file_size_mb ?? null,
  );
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState(book?.cover_url ?? "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isFree, setIsFree] = useState(book?.is_free ?? false);
  const [position, setPosition] = useState(String(book?.position ?? 0));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!filePath && !pdfFile) {
      setError("Please upload a PDF file.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      let finalFilePath = filePath;
      let finalSize = fileSizeMb;
      let finalCover = coverUrl || null;

      if (pdfFile) {
        setStage("Uploading PDF…");
        const ext = pdfFile.name.split(".").pop()?.toLowerCase() || "pdf";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("books")
          .upload(path, pdfFile, { contentType: pdfFile.type, upsert: false });
        if (upErr) throw new Error(`PDF upload failed: ${upErr.message}`);
        finalFilePath = path;
        finalSize = Number((pdfFile.size / (1024 * 1024)).toFixed(2));
      }

      if (coverFile) {
        setStage("Uploading cover…");
        const ext = coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `book-covers/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("course-covers")
          .upload(path, coverFile, {
            contentType: coverFile.type,
            upsert: false,
          });
        if (upErr) throw new Error(`Cover upload failed: ${upErr.message}`);
        const { data } = supabase.storage
          .from("course-covers")
          .getPublicUrl(path);
        finalCover = data.publicUrl;
      }

      setStage("Saving…");
      const payload: BookInput = {
        id: book?.id,
        title,
        description: description || null,
        subjectId: subjectId || null,
        type,
        filePath: finalFilePath,
        coverUrl: finalCover,
        fileSizeMb: finalSize,
        isFree,
        position: Number(position) || 0,
      };
      const res = book ? await updateBook(payload) : await createBook(payload);
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
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Biology Complete Notes"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's inside…"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as BookType)}
              >
                <option value="book">Book</option>
                <option value="notes">Notes</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subject (optional)</Label>
              <Select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="">— None —</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>PDF file</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              />
              {filePath && !pdfFile && (
                <p className="text-xs text-success">
                  PDF uploaded ✓ — choose a file to replace.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Cover image (optional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              />
              {coverUrl && !coverFile && (
                <p className="text-xs text-success">Cover set ✓ — replace?</p>
              )}
            </div>
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
              {busy ? stage || "Saving…" : book ? "Save changes" : "Create item"}
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
