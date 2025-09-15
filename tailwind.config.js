/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f2f0',
          100: '#cce5e0',
          200: '#99ccc1',
          300: '#66b2a1',
          400: '#4A9782',
          500: '#004030',
          600: '#003629',
          700: '#002d22',
          800: '#00241b',
          900: '#001a14',
        },
        secondary: {
          50: '#FFF9E5',
          100: '#fff6d6',
          200: '#ffedac',
          300: '#ffe483',
          400: '#4A9782',
          500: '#4A9782',
          600: '#3d7a6a',
          700: '#305c52',
          800: '#44444E',
          900: '#44444E',
        },
      }
    },
  },
  plugins: [],
}

