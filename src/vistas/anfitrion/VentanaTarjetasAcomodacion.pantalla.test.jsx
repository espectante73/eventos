// Tarjetas de acomodación (v97): las opciones, la cuenta y la vista previa. El
// dibujo de verdad necesita un lienzo, que aquí no hay: se pasa uno de pega
// que apunta con qué se le llamó.
import { it, expect, beforeEach } from "vitest";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaTarjetasAcomodacion } from "./VentanaTarjetasAcomodacion";

const g = (id, nombre, apellido, mesa, extra = {}) => ({ id, nombre, apellido, mesa, confirmado: true, ...extra });
const invitados = [...Array.from({ length: 12 }, (_, i) => g(String(i), `N${i}`, "Medina", 1 + (i % 3))), g("x", "Rosa", "Delgado", null)];

beforeEach(() => window.localStorage.clear());

const muestra = (id) => `data:image/png;base64,${id}`;
const esperar = () => act(() => new Promise((r) => setTimeout(r, 60)));

it("cuenta tarjetas y hojas, avisa de quien no tiene mesa y enseña la vista previa", async () => {
  const llamadas = [];
  const vistaPrevia = (tarjetas, opciones) => (llamadas.push({ n: tarjetas.length, ...opciones }), ["data:image/jpeg;base64,AAA", "data:image/jpeg;base64,BBB"]);
  const vista = montar(<VentanaTarjetasAcomodacion invitados={invitados} onCerrar={() => {}} vistaPrevia={vistaPrevia} muestra={muestra} />);
  expect(document.body.querySelector("[data-resumen-tarjetas]").textContent).toBe("12 tarjetas en 2 hojas A3, 9 por hoja.");
  expect(document.body.querySelector("[data-sin-mesa]").textContent).toBe("1 confirmado sin mesa se queda sin tarjeta.");
  await esperar();
  expect(document.body.querySelectorAll("[data-vista-previa] img")).toHaveLength(2);
  expect(llamadas.at(-1)).toEqual({ n: 12, hoja: "a3", acabado: "verde" });
  vista.desmontar();
});

// v98.9 (él): solo la tarjeta bancaria; el ancho ya no se elige.
it("cambiar la hoja rehace la vista previa y se recuerda en el aparato; el ancho ya no se elige", async () => {
  const llamadas = [];
  const vistaPrevia = (tarjetas, opciones) => (llamadas.push(opciones), []);
  const vista = montar(<VentanaTarjetasAcomodacion invitados={invitados} onCerrar={() => {}} vistaPrevia={vistaPrevia} muestra={muestra} />);
  const selects = document.body.querySelectorAll("[data-opciones-tarjetas] select");
  expect([...selects].map((s) => s.getAttribute("aria-label"))).toEqual(["Hoja"]);
  act(() => {
    selects[0].value = "a4";
    selects[0].dispatchEvent(new Event("change", { bubbles: true }));
  });
  await esperar();
  expect(llamadas.at(-1)).toEqual({ hoja: "a4", acabado: "verde" });
  expect(document.body.querySelector("[data-resumen-tarjetas]").textContent).toBe("12 tarjetas en 3 hojas A4, 4 por hoja.");
  expect(JSON.parse(window.localStorage.getItem("tarjetas-acomodacion-opciones"))).toEqual({ hoja: "a4", acabado: "verde" });
  vista.desmontar();
});

it("lo guardado de antes con el ancho de 9,5 cm se respeta en hoja y acabado, y el ancho se olvida", async () => {
  window.localStorage.setItem("tarjetas-acomodacion-opciones", JSON.stringify({ hoja: "a4", ancho: 95, acabado: "blancoVerde" }));
  const llamadas = [];
  const vista = montar(<VentanaTarjetasAcomodacion invitados={invitados} onCerrar={() => {}} vistaPrevia={(t, o) => (llamadas.push(o), [])} muestra={muestra} />);
  await esperar();
  expect(llamadas.at(-1)).toEqual({ hoja: "a4", acabado: "blancoVerde" });
  vista.desmontar();
});

it("los botones van ARRIBA, antes de las opciones y de la vista previa", () => {
  const vista = montar(<VentanaTarjetasAcomodacion invitados={invitados} onCerrar={() => {}} vistaPrevia={() => []} muestra={muestra} />);
  const botones = document.body.querySelector("[data-botones-tarjetas]");
  const opciones = document.body.querySelector("[data-opciones-tarjetas]");
  expect(botones.compareDocumentPosition(opciones) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(botones.textContent).toContain("Cancelar");
  expect(botones.textContent).toContain("Descargar");
  vista.desmontar();
});

it("la paleta: seis acabados, cada uno con su muestra; elegir uno rehace la vista previa y se recuerda", async () => {
  const llamadas = [];
  const vista = montar(<VentanaTarjetasAcomodacion invitados={invitados} onCerrar={() => {}} vistaPrevia={(t, o) => (llamadas.push(o), [])} muestra={muestra} />);
  const radios = [...document.body.querySelectorAll('[role="radiogroup"][aria-label="Acabado"] [role="radio"]')];
  expect(radios).toHaveLength(6);
  expect(radios.map((r) => r.querySelector("img").getAttribute("src"))).toEqual(["verde", "blancoDorado", "blancoVerde", "recuadroVerde", "recuadroBlanco", "recuadroBlancoDorado"].map(muestra));
  expect(radios[0].getAttribute("aria-checked")).toBe("true");
  vista.pulsar(radios[3]);
  await esperar();
  expect(radios[3].getAttribute("aria-checked")).toBe("true");
  expect(document.body.querySelector("[data-acabado]").textContent).toContain("Recuadro verde, borde blanco");
  expect(llamadas.at(-1).acabado).toBe("recuadroVerde");
  expect(JSON.parse(window.localStorage.getItem("tarjetas-acomodacion-opciones")).acabado).toBe("recuadroVerde");
  vista.desmontar();
});
