// Sobres de los matrimonios (v98): las opciones, la cuenta y la vista
// previa. Sin lienzo ni red: el dibujo y el logo, de pega.
import { it, expect, beforeEach } from "vitest";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";
import { VentanaSobresMatrimonios } from "./VentanaSobresMatrimonios";

const g = (id, nombre, apellido, grupoFamiliar, rolFamiliar, mesa) => ({ id, nombre, apellido, grupoFamiliar, rolFamiliar, mesa, confirmado: true });
const invitados = [
  g("1", "Luis", "Abreu", "M1", "esposo", 7),
  g("2", "Ana", "Medina", "M1", "esposa", 7),
  g("3", "Daniel", "Suárez", "S1", "esposo", null),
  g("4", "Sara", "Mesa", "S1", "esposa", null),
];
const LOGO = { dato: "data:image/png;base64,AAA", imagen: null, proporcion: 0.9 };
const cargarLogo = () => Promise.resolve(LOGO);
// Las letras y el corazón de la invitación (v99.3): aquí no hay red.
const ADORNOS = { de: "pega" };
const cargarAdornos = () => Promise.resolve(ADORNOS);
const esperar = async () => {
  for (let i = 0; i < 3; i++) await act(() => new Promise((r) => setTimeout(r, 50)));
};

beforeEach(() => window.localStorage.clear());

it("cuenta los sobres, avisa de los que van sin mesa y enseña la vista previa con el logo", async () => {
  const llamadas = [];
  const vistaPrevia = (sobres, opciones, logo) => (llamadas.push({ n: sobres.length, opciones, logo }), ["data:image/jpeg;base64,A", "data:image/jpeg;base64,B"]);
  const vista = montar(<VentanaSobresMatrimonios invitados={invitados} fechaEvento="2026-12-11" onCerrar={() => {}} vistaPrevia={vistaPrevia} cargarLogo={cargarLogo} cargarAdornos={cargarAdornos} />);
  await esperar();
  expect(document.body.querySelector("[data-resumen-sobres]").textContent).toBe("2 sobres, uno por matrimonio confirmado. Sobre Foto 10×15 (C6): 16,2 × 11,4 cm.");
  expect(document.body.querySelector("[data-sin-mesa]").textContent).toBe("1 matrimonio sin mesa: su sobre sale sin número.");
  expect(document.body.querySelectorAll("[data-vista-previa] img")).toHaveLength(2);
  expect(llamadas.at(-1)).toEqual({ n: 2, opciones: { sobre: "c6", formato: "nombres", nombre: "centro", logo: "encima" }, logo: LOGO });
  vista.desmontar();
});

it("cambiar el sobre, el nombre, dónde va y el logo rehace la vista previa y se recuerda", async () => {
  const llamadas = [];
  const vista = montar(<VentanaSobresMatrimonios invitados={invitados} fechaEvento="2026-12-11" onCerrar={() => {}} vistaPrevia={(s, o) => (llamadas.push(o), [])} cargarLogo={cargarLogo} cargarAdornos={cargarAdornos} />);
  await esperar();
  const [sobre, formato, nombre, logo] = document.body.querySelectorAll("[data-opciones-sobres] select");
  for (const [campo, valor] of [[sobre, "americano"], [formato, "apellido"], [nombre, "abajoDerecha"], [logo, "centro"]]) {
    act(() => {
      campo.value = valor;
      campo.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }
  await esperar();
  const elegidas = { sobre: "americano", formato: "apellido", nombre: "abajoDerecha", logo: "centro" };
  expect(llamadas.at(-1)).toEqual(elegidas);
  expect(JSON.parse(window.localStorage.getItem("sobres-matrimonios-opciones"))).toEqual(elegidas);
  vista.desmontar();
});

it("si el logo no llega, se dice y los sobres salen sin él", async () => {
  const llamadas = [];
  const vista = montar(
    <VentanaSobresMatrimonios invitados={invitados} fechaEvento="2026-12-11" onCerrar={() => {}} vistaPrevia={(s, o, l) => (llamadas.push(l), [])} cargarLogo={() => Promise.reject(new Error("red"))} cargarAdornos={cargarAdornos} />
  );
  await esperar();
  expect(document.body.textContent).toContain("No se pudo cargar el logo");
  expect(llamadas.at(-1)).toBeNull();
  vista.desmontar();
});

it("los botones van ARRIBA, antes de las opciones", () => {
  const vista = montar(<VentanaSobresMatrimonios invitados={invitados} fechaEvento="2026-12-11" onCerrar={() => {}} vistaPrevia={() => []} cargarLogo={cargarLogo} cargarAdornos={cargarAdornos} />);
  const botones = document.body.querySelector("[data-botones-sobres]");
  expect(botones.compareDocumentPosition(document.body.querySelector("[data-opciones-sobres]")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(botones.textContent).toContain("Descargar");
  vista.desmontar();
});

// v99.3 (él): «aprovechamos esta tipografía y filigrana para los sobres».
it("las letras y el corazón de la invitación llegan a la vista previa; si no llegan, se dice", async () => {
  const llamadas = [];
  const vista = montar(
    <VentanaSobresMatrimonios invitados={invitados} fechaEvento="2026-12-11" onCerrar={() => {}} vistaPrevia={(s, o, l, a) => (llamadas.push(a), [])} cargarLogo={cargarLogo} cargarAdornos={cargarAdornos} />
  );
  await esperar();
  expect(llamadas.at(-1)).toBe(ADORNOS);
  expect(document.body.querySelector("[data-sin-adornos]")).toBeNull();
  vista.desmontar();

  const fallan = [];
  const sin = montar(
    <VentanaSobresMatrimonios
      invitados={invitados}
      fechaEvento="2026-12-11"
      onCerrar={() => {}}
      vistaPrevia={(s, o, l, a) => (fallan.push(a), [])}
      cargarLogo={cargarLogo}
      cargarAdornos={() => Promise.reject(new Error("red"))}
    />
  );
  await esperar();
  expect(fallan.at(-1)).toBeNull();
  expect(document.body.querySelector("[data-sin-adornos]").textContent).toContain("los sobres salen con la letra de siempre");
  sin.desmontar();
});
