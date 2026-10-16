// La ventana aparte (Lista de invitados en el Mac) no puede quedarse
// «muerta» tras recargarse la pestaña con una versión nueva (él, v68.7:
// «no filtra nada»).
import { it, expect, vi, afterEach } from "vitest";
import { act, useEffect } from "react";
import { montar } from "../pruebas/dibujar";
import { usePopupWindow } from "./usePopupWindow";

// Una ventana de mentira: su propio documento, como la de verdad.
function ventanaFalsa() {
  const doc = document.implementation.createHTMLDocument("");
  return { document: doc, closed: false, close: vi.fn(function () { this.closed = true; }), focus: () => {}, addEventListener: () => {} };
}

let abrirRef;
function Prueba() {
  const { abrir } = usePopupWindow({ nombreVentana: "lista-invitados" });
  useEffect(() => {
    abrirRef = abrir;
  });
  return null;
}

afterEach(() => vi.restoreAllMocks());

it("si con ese nombre ya había una ventana con la lista vieja, se vacía antes de pintar", () => {
  const vieja = ventanaFalsa();
  vieja.document.body.innerHTML = '<div class="raiz-ventana-emergente">lista muerta</div>';
  vi.spyOn(window, "open").mockReturnValue(vieja);
  const vista = montar(<Prueba />);
  act(() => abrirRef());
  expect(vieja.document.body.textContent).not.toContain("lista muerta");
  expect(vieja.document.querySelectorAll(".raiz-ventana-emergente")).toHaveLength(1);
  vista.desmontar();
});

it("al irse la pestaña (recarga por versión nueva), cierra su ventana", () => {
  const nueva = ventanaFalsa();
  vi.spyOn(window, "open").mockReturnValue(nueva);
  const vista = montar(<Prueba />);
  act(() => abrirRef());
  window.dispatchEvent(new Event("pagehide"));
  expect(nueva.close).toHaveBeenCalled();
  vista.desmontar();
});
