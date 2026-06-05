import { LectureManager } from "@/components/admin/lecture-manager";
import { getSubjectsWithTopics } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Lecture } from "@/lib/types";

export const metadata = { title: "Lectures — Admin" };

export default async function AdminLecturesPage() {
  const { subjects, topics } = await getSubjectsWithTopics();
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("lectures")
    .select("*")
    .order("subject_id")
    .order("position");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">
          Lectures &amp; Notes
        </h1>
        <p className="mt-1 text-ink-muted">
          Video lessons (embed or upload) with written notes and PDF downloads.
        </p>
      </div>

      <LectureManager
        subjects={subjects}
        topics={topics}
        lectures={(data as Lecture[]) ?? []}
      />
    </div>
  );
}
