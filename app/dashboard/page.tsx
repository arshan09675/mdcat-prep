import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user!.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container flex-1 py-12">
        <h1 className="text-2xl font-semibold">
          Welcome, {profile?.name ?? user?.email}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Signed in as <span className="font-medium">{user?.email}</span> ·
          role: <span className="font-medium">{profile?.role ?? "student"}</span>
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          Your enrolled courses, progress, grades, and certificates will appear
          here in later build steps.
        </p>
      </main>
    </div>
  );
}
