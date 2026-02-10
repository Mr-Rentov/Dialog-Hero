/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#007AFF",
          hover: "#0063D1",
        },
        background: "#F5F5F7",
        foreground: "#1D1D1F",
        "secondary-text": "#86868B",
        surface: "#FFFFFF",
        border: "#D2D2D7",
        success: "#34C759",
        error: "#FF3B30",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
