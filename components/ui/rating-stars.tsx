import { cn } from "@/lib/utils/cn";

interface RatingStarsProps {
  value: number;
  outOf?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}

export function RatingStars({
  value,
  outOf = 5,
  size = 14,
  showValue = false,
  className,
}: RatingStarsProps) {
  const stars = Array.from({ length: outOf }, (_, i) => i < Math.round(value));
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="inline-flex items-center gap-0.5">
        {stars.map((filled, i) => (
          <Star key={i} filled={filled} size={size} />
        ))}
      </span>
      {showValue && (
        <span className="text-xs text-muted-strong">{value.toFixed(1)}</span>
      )}
    </span>
  );
}

function Star({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "#F5A524" : "rgba(255,255,255,0.18)"}
      aria-hidden
    >
      <path d="M12 2l2.92 6.06L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l7.08-1.21Z" />
    </svg>
  );
}
