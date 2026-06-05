"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateUserRole } from "@/app/admin/students/actions";

type Role = "student" | "instructor" | "admin";

export interface StudentRow {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  createdAt: string;
  subStatus: string | null;
  subEndsAt: string | null;
  planName: string | null;
  attempts: number;
}

export function StudentsTable({
  rows,
  canEditRoles,
  currentUserId,
}: {
  rows: StudentRow[];
  canEditRoles: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.name ?? "").toLowerCase().includes(q) ||
      (r.email ?? "").toLowerCase().includes(q)
    );
  });

  async function changeRole(id: string, role: Role) {
    setBusyId(id);
    const res = await updateUserRole(id, role);
    setBusyId(null);
    if (!res.ok) alert(res.error);
    else router.refresh();
  }

  function subBadge(r: StudentRow) {
    if (r.subStatus === "active") {
      return (
        <Badge variant="success">
          Active
          {r.subEndsAt
            ? ` · ${new Date(r.subEndsAt).toLocaleDateString()}`
            : ""}
        </Badge>
      );
    }
    if (r.subStatus === "expired")
      return <Badge variant="destructive">Expired</Badge>;
    if (r.subStatus) return <Badge variant="outline">{r.subStatus}</Badge>;
    return <span className="text-ink-muted">—</span>;
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border bg-off text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3 font-semibold">Student</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Subscription</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 text-right font-semibold">Attempts</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-off/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-navy">
                      {r.name ?? "Unnamed"}
                    </p>
                    <p className="text-xs text-ink-muted">{r.email ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    {canEditRoles ? (
                      <Select
                        value={r.role}
                        disabled={busyId === r.id || r.id === currentUserId}
                        onChange={(e) =>
                          changeRole(r.id, e.target.value as Role)
                        }
                        className="h-9 w-32"
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="capitalize">
                        {r.role}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">{subBadge(r)}</td>
                  <td className="px-4 py-3 text-ink-mid">
                    {r.planName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-navy">
                    {r.attempts}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
