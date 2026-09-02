// Los dos valores posibles de `invitados.conyuge` ("" = no es cónyuge).
// En fichero propio para que lo puedan importar tanto la tabla de
// invitados como lib/matrimonios.js sin arrastrar nada más.
export const CONYUGE = {
  ESPOSO: "esposo",
  ESPOSA: "esposa",
};

// Cómo se ve en la tabla: una sola letra, que es como lo pidió el
// usuario ("esposO con la O y esposA con la A", 2026-09-03).
export const LETRA_CONYUGE = {
  [CONYUGE.ESPOSO]: "O",
  [CONYUGE.ESPOSA]: "A",
};

export const NOMBRE_CONYUGE = {
  [CONYUGE.ESPOSO]: "Esposo",
  [CONYUGE.ESPOSA]: "Esposa",
};
