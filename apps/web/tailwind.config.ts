import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette inspirée des couleurs de la Saarland
        saar: {
          blue: "#003B6F",    // Bleu institutionnel
          red: "#CC0000",     // Rouge Saarland
          gold: "#F0A500",    // Or/Ambre
          light: "#E8F0F8",   // Fond clair
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
