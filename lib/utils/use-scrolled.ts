"use client";

import { useEffect, useState } from "react";

/**
 * Returns true once the window has scrolled past `threshold` pixels.
 * Used to collapse fixed chrome (bottom nav, primary CTA) into smaller
 * affordances once the user is reading further down a page.
 *
 * Passive scroll listener, single global subscription per consumer.
 */
export function useScrolled(threshold = 80): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onScroll() {
      const y = window.scrollY ?? window.pageYOffset ?? 0;
      setScrolled(y > threshold);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
