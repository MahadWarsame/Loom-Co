import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#fffdf9",
        fg: "#3b2b22",
        mut: "#76685d",
        card: "#ffffff",
        line: "#eadfd2",
        soft: "#f5eee5",
        sale: "#9b4f3a",
        gold: "#b08d57",
        warm: "#c56f57",
        cream: "#f4e6d7",
        sand: "#d9b58e",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
