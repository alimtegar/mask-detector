const forms = require('@tailwindcss/forms');

module.exports = {
  purge: [
    'src/**/*.js',
    'src/**/*.jsx',
    'src/**/*.ts',
    'src/**/*.tsx',
    'public/**/*.html',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    fontFamily: false,
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [
    forms,
  ],
}
