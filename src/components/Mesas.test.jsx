// @vitest-environment jsdom
// v93.9 (él: «en Mesas no se pueden mover»): en el Mac, Mesas es otra
// ventana del sistema, y la mesa del plano escuchaba el ratón en la
// principal. Como en VentanaFlotante (v80.1), la «otra ventana» es un iframe.
import { it, expect, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { act, useRef } from "react";
import { MesaPlano } from "./Mesas";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function Plano({ onMover }) {
  const lienzo = useRef(null);
  return (
    <div ref={lienzo} data-lienzo>
      <MesaPlano m={{ numero: 3, capacidad: 8, posX: 10, posY: 10 }} ocupados={2} canvasRef={lienzo} onMover={onMover} />
    </div>
  );
}

it("dentro de otra ventana del sistema, la mesa se arrastra con el ratón de ESA ventana", () => {
  const marco = document.createElement("iframe");
  document.body.appendChild(marco);
  const otra = marco.contentWindow;
  const contenedor = document.createElement("div");
  document.body.appendChild(contenedor);
  const raiz = createRoot(contenedor);
  const onMover = vi.fn();
  act(() => raiz.render(createPortal(<Plano onMover={onMover} />, otra.document.body)));
  const lienzo = otra.document.querySelector("[data-lienzo]");
  lienzo.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 });
  const raton = (el, tipo, x, y) => act(() => el.dispatchEvent(new otra.MouseEvent(tipo, { bubbles: true, cancelable: true, clientX: x, clientY: y })));
  raton(lienzo.querySelector(".select-none"), "mousedown", 20, 10);
  raton(otra, "mousemove", 100, 50);
  raton(otra, "mouseup", 100, 50);
  expect(onMover).toHaveBeenCalledWith(3, 50, 50);
  act(() => raiz.unmount());
  marco.remove();
  contenedor.remove();
});
