import { useLayoutEffect } from "react";

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
export function useAltoAutomatico(ref, valor, visible = true) {
  useLayoutEffect(() => {
    const el = ref?.current;
    if (!visible || !el) return;

    const ajustar = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };
    ajustar();

    // Una pasada más en el siguiente fotograma: cubre el caso de que
    // los estilos lleguen sin cambiar el ancho (una fuente distinta,
    // por ejemplo, que cambia el alto de línea pero no el ancho).
    const fotograma = requestAnimationFrame(ajustar);

    let anchoPrevio = el.getBoundingClientRect().width;
    const observador = new ResizeObserver((entradas) => {
      const ancho = entradas[0]?.contentRect.width ?? 0;
      if (ancho === anchoPrevio) return;
      anchoPrevio = ancho;
      ajustar();
    });
    observador.observe(el);

    return () => {
      cancelAnimationFrame(fotograma);
      observador.disconnect();
    };
  }, [ref, valor, visible]);
}
