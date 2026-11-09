// La acreditación por QR (él, v83.2): qué enseña la pantalla del acomodador
// al leer la invitación de una familia. Lo que manda está en la base
// (acreditar_marcar); esto solo decide por dónde empezar.

// Puede marcarse: en regla (pagado y con sus datos), ya dentro para poder
// corregirlo, o en Modo Pruebas, donde no se exige nada.
export const sePuedeMarcar = (m, datos) => !datos.exigir || m.enRegla || m.presente;

// Con todos dentro, ya está hecho. Con alguno dentro, o con alguien que no
// se puede marcar, se va a elegir quiénes. Si no, «¿Vienen todos?».
export function pantallaInicial(datos) {
  const { miembros } = datos;
  if (miembros.length > 0 && miembros.every((m) => m.presente)) return "hecho";
  if (miembros.some((m) => m.presente || !sePuedeMarcar(m, datos))) return "elegir";
  return "pregunta";
}

// Marcados al elegir: los que ya están dentro o, si no hay, todos los que se
// pueden marcar (lo normal es que falte alguno: se desmarca).
export function seleccionInicial(datos) {
  const dentro = datos.miembros.filter((m) => m.presente);
  return new Set((dentro.length ? dentro : datos.miembros.filter((m) => sePuedeMarcar(m, datos))).map((m) => m.id));
}

// «Mesa 5», o las que sean si la familia estuviera repartida.
export function textoMesas(miembros) {
  const mesas = [...new Set(miembros.map((m) => m.mesa).filter((n) => n != null))].sort((a, b) => a - b);
  if (mesas.length === 0) return "Sin mesa";
  return `${mesas.length === 1 ? "Mesa" : "Mesas"} ${mesas.join(", ")}`;
}

export const MOTIVOS_ACREDITAR = {
  permiso: "Tu cuenta no tiene permiso para acreditar en la entrada. Pídeselo al anfitrión.",
  codigo: "Este QR no es de ninguna familia del evento.",
  cerrada: "Las llegadas todavía no están abiertas: se abren en «Día del evento».",
  regla: "Alguno de ellos no tiene el pago o sus datos completos. Avisa a su colaborador.",
};
