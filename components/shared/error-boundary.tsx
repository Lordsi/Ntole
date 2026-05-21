"use client";

import { Component, type ReactNode } from "react";

import { MaterialIcon } from "@/components/ui/material-icon";

interface ErrorBoundaryProps {
  /** Rendered when no error has been caught. */
  children: ReactNode;
  /** Custom fallback. Receives the caught error + a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Optional label included in the default fallback for context. */
  label?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Tiny client-side error boundary. Catches render-time and
 * effect-throw exceptions inside its subtree so a single bad component
 * doesn't blank the whole page (which is what Next.js's default error
 * overlay does in production).
 *
 * We log to the console so users can still report the underlying error,
 * but the surface stays usable.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", this.props.label ?? "", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return <DefaultFallback error={error} reset={this.reset} />;
  }
}

function DefaultFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="glass-panel rounded-lg p-lg flex flex-col gap-md text-on-surface">
      <div className="flex items-center gap-sm">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-error/15 text-error">
          <MaterialIcon name="error" />
        </span>
        <div className="flex flex-col">
          <p className="font-headline-md text-headline-md">Something broke</p>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            We caught the error so the rest of the app keeps working.
          </p>
        </div>
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant break-words">
        {error.message || "Unknown error"}
      </p>
      <button
        type="button"
        onClick={reset}
        className="h-12 self-start rounded-full px-lg bg-primary-container text-on-primary-container font-label-md text-label-md font-bold uppercase tracking-[0.08em]"
      >
        Try again
      </button>
    </div>
  );
}
