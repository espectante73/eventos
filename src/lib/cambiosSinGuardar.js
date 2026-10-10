// Lo escrito y todavía sin guardar, por ventana (él, v61.2). La ficha lo
// apunta mientras tiene cambios; quien cierra esa ventana desde fuera (la X
// de la barra del móvil, la X de la propia ventana) lo mira y, si hay algo,
// pregunta antes con la pregunta de «Cancelar» (norma 9).
import { useSyncExternalStore } from "react";

const sinGuardar = new Set();
const oyentes = new Set();
// Lo que ve React: una cadena, que solo cambia si cambia el conjunto.
let foto = "";

export function marcarSinGuardar(clave, hay) {
  if (hay === sinGuardar.has(clave)) return;
  if (hay) sinGuardar.add(clave);
  else sinGuardar.delete(clave);
  foto = [...sinGuardar].sort().join(",");
  oyentes.forEach((oyente) => oyente());
}

export const haySinGuardar = (clave) => sinGuardar.has(clave);

const suscribir = (oyente) => {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
};

// Para pintar: vuelve a dibujar cuando algo pasa a tener (o deja de tener)
// cambios sin guardar. Devuelve haySinGuardar.
export function useSinGuardar() {
  useSyncExternalStore(suscribir, () => foto);
  return haySinGuardar;
}

// La misma que la de «Cancelar» en la ficha.
export const PREGUNTA_DESCARTAR = { titulo: "¿Descartar los cambios?", rotulo: "Sí, descartar" };
