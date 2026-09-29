// @vitest-environment jsdom
// v53.1: si el servidor no contesta, la pantalla de carga lo dice a los
// pocos segundos y deja volver a intentarlo, en vez de quedarse muda.
import { it, expect, vi, afterEach } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";
import { PantallaCargando, ESPERA_ANTES_DE_AVISAR_MS } from "./PantallaCargando";

afterEach(() => vi.useRealTimers());

it("al principio solo «Abriendo…»; si tarda, avisa y ofrece volver a intentar", () => {
  vi.useFakeTimers();
  const vista = montar(<PantallaCargando />);
  expect(vista.contenedor.textContent).toContain("Abriendo el libro de invitados");
  expect(vista.contenedor.textContent).not.toContain("El servidor tarda en responder");
  act(() => vi.advanceTimersByTime(ESPERA_ANTES_DE_AVISAR_MS));
  expect(vista.contenedor.textContent).toContain("El servidor tarda en responder. Inténtalo en un momento.");
  expect(vista.contenedor.querySelector("button").textContent).toBe("Volver a intentar");
  vista.desmontar();
});

it("si ya se sabe que el servidor ha fallado, lo dice sin esperar", () => {
  const vista = montar(<PantallaCargando sinRespuesta />);
  expect(vista.contenedor.textContent).toContain("El servidor tarda en responder");
  vista.desmontar();
});
