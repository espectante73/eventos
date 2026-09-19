import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    // `zurdo:` -- solo se aplica cuando el móvil se maneja con la mano
    // izquierda (data-mano="izquierda" en <html>, lo pone src/lib/mano.js).
    // Ejemplo: "items-end zurdo:items-start".
    plugin(({ addVariant }) => {
      addVariant("zurdo", 'html[data-mano="izquierda"] &');
    }),
  ],
};
