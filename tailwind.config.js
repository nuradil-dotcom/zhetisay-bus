/** @type {import('tailwindcss').Config} */
// Tailwind CSS v4 uses CSS-based configuration via @import "tailwindcss" in your CSS file.
// Theme tokens are defined with @theme in src/index.css.
// This file is kept for editor tooling/IDE support.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        yellow: { DEFAULT: '#FFD700', 400: '#FFD700', 500: '#e6c000' },
        charcoal: { DEFAULT: '#1A1A1B', dark: '#111112' },
      },
    },
  },
  plugins: [],
}
