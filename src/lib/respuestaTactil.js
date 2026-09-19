// Respuesta al pulsar: un clic muy suave y, en el móvil, una vibración
// corta. Pedido por el usuario (2026-09-19): sin una señal de que el botón
// "ha entrado", se pulsa varias veces -- y cada pulsación de "Añadir mesa"
// es una mesa más.
//
// Una sola pieza para toda la app: un único escuchador en el documento, no
// un aviso por botón. Todo lo que se pulsa (botones, desplegables, casillas,
// títulos plegables, enlaces) responde solo, también lo que se añada en el
// futuro. El relieve y el hundirse al pulsar son de index.css (.boton-3d).
//
// - El sonido se fabrica al vuelo (Web Audio), sin archivo que descargar.
//   Respeta el interruptor de silencio del iPhone.
// - Vibración: Android la da con navigator.vibrate. El iPhone NO deja vibrar
//   a una página web por la vía oficial; desde iOS 18, pulsar un interruptor
//   (<input type="checkbox" switch>) da el "tic" del sistema, y aquí se pulsa
//   uno escondido. Si Apple lo quita, simplemente no vibra.
// - Dentro de la Música del evento NO suena el clic (data-sin-sonido-clic):
//   el aparato que reproduce puede estar conectado a los altavoces del
//   local. La vibración sí se mantiene.
import { esAparatoTactil } from "./mano";

const PULSABLE = 'button, summary, a[href], [role="button"], [role="radio"], input[type="checkbox"], input[type="radio"], label';
const TIPOS_CON_CLIC = new Set(["checkbox", "radio", "file"]);

// Qué hacer al pulsar `elemento`: null (nada), o { sonido, vibracion }.
export function queRespuesta(elemento) {
  const pulsable = elemento?.closest?.(PULSABLE);
  if (!pulsable) return null;
  // Una etiqueta solo cuenta si maneja una casilla o un "subir archivo":
  // tocar la etiqueta de un campo de texto no es pulsar un botón.
  if (pulsable.tagName === "LABEL" && !TIPOS_CON_CLIC.has(pulsable.control?.type)) return null;
  if (pulsable.disabled || pulsable.getAttribute("aria-disabled") === "true") return null;
  return { sonido: !pulsable.closest("[data-sin-sonido-clic]"), vibracion: true };
}

let contexto = null;
function sonarClic() {
  try {
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return;
    contexto ||= new Contexto();
    if (contexto.state === "suspended") contexto.resume();
    const t = contexto.currentTime;
    // Un "tic" de 35 milésimas: tono que cae de 1500 a 600 Hz y se apaga.
    const tono = contexto.createOscillator();
    tono.type = "sine";
    tono.frequency.setValueAtTime(1500, t);
    tono.frequency.exponentialRampToValueAtTime(600, t + 0.03);
    const volumen = contexto.createGain();
    volumen.gain.setValueAtTime(0.0001, t);
    volumen.gain.exponentialRampToValueAtTime(0.05, t + 0.002);
    volumen.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
    tono.connect(volumen).connect(contexto.destination);
    tono.start(t);
    tono.stop(t + 0.04);
  } catch (_) {
    /* sin sonido: no pasa nada */
  }
}

function vibrar(doc) {
  const win = doc.defaultView || window;
  if (!esAparatoTactil(win)) return;
  if (typeof win.navigator.vibrate === "function") {
    win.navigator.vibrate(10);
    return;
  }
  // iPhone: el interruptor escondido (ver la cabecera).
  let etiqueta = doc.getElementById("interruptor-vibracion");
  if (!etiqueta) {
    etiqueta = doc.createElement("label");
    etiqueta.id = "interruptor-vibracion";
    etiqueta.setAttribute("aria-hidden", "true");
    etiqueta.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none";
    const interruptor = doc.createElement("input");
    interruptor.type = "checkbox";
    interruptor.setAttribute("switch", "");
    interruptor.tabIndex = -1;
    etiqueta.appendChild(interruptor);
    doc.body.appendChild(etiqueta);
  }
  etiqueta.click();
}

let ultima = 0;
function responder(elemento) {
  const respuesta = queRespuesta(elemento);
  if (!respuesta) return;
  const ahora = Date.now();
  if (ahora - ultima < 40) return; // una pulsación, una respuesta
  ultima = ahora;
  if (respuesta.sonido) sonarClic();
  if (respuesta.vibracion) vibrar(elemento.ownerDocument);
}

// Una vez por documento: el de la pestaña (main.jsx) y el de cada ventana
// emergente (usePopupWindow), que tiene el suyo propio.
export function activarRespuestaTactil(doc = document) {
  if (doc.__respuestaTactil) return;
  doc.__respuestaTactil = true;
  // Sin esto el iPhone no aplica :active, y el botón no se hunde al tocarlo.
  doc.addEventListener("touchstart", () => {}, { passive: true });
  doc.addEventListener(
    "click",
    (e) => {
      // isTrusted: solo el dedo o el ratón de verdad. Deja fuera los clics
      // de código, entre ellos el del propio interruptor de la vibración.
      if (e.isTrusted) responder(e.target);
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
        vibrar(e.target.ownerDocument);
      }
    },
    true
  );
}
