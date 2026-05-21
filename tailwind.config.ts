import type { Config } from "tailwindcss";

const withAlpha = (name: string) =>
  `rgb(var(--${name}) / <alpha-value>)` as const;

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
        background: withAlpha("background"),
        surface: withAlpha("background"),
        "surface-dim": withAlpha("surface-dim"),
        "surface-bright": withAlpha("surface-bright"),
        "surface-container-lowest": withAlpha("surface-container-lowest"),
        "surface-container-low": withAlpha("surface-container-low"),
        "surface-container": withAlpha("surface-container"),
        "surface-container-high": withAlpha("surface-container-high"),
        "surface-container-highest": withAlpha("surface-container-highest"),
        "surface-variant": withAlpha("surface-variant"),
        "on-surface": withAlpha("on-surface"),
        "on-surface-variant": withAlpha("on-surface-variant"),
        "on-background": withAlpha("foreground"),
        outline: withAlpha("outline"),
        "outline-variant": withAlpha("outline-variant"),
        primary: withAlpha("primary"),
        "on-primary": withAlpha("on-primary"),
        "primary-container": withAlpha("primary-container"),
        "on-primary-container": withAlpha("on-primary-container"),
        "primary-fixed": withAlpha("primary-fixed"),
        "primary-fixed-dim": withAlpha("primary-fixed-dim"),
        secondary: withAlpha("secondary"),
        "secondary-container": withAlpha("secondary-container"),
        "on-secondary-container": withAlpha("on-secondary-container"),
        "tertiary-fixed-dim": withAlpha("tertiary-fixed-dim"),
        error: withAlpha("error"),
        "surface-2": withAlpha("surface-container-high"),
        "surface-3": withAlpha("surface-container-highest"),
        accent: {
          DEFAULT: withAlpha("primary-container"),
          hover: withAlpha("primary-fixed"),
          muted: "#1F5E3C",
          subtle: "#132A1F",
        },
        muted: withAlpha("on-surface-variant"),
        "muted-strong": withAlpha("on-surface"),
        danger: withAlpha("error"),
        warning: "#FF9F0A",
      },

      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
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
          "2.75rem",
          {
            lineHeight: "1.1",
            letterSpacing: "-0.03em",
            fontWeight: "700",
          },
        ],
        "headline-lg": [
          "2rem",
          {
            lineHeight: "1.2",
            letterSpacing: "-0.02em",
            fontWeight: "600",
          },
        ],
        "headline-lg-mobile": [
          "1.75rem",
          { lineHeight: "1.25", letterSpacing: "-0.02em", fontWeight: "600" },
        ],
        "headline-md": [
          "1.375rem",
          { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        "body-lg": ["1.125rem", { lineHeight: "1.55", fontWeight: "400" }],
        "body-md": ["1rem", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["0.875rem", { lineHeight: "1.45", fontWeight: "400" }],
        "label-md": [
          "0.8125rem",
          {
            lineHeight: "1.35",
            letterSpacing: "0.03em",
            fontWeight: "500",
          },
        ],
        "label-sm": [
          "0.6875rem",
          {
            lineHeight: "1.3",
            letterSpacing: "0.04em",
            fontWeight: "500",
          },
        ],
      },

      borderRadius: {
        DEFAULT: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "3rem",
        full: "9999px",
        pill: "9999px",
      },

      spacing: {
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
        glow: "0 0 15px rgb(var(--primary-container) / 0.25)",
        "glow-strong": "0 0 24px rgb(var(--primary-container) / 0.35)",
        card: "0 8px 24px rgb(0 0 0 / 0.08)",
        sheet: "0 -10px 40px rgb(0 0 0 / 0.12)",
        elevated:
          "0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px rgb(0 0 0 / 0.06)",
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
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.28s ease-out",
        "pulse-soft": "pulseSoft 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
