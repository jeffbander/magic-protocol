import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // T007: 8px grid spacing system (only 8, 16, 24, 32, 48, 64px)
      spacing: {
        '2': '8px',    // 8px
        '4': '16px',   // 16px
        '6': '24px',   // 24px
        '8': '32px',   // 32px
        '12': '48px',  // 48px
        '16': '64px',  // 64px
      },
      // T008: Minimum 16px text sizes
      fontSize: {
        base: '16px',    // Default body text
        lg: '18px',      // Slightly larger
        xl: '20px',      // Section headers
        '3xl': '30px',   // Page titles
      },
      // T009: Blue-600 accent + gray scale palette
      colors: {
        primary: {
          600: '#2563eb',  // blue-600 for CTAs
          700: '#1d4ed8',  // blue-700 for hover
        },
      },
    },
  },
  plugins: [],
};

export default config;
