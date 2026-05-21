"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils/cn";

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
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
        router.replace(next);
        router.refresh();
        return;
      }

      const trimmedEmail = email.trim();
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      });
      if (error) {
        setError(error.message);
        return;
      }

      if (data.session) {
        router.replace(next);
        router.refresh();
        return;
      }

      // No confirmation email — sign in immediately after account creation.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signInError) {
        setError(
          signInError.message.includes("Email not confirmed")
            ? "Account created. Disable “Confirm email” in Supabase Auth settings, or sign in with the password you just set."
            : signInError.message,
        );
        return;
      }

      router.replace(next);
      router.refresh();
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

  const disabled = pending || !email || !password || (isSignup && !fullName);

  return (
    <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
      {isSignup && (
        <Field
          icon="badge"
          label="Full Name"
          type="text"
          required
          placeholder="Your name"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      )}

      <Field
        icon="mail"
        label="Email"
        type="email"
        required
        placeholder="you@example.com"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Field
        icon="lock"
        label="Password"
        type="password"
        required
        minLength={6}
        placeholder="••••••••"
        autoComplete={isSignup ? "new-password" : "current-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        type="submit"
        disabled={disabled}
        className={cn(
          "mt-sm w-full py-md rounded-full font-headline-md text-headline-md font-extrabold tracking-tight transition-all duration-150 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2 disabled:cursor-not-allowed",
          !disabled
            ? "bg-primary-container text-on-primary-container shadow-elevated neon-glow-primary"
            : "bg-surface-container-highest text-on-surface-variant",
        )}
      >
        {submitLabel}
      </button>

      {error && (
        <p
          className="text-center font-body-sm text-body-sm text-error"
          role="alert"
        >
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          setMode(isSignup ? "signin" : "signup");
          setError(null);
        }}
        className="mt-xs text-center font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2 rounded-full py-xs"
      >
        {isSignup ? (
          <>
            Already have an account?{" "}
            <span className="text-primary-container">Sign in</span>
          </>
        ) : (
          <>
            New to Ntole?{" "}
            <span className="text-primary-container">Create an account</span>
          </>
        )}
      </button>

      <DemoCredentials onPick={setEmail} />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Glass field with leading Material Symbol + tracked uppercase label */
/* ------------------------------------------------------------------ */

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: string;
  label: string;
}

function Field({ icon, label, className, ...input }: FieldProps) {
  return (
    <label
      className={cn(
        "glass-panel rounded-md p-md flex items-center gap-md transition-colors focus-within:border-primary-container/40",
        className,
      )}
    >
      <MaterialIcon
        name={icon}
        className="text-on-surface-variant text-[20px]"
      />
      <div className="flex flex-1 flex-col">
        <span className="caps-label">{label}</span>
        <input
          {...input}
          className="w-full bg-transparent text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
        />
      </div>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Demo credentials disclosure                                        */
/* ------------------------------------------------------------------ */

function DemoCredentials({ onPick }: { onPick: (email: string) => void }) {
  const accounts = [
    { label: "Rider", email: "rider@ntole.test" },
    { label: "Driver", email: "driver@ntole.test" },
    { label: "Admin", email: "admin@ntole.test" },
  ];
  return (
    <details className="mt-md rounded-md glass-panel p-md">
      <summary className="cursor-pointer select-none font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant hover:text-on-surface">
        Demo accounts
      </summary>
      <ul className="mt-sm flex flex-col gap-xs">
        {accounts.map((a) => (
          <li key={a.email}>
            <button
              type="button"
              onClick={() => onPick(a.email)}
              className="w-full flex items-center justify-between gap-md rounded-sm px-xs py-xs text-left hover:bg-white/5 transition-colors"
            >
              <span className="font-body-sm text-body-sm text-on-surface">
                {a.label}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {a.email}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-sm font-body-sm text-body-sm text-on-surface-variant">
        Shared password:{" "}
        <span className="text-on-surface">Password123!</span>
      </p>
    </details>
  );
}
