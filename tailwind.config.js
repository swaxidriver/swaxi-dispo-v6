import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: {
            DEFAULT: '#222F88',
            light: '#2f3d99',
            dark: '#1a2566'
          },
          accent: '#27ADE7',
          surface: '#ffffff',
          bg: '#f8fafc',
          border: '#e2e8f0',
          text: '#0f172a'
        },
        muted: '#64748b',
        ok: '#16a34a',
        warn: '#f59e0b',
        err: '#dc2626'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      spacing: {
        '4.5': '1.125rem',
      },
      borderRadius: {
        'inherit': 'inherit',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [forms],
};