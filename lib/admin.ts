import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Subject, Topic } from "@/lib/types";

/**
 * Subjects + topics for admin form dropdowns. Uses the service-role client so
 * counts/curriculum are complete regardless of the caller's subscription. All
 * callers are already behind the staff-only admin layout + requireStaff.
 */
export async function getSubjectsWithTopics(): Promise<{
  subjects: Subject[];
  topics: Topic[];
}> {
  const admin = createServiceRoleClient();
  const [{ data: subjects }, { data: topics }] = await Promise.all([
    admin.from("subjects").select("*").order("position"),
    admin.from("topics").select("*").order("position"),
  ]);
  return {
    subjects: (subjects as Subject[]) ?? [],
    topics: (topics as Topic[]) ?? [],
  };
}
