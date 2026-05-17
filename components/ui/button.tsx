import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "pill";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-black hover:bg-accent-hover active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100",
  secondary:
    "bg-surface text-white hover:bg-surface-2 active:scale-[0.98] disabled:opacity-40",
  ghost: "bg-transparent text-white hover:bg-white/5 disabled:opacity-40",
  danger:
    "bg-danger text-white hover:opacity-90 active:scale-[0.98] disabled:opacity-40",
  pill: "bg-accent text-black hover:bg-accent-hover rounded-full px-5 active:scale-[0.98]",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-[15px]",
  lg: "h-[52px] px-6 text-[17px]",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", fullWidth, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-[-0.01em] transition-[background-color,transform,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed",
          VARIANTS[variant],
          SIZES[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      />
    );
  },
);
