import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard — MDCAT Prep" };

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
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="container flex-1 py-12">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, {profile?.name ?? user?.email}
            </h1>
            <p className="mt-1 text-muted-foreground">{user?.email}</p>
          </div>
          <Badge variant="secondary" className="capitalize">
            {profile?.role ?? "student"}
          </Badge>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Subscription</CardTitle>
              <CardDescription>Your access status</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Subscription details will appear here.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent attempts</CardTitle>
              <CardDescription>Your latest mock tests</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Your test attempts will appear here.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance</CardTitle>
              <CardDescription>Scores & weak areas</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Your performance trend will appear here.
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
