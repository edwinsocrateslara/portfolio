import type { Config } from "tailwindcss"

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
        // surface / elevated / border / border-strong are gone from here.
        // They are no longer RGB triplets — they are white at an alpha, so
        // they cannot take Tailwind's <alpha-value> slot, and every one of
        // them had zero usages as a utility. Use var(--layer-1),
        // var(--layer-2), var(--hairline), var(--hairline-strong).
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
      // No `fontSize` here on purpose. The type scale lives in exactly one
      // place — the .type-* classes in app/globals.css. A `fontSize` block
      // duplicated those values by hand and had zero consumers; keeping it
      // only offered a second, silently-diverging way to set type.
      // No `spacing` here on purpose, for the same reason there is no
      // `fontSize`. Relatedness levels were exposed as p-within / gap-between /
      // mb-group / py-section and reached zero usages: the codebase settled on
      // var(--space-*), which is the only form that works in BOTH a style
      // object and a CSS rule. The named component classes in globals.css
      // cannot use a Tailwind utility, so keeping these split the vocabulary
      // by file type. One way to say 16px, not three.
    },
  },
  // No plugins. tailwindcss-animate was registered and supplied nothing —
  // the animation classes here are local @keyframes in globals.css, and
  // .animate-fade-in is one of those, not a plugin utility.
  plugins: [],
}

export default config
