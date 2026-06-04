import Link from "next/link";
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

  return (
    <>
      <div className="topbar">
        MDCAT 2025 prep — practice free MCQs &amp; full-length mock tests
        <Link href="/pricing">See plans →</Link>
      </div>
      <SiteNav signedIn={!!user} isStaff={isStaff} />
    </>
  );
}
