/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        vintage: {
          900: '#1A0F08',
          800: '#2D1B0E',
          700: '#3D2815',
          600: '#5A3A1F',
        },
        gold: {
          50: '#FDF8EE',
          100: '#F5EDE0',
          200: '#E8D9B5',
          300: '#DCC18C',
          400: '#C9A962',
          500: '#B8944D',
          600: '#A07A3C',
        },
        teal: {
          700: '#3D5A54',
          600: '#4A6B64',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201, 169, 98, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(201, 169, 98, 0)' },
        },
      },
    },
  },
  plugins: [],
};
