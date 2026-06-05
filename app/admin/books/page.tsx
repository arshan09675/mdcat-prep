import { BookManager } from "@/components/admin/book-manager";
import { getSubjectsWithTopics } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/types";

export const metadata = { title: "Books & Notes — Admin" };

export default async function AdminBooksPage() {
  const { subjects } = await getSubjectsWithTopics();
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("books")
    .select("*")
    .order("position")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">
          Books &amp; Notes
        </h1>
        <p className="mt-1 text-ink-muted">
          Downloadable PDF books and subject-wise notes for subscribers.
        </p>
      </div>

      <BookManager subjects={subjects} books={(data as Book[]) ?? []} />
    </div>
  );
}
