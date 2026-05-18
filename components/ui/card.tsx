import * as React from "react";
import { cn } from "@/lib/utils/cn";

type CardVariant = "solid" | "glass" | "glass-strong";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const VARIANTS: Record<CardVariant, string> = {
  solid: "bg-surface-container-low border border-white/[0.05]",
  glass: "glass-panel shadow-card",
  "glass-strong": "glass-panel-strong shadow-sheet",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant = "glass", ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("rounded-3xl p-4", VARIANTS[variant], className)}
      {...props}
    />
  );
});
