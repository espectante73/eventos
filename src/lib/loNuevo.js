// «Lo nuevo» (él, v81.7): la tarjeta que pone al día a cada colaborador, en
// su panel, de lo añadido estas semanas. Lo nuevo sale hasta que toca
// «Entendido» (se recuerda en ese aparato); «Instala la app» sale en el
// móvil mientras no la abra instalada, y se va sola al abrirla desde su
// icono. Con novedades nuevas en la tarjeta, cambiar LO_NUEVO para que
// vuelva a salir a todos.
import { esAppInstalada } from "./avisosPush";

export const LO_NUEVO = "81.7";
const CLAVE = `lo-nuevo-visto:${LO_NUEVO}`;

const almacenDe = (w) => {
  try {
    return w.localStorage;
  } catch {
    return null;
  }
};

export function leerVisto(w = window) {
  try {
    return almacenDe(w)?.getItem(CLAVE) === "1";
  } catch {
    return false;
  }
}

export function marcarVisto(w = window) {
  try {
    almacenDe(w)?.setItem(CLAVE, "1");
  } catch {
    /* sin memoria: volverá a salir, nada más */
  }
}

// En un aparato táctil (no por el ancho: un iPad apaisado es ancho).
const esTactil = (w) => Boolean(w.matchMedia?.("(pointer: coarse) and (hover: none)").matches);

export function queVerLoNuevo(w = window) {
  return { verNovedades: !leerVisto(w), verInstalar: esTactil(w) && !esAppInstalada(w) };
}
