import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lixi: {
          red: {
            DEFAULT: "#E53935",
            dark: "#C62828",
            light: "#EF5350",
          },
          gold: {
            DEFAULT: "#FFB300",
            light: "#FFD54F",
            dark: "#FF8F00",
          },
          cream: {
            DEFAULT: "#FDF6E9",
            dark: "#F5E6D3",
            light: "#FFF8F0",
          },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.3s ease-out",
        celebrate: "celebrate 0.5s ease-out",
        "slot-spin": "slotSpin 0.5s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        celebrate: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        slotSpin: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
