import { StudentsTable, type StudentRow } from "@/components/admin/students-table";
import { getCurrentProfile } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const metadata = { title: "Students — Admin" };

type Role = "student" | "instructor" | "admin";

export default async function AdminStudentsPage() {
  const profile = await getCurrentProfile();
  const admin = createServiceRoleClient();

  const [{ data: profiles }, { data: subs }, { data: attempts }, usersRes] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, name, role, created_at")
        .order("created_at", { ascending: false }),
      admin
        .from("subscriptions")
        .select("user_id, status, ends_at, plan:plans(name)")
        .order("ends_at", { ascending: false }),
      admin.from("test_attempts").select("user_id"),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

  // email lookup
  const emailById = new Map<string, string>();
  for (const u of usersRes.data?.users ?? []) {
    if (u.email) emailById.set(u.id, u.email);
  }

  // best subscription per user (active+unexpired wins, else most recent)
  const now = Date.now();
  const subByUser = new Map<
    string,
    { status: string; ends_at: string | null; planName: string | null }
  >();
  for (const s of subs ?? []) {
    const planRel = s.plan as unknown as
      | { name: string }
      | { name: string }[]
      | null;
    const planName = Array.isArray(planRel)
      ? (planRel[0]?.name ?? null)
      : (planRel?.name ?? null);
    const isActive =
      s.status === "active" && (!s.ends_at || new Date(s.ends_at).getTime() > now);
    const existing = subByUser.get(s.user_id);
    if (!existing || (isActive && existing.status !== "active")) {
      subByUser.set(s.user_id, {
        status: isActive ? "active" : s.status,
        ends_at: s.ends_at,
        planName,
      });
    }
  }

  // attempt counts
  const attemptCount = new Map<string, number>();
  for (const a of attempts ?? []) {
    attemptCount.set(a.user_id, (attemptCount.get(a.user_id) ?? 0) + 1);
  }

  const rows: StudentRow[] = (profiles ?? []).map((p) => {
    const sub = subByUser.get(p.id);
    return {
      id: p.id,
      name: p.name,
      email: emailById.get(p.id) ?? null,
      role: p.role as Role,
      createdAt: p.created_at,
      subStatus: sub?.status ?? null,
      subEndsAt: sub?.ends_at ?? null,
      planName: sub?.planName ?? null,
      attempts: attemptCount.get(p.id) ?? 0,
    };
  });

  const activeSubs = rows.filter((r) => r.subStatus === "active").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-navy">Students</h1>
        <p className="mt-1 text-ink-muted">
          {rows.length} users · {activeSubs} with active access
        </p>
      </div>

      <StudentsTable
        rows={rows}
        canEditRoles={profile?.role === "admin"}
        currentUserId={profile?.id ?? ""}
      />
    </div>
  );
}
