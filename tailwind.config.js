/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        cq: {
          primary: "#0f3b74",      // bleu ComptaNet
          primaryDark: "#0c2f5c"   // bleu foncé ComptaNet
        }
      },
      borderRadius: {
        "2xl": "1rem"              // correction du nom Tailwind standard
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0,0,0,0.08)"
      }
    }
  },
  plugins: []
};
⚙️ Et voici ton postcss.config.js
Crée-le (s’il n’existe pas déjà) à la racine du projet :

js
Copier le code
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
