import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bureau 1D — all CSS-var-backed for Tailwind opacity modifiers
        bg:              "rgb(var(--bureau-bg) / <alpha-value>)",
        surface:         "rgb(var(--bureau-surface) / <alpha-value>)",
        elevated:        "rgb(var(--bureau-elevated) / <alpha-value>)",
        border:          "rgb(var(--bureau-border) / <alpha-value>)",
        "border-strong": "rgb(var(--bureau-border-strong) / <alpha-value>)",
        "text-primary":  "rgb(var(--bureau-text-primary) / <alpha-value>)",
        "text-secondary":"rgb(var(--bureau-text-secondary) / <alpha-value>)",
        "text-muted":    "rgb(var(--bureau-text-muted) / <alpha-value>)",
        accent:          "rgb(var(--bureau-accent) / <alpha-value>)",
        "on-accent":     "rgb(var(--bureau-on-accent) / <alpha-value>)",
      },
      borderRadius: {
        card: "var(--bureau-radius-card)",
        btn:  "var(--bureau-radius-btn)",
        chip: "var(--bureau-radius-chip)",
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        hero:      ["52px", { lineHeight: "1.04", letterSpacing: "-1.6px", fontWeight: "800" }],
        h2:        ["34px", { lineHeight: "1.10", letterSpacing: "-1px", fontWeight: "700" }],
        "card-h3": ["17px", { lineHeight: "1.25", fontWeight: "600" }],
        prose:     ["16px", { lineHeight: "1.7", fontWeight: "400" }],
        "prose-2": ["15px", { lineHeight: "1.55", fontWeight: "400" }],
        label:     ["10px", { lineHeight: "1", letterSpacing: "1.4px", fontWeight: "600" }],
        nav:       ["11px", { lineHeight: "1", letterSpacing: "1.4px", fontWeight: "500" }],
        meta:      ["11px", { lineHeight: "1", fontWeight: "400" }],
      },
    },
  },
  plugins: [animate],
}

export default config
