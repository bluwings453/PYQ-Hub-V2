/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--color-paper)",
        surface: "var(--color-surface)",
        hairline: "var(--color-hairline)",
        ink: "var(--color-ink)",
        "ink-soft": "var(--color-ink-soft)",
        maroon: {
          DEFAULT: "var(--color-maroon)",
          dark: "var(--color-maroon-dark)",
          light: "var(--color-maroon-light)",
        },
        "on-maroon": "var(--color-on-maroon)",
        gold: {
          DEFAULT: "var(--color-gold)",
          light: "var(--color-gold-light)",
        },
      },
      fontFamily: {
        serif: ["'IBM Plex Serif'", "ui-serif", "Georgia", "serif"],
        sans: ["'IBM Plex Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
