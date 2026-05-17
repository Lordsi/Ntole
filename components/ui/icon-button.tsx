import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const IconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: number }
>(function IconButton({ className, size = 44, ...props }, ref) {
  return (
    <button
      ref={ref}
      style={{ width: size, height: size }}
      className={cn(
        "grid place-items-center rounded-full bg-surface text-white ring-1 ring-white/5 transition-colors hover:bg-surface-2 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
