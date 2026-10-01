// La ventana de Música es una PÁGINA PROPIA (?musica, v56): la app entera
// enseñando solo Música, con su sesión y su conexión. Antes era una
// ventana que movía la pestaña principal: al cerrar la app seguía
// sonando sin que nadie la manejara (ni el mando ni sus botones), y al
// volver a abrir Música se montaba un segundo reproductor encima -- dos
// canciones a destiempo (él, en una prueba). Ahora sigue sonando y
// obedeciendo aunque se cierre la app, y Música trae al frente la misma.
export const NOMBRE_VENTANA_MUSICA = "musica-evento";
const CLAVE_ROL = "musica-evento-rol";

export function esVistaMusica(busqueda = window.location.search) {
  try {
    return new URLSearchParams(busqueda).has("musica");
  } catch {
    return false;
  }
}

export function urlMusica(lugar = window.location) {
  return `${lugar.origin}${lugar.pathname}?musica=1`;
}

// ⚠️ Dentro del propio clic, nunca tras un await (CLAUDE.md 2.2): si no,
// Safari la bloquea en silencio. Devuelve false si el navegador no deja.
export function abrirVentanaMusica({ esTactil, abrir = (...a) => window.open(...a), url = urlMusica() }) {
  // Por su nombre: si ya está abierta, el navegador devuelve ESA ventana.
  const ventana = abrir("", NOMBRE_VENTANA_MUSICA, esTactil ? undefined : "width=940,height=800");
  if (!ventana) return false;
  let yaEsMusica = false;
  try {
    yaEsMusica = esVistaMusica(ventana.location.search);
  } catch {
    // Sin poder leerla, se carga la de Música.
  }
  // Si ya es la de Música, no se toca: recargarla cortaría lo que suena.
  // Si no (nueva, o una vieja de antes de v56), se carga.
  if (!yaEsMusica) ventana.location.href = url;
  ventana.focus?.();
  return true;
}

// Una sola página de Música por aparato: la segunda no monta reproductor
// (dos sonarían a destiempo). El cerrojo del navegador se suelta solo al
// cerrar la página. Sin cerrojos (navegador antiguo), se deja pasar.
export function cogerCerrojoMusica(alResultado, cerrojos = globalThis.navigator?.locks) {
  if (!cerrojos?.request) {
    alResultado(true);
    return () => {};
  }
  let vivo = true;
  let soltar = null;
  cerrojos
    .request(NOMBRE_VENTANA_MUSICA, { ifAvailable: true }, (cerrojo) => {
      if (!vivo) return undefined;
      alResultado(Boolean(cerrojo));
      return cerrojo ? new Promise((r) => (soltar = r)) : undefined;
    })
    .catch(() => alResultado(true));
  return () => {
    vivo = false;
    soltar?.();
  };
}

// Un móvil que hizo de mando lo recuerda y no vuelve a preguntar (v56).
// Solo en aparatos táctiles: el Mac tiene que poder elegir siempre ser
// el que suena, y un mando no se puede deshacer desde la ventana.
export function rolRecordado(esTactil) {
  if (!esTactil) return null;
  try {
    return localStorage.getItem(CLAVE_ROL);
  } catch {
    return null;
  }
}

export function recordarRol(rol, esTactil) {
  if (!esTactil) return;
  try {
    localStorage.setItem(CLAVE_ROL, rol);
  } catch {
    // Sin almacenamiento (modo privado): volverá a preguntar, nada más.
  }
}
