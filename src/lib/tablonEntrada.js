// La entrada al tablón (él, v70): apellido, nombre Y año de nacimiento. Los
// tres viajan como una sola respuesta, «Apellido Nombre 1975», y el servidor
// la compara con su ficha (clave_tablon) en la puerta y en todo lo de dentro.
// El año, en un desplegable sin teclado, como en las fotos.

export const NO_ENCONTRADO =
  "No te encontramos. Escribe primero tu apellido y después tu nombre, tal como aparecen en tu invitación, " +
  "y elige tu año de nacimiento. Dan igual las mayúsculas y las tildes.";
// Breve, como él pidió.
export const SIN_ANIO = "Tu ficha aún no tiene tu año de nacimiento. Pídeselo a tu colaborador.";

export const respuestaTablon = (nombre, anio) => `${String(nombre || "").trim()} ${anio || ""}`.trim();

// El año con el que entró, para no volver a pedirlo en las fotos.
export const anioDeRespuesta = (respuesta) => (String(respuesta || "").match(/(\d{4})\s*$/) || [])[1] || "";

// Devuelve { respuesta } si vale (la que se guarda y se manda luego), o
// { aviso } con lo que tiene que revisar.
export async function entrarTablon(supabase, token, nombre, anio) {
  const verificar = async (respuesta) =>
    (await supabase.rpc("tablon_verificar_respuesta", { p_token: token, p_respuesta: respuesta })).data === true;
  const conAnio = respuestaTablon(nombre, anio);
  if (await verificar(conAnio)) return { respuesta: conAnio };
  // Mientras el servidor no tenga el SQL v70 (que exige el año), todavía
  // entra con el nombre solo. Con él subido, esto ya no deja pasar a nadie:
  // la clave lleva siempre el año.
  const soloNombre = respuestaTablon(nombre, "");
  if (await verificar(soloNombre)) return { respuesta: soloNombre };
  const { data: faltaAnio } = await supabase.rpc("tablon_falta_anio", { p_token: token, p_nombre: soloNombre });
  return { aviso: faltaAnio === true ? SIN_ANIO : NO_ENCONTRADO };
}
