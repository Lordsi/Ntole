"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createBrowserSupabaseClient();
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        setError(error.message);
      } else {
        setSent(true);
      }
    });
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-accent/40 bg-accent/10 p-6 text-center">
        <p className="text-sm text-white">Check your inbox</p>
        <p className="mt-2 text-sm text-muted">
          We sent a sign-in link to <span className="text-white">{email}</span>.
        </p>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Input
        type="email"
        required
        placeholder="you@example.com"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" disabled={pending || !email}>
        {pending ? "Sending..." : "Send magic link"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
      <p className="text-center text-xs text-muted">
        New to Ntole? An account is created automatically when you sign in.
      </p>
    </form>
  );
}
