// Paleta de colores y estilo base de los campos de texto — usado por
// prácticamente todos los componentes de la app. Vive en su propio módulo
// (en vez de en App.jsx) para que tanto App.jsx como los componentes bajo
// src/components/ puedan importarlo sin depender el uno del otro. Movido
// fuera de App.jsx en el reparto del 2026-08-08 (ver CLAUDE.md).

export const C = {
  paper: "#EFE9DE",
  paperDark: "#E4DCC9",
  ink: "#1F3A2E",
  wax: "#8C2F39",
  gold: "#B08D57",
  // C.gold es demasiado apagado sobre fondos oscuros (los botones/paneles
  // de cristal del repaso visual de 2026-08-12, fondo verde tinta) --
  // este dorado más claro se lee mucho mejor ahí. C.gold se queda para
  // fondos claros (el uso original, mayoritario en la app).
  goldClaro: "#D9B778",
  charcoal: "#2B2620",
  line: "#C9BFA9",
  // Rojo de aviso/peligro y su fondo suave a juego — centralizados el
  // 2026-08-24 (examen honesto del código, a petición del usuario):
  // antes cada sitio llevaba su propio "#B00020"/"#FBEAEC" copiado a
  // mano, y ya había una desviación real sin querer (VentanaMesas.jsx
  // usaba "#FBEAEA", un carácter distinto, visualmente idéntico) --
  // prueba de que copiar hexadecimales a mano deriva solo con el tiempo.
  peligro: "#B00020",
  avisoFondo: "#FBEAEC",
};

export const inputStyle = {
  background: "#fff",
  border: `1px solid ${C.line}`,
  borderRadius: 4,
  padding: "6px 9px",
  color: C.charcoal,
  fontFamily: "'Inter', sans-serif",
  fontSize: 14,
};
