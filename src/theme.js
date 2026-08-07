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
  charcoal: "#2B2620",
  line: "#C9BFA9",
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
