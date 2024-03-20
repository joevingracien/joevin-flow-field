const { fontFamily } = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-website)', ...fontFamily.sans],
      },
      fontVariationSettings: {
        'text-bold': {
          opsz: 12,
          wght: 700,
          wdth: 100,
        },
        'text-light': {
          opsz: 12,
          wght: 300,
          wdth: 100,
        },
        'text-normal': {
          opsz: 12,
          wght: 400,
          wdth: 100,
        },
        'display-black': {
          opsz: 30,
          wght: 900,
          wdth: 50,
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
