// «Lo nuevo» (él, v81.7-81.9): aviso arriba del todo en el Inicio de cada
// colaborador, plegado en una línea, con lo añadido estas semanas (él no
// lee «Versiones», que es del anfitrión). Temporal (él: «hasta algo nuevo o
// quitarlo en un tiempo»): sale hasta LO_NUEVO_HASTA, incluido, sin
// «Entendido». Con novedades nuevas, se cambian las líneas de AvisoLoNuevo
// y la fecha. «Instala la app», dentro, solo en el móvil sin instalar: en
// el iPhone, sin eso no llegan los avisos.
import { esAppInstalada } from "./avisosPush";

export const LO_NUEVO_HASTA = "2026-11-18";

// "AAAA-MM-DD" de un día, en la hora de este aparato.
const diaDe = (fecha) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

// En un aparato táctil (no por el ancho: un iPad apaisado es ancho).
const esTactil = (w) => Boolean(w.matchMedia?.("(pointer: coarse) and (hover: none)").matches);

export function queVerLoNuevo(w = window, hoy = new Date()) {
  const ver = diaDe(hoy) <= LO_NUEVO_HASTA;
  return { ver, verInstalar: ver && esTactil(w) && !esAppInstalada(w) };
}
