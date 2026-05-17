import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, leading, trailing, ...props }, ref) {
    return (
      <label
        className={cn(
          "flex h-14 w-full items-center gap-3 rounded-2xl bg-surface px-4 ring-1 ring-white/5 focus-within:ring-accent",
          className,
        )}
      >
        {leading && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-muted-strong">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          {...props}
          className="h-full flex-1 bg-transparent text-base text-white placeholder:text-muted focus:outline-none"
        />
        {trailing && <span className="shrink-0">{trailing}</span>}
      </label>
    );
  },
);
