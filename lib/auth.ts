import { createClient } from "@/lib/supabase/server";

export interface CurrentProfile {
  id: string;
  email: string | null;
  name: string | null;
  role: "student" | "instructor" | "admin";
}

/** Returns the signed-in user's profile (id, email, name, role) or null. */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .single();
  if (!data) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    name: data.name,
    role: data.role,
  };
}

/**
 * Returns the profile only if the caller is staff (instructor/admin),
 * otherwise null. Use to guard privileged server actions BEFORE doing any
 * service-role write — never trust the client.
 */
export async function requireStaff(): Promise<CurrentProfile | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  if (profile.role !== "admin" && profile.role !== "instructor") return null;
  return profile;
}

/**
 * Returns the profile only if the caller is an admin. Use for admin-only
 * writes (e.g. subscription plans / pricing) that the DB restricts to
 * is_admin() — keeps server actions in step with RLS.
 */
export async function requireAdmin(): Promise<CurrentProfile | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  if (profile.role !== "admin") return null;
  return profile;
}
