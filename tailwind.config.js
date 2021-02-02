module.exports = {
  purge: ['./src/**/*.js', './public/index.html'],
   darkMode: false, // or 'media' or 'class'
   theme: {
     extend: {
      borderWidth: {
        '3': '3px',
      }
     }
   },
   variants: {},
   plugins: []
 }