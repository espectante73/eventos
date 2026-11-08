// «Lo nuevo» (él, v81.7-82): aviso arriba del todo en el Inicio de cada
// colaborador, plegado en una línea, con lo añadido estas semanas (él no
// lee «Versiones», que es del anfitrión). Temporal (él: «hasta algo nuevo o
// quitarlo en un tiempo»): sale hasta LO_NUEVO_HASTA, incluido, sin
// «Entendido». Con novedades nuevas, se cambian las líneas de AvisoLoNuevo
// y la fecha. Los pasos de instalar van SIEMPRE dentro (él, v82: «no tiene
// sentido avisos si no tiene instrucciones»): antes se escondían a quien ya
// la tenía instalada o entraba desde el ordenador, y él no los veía.

export const LO_NUEVO_HASTA = "2026-11-22";

// "AAAA-MM-DD" de un día, en la hora de este aparato.
const diaDe = (fecha) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

export const hayLoNuevo = (hoy = new Date()) => diaDe(hoy) <= LO_NUEVO_HASTA;
