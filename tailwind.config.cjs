/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        "darkprimary":"#1976D2",
        "primary":"#2196F3",
        "variant":"#FFA726",
        "accent":"#03A9F4",
        "lightest":"#F5F5F5",
        "lighter":"#EEEEEE",
        "light":"#E0E0E0",
        "dark":"#616161",
        "darker":"#424242",
        "darkest":"#212121",
        "semitrans":"rgba(0,0,0,0.25)"
      }
    },
  },
  plugins: [],
}