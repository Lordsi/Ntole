/**
 * Lightweight className combiner. Filters falsy values and joins with spaces.
 * Avoids pulling in clsx + tailwind-merge for an MVP.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
