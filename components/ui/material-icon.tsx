import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface MaterialIconProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Material Symbol glyph name (e.g. "menu", "directions_car"). */
  name: string;
  /** Filled (`'FILL' 1`) renders the solid variant — used for active states. */
  filled?: boolean;
  /** Visual font weight 100–700. Stitch uses 400 by default. */
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
}

/**
 * Single source of truth for icon usage. Wraps the Material Symbols Outlined
 * font that ships from Google Fonts. Keeps JSX visually close to the Stitch
 * HTML (`<span class="material-symbols-outlined">menu</span>`) while letting
 * us strongly type the inputs.
 */
export function MaterialIcon({
  name,
  filled,
  weight = 400,
  className,
  style,
  ...rest
}: MaterialIconProps) {
  return (
    <span
      aria-hidden
      {...rest}
      className={cn("material-symbols-outlined select-none", className)}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`,
        ...style,
      }}
    >
      {name}
    </span>
  );
}
