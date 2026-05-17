"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "signin" | "signup";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const initialErrorFromUrl = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(initialErrorFromUrl);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    startTransition(async () => {
      const supabase = createBrowserSupabaseClient();

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          setError(error.message);
          return;
        }
        // Refresh server components and route by role via the smart `/` entry.
        router.replace(next);
        router.refresh();
        return;
      }

      // Sign up. If the Supabase project requires email confirmation, the user
      // will be sent a verification link that lands back on /auth/callback.
      // If confirmation is disabled, a session is returned immediately and we
      // can redirect right away.
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setError(error.message);
        return;
      }

      if (data.session) {
        router.replace(next);
        router.refresh();
      } else {
        setInfo(
          `We sent a confirmation link to ${email.trim()}. Open it to finish creating your account.`,
        );
      }
    });
  }

  const isSignup = mode === "signup";
  const submitLabel = pending
    ? isSignup
      ? "Creating account…"
      : "Signing in…"
    : isSignup
      ? "Create account"
      : "Sign in";

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      {isSignup && (
        <Input
          type="text"
          required
          placeholder="Full name"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      )}

      <Input
        type="email"
        required
        placeholder="you@example.com"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        type="password"
        required
        minLength={6}
        placeholder="Password"
        autoComplete={isSignup ? "new-password" : "current-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button
        type="submit"
        size="lg"
        fullWidth
        disabled={pending || !email || !password || (isSignup && !fullName)}
      >
        {submitLabel}
      </Button>

      {error && (
        <p className="text-center text-[13px] text-danger" role="alert">
          {error}
        </p>
      )}
      {info && (
        <p className="text-center text-[13px] text-accent">{info}</p>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(isSignup ? "signin" : "signup");
          setError(null);
          setInfo(null);
        }}
        className="mt-1 text-center text-[13px] text-muted transition-colors hover:text-white"
      >
        {isSignup ? (
          <>
            Already have an account?{" "}
            <span className="text-accent">Sign in</span>
          </>
        ) : (
          <>
            New to Ntole?{" "}
            <span className="text-accent">Create an account</span>
          </>
        )}
      </button>

      <DemoCredentials />
    </form>
  );
}

/**
 * Inline hint card listing the three seeded demo accounts so reviewers can
 * jump in without provisioning new users. Rendered in every environment —
 * the accounts only exist after `supabase db reset` runs the seed.
 */
function DemoCredentials() {
  const accounts = [
    { label: "Rider", email: "rider@ntole.test" },
    { label: "Driver", email: "driver@ntole.test" },
    { label: "Admin", email: "admin@ntole.test" },
  ];
  return (
    <details className="mt-4 rounded-2xl glass p-3 text-[12px] text-muted">
      <summary className="cursor-pointer select-none text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-strong">
        Demo accounts
      </summary>
      <ul className="mt-2 flex flex-col gap-1.5">
        {accounts.map((a) => (
          <li key={a.email} className="flex items-center justify-between gap-3">
            <span className="text-white">{a.label}</span>
            <span className="font-mono text-muted-strong">{a.email}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-muted">
        Shared password: <span className="font-mono text-white">Password123!</span>
      </p>
    </details>
  );
}
