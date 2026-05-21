"use client";

import { MaterialIcon } from "@/components/ui/material-icon";
import { useTheme } from "@/components/shared/theme-provider";
import { cn } from "@/lib/utils/cn";

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export function ThemeToggle({ className, compact }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2",
        compact
          ? "grid h-9 w-9 place-items-center text-on-surface-variant hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-on-surface"
          : "flex items-center gap-sm px-md py-sm text-on-surface-variant hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:text-on-surface",
        className,
      )}
    >
      <MaterialIcon
        name={isDark ? "light_mode" : "dark_mode"}
        className="text-[20px]"
      />
      {!compact && (
        <span className="font-label-md text-label-md">
          {isDark ? "Light" : "Dark"}
        </span>
      )}
    </button>
  );
}
