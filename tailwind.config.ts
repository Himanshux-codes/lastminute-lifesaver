import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "rgb(var(--color-base-950) / <alpha-value>)",
          900: "rgb(var(--color-base-900) / <alpha-value>)",
          800: "rgb(var(--color-base-800) / <alpha-value>)",
          700: "rgb(var(--color-base-700) / <alpha-value>)",
        },
        signal: {
          DEFAULT: "#6E63FF",
          dim: "#4A41C9",
          glow: "#9B93FF",
        },
        risk: {
          low: "#3DD9A4",
          medium: "#F2B84B",
          high: "#F2654B",
          critical: "#FF3B5C",
        },
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          muted: "rgb(var(--color-ink-muted) / <alpha-value>)",
          faint: "rgb(var(--color-ink-faint) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(110, 99, 255, 0.45)",
        card: "0 1px 2px rgba(0, 0, 0, 0.24), 0 12px 32px -16px rgba(0, 0, 0, 0.45)",
        elevated: "0 2px 4px rgba(0, 0, 0, 0.28), 0 24px 48px -20px rgba(0, 0, 0, 0.55)",
        "glow-sm": "0 0 0 1px rgba(110, 99, 255, 0.25), 0 8px 20px -8px rgba(110, 99, 255, 0.35)",
        glass: "0 1px 1px rgba(255, 255, 255, 0.06) inset, 0 16px 40px -16px rgba(0, 0, 0, 0.5)",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.4)", opacity: "0" },
          "100%": { transform: "scale(1.4)", opacity: "0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px) rotate(var(--float-rot, 0deg))" },
          "50%": { transform: "translateY(-12px) rotate(var(--float-rot, 0deg))" },
        },
        auroraShift: {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "33%": { transform: "translate(4%, -6%) scale(1.08)" },
          "66%": { transform: "translate(-4%, 4%) scale(0.96)" },
        },
      },
      animation: {
        pulseRing: "pulseRing 2.2s cubic-bezier(0.4,0,0.6,1) infinite",
        fadeUp: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both",
        floatSlow: "floatSlow 6s ease-in-out infinite",
        aurora: "auroraShift 18s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
