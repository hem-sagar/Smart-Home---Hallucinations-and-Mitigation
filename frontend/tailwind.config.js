/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#0c1222",
          900: "#111827",
          800: "#1e293b",
          700: "#334155",
        },
        mist: "#e8eef7",
        accent: {
          DEFAULT: "#3b82f6",
          soft: "#93c5fd",
        },
        mint: "#34d399",
        rose: "#fb7185",
      },
      boxShadow: {
        card: "0 4px 24px -4px rgba(15, 23, 42, 0.12)",
        soft: "0 2px 12px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
