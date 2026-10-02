/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rescue: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Rescue orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        emergency: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444', // Emergency red
          600: '#dc2626',
          700: '#b91c1c',
        },
        navy: {
          800: '#0f172a',
          900: '#0b0f19',
          950: '#05070d',
        }
      },
      fontFamily: {
        sans: ['Prompt', 'Sarabun', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
