"use client";

import { MaterialIcon } from "@/components/ui/material-icon";

interface PageHeaderProps {
  title: string;
  /** Optional small descriptive line under the title. */
  subtitle?: string;
  /** Optional Material Symbol shown to the left of the title. */
  icon?: string;
}

/**
 * Per-page heading used inside `MobileShell`. The shell already provides the
 * top app bar + bottom nav, so sub-pages don't need their own back button —
 * users navigate via the "Home" tab. This component is purely the title
 * row that introduces the page.
 */
export function PageHeader({ title, subtitle, icon }: PageHeaderProps) {
  return (
    <div className="mb-lg flex items-center gap-md">
      {icon && (
        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary-container/10 text-primary-container">
          <MaterialIcon name={icon} />
        </div>
      )}
      <div className="flex flex-col">
        <h1 className="font-headline-md text-headline-md text-on-surface">
          {title}
        </h1>
        {subtitle && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
