import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        elevated: "var(--elevated)",
        accent: "var(--accent)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      animation: {
        marquee: "marquee var(--duration) linear infinite",
        "fade-in-up": "fade-in-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
