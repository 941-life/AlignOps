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
        border: "hsl(214.3 31.8% 91.4%)",
        input: "hsl(214.3 31.8% 91.4%)",
        ring: "hsl(215 20.2% 65.1%)",
        background: "hsl(210 40% 98%)",
        foreground: "hsl(222.2 84% 4.9%)",
        primary: {
          DEFAULT: "#A5C89E", // Sage green - calming, professional
          foreground: "#1a3a1a",
        },
        secondary: {
          DEFAULT: "#FFF7CD", // Soft cream
          foreground: "hsl(222.2 47.4% 11.2%)",
        },
        destructive: {
          DEFAULT: "#FB9B8F", // Soft coral
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "hsl(210 40% 96.1%)",
          foreground: "hsl(215.4 16.3% 46.9%)",
        },
        accent: {
          DEFAULT: "#9CCFFF", // Soft sky blue
          foreground: "hsl(222.2 47.4% 11.2%)",
        },
        popover: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(222.2 84% 4.9%)",
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(222.2 84% 4.9%)",
        },
        // Custom brand colors - Natural & Professional palette
        brand: {
          sage: "#A5C89E",      // Primary action - sage green
          cream: "#FFF7CD",      // Backgrounds - soft cream
          coral: "#FB9B8F",      // Warnings/highlights - soft coral
          sky: "#9CCFFF",        // Info/secondary - sky blue
          forest: "#6B8E68",     // Hover states - deeper green
          peach: "#FFD4CC",      // Subtle highlights - soft peach
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
    },
  },
  plugins: [],
};

export default config;

