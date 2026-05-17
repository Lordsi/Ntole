import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in to Ntole" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-background">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
              <path d="M5 14 12 5l7 9h-3l-4-5-4 5H5Zm0 1.5h14v2H5v-2Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold">Welcome to Ntole</h1>
          <p className="text-center text-sm text-muted">
            Hail a ride or send a package across Malawi. Sign in with your email
            and we&apos;ll send you a magic link.
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
