import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      /* Legacy brand-* color tokens retained for incremental migration; prefer CSS variables in tokens.css */
      colors: {
        "brand-primary": "#222F88",
        "brand-primary-light": "#2f3d99",
        "brand-primary-dark": "#1a2566",
        "brand-secondary": "#27ADE7",
        "brand-accent": "#27ADE7",
        "brand-surface": "#ffffff",
        "brand-bg": "#f8fafc",
        "brand-border": "#e2e8f0",
        "brand-text": "#0f172a",
        err: "#dc2626",
        /* Semantic design token mappings to CSS variables */
        primary: "var(--color-primary)",
        "primary-emphasis": "var(--color-primary-emphasis)",
        accent: "var(--color-accent)",
        surface: "var(--color-surface)",
        bg: "var(--color-bg)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        muted: "var(--color-muted)",
        ok: "var(--color-ok)",
        warn: "var(--color-warn)",
        danger: "var(--color-err)",
      },
      fontFamily: {
        /* Modern geometric humanist font with CSS variable fallback */
        sans: [
          "var(--font-sans)",
          "Manrope",
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        /* Legacy direct mapping for backward compatibility */
        "sans-legacy": [
          "Manrope",
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      fontSize: {
        "2xs": "0.625rem",
      },
      spacing: {
        4.5: "1.125rem",
      },
      borderRadius: {
        inherit: "inherit",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in": "slideIn 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      screens: {
        xs: { max: "420px" },
        // Default Tailwind breakpoints still available: sm, md, lg, xl, 2xl
      },
    },
  },
  plugins: [forms],
};
