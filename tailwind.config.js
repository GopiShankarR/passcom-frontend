/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9ff',
          100: '#d9f0ff',
          200: '#b9e4ff',
          300: '#89d4ff',
          400: '#4cbcff',
          500: '#1aa2ff',
          600: '#007fe6',
          700: '#0063b4',
          800: '#004f8d',
          900: '#003f70'
        }
      }
    }
  },
  plugins: []
}
