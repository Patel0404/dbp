import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f8ff",
          100: "#e6edff",
          500: "#3b5bff",
          600: "#2b45d9",
          700: "#1e32a8",
        },
        pos: "#1aa86a",
        neg: "#d74141",
        warn: "#d98b1f",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
