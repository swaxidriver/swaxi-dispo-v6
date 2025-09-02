import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      /* SWA Corporate Design Colors - All mapped to CSS variables */
      colors: {
        /* SWA Primary Brand Colors */
        primary: "var(--swa-primary)",
        "primary-emphasis": "var(--swa-primary-emphasis)",
        accent: "var(--swa-accent)",

        /* SWA Semantic Colors */
        surface: "var(--swa-surface)",
        bg: "var(--swa-background)",
        border: "var(--swa-border)",
        text: "var(--swa-text)",
        muted: "var(--swa-text-muted)",

        /* SWA Status Colors */
        ok: "var(--swa-success)",
        success: "var(--swa-success)",
        warn: "var(--swa-warning)",
        warning: "var(--swa-warning)",
        danger: "var(--swa-error)",
        error: "var(--swa-error)",

        /* Common SWA Component Colors (replaces hard-coded values) */
        "swa-blue": "var(--swa-blue)",
        "swa-red": "var(--swa-red)",
        "swa-green": "var(--swa-green)",
        "swa-gray": "var(--swa-gray)",
        "swa-yellow": "var(--swa-yellow)",
        "swa-purple": "var(--swa-purple)",

        /* Legacy brand-* mappings for backward compatibility - now using variables */
        "brand-primary": "var(--swa-primary)",
        "brand-primary-light": "var(--swa-primary)",
        "brand-primary-dark": "var(--swa-primary-emphasis)",
        "brand-secondary": "var(--swa-accent)",
        "brand-accent": "var(--swa-accent)",
        "brand-surface": "var(--swa-surface)",
        "brand-bg": "var(--swa-background)",
        "brand-border": "var(--swa-border)",
        "brand-text": "var(--swa-text)",
        err: "var(--swa-error)",
      },
      fontFamily: {
        /* SWA Corporate Design Typography */
        sans: [
          "var(--swa-font-family)",
          "Manrope",
          "Inter",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: [
          "var(--swa-font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "monospace",
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
