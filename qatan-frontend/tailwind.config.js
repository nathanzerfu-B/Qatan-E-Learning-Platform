/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#007BFF",
        "background-light": "#F8F9FA",
        "background-dark": "#121212",
        "surface-light": "#FFFFFF",
        "surface-dark": "#1E1E1E",
        "text-light-primary": "#212529",
        "text-light-secondary": "#6C757D",
        "text-dark-primary": "#E0E0E0",
        "text-dark-secondary": "#A0A0A0",
        "border-light": "#E9ECEF",
        "border-dark": "#333333"
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
    },
  },
  plugins: [],
}
