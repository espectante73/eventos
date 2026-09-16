import { useLayoutEffect } from "react";

// Hace que un <textarea> crezca hasta donde llegue su texto, en vez de
// quedarse en las filas que tenga puestas.
//
// Nació el 2026-09-16, reportado desde el móvil: al abrir una novedad
// para editarla solo se veían tres líneas y no había forma de estirar
// el recuadro -- en el móvil no hay esquina que arrastrar. En el Mac
// se podía arrastrar y por eso no se había notado.
//
// Se aplica al abrir (no solo al escribir): quien abre un texto ya
// escrito lo ve entero desde el primer momento, que es justo lo que
// faltaba.
//
// El truco del "auto" antes de medir es necesario: sin él, `scrollHeight`
// devuelve el alto actual y el recuadro solo puede crecer -- al borrar
// texto se quedaría grande para siempre.
export function useAltoAutomatico(ref, valor) {
  useLayoutEffect(() => {
    const el = ref?.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [ref, valor]);
}
