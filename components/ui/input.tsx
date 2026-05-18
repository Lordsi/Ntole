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
          "flex h-14 w-full items-center gap-3 rounded-md bg-surface-container-low px-4 ring-1 ring-white/[0.08] transition-colors focus-within:ring-primary-container/40 focus-within:bg-surface-container",
          className,
        )}
      >
        {leading && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-container-highest text-on-surface-variant">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          {...props}
          className="h-full flex-1 bg-transparent text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
        />
        {trailing && <span className="shrink-0">{trailing}</span>}
      </label>
    );
  },
);
