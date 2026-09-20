import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createElement, act } from "react";
import { createRoot } from "react-dom/client";
import { Seal } from "./Widgets";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// El sello rojo del botón "Abrir formulario": cuenta lo que falta y late
// igual que una ficha incompleta (usuario, 2026-09-20). Late el SELLO,
// nunca el botón.
describe("Seal", () => {
  let contenedor, raiz;
  beforeEach(() => {
    contenedor = document.createElement("div");
    document.body.appendChild(contenedor);
    raiz = createRoot(contenedor);
  });
  afterEach(() => {
    act(() => raiz.unmount());
    contenedor.remove();
  });

  const pintar = (props) => act(() => raiz.render(createElement(Seal, props)));

  it("sin nada pendiente no se pinta: un cero no es un aviso", () => {
    pintar({ count: 0, late: true });
    expect(contenedor.textContent).toBe("");
  });

  it("con `late` da el latido", () => {
    pintar({ count: 7, late: true });
    const sello = contenedor.querySelector("span");
    expect(sello.textContent).toBe("7");
    expect(sello.className).toContain("sello-latiendo");
  });

  it("sin `late` es el sello de siempre, quieto", () => {
    pintar({ count: 7 });
    expect(contenedor.querySelector("span").className).not.toContain("sello-latiendo");
  });
});
