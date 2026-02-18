/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#0a2948",
        "accent": "#D4842D",
        "background-dark": "#0B1116",
      },
      fontFamily: {
        "display": ["Public Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
}