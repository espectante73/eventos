// Respuesta al pulsar: un clic suave y, en el móvil, una vibración corta.
// Pedido por el usuario (2026-09-19): sin una señal de que el botón "ha
// entrado", se pulsa varias veces -- y cada pulsación de "Añadir mesa" es
// una mesa más.
//
// Una sola pieza para toda la app: un único escuchador por documento, no un
// aviso por botón. Todo lo que se pulsa responde solo, también lo que se
// añada en el futuro. El relieve y el hundirse son de index.css (.boton-3d).
//
// - El clic se fabrica al vuelo (Web Audio), sin archivo que descargar.
//   ⚠️ El iPhone lo calla con el interruptor lateral de silencio, igual que
//   los clics del teclado. Es lo correcto: no se fuerza.
// - Vibración en Android: navigator.vibrate.
// - Vibración en iPhone: Safari no tiene navigator.vibrate. Lo único que
//   hace vibrar a una página es TOCAR con el dedo un interruptor nativo
//   (<input type="checkbox" switch>, iOS 18+). Hasta iOS 26.4 bastaba con
//   pulsarlo desde el código; Apple lo cerró en iOS 26.5 (primera versión,
//   v36, falló por eso: el usuario no notaba nada). Lo que sigue
//   funcionando: poner DENTRO de cada botón un interruptor invisible que lo
//   cubre entero, de modo que el dedo lo toca de verdad. El toque sigue
//   subiendo al botón y su acción se ejecuta igual. Técnica comprobada en
//   aparato real por github.com/m1ckc3s/project-fathom.
// - Dentro de la Música del evento NO suena el clic (data-sin-sonido-clic):
//   el aparato que reproduce puede estar conectado a los altavoces del
//   local. La vibración sí se mantiene.
import { esAparatoTactil } from "./mano";

const PULSABLE = 'button, summary, a[href], [role="button"], [role="radio"], input[type="checkbox"], input[type="radio"], label';
const TIPOS_CON_CLIC = new Set(["checkbox", "radio", "file"]);
export const CLASE_INTERRUPTOR = "interruptor-haptico";

// Qué hacer al pulsar `elemento`: null (nada), o { sonido, vibracion }.
export function queRespuesta(elemento) {
  const pulsable = elemento?.closest?.(PULSABLE);
  if (!pulsable) return null;
  // Una etiqueta solo cuenta si maneja una casilla o un "subir archivo":
  // tocar la etiqueta de un campo de texto no es pulsar un botón.
  if (pulsable.tagName === "LABEL" && !TIPOS_CON_CLIC.has(pulsable.control?.type)) return null;
  // El interruptor invisible cuenta como el botón que lo lleva dentro.
  const boton = pulsable.classList?.contains(CLASE_INTERRUPTOR) ? pulsable.parentElement : pulsable;
  if (!boton || boton.disabled || boton.getAttribute("aria-disabled") === "true") return null;
  return { sonido: !boton.closest("[data-sin-sonido-clic]"), vibracion: true };
}

let contexto = null;
let ruido = null;
function sonarClic() {
  try {
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return;
    contexto ||= new Contexto();
    if (contexto.state === "suspended") contexto.resume();
    // Un "tic" como el de una tecla: 12 milésimas de ruido que se apaga,
    // pasado por un filtro para que suene seco y no a soplido. La primera
    // versión (un pitido a volumen 0,05) no se oía en el altavoz del móvil.
    if (!ruido) {
      const muestras = Math.floor(contexto.sampleRate * 0.012);
      ruido = contexto.createBuffer(1, muestras, contexto.sampleRate);
      const datos = ruido.getChannelData(0);
      for (let i = 0; i < muestras; i++) datos[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / muestras, 3);
    }
    const fuente = contexto.createBufferSource();
    fuente.buffer = ruido;
    const filtro = contexto.createBiquadFilter();
    filtro.type = "bandpass";
    filtro.frequency.value = 2400;
    filtro.Q.value = 0.8;
    const volumen = contexto.createGain();
    volumen.gain.value = 0.6;
    fuente.connect(filtro).connect(volumen).connect(contexto.destination);
    fuente.start();
  } catch (_) {
    /* sin sonido: no pasa nada */
  }
}

function tieneVibracionOficial(win) {
  return typeof win.navigator.vibrate === "function";
}

// Solo para Android (y para el iPhone hasta iOS 26.4 cuando lo tocado no es
// un botón con interruptor dentro: un enlace, una casilla...).
function vibrar(doc, elemento) {
  const win = doc.defaultView || window;
  if (!esAparatoTactil(win)) return;
  if (tieneVibracionOficial(win)) {
    win.navigator.vibrate(10);
    return;
  }
  // Si el dedo ya tocó el interruptor de dentro del botón, el iPhone ya ha
  // vibrado solo.
  if (elemento?.classList?.contains(CLASE_INTERRUPTOR)) return;
  let etiqueta = doc.getElementById("interruptor-vibracion");
  if (!etiqueta) {
    etiqueta = doc.createElement("label");
    etiqueta.id = "interruptor-vibracion";
    etiqueta.setAttribute("aria-hidden", "true");
    etiqueta.style.display = "none";
    const interruptor = doc.createElement("input");
    interruptor.type = "checkbox";
    interruptor.setAttribute("switch", "");
    interruptor.tabIndex = -1;
    etiqueta.appendChild(interruptor);
    doc.head.appendChild(etiqueta);
  }
  etiqueta.click();
}

// El interruptor invisible dentro de un botón (ver la cabecera).
function ponerInterruptor(boton) {
  if (boton.querySelector(`:scope > .${CLASE_INTERRUPTOR}`)) return;
  const doc = boton.ownerDocument;
  // Tiene que cubrir el botón: si el botón no está "posicionado", el
  // interruptor se iría a cubrir otra cosa.
  if (doc.defaultView.getComputedStyle(boton).position === "static") boton.style.position = "relative";
  const interruptor = doc.createElement("input");
  interruptor.type = "checkbox";
  interruptor.setAttribute("switch", "");
  interruptor.className = CLASE_INTERRUPTOR;
  interruptor.tabIndex = -1; // el teclado sigue yendo al botón
  interruptor.setAttribute("aria-hidden", "true");
  boton.appendChild(interruptor);
}

// Todos los <button>, también los que aparezcan después (ventanas que se
// abren, filas nuevas). Solo <button>: dentro de un enlace, una etiqueta o
// un plegable nativo, el interruptor les robaría la acción.
function vigilarBotones(doc) {
  const win = doc.defaultView;
  const repasar = () => doc.querySelectorAll("button").forEach(ponerInterruptor);
  let programado = false;
  const observador = new win.MutationObserver(() => {
    if (programado) return;
    programado = true;
    win.requestAnimationFrame(() => {
      programado = false;
      repasar();
    });
  });
  const empezar = () => {
    repasar();
    observador.observe(doc.body, { childList: true, subtree: true });
  };
  if (doc.body) empezar();
  else doc.addEventListener("DOMContentLoaded", empezar, { once: true });
}

let ultima = 0;
function responder(elemento) {
  const respuesta = queRespuesta(elemento);
  if (!respuesta) return;
  const ahora = Date.now();
  if (ahora - ultima < 40) return; // una pulsación, una respuesta
  ultima = ahora;
  if (respuesta.sonido) sonarClic();
  if (respuesta.vibracion) vibrar(elemento.ownerDocument, elemento);
}

// Una vez por documento: el de la pestaña (main.jsx) y el de cada ventana
// emergente (usePopupWindow), que tiene el suyo propio.
export function activarRespuestaTactil(doc = document) {
  if (doc.__respuestaTactil) return;
  doc.__respuestaTactil = true;
  const win = doc.defaultView || window;
  // Sin esto el iPhone no aplica :active, y el botón no se hunde al tocarlo.
  doc.addEventListener("touchstart", () => {}, { passive: true });
  // El interruptor dentro de cada botón: solo en el iPhone (táctil y sin
  // vibración oficial). En Android y en el ordenador no hace falta.
  if (esAparatoTactil(win) && !tieneVibracionOficial(win)) vigilarBotones(doc);
  doc.addEventListener(
    "click",
    (e) => {
      // isTrusted: solo el dedo o el ratón de verdad. Deja fuera los clics
      // de código, entre ellos el del propio interruptor de la vibración.
      if (!e.isTrusted) return;
      responder(e.target);
      // Un botón de "enviar formulario" con el interruptor dentro: el toque
      // lo recibe el interruptor, y el navegador ya no envía el formulario
      // por su cuenta. Se envía aquí, como si se hubiera pulsado el botón.
      if (e.target.classList?.contains(CLASE_INTERRUPTOR)) {
        const boton = e.target.parentElement;
        if (boton?.type === "submit" && boton.form && !boton.disabled) boton.form.requestSubmit(boton);
      }
    },
    true
  );
  // Un desplegable responde al ELEGIR una opción, no al abrirlo.
  doc.addEventListener(
    "change",
    (e) => {
      if (e.isTrusted && e.target?.tagName === "SELECT") {
        const ahora = Date.now();
        if (ahora - ultima < 40) return;
        ultima = ahora;
        if (!e.target.closest("[data-sin-sonido-clic]")) sonarClic();
        vibrar(e.target.ownerDocument, e.target);
      }
    },
    true
  );
}
