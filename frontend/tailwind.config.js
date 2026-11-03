/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        navy: { 950: "#060b1a", 900: "#0a1128", 800: "#111a3a", 700: "#1a2550" },
      },
    },
  },
  plugins: [],
};
