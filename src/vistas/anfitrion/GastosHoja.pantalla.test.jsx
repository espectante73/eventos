// Los gastos como hoja de cálculo (v76), DIBUJADOS de verdad: la fila de
// escribir arriba, el precio fijo que se pone solo, lo último arriba, el
// importe de un mes que se corrige en su fila y la lista de conceptos.
import { it, expect } from "vitest";
import { useState } from "react";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { GastosHoja, VentanaConceptos } from "./GastosHoja";

const escribir = (input, valor) =>
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, valor);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
const tecla = (input, key) => act(() => input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })));

const CONCEPTOS = [
  { nombre: "Música", precio: "" },
  { nombre: "Suscripción ChatGPT", precio: "22,99" },
];
const GASTOS = [
  { id: "a", concepto: "Música", importe: "250", fecha: "2026-10-27", creadoEn: "2026-10-27T10:00:00Z" },
  { id: "b", concepto: "", categoria: "Flores", importe: "180" },
];

function dibujar({ evento = { conceptosGastos: CONCEPTOS }, gastos = GASTOS } = {}) {
  const guardados = [];
  const eventos = [];
  function Prueba() {
    const [lista, setLista] = useState(gastos);
    const [ev, setEv] = useState(evento);
    const data = {
      evento: ev,
      gastos: lista,
      persistGastos: (l) => {
        guardados.push(l);
        setLista(l);
      },
      persistEvento: (e) => {
        eventos.push(e);
        setEv(e);
      },
    };
    return (
      <>
        <GastosHoja data={data} onConceptos={() => {}} />
        <VentanaConceptos data={data} onCerrar={() => {}} />
      </>
    );
  }
  const vista = montar(<Prueba />);
  const q = (sel) => vista.contenedor.querySelector(sel);
  const todos = (sel) => [...vista.contenedor.querySelectorAll(sel)];
  return { vista, guardados, eventos, q, todos };
}

it("la fila de escribir: el concepto con precio fijo pone el importe, y se apunta arriba con su fecha", () => {
  const { vista, guardados, todos } = dibujar();
  const [concepto] = todos('select[aria-label="Concepto"]');
  const [fecha] = todos('input[aria-label="Fecha"]');
  escribir(fecha, "2026-09-12");
  vista.elegir(concepto, "Suscripción ChatGPT");
  const importe = todos('input[aria-label="Importe"]')[0];
  expect(importe.value).toBe("22,99");
  tecla(importe, "Enter");
  const [nuevo] = guardados.at(-1);
  expect(nuevo).toMatchObject({ concepto: "Suscripción ChatGPT", importe: "22,99", fecha: "2026-09-12", pagado: true });
  // Arriba del todo, justo bajo la fila de escribir; la fila, vacía otra vez.
  expect(todos('select[aria-label="Concepto"]')[1].value).toBe("Suscripción ChatGPT");
  expect(todos('select[aria-label="Concepto"]')[0].value).toBe("");
  vista.desmontar();
});

it("sin concepto no se apunta, y se dice qué falta", () => {
  const { vista, guardados, todos } = dibujar();
  escribir(todos('input[aria-label="Importe"]')[0], "10");
  tecla(todos('input[aria-label="Importe"]')[0], "Enter");
  expect(guardados).toEqual([]);
  expect(document.body.textContent).toContain("Elige el concepto.");
  vista.desmontar();
});

it("lo apuntado después, arriba; los de antes, con su categoría como concepto; al pie, el Total", () => {
  const { vista, todos } = dibujar();
  const conceptos = todos('select[aria-label="Concepto"]').slice(1).map((s) => s.value);
  expect(conceptos).toEqual(["Música", "Flores"]);
  expect(document.body.textContent).toContain("Total");
  expect(document.body.textContent).toMatch(/430\s€/);
  vista.desmontar();
});

it("el importe de un mes se corrige en su fila, sin tocar los demás", () => {
  const { vista, guardados, todos } = dibujar();
  const importe = todos('input[aria-label="Importe"]')[1];
  act(() => importe.dispatchEvent(new FocusEvent("focus", { bubbles: true })));
  escribir(importe, "275");
  act(() => importe.dispatchEvent(new FocusEvent("blur", { bubbles: true })));
  act(() => importe.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));
  const final = guardados.at(-1);
  expect(final.find((g) => g.id === "a").importe).toBe("275");
  expect(final.find((g) => g.id === "b").importe).toBe("180");
  vista.desmontar();
});

it("Conceptos: se añade con su precio fijo, y sin repetir", () => {
  const { vista, eventos, q } = dibujar();
  escribir(q('input[aria-label="Nuevo concepto"]'), "Dominio");
  escribir(q('input[aria-label="Precio fijo"]'), "15");
  tecla(q('input[aria-label="Nuevo concepto"]'), "Enter");
  expect(eventos.at(-1).conceptosGastos).toContainEqual({ nombre: "Dominio", precio: "15" });
  escribir(q('input[aria-label="Nuevo concepto"]'), "música");
  tecla(q('input[aria-label="Nuevo concepto"]'), "Enter");
  expect(document.body.textContent).toContain("«música» ya está en la lista.");
  vista.desmontar();
});

it("sin el SQL de la v76, «Conceptos» y apuntar salen apagados y se dice por qué", () => {
  const { vista, todos } = dibujar({ evento: {} });
  const conceptos = [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === "Conceptos");
  expect(conceptos.disabled).toBe(true);
  expect(todos('button[aria-label="Apuntar el gasto"]')[0].disabled).toBe(true);
  expect(document.body.textContent).toContain("Falta subir el SQL de la versión 76");
  vista.desmontar();
});
