/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        accent: '#0ea5e9',
        'accent-dark': '#0284c7',
      },
      fontFamily: {
        mono: ['Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
