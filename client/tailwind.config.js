/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F5A623',
        secondary: '#2D7D46',
        primaryText: '#C47F00',
      },
      fontFamily: {
        devanagari: ['Noto Sans Devanagari', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
