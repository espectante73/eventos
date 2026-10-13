// @vitest-environment jsdom
// v63.8: el «auto» en cada letra hacía parpadear y subir la ventana.
// Escribiendo, el recuadro solo se estira; al borrar, se mide en «auto».
import { it, expect, beforeAll } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { useAltoAutomatico } from "./useAltoAutomatico";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
});

// Un recuadro de mentira: apunta cada alto que se le pone.
function recuadro() {
  const altos = [];
  let alto = "";
  return {
    altos,
    scrollHeight: 120,
    clientHeight: 100,
    offsetHeight: 102,
    value: "",
    selectionEnd: 0,
    parentElement: null,
    ownerDocument: document,
    getBoundingClientRect: () => ({ width: 300, bottom: 0 }),
    style: {
      get height() {
        return alto;
      },
      set height(v) {
        alto = v;
        altos.push(v);
      },
    },
  };
}

function Prueba({ el, valor }) {
  useAltoAutomatico({ current: el }, valor);
  return null;
}

it("escribiendo se estira sin encogerse; al borrar, se mide en «auto»", async () => {
  const el = recuadro();
  const caja = document.createElement("div");
  const raiz = createRoot(caja);
  await act(async () => raiz.render(<Prueba el={el} valor="Hola" />));
  el.altos.length = 0;

  await act(async () => raiz.render(<Prueba el={el} valor="Hola, ¿qué tal?" />));
  expect(el.altos).not.toContain("auto");
  expect(el.altos).toContain("122px"); // scrollHeight + borde

  el.altos.length = 0;
  await act(async () => raiz.render(<Prueba el={el} valor="Hola" />));
  expect(el.altos[0]).toBe("auto");
  await act(async () => raiz.unmount());
});
