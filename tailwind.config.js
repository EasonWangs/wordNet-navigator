/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebefff',
          500: '#667eea',
          600: '#5568d3',
          700: '#4c51bf',
        },
        secondary: {
          500: '#764ba2',
        }
      },
    },
  },
  plugins: [],
}
