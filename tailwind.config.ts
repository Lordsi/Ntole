import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aligned to iOS dark-mode systemGray scale (#000, gray6, gray5, gray4).
        background: "#000000",
        surface: "#1C1C1E",
        "surface-2": "#2C2C2E",
        "surface-3": "#3A3A3C",
        // Single-purpose accent for interactive emphasis (CTA + selected state).
        accent: {
          DEFAULT: "#34D67E",
          hover: "#2BC470",
          muted: "#1F5E3C",
          subtle: "#132A1F",
        },
        // iOS systemGray + systemGray2 for secondary text.
        muted: "#8E8E93",
        "muted-strong": "#AEAEB2",
        // iOS systemRed / systemOrange dark variants.
        danger: "#FF453A",
        warning: "#FF9F0A",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        pill: "9999px",
      },
      boxShadow: {
        // Single subtle elevation; Apple relies on contrast, not glow.
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.45)",
        sheet: "0 -8px 32px rgba(0,0,0,0.5)",
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
