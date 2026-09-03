// Papel de cada invitado DENTRO de su familia (2026-09-03, ampliado el
// 2026-09-04 con "hijo").
//
// ⚠️ Nació como `conyuge` con solo esposo/esposa. Al añadir "hijo" ese
// nombre pasaba a mentir, así que se renombró el campo entero (columna
// incluida) en vez de dejarlo mal puesto: un hijo no es un cónyuge.
//
// Los tres valores describen el núcleo familiar completo:
//   O = esposo, A = esposa, H = hijo.
// Y el vacío tiene significado propio, no es "sin rellenar": es una
// UNIDAD SUELTA -- alguien soltero, o el único miembro de un matrimonio
// que asiste. Lo dijo el usuario así: los que no tengan ni O, ni A, ni
// H son una unidad suelta invitada.
export const ROL_FAMILIAR = {
  ESPOSO: "esposo",
  ESPOSA: "esposa",
  HIJO: "hijo",
};

// Cómo se ve en la tabla: una sola letra, que es como lo pidió el
// usuario ("esposO con la O y esposA con la A").
export const LETRA_ROL = {
  [ROL_FAMILIAR.ESPOSO]: "O",
  [ROL_FAMILIAR.ESPOSA]: "A",
  [ROL_FAMILIAR.HIJO]: "H",
};

export const NOMBRE_ROL = {
  [ROL_FAMILIAR.ESPOSO]: "Esposo",
  [ROL_FAMILIAR.ESPOSA]: "Esposa",
  [ROL_FAMILIAR.HIJO]: "Hijo",
};
