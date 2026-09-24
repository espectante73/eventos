import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { montar } from "../pruebas/dibujar";
import { Seal } from "./Widgets";

// El sello rojo del botón "Abrir formulario": cuenta lo que falta y late
// igual que una ficha incompleta (usuario, 2026-09-20). Late el SELLO,
// nunca el botón.
describe("Seal", () => {
  let vista, contenedor;
  beforeEach(() => {
    vista = montar(createElement("span"));
    contenedor = vista.contenedor;
  });
  afterEach(() => vista.desmontar());

  const pintar = (props) => vista.pintar(createElement(Seal, props));

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
