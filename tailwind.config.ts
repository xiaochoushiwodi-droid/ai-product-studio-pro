import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#18201f",
        graphite: "#2e3432",
        paper: "#f7f6f1",
        studio: "#0b0c0f",
        mist: "#e7ece8",
        canopy: "#23645a",
        mint: "#d7efe5",
        signal: "#f1b13b",
        coral: "#cf5f4e",
        ocean: "#2d6f8f"
      },
      boxShadow: {
        soft: "0 18px 55px rgba(24, 32, 31, 0.12)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
