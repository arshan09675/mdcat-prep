import { createClient } from "@/lib/supabase/server";
import { SiteNav } from "@/components/site-nav";

export async function SiteHeader() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;
  }

  const isStaff = role === "admin" || role === "instructor";

  return <SiteNav signedIn={!!user} isStaff={isStaff} />;
}
