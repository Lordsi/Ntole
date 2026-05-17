import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  name?: string;
  src?: string | null;
  size?: number;
  className?: string;
}

function fallbackUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundColor=10C46F`;
}

export function Avatar({ name = "User", src, size = 40, className }: AvatarProps) {
  const url = src || fallbackUrl(name);
  return (
    <span
      className={cn(
        "inline-block overflow-hidden rounded-full bg-surface-2 ring-1 ring-white/10",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        className="h-full w-full object-cover"
      />
    </span>
  );
}
