import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; message?: string; error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-off px-4 py-12">
      <AuthForm
        mode="login"
        redirectTo={searchParams.redirect}
        message={searchParams.message ?? searchParams.error}
      />
    </main>
  );
}
