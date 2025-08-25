/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#222F88',
        'brand-accent': '#27ADE7',
        'brand-surface': 'var(--brand-surface)',
        'brand-bg': 'var(--brand-bg)',
        'brand-border': 'var(--brand-border)',
        'brand-text': 'var(--brand-text)',
        'muted': 'var(--muted)',
      },
    },
  },
  plugins: [],
};