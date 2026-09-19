// Con qué mano se maneja el móvil: pulgar derecho o pulgar izquierdo.
//
// La app pone sus botones al alcance del pulgar DERECHO (ver CLAUDE.md,
// "Normas de estándar"). A petición del usuario (2026-09-19), quien la
// maneje con la izquierda puede pedir que en SU móvil vayan a la izquierda.
//
// - Se guarda EN EL APARATO (localStorage), no en la base: es cómo coge
//   cada uno su móvil. Así no hace falta ni SQL ni sesión, y la app lo
//   recuerda: la pregunta solo sale una vez (ver PreguntaMano, en MiCuenta).
// - Solo cambia algo en aparatos TÁCTILES: en el ordenador todo sigue a la
//   derecha aunque se haya elegido la izquierda.
// - Una sola pieza: aplicarMano() pone data-mano="izquierda" en <html>, y
//   de ese atributo cuelga todo lo demás -- la variante `zurdo:` de
//   Tailwind (tailwind.config.js), los menús (MenuFlotante lo lee al
//   abrirse) y useMano() para lo que se coloca desde JS.
import { useSyncExternalStore } from "react";

export const CLAVE_MANO = "manoPreferida";
export const MANO = { DERECHA: "derecha", IZQUIERDA: "izquierda" };
const EVENTO_CAMBIO = "eventos:cambio-mano";
// Por si localStorage no deja guardar (modo privado estricto): la elección
// vale al menos mientras la pestaña siga abierta, y la pregunta no vuelve
// a salir nada más contestarla.
let manoEnMemoria = null;

const esValida = (valor) => valor === MANO.DERECHA || valor === MANO.IZQUIERDA;

export function leerMano() {
  try {
    const valor = localStorage.getItem(CLAVE_MANO);
    if (esValida(valor)) return valor;
  } catch (_) {
    /* sin localStorage */
  }
  return manoEnMemoria;
}

// Mismo criterio que VistaAnfitrion para "aparato táctil": sin ratón.
export function esAparatoTactil(win = window) {
  return Boolean(win?.matchMedia?.("(pointer: coarse) and (hover: none)").matches);
}

// La mano que de verdad manda: la izquierda solo en un aparato táctil.
export function manoEfectiva(mano, tactil) {
  return tactil && mano === MANO.IZQUIERDA ? MANO.IZQUIERDA : MANO.DERECHA;
}

// `doc`: el de la pestaña, o el de una ventana emergente (usePopupWindow),
// que tiene su propio <html> y necesita su propio atributo.
export function aplicarMano(doc = document) {
  const raiz = doc?.documentElement;
  if (!raiz) return;
  const tactil = esAparatoTactil(doc.defaultView || window);
  if (manoEfectiva(leerMano(), tactil) === MANO.IZQUIERDA) raiz.dataset.mano = MANO.IZQUIERDA;
  else delete raiz.dataset.mano;
}

export function esZurdo(doc = document) {
  return doc?.documentElement?.dataset.mano === MANO.IZQUIERDA;
}

export function alCambiarMano(avisar) {
  window.addEventListener(EVENTO_CAMBIO, avisar);
  // "storage": la cambió otra pestaña de la app en el mismo aparato.
  window.addEventListener("storage", avisar);
  return () => {
    window.removeEventListener(EVENTO_CAMBIO, avisar);
    window.removeEventListener("storage", avisar);
  };
}

export function guardarMano(mano) {
  if (!esValida(mano)) return;
  manoEnMemoria = mano;
  try {
    localStorage.setItem(CLAVE_MANO, mano);
  } catch (_) {
    /* sin localStorage: queda manoEnMemoria */
  }
  aplicarMano();
  window.dispatchEvent(new Event(EVENTO_CAMBIO));
}

// Una vez, al arrancar (main.jsx).
export function iniciarMano() {
  aplicarMano();
  alCambiarMano(() => aplicarMano());
}

// `mano`: la elegida, o null si todavía no se ha preguntado.
// `zurdo`: si hay que poner las cosas a la izquierda en ESTE aparato.
export function useMano() {
  const mano = useSyncExternalStore(alCambiarMano, leerMano, () => null);
  const tactil = esAparatoTactil();
  return { mano, tactil, zurdo: manoEfectiva(mano, tactil) === MANO.IZQUIERDA, elegir: guardarMano };
}
