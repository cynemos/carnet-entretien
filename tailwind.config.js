/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: '#121212',
        secondary: '#1E1E1E',
        light: '#FFFFFF',
        primary: '#FF4500',
        accent: '#64FFDA',
        info: '#3498db',
        // Removed dark-text color definition
      },
      backgroundImage: {
        'racing-stripes': "url('./src/assets/racing-stripes.png')",
      },
    },
  },
  plugins: [],
}
