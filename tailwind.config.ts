import type { Config } from "tailwindcss";

// Design system "Painel da Tata": creme + navy + púrpura
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        creme: {
          DEFAULT: "#F7F3EC",
          50: "#FCFAF6",
          100: "#F7F3EC",
          200: "#EFE7D8",
        },
        navy: {
          DEFAULT: "#1E2A44",
          50: "#E8EBF1",
          100: "#C7CEDD",
          600: "#27365A",
          700: "#1E2A44",
          800: "#172033",
          900: "#0F1622",
        },
        purpura: {
          DEFAULT: "#7C5BD9",
          50: "#F1ECFB",
          100: "#E0D6F6",
          400: "#9A7FE3",
          500: "#7C5BD9",
          600: "#6544C4",
          700: "#523A9E",
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
