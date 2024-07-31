/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {
      colors : {
        'brown-light' : '#6b5535',
        'brown-dark' : '#4a381c',
        'tan-dark' : '#d5b990',
        'tan-medium' : '#e6d5bc',
        'tan-light' : '#ece3d4'
      }
    },
  },
  plugins: [],
}