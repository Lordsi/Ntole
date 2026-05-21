import { MaterialIcon } from "@/components/ui/material-icon";

interface AdminTableSkeletonProps {
  title: string;
  subtitle?: string;
  icon?: string;
  /** Number of skeleton rows to draw. */
  rows?: number;
  /** Number of skeleton columns to draw. */
  cols?: number;
}

/**
 * Lightweight skeleton matching the look of the admin list pages
 * (Users/Drivers/Rides). Render this from per-segment `loading.tsx` files so
 * the in-page chrome and a table outline appear instantly while the server
 * fetches the live rows.
 */
export function AdminTableSkeleton({
  title,
  subtitle,
  icon,
  rows = 8,
  cols = 5,
}: AdminTableSkeletonProps) {
  return (
    <div className="animate-fade-in" aria-busy="true" aria-live="polite">
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

      <div className="glass-panel rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full font-body-md text-body-md">
            <thead>
              <tr className="bg-surface-container-highest/60">
                {Array.from({ length: cols }).map((_, i) => (
                  <th key={i} className="px-md py-sm text-left">
                    <div className="h-3 w-16 rounded-sm bg-surface-container-high/60" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }).map((_, r) => (
                <tr
                  key={r}
                  className="border-t border-white/[0.06] animate-pulse-soft"
                >
                  {Array.from({ length: cols }).map((_, c) => (
                    <td key={c} className="px-md py-md">
                      <div
                        className="h-3 rounded-sm bg-surface-container-high/40"
                        style={{ width: `${50 + ((r + c) % 4) * 10}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
