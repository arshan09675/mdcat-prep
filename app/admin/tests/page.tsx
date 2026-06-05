import { TestManager } from "@/components/admin/test-manager";
import { getSubjectsWithTopics } from "@/lib/admin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Test } from "@/lib/types";

export const metadata = { title: "Tests — Admin" };

export default async function AdminTestsPage() {
  const { subjects, topics } = await getSubjectsWithTopics();
  const admin = createServiceRoleClient();
  const { data } = await admin
    .from("tests")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">Mock Tests</h1>
        <p className="mt-1 text-ink-muted">
          Create timed tests and attach questions from the MCQ bank.
        </p>
      </div>

      <TestManager
        subjects={subjects}
        topics={topics}
        tests={(data as Test[]) ?? []}
      />
    </div>
  );
}
