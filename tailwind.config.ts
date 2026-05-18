import type { Config } from "tailwindcss";

/**
 * Token system mirrors the Stitch "Ntole — Night City" design language:
 * Material 3 dark-mode color roles (surface tiers + on-* foreground roles),
 * Geist + JetBrains Mono typography, neon-green primary container as the
 * single source of interactive emphasis. Legacy aliases (accent, background,
 * surface, surface-2, surface-3, muted, muted-strong, danger) are kept so
 * pages we haven't migrated yet keep rendering.
 */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ---- Stitch Material-3 roles ----
        background: "#121414",
        surface: "#121414",
        "surface-dim": "#121414",
        "surface-bright": "#38393a",
        "surface-container-lowest": "#0c0f0f",
        "surface-container-low": "#1a1c1c",
        "surface-container": "#1e2020",
        "surface-container-high": "#282a2b",
        "surface-container-highest": "#333535",
        "surface-variant": "#333535",

        "on-surface": "#e2e2e2",
        "on-surface-variant": "#baccb0",
        "on-background": "#e2e2e2",
        "inverse-surface": "#e2e2e2",
        "inverse-on-surface": "#2f3131",

        outline: "#85967c",
        "outline-variant": "#3c4b35",
        "surface-tint": "#2ae500",

        primary: "#efffe3",
        "on-primary": "#053900",
        "primary-container": "#39ff14",
        "on-primary-container": "#107100",
        "inverse-primary": "#106e00",
        "primary-fixed": "#79ff5b",
        "primary-fixed-dim": "#2ae500",
        "on-primary-fixed": "#022100",
        "on-primary-fixed-variant": "#095300",

        secondary: "#c8c6c5",
        "on-secondary": "#313030",
        "secondary-container": "#4a4949",
        "on-secondary-container": "#bab8b7",
        "secondary-fixed": "#e5e2e1",
        "secondary-fixed-dim": "#c8c6c5",
        "on-secondary-fixed": "#1c1b1b",
        "on-secondary-fixed-variant": "#474646",

        tertiary: "#ebffe8",
        "on-tertiary": "#003914",
        "tertiary-container": "#6cf88a",
        "on-tertiary-container": "#00702e",
        "tertiary-fixed": "#72fe8f",
        "tertiary-fixed-dim": "#53e076",
        "on-tertiary-fixed": "#002108",
        "on-tertiary-fixed-variant": "#005320",

        error: "#ffb4ab",
        "on-error": "#690005",
        "error-container": "#93000a",
        "on-error-container": "#ffdad6",

        // ---- Legacy aliases (keep unconverted pages working) ----
        "surface-2": "#282a2b",
        "surface-3": "#333535",
        accent: {
          DEFAULT: "#39ff14",
          hover: "#79ff5b",
          muted: "#1F5E3C",
          subtle: "#132A1F",
        },
        muted: "#baccb0",
        "muted-strong": "#e2e2e2",
        danger: "#ffb4ab",
        warning: "#FF9F0A",
      },

      fontFamily: {
        // The base sans font. `var(--font-geist)` is injected from
        // `next/font/google` in `app/layout.tsx`.
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        // Stitch role-named families. Both map to Geist except label fonts
        // which use JetBrains Mono — exactly mirroring DESIGN.md.
        "display-lg": ["var(--font-geist)", "sans-serif"],
        "headline-lg": ["var(--font-geist)", "sans-serif"],
        "headline-lg-mobile": ["var(--font-geist)", "sans-serif"],
        "headline-md": ["var(--font-geist)", "sans-serif"],
        "body-lg": ["var(--font-geist)", "sans-serif"],
        "body-md": ["var(--font-geist)", "sans-serif"],
        "label-md": ["var(--font-mono)", "monospace"],
        "label-sm": ["var(--font-mono)", "monospace"],
      },

      fontSize: {
        "display-lg": [
          "48px",
          { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "800" },
        ],
        "headline-lg": [
          "32px",
          { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "700" },
        ],
        "headline-lg-mobile": [
          "28px",
          { lineHeight: "36px", fontWeight: "700" },
        ],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-md": [
          "14px",
          { lineHeight: "20px", letterSpacing: "0.05em", fontWeight: "500" },
        ],
        "label-sm": [
          "12px",
          { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "500" },
        ],
      },

      borderRadius: {
        // Stitch shape scale.
        DEFAULT: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
        pill: "9999px",
      },

      spacing: {
        // Stitch 4px-based rhythm — names align to the HTML's `p-md`, `gap-lg`, etc.
        unit: "4px",
        xs: "4px",
        sm: "8px",
        md: "16px",
        gutter: "16px",
        lg: "24px",
        xl: "40px",
        "margin-mobile": "20px",
        "margin-desktop": "64px",
      },

      boxShadow: {
        // Glow utilities tuned to the neon primary-container (#39FF14).
        glow: "0 0 15px rgba(57,255,20,0.3)",
        "glow-strong": "0 0 30px rgba(57,255,20,0.6)",
        // Generic depth for stacked surfaces.
        card: "0 8px 24px rgba(0,0,0,0.55)",
        sheet: "0 -10px 40px rgba(0,0,0,0.6)",
      },

      backdropBlur: {
        xs: "2px",
      },

      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "pulse-soft": "pulseSoft 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
