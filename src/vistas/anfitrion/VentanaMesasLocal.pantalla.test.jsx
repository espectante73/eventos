// «Mesas del local» (v101.2), DIBUJADA de verdad: una línea por tamaño, el
// total de comensales al pie, «Guardar» limpio y el aviso si algo no vale.
import { it, expect } from "vitest";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaMesasLocal } from "./VentanaMesasLocal";

const escribir = (input, valor) =>
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, valor);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
const boton = (t) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === t || b.title === t);
const campos = (etiqueta) => [...document.body.querySelectorAll(`[aria-label="${etiqueta}"]`)];

function dibujar(evento) {
  const guardados = [];
  const cerradas = [];
  const vista = montar(<VentanaMesasLocal evento={evento} persistEvento={(e) => guardados.push(e)} onCerrar={() => cerradas.push(1)} />);
  return { vista, guardados, cerradas };
}

it("cada tamaño en su línea, de mayor a menor, y al pie cuántos comensales caben", () => {
  const { vista } = dibujar({ mesasLocal: [{ sitios: 9, cuantas: 10 }, { sitios: 11, cuantas: 4 }] });
  expect(campos("Sitios por mesa").map((c) => c.value)).toEqual(["11", "9"]);
  expect(campos("Cuántas mesas").map((c) => c.value)).toEqual(["4", "10"]);
  expect(document.body.querySelector("[data-total]").textContent).toBe("Total: 14 mesas, hasta 134 comensales");
  vista.desmontar();
});

it("sin configurar, una línea vacía; «Tamaño» añade otra y «Guardar» guarda solo las completas", () => {
  const { vista, guardados, cerradas } = dibujar({ mesasLocal: null });
  expect(campos("Sitios por mesa")).toHaveLength(1);
  escribir(campos("Sitios por mesa")[0], "9");
  escribir(campos("Cuántas mesas")[0], "10");
  vista.pulsar(boton("Tamaño"));
  escribir(campos("Sitios por mesa")[1], "11");
  escribir(campos("Cuántas mesas")[1], "4");
  vista.pulsar(boton("Tamaño"));
  expect(document.body.querySelector("[data-total]").textContent).toBe("Total: 14 mesas, hasta 134 comensales");
  vista.pulsar(boton("Guardar"));
  expect(guardados.at(-1).mesasLocal).toEqual([{ sitios: 11, cuantas: 4 }, { sitios: 9, cuantas: 10 }]);
  expect(cerradas).toHaveLength(1);
  vista.desmontar();
});

it("una línea a medias no se guarda: dice cuál", () => {
  const { vista, guardados, cerradas } = dibujar({ mesasLocal: null });
  escribir(campos("Sitios por mesa")[0], "11");
  vista.pulsar(boton("Guardar"));
  expect(document.body.textContent).toContain("En la línea 1 falta un número");
  expect(guardados).toEqual([]);
  expect(cerradas).toEqual([]);
  vista.desmontar();
});

it("salir con algo escrito pregunta antes", () => {
  const { vista, cerradas } = dibujar({ mesasLocal: [{ sitios: 11, cuantas: 4 }] });
  escribir(campos("Cuántas mesas")[0], "5");
  vista.pulsar(boton("Cancelar"));
  expect(document.body.textContent).toContain("¿Descartar los cambios?");
  expect(cerradas).toEqual([]);
  vista.desmontar();
});
