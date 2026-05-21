import { MaterialIcon } from "@/components/ui/material-icon";

interface Stat {
  icon: string;
  label: string;
  value: string;
  hint?: string;
}

interface ProfileStatsProps {
  stats: Stat[];
}

/**
 * Compact 2/3/4-column stat grid rendered on the profile page. Generic by
 * design so each role's profile can supply its own meaningful numbers
 * (riders: trips + miles + rating; drivers: trips + earnings + rating; admin:
 * platform totals).
 */
export function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <div
      className="grid gap-sm"
      style={{
        gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))`,
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="glass-panel rounded-md p-md flex flex-col gap-xs"
        >
          <div className="flex items-center gap-xs">
            <MaterialIcon
              name={s.icon}
              className="text-primary-container text-[20px]"
            />
            <span className="font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
              {s.label}
            </span>
          </div>
          <span className="font-headline-md text-headline-md text-on-surface">
            {s.value}
          </span>
          {s.hint && (
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {s.hint}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
