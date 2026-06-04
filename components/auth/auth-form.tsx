"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, register, type AuthState } from "@/app/(auth)/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Please wait…" : label}
    </Button>
  );
}

export function AuthForm({
  mode,
  redirectTo,
  message,
}: {
  mode: "login" | "register";
  redirectTo?: string;
  message?: string;
}) {
  const action = mode === "login" ? login : register;
  const [state, formAction] = useFormState<AuthState, FormData>(action, null);

  return (
    <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-7 shadow-card">
      <div className="space-y-2 text-center">
        <Link
          href="/"
          className="inline-block rounded-md font-display text-xl font-extrabold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          MDCAT<span className="text-primary"> Prep</span>
        </Link>
        <h1 className="pt-1 text-2xl font-semibold tracking-tight">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "login"
            ? "Sign in to continue learning."
            : "Start learning in under a minute."}
        </p>
      </div>

      {message && (
        <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">
          {message}
        </p>
      )}

      <form action={formAction} className="space-y-4">
        {mode === "register" && (
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" type="text" placeholder="Jane Doe" />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="••••••••"
            required
          />
        </div>

        {redirectTo && (
          <input type="hidden" name="redirect" value={redirectTo} />
        )}

        {state?.error && (
          <p className="text-sm font-medium text-destructive">{state.error}</p>
        )}

        <SubmitButton label={mode === "login" ? "Sign in" : "Create account"} />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link href="/register" className="font-medium text-foreground underline">
              Register
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
