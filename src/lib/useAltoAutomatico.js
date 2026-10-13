import { useLayoutEffect, useRef } from "react";

// Hace que un <textarea> crezca hasta donde llegue su texto, en vez de
// quedarse en las filas que tenga puestas.
//
// Nació el 2026-09-16, reportado desde el móvil: al abrir una novedad
// para editarla solo se veían tres líneas y no había forma de estirar
// el recuadro -- en el móvil no hay esquina que arrastrar. En el Mac
// se podía arrastrar y por eso no se había notado.
//
// ⚠️ NO BASTA CON MEDIR AL MONTAR, y esto costó una segunda vuelta.
// Novedades vive en una ventana aparte del sistema, y a esa ventana los
// estilos se le COPIAN a mano al <head> (ver lib/usePopupWindow.js):
// pueden aplicarse DESPUÉS de que este efecto haya medido. Midiendo una
// sola vez, el alto sale calculado sobre un textarea todavía sin
// estilo, y como el texto no cambia, nadie vuelve a medir nunca. Es
// exactamente el mismo tropiezo que ya hubo con las columnas de la
// Lista de invitados (ver CLAUDE.md), donde la medida corría antes de
// que los estilos copiados existieran.
//
// Por eso se vigila también el ANCHO del propio recuadro: cuando los
// estilos llegan de verdad, el ancho cambia y se vuelve a medir. Se
// mira el ancho y no el alto a propósito -- reaccionar al alto sería
// un bucle, porque este efecto es justo quien lo cambia.
//
// El truco del "auto" antes de medir es necesario: sin él,
// `scrollHeight` devuelve el alto actual y el recuadro solo podría
// crecer -- al borrar texto se quedaría grande para siempre.
// `visible`: cuándo el recuadro existe de verdad en la pantalla.
//
// ⚠️ Hace falta, y su ausencia fue lo que hizo fallar dos intentos
// seguidos. En Novedades el <textarea> solo se monta al desplegar la
// tarjeta, pero la tarjeta (que es quien llama a este hook) sigue viva
// mientras tanto. Al desplegar no cambia ni el texto ni la ref, así que
// React no volvía a ejecutar el efecto: la medición era correcta, pero
// se hacía en un momento que no llegaba nunca. En las plantillas de
// email no pasaba porque allí se desmonta el componente entero y el
// efecto corre al remontarlo -- de ahí que uno funcionara y el otro no.
//
// ⚠️ Ese «auto», hecho en CADA letra, hacía parpadear la ventana y la
// subía: al encogerse el recuadro, la ventana perdía alto un instante, el
// navegador la recolocaba arriba y lo que se escribía quedaba fuera de
// la vista (él, v63.8). Ahora: si el texto crece, se estira sin encoger;
// solo si se acorta se mide en «auto», sujetando antes el alto de lo que
// lo rodea y dejando cada desplazamiento donde estaba. Y escribiendo al
// final, la ventana baja con el texto.
const MARGEN_CURSOR = 16;

// Lo que se desplaza alrededor del recuadro, de dentro afuera.
function conDesplazamiento(el) {
  const lista = [];
  const win = el.ownerDocument.defaultView;
  for (let p = el.parentElement; p; p = p.parentElement) {
    const { overflowY } = win.getComputedStyle(p);
    if ((overflowY === "auto" || overflowY === "scroll") && p.scrollHeight > p.clientHeight) lista.push(p);
  }
  const doc = el.ownerDocument.scrollingElement;
  if (doc) lista.push(doc);
  return lista;
}

// Escribiendo al final, que la última línea no se quede debajo del
// borde (ni del teclado del móvil).
function seguirAlCursor(el) {
  const doc = el.ownerDocument;
  if (doc.activeElement !== el || el.selectionEnd < el.value.length - 1) return;
  const win = doc.defaultView;
  const [contenedor] = conDesplazamiento(el);
  if (!contenedor) return;
  const vista = win.visualViewport;
  const finVentana = vista ? vista.offsetTop + vista.height : win.innerHeight;
  const finVisible = contenedor === doc.scrollingElement ? finVentana : Math.min(finVentana, contenedor.getBoundingClientRect().bottom);
  const sobra = el.getBoundingClientRect().bottom - (finVisible - MARGEN_CURSOR);
  if (sobra > 0) contenedor.scrollTop += sobra;
}

export function useAltoAutomatico(ref, valor, visible = true) {
  const largoPrevio = useRef(null);
  useLayoutEffect(() => {
    const el = ref?.current;
    if (!visible || !el) return;

    const ajustar = (puedeEncoger) => {
      // El borde: con box-sizing border-box, el alto lo incluye.
      const borde = el.offsetHeight - el.clientHeight;
      if (!puedeEncoger) {
        if (el.scrollHeight > el.clientHeight) el.style.height = `${el.scrollHeight + borde}px`;
        return;
      }
      const padre = el.parentElement;
      const desplazados = conDesplazamiento(el).map((c) => [c, c.scrollTop]);
      if (padre) padre.style.minHeight = `${padre.offsetHeight}px`;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight + borde}px`;
      if (padre) padre.style.minHeight = "";
      desplazados.forEach(([c, arriba]) => {
        c.scrollTop = arriba;
      });
    };

    const largo = String(valor ?? "").length;
    const primera = largoPrevio.current === null;
    ajustar(primera || largo < largoPrevio.current);
    largoPrevio.current = largo;
    seguirAlCursor(el);

    // Una pasada más en el siguiente fotograma: cubre el caso de que
    // los estilos lleguen sin cambiar el ancho (una fuente distinta,
    // por ejemplo, que cambia el alto de línea pero no el ancho).
    const fotograma = requestAnimationFrame(() => ajustar(primera));

    let anchoPrevio = el.getBoundingClientRect().width;
    const observador = new ResizeObserver((entradas) => {
      const ancho = entradas[0]?.contentRect.width ?? 0;
      if (ancho === anchoPrevio) return;
      anchoPrevio = ancho;
      ajustar(true);
    });
    observador.observe(el);

    return () => {
      cancelAnimationFrame(fotograma);
      observador.disconnect();
    };
  }, [ref, valor, visible]);

  // Al plegarse, la próxima vez se vuelve a medir desde cero.
  useLayoutEffect(() => {
    if (!visible) largoPrevio.current = null;
  }, [visible]);
}
