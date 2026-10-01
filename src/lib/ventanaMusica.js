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

// Abre (o trae al frente) una página propia por su nombre. Si ya es la
// suya, no se toca: recargarla cortaría lo que suena o se ve. Si no
// (nueva, o una vieja de antes de v56), se carga. ⚠️ Dentro del propio
// clic, nunca tras un await (CLAUDE.md 2.2): si no, Safari la bloquea en
// silencio. Devuelve false si el navegador no deja.
function abrirPaginaPropia({ nombre, url, tamano, esLaSuya, abrir }) {
  const ventana = abrir("", nombre, tamano);
  if (!ventana) return false;
  let yaEs = false;
  try {
    yaEs = esLaSuya(ventana.location.search);
  } catch {
    // Sin poder leerla, se carga.
  }
  if (!yaEs) ventana.location.href = url;
  ventana.focus?.();
  return true;
}

// Solo en el ordenador: en el móvil, Música va dentro de la app, con la
// barra de ventanas (App.jsx).
export function abrirVentanaMusica({ abrir = (...a) => window.open(...a), url = urlMusica() } = {}) {
  return abrirPaginaPropia({ nombre: NOMBRE_VENTANA_MUSICA, url, tamano: "width=940,height=800", esLaSuya: esVistaMusica, abrir });
}

// ---------- La pantalla de la tele (v58) ----------
// Otra página propia (?pantalla): solo el vídeo, a pantalla completa en
// la tele. Se abre en el Mac conectado a ella, se arrastra allí y se pone
// a pantalla completa. Siempre en silencio: el sonido de un vídeo lo pone
// el Mac del sonido (paso 2), sea el mismo Mac o otro.
export const NOMBRE_VENTANA_PANTALLA = "pantalla-evento";

export function esVistaPantalla(busqueda = window.location.search) {
  try {
    return new URLSearchParams(busqueda).has("pantalla");
  } catch {
    return false;
  }
}

export function urlPantalla(lugar = window.location) {
  return `${lugar.origin}${lugar.pathname}?pantalla=1`;
}

export function abrirVentanaPantalla({ abrir = (...a) => window.open(...a), url = urlPantalla() } = {}) {
  return abrirPaginaPropia({ nombre: NOMBRE_VENTANA_PANTALLA, url, tamano: "width=960,height=540", esLaSuya: esVistaPantalla, abrir });
}

// Los tres vídeos, como mucho (él): el logo manda; las fotos se ven una
// vez y, al terminar, la pantalla vuelve sola al logo.
export const VIDEOS = [
  { clave: "logo", titulo: "Logo" },
  { clave: "fotos1", titulo: "Fotos 1" },
  { clave: "fotos2", titulo: "Fotos 2" },
];
export const VIDEO_REPOSO = "logo";

// Qué se pone cuando un vídeo termina: el logo no termina nunca (bucle).
export function despuesDe(clave) {
  return clave === VIDEO_REPOSO ? null : VIDEO_REPOSO;
}

// El botón Música, para el anfitrión y para el colaborador con permiso:
// en el ordenador, su página propia; en el móvil (o si el navegador
// bloquea la ventana), dentro de la app con la barra de ventanas. La
// pregunta es qué APARATO es, no cuánto mide la ventana: con el navegador
// a media pantalla, el Mac también mide poco (2026-09-01).
export function abrirMusica(abrirDentro) {
  const esTactil = Boolean(window.matchMedia?.("(pointer: coarse) and (hover: none)")?.matches);
  if (esTactil || !abrirVentanaMusica()) abrirDentro?.();
}

// Una sola página de Música por aparato: la segunda no monta reproductor
// (dos sonarían a destiempo). El cerrojo del navegador se suelta solo al
// cerrar la página. Sin cerrojos (navegador antiguo), se deja pasar.
export function cogerCerrojoMusica(alResultado, cerrojos = globalThis.navigator?.locks, nombre = NOMBRE_VENTANA_MUSICA) {
  if (!cerrojos?.request) {
    alResultado(true);
    return () => {};
  }
  let vivo = true;
  let soltar = null;
  cerrojos
    .request(nombre, { ifAvailable: true }, (cerrojo) => {
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

// Cada aparato recuerda su pestaña de Multimedia (Audio o Vídeo): el móvil
// del colaborador del vídeo abre directamente en Vídeo (v58).
const CLAVE_PARTE = "multimedia-parte";
export function parteRecordada() {
  try {
    return localStorage.getItem(CLAVE_PARTE) === "video" ? "video" : "audio";
  } catch {
    return "audio";
  }
}
export function recordarParte(parte) {
  try {
    localStorage.setItem(CLAVE_PARTE, parte);
  } catch {
    // Sin almacenamiento: abrirá en Audio, nada más.
  }
}
