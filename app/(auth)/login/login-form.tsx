"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils/cn";

type Mode = "signin" | "signup";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const initialErrorFromUrl = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(initialErrorFromUrl);
  const [confirmEmailSentTo, setConfirmEmailSentTo] = useState<string | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  // After a successful sign-in we want the new session cookie to flow
  // through every server component on the destination page, with no
  // double-fetch. Doing a full-page navigation (instead of router.replace
  // + router.refresh) is both simpler and noticeably snappier — the
  // browser shows the navigation immediately and the server renders the
  // next page with the cookie already in place.
  function navigateToDestination() {
    if (typeof window === "undefined") return;
    window.location.assign(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setConfirmEmailSentTo(null);
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
        navigateToDestination();
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

      // If Supabase returned a session, we're done — email confirmation is
      // disabled in this project. Navigate straight to the destination.
      if (data.session) {
        navigateToDestination();
        return;
      }

      // Otherwise a confirmation email is on its way. Tell the user to
      // check their inbox — we don't try to brute-force sign-in here
      // because it would silently fail with "Email not confirmed".
      setConfirmEmailSentTo(trimmedEmail);
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

      {confirmEmailSentTo && (
        <div
          className="glass-panel rounded-md p-md flex items-start gap-md"
          role="status"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-container/15 text-primary-container">
            <MaterialIcon name="mark_email_unread" filled />
          </span>
          <div className="flex flex-1 flex-col gap-xs">
            <p className="font-body-md text-body-md font-semibold text-on-surface">
              Check your inbox
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              We sent a confirmation link to{" "}
              <span className="text-on-surface">{confirmEmailSentTo}</span>.
              Open it to finish creating your account, then come back and sign
              in.
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setMode(isSignup ? "signin" : "signup");
          setError(null);
          setConfirmEmailSentTo(null);
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

