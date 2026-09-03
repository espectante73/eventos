// Papel de cada invitado DENTRO de su familia (2026-09-03, ampliado el
// 2026-09-04 con "hijo").
//
// ⚠️ Nació como `conyuge` con solo esposo/esposa. Al añadir "hijo" ese
// nombre pasaba a mentir, así que se renombró el campo entero (columna
// incluida) en vez de dejarlo mal puesto: un hijo no es un cónyuge.
//
// Cinco valores, y la clave para entenderlos es que esto NO sirve solo
// para contar matrimonios: sirve también para SENTAR a la gente.
//   O = esposo (con su esposa presente)
//   A = esposa (con su esposo presente)
//   H = hijo
//   P = padre o madre que asiste SIN su cónyuge -- madre soltera, o el
//       cónyuge se puso malo y el resto de la familia sí viene. No forma
//       matrimonio, pero hay que sentarlo con sus hijos.
//   S = suelto de verdad: no hay nadie a quien vincularlo, cabe en
//       cualquier hueco que quede sin asignar en una mesa.
//
// P y S existen por separado justo por eso (razonado con el usuario el
// 2026-09-04): a efectos de contar matrimonios dan igual los dos, pero a
// efectos de mesa son opuestos -- uno va atado a su familia y el otro
// es libre. Un modelo de cuatro letras los mezclaba y perdía ese dato.
//
// ⚠️ Y el VACÍO ya no significa "unidad suelta": significa SIN REVISAR.
// Antes el guion valía para las dos cosas y no se podía saber cuánto
// quedaba por repasar de los ~140 invitados. Quien está revisado y no
// encaja en ninguna familia lleva su S.
export const ROL_FAMILIAR = {
  ESPOSO: "esposo",
  ESPOSA: "esposa",
  HIJO: "hijo",
  PADRE: "padre",
  SUELTO: "suelto",
};

// Cómo se ve en la tabla: una sola letra, que es como lo pidió el
// usuario ("esposO con la O y esposA con la A").
export const LETRA_ROL = {
  [ROL_FAMILIAR.ESPOSO]: "O",
  [ROL_FAMILIAR.ESPOSA]: "A",
  [ROL_FAMILIAR.HIJO]: "H",
  [ROL_FAMILIAR.PADRE]: "P",
  [ROL_FAMILIAR.SUELTO]: "S",
};

export const NOMBRE_ROL = {
  [ROL_FAMILIAR.ESPOSO]: "Esposo",
  [ROL_FAMILIAR.ESPOSA]: "Esposa",
  [ROL_FAMILIAR.HIJO]: "Hijo",
  [ROL_FAMILIAR.PADRE]: "Padre o madre sin su cónyuge (se sienta con sus hijos)",
  [ROL_FAMILIAR.SUELTO]: "Suelto: sin nadie a quien vincularlo, cabe en cualquier hueco",
};
