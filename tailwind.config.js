/** @type {import('tailwindcss').Config} */
// Thème « atelier de restauration vintage » : cuir et acier sombres, laiton, vert patiné, rouille
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: '#15110d',        // sol de l'atelier
        secondary: '#221b15',   // tôle / cuir des panneaux
        light: '#efe4cc',       // papier crème
        primary: '#d4943a',     // laiton
        'primary-fonce': '#a86f26',
        accent: '#8fbf9f',      // vert patiné
        'accent-clair': '#b8dcc4',
        rouille: '#c2553a',
        info: '#7aa7b8',
      },
      fontFamily: {
        sans: ['Barlow', 'system-ui', 'sans-serif'],
        display: ['"Alfa Slab One"', 'Georgia', 'serif'],
        titre: ['Oswald', 'Impact', 'sans-serif'],
        machine: ['"Special Elite"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
}
