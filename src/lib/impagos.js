// El que no paga con su familia (él, v61). Al cobrar, por cada uno que no
// paga se pregunta «¿va a ir a la fiesta?»:
//   Sí -> pago pendiente una semana; como mucho PLAZOS_MAX plazos.
//   No -> «No asiste»: deja de estar confirmado y libera su mesa.
// Lo mismo hace la base para el colaborador (colaborador_responder_impago);
// esto es para el anfitrión, que guarda la lista entera, y para pintar.

import { nombreCompleto } from "./formato";

export const PLAZOS_MAX = 3;
const DIAS_PLAZO = 7;

// "AAAA-MM-DD" del día de hoy, en la hora de aquí.
export function hoyISO(ahora = new Date()) {
  const d = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function masDias(iso, dias) {
  const [a, m, d] = iso.split("-").map(Number);
  return hoyISO(new Date(a, m - 1, d + dias));
}

// Lo que cambia en el invitado al contestar. null: no se puede (ya agotó
// los plazos y se ha contestado «Sí»).
export function respuestaImpago(g, va, ahora = new Date()) {
  if (!va) return { noAsiste: true, confirmado: false, mesa: null, pagoPendienteHasta: null };
  const plazos = Number(g.plazosPago) || 0;
  if (plazos >= PLAZOS_MAX) return null;
  return { pagoPendienteHasta: masDias(hoyISO(ahora), DIAS_PLAZO), plazosPago: plazos + 1 };
}

// El estado de un pago pendiente, para el aviso. null si no hay.
export function estadoImpago(g, ahora = new Date()) {
  if (g.pagado || !g.pagoPendienteHasta) return null;
  const plazo = Number(g.plazosPago) || 1;
  return {
    hasta: g.pagoPendienteHasta,
    plazo,
    vencido: g.pagoPendienteHasta < hoyISO(ahora),
    quedanPlazos: plazo < PLAZOS_MAX,
  };
}

// "17 oct", corto para caber en una línea.
export function fechaCorta(iso) {
  const [a, m, d] = String(iso || "").split("-").map(Number);
  if (!a) return "";
  return new Date(a, m - 1, d).toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "");
}

// La línea del aviso, en la fila de su familia.
// La persona, "Apellido, Nombre" (norma 15).
export function textoAvisoImpago(g, ahora = new Date()) {
  const e = estadoImpago(g, ahora);
  if (!e) return "";
  const quien = nombreCompleto(g);
  if (e.vencido) return e.quedanPlazos ? `${quien}: plazo de pago vencido` : `${quien}: último plazo vencido`;
  return `${quien}: pago pendiente hasta el ${fechaCorta(e.hasta)} (${e.plazo}.º plazo)`;
}

// Por colaborador, para el anfitrión (Progreso): cuántos han vencido, y de
// esos cuántos ya sin plazos.
export function impagosVencidos(invitados, ahora = new Date()) {
  const vencidos = (invitados || []).filter((g) => g.confirmado && estadoImpago(g, ahora)?.vencido);
  return {
    vencidos: vencidos.length,
    ultimos: vencidos.filter((g) => !estadoImpago(g, ahora).quedanPlazos).length,
  };
}
