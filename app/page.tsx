import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container flex flex-1 flex-col items-center justify-center gap-6 py-24 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Learn anything, at your own pace.
        </h1>
        <p className="max-w-xl text-muted-foreground">
          A production-style LMS with real courses, payments, quizzes,
          assignments, and certificates. The course catalog lands in step 2.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/register">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
