import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function Card({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl bg-surface p-4 shadow-card ring-1 ring-white/5",
        className,
      )}
      {...props}
    />
  );
});
