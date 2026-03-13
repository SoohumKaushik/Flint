/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'flint-bg': '#0D0D1A',
        'flint-surface': '#111122',
        'flint-card': '#141428',
        'flint-border': '#1E1E35',
        'flint-purple': '#8B5CF6',
        'flint-purple-hover': '#7C3AED',
        'flint-amber': '#F59E0B',
        'flint-success': '#10B981',
        'flint-danger': '#EF4444',
        'flint-text': '#F1F0FF',
        'flint-muted': '#8B8BAE',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.7s ease-out forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
