/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#fad7ac',
          300: '#f6bb77',
          400: '#f19540',
          500: '#ee7a1b',
          600: '#df6011',
          700: '#b94910',
          800: '#933a15',
          900: '#773214',
          950: '#401708',
        },
        etsy: {
          orange: '#F56400',
          black: '#222222',
          gray: '#757575',
        },
      },
    },
  },
  plugins: [],
};
