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
        // Premium dark-mode palette: deep, near-black navy with subtle blue cast.
        // Surfaces stack above the base via translucency and backdrop blur.
        background: "#0B0C10",
        surface: "#15171C",
        "surface-2": "#1E2128",
        "surface-3": "#2A2E37",
        // Vibrant neon/lime green for primary actions and active states.
        accent: {
          DEFAULT: "#28C76F",
          hover: "#22B864",
          muted: "#1A6B3F",
          subtle: "#0F2A1B",
        },
        // Cool gray secondary text, tuned to the new background hue.
        muted: "#8B8F99",
        "muted-strong": "#B7BBC4",
        // Status colors.
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
        // Glass cards: inset hairline highlight + soft depth.
        card: "0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 24px rgba(0,0,0,0.55)",
        sheet:
          "0 1px 0 rgba(255,255,255,0.06) inset, 0 -12px 40px rgba(0,0,0,0.65)",
        // Soft neon halo around primary CTAs.
        glow: "0 8px 24px rgba(40,199,111,0.35), 0 0 0 1px rgba(40,199,111,0.25) inset",
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
