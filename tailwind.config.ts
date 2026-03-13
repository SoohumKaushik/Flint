import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        flint: {
          bg: "#080810",
          surface: "#0F0F1A",
          card: "#141428",
          border: "#1E1E35",
          accent: "#8B5CF6",
          "accent-hover": "#7C3AED",
          "accent-glow": "rgba(139, 92, 246, 0.15)",
          "text-primary": "#F1F0FF",
          "text-secondary": "#8B8BAE",
          "text-muted": "#4A4A6A",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
