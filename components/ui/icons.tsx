import * as React from "react";

type SvgProps = React.SVGProps<SVGSVGElement>;

export function MapPinIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5Z" />
    </svg>
  );
}

export function SwapIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M7 7h11M7 7l3-3M7 7l3 3M17 17H6M17 17l-3 3M17 17l-3-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BellIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z" />
    </svg>
  );
}

export function MenuIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <circle cx="6" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
    </svg>
  );
}

export function SteeringWheelIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <path
        d="M5 11h5M14 11h5M12 14v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PackageIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M3 7l9-4 9 4v10l-9 4-9-4V7Zm0 0l9 4m0 0l9-4m-9 4v9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChatIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

export function ArrowLeftIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowRightIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SeatIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M7 4v8a2 2 0 0 0 2 2h8M7 14l-2 6h12l-2-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CompassIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M15 9l-2 5-5 2 2-5 5-2Z" fill="currentColor" />
    </svg>
  );
}

export function ChevronsRightIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M6 6l6 6-6 6M12 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2.5l2.95 6.42 7.05.7-5.3 4.86 1.55 6.92L12 17.77l-6.25 3.63 1.55-6.92L2 9.62l7.05-.7L12 2.5Z" />
    </svg>
  );
}

/**
 * Clean top-down vector of a sedan. Used as the visual centerpiece of the
 * driver-arrived panel — single color, fills `currentColor` so it inherits
 * accent/white as needed.
 */
export function CarTopDownIcon(props: SvgProps) {
  return (
    <svg viewBox="0 0 96 160" fill="none" aria-hidden {...props}>
      {/* body */}
      <path
        d="M24 24c0-8 4-12 12-14 4-1 8-1.5 12-1.5s8 .5 12 1.5c8 2 12 6 12 14v100c0 12-6 22-14 25-4 1.5-7 2-10 2s-6-.5-10-2c-8-3-14-13-14-25V24Z"
        fill="currentColor"
      />
      {/* windshield */}
      <path
        d="M30 38c2-6 7-9 18-9s16 3 18 9l-2 22c-1 4-4 6-16 6s-15-2-16-6l-2-22Z"
        fill="#0B0C10"
        opacity="0.85"
      />
      {/* rear window */}
      <path
        d="M32 108c1-5 5-7 16-7s15 2 16 7l1 14c0 3-2 5-17 5s-17-2-17-5l1-14Z"
        fill="#0B0C10"
        opacity="0.7"
      />
      {/* roof line */}
      <rect
        x="30"
        y="72"
        width="36"
        height="28"
        rx="4"
        fill="#0B0C10"
        opacity="0.35"
      />
      {/* side mirrors */}
      <rect x="20" y="40" width="6" height="4" rx="1.5" fill="currentColor" />
      <rect x="70" y="40" width="6" height="4" rx="1.5" fill="currentColor" />
      {/* headlights */}
      <rect
        x="32"
        y="14"
        width="10"
        height="3"
        rx="1.5"
        fill="#28C76F"
        opacity="0.9"
      />
      <rect
        x="54"
        y="14"
        width="10"
        height="3"
        rx="1.5"
        fill="#28C76F"
        opacity="0.9"
      />
    </svg>
  );
}
