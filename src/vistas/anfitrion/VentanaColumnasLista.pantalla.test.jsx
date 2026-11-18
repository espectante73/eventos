// «Columnas» (él, v89.3), DIBUJADA: una casilla por columna, el nombre sin
// casilla, y «Volver a la original» solo cuando hay alguna oculta.
import { it, expect, vi } from "vitest";
import { montar } from "../../pruebas/dibujar";
import { VentanaColumnasLista } from "./VentanaColumnasLista";

const casilla = (titulo) => document.body.querySelector(`label span[title="${titulo}"]`)?.closest("label").querySelector("input");
const volver = () => [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Volver a la original"));

it("marca y desmarca columnas; el nombre se ve siempre; «Volver a la original» las enseña todas", () => {
  const onCambiar = vi.fn();
  const entera = montar(<VentanaColumnasLista ocultas={new Set()} onCambiar={onCambiar} onCerrar={() => {}} />);
  expect(casilla("Invitado · siempre")).toBeFalsy();
  expect(casilla("Pagado").checked).toBe(true);
  expect(volver().disabled).toBe(true);
  entera.pulsar(casilla("Pagado"));
  expect([...onCambiar.mock.calls[0][0]]).toEqual(["pagado"]);
  entera.desmontar();

  const reducida = montar(<VentanaColumnasLista ocultas={new Set(["pagado", "zona"])} onCambiar={onCambiar} onCerrar={() => {}} />);
  expect(casilla("Pagado").checked).toBe(false);
  expect(casilla("Función · y la papelera").checked).toBe(true);
  reducida.pulsar(volver());
  expect(onCambiar.mock.calls.at(-1)[0].size).toBe(0);
  reducida.desmontar();
});
