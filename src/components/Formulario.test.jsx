// @vitest-environment jsdom
// v51.4: en la ventana aparte de la Lista no se podía escribir una tilde
// en "Buscar...". El valor vive en la pestaña principal y llega un instante
// tarde; un campo controlado normal volvía al texto anterior justo entre
// la "´" y la vocal. Aquí se simula ese retraso: el valor de fuera NO
// cambia al escribir.
import { it, expect } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";
import { TextInputEnVentanaAparte } from "./Formulario";

const escribir = (input, valor) =>
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, valor);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

it("lo escrito no vuelve atrás aunque el valor de fuera llegue tarde (la tilde se queda)", () => {
  const recibidos = [];
  const vista = montar(<TextInputEnVentanaAparte value="" onCambio={(v) => recibidos.push(v)} />);
  const campo = vista.contenedor.querySelector("input");
  campo.focus();
  escribir(campo, "´");
  expect(campo.value).toBe("´");
  escribir(campo, "á");
  expect(campo.value).toBe("á");
  expect(recibidos).toEqual(["´", "á"]);
  vista.desmontar();
});

it("un cambio de fuera (la Revisión) se aplica cuando no se está escribiendo", () => {
  const vista = montar(<TextInputEnVentanaAparte value="" onCambio={() => {}} />);
  vista.pintar(<TextInputEnVentanaAparte value="Gatell, Juan" onCambio={() => {}} />);
  expect(vista.contenedor.querySelector("input").value).toBe("Gatell, Juan");
  vista.desmontar();
});
