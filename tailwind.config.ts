import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#faf8f4",
        fg: "#26241f",
        mut: "#8a8378",
        card: "#ffffff",
        line: "#e6e1d7",
        soft: "#f1ede4",
        sale: "#8a5a3d",
        gold: "#b08d57",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
