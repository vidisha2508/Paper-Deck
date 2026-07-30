/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/static/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FFFFFF',
        ink: '#15121F',
        purple: '#7C5CFC',
        pink: '#FF6FB5',
        yellow: '#FFD166',
        blue: '#4FA3F7',
        green: '#6BDE8F',
      },
      borderWidth: {
        '3': '3px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
