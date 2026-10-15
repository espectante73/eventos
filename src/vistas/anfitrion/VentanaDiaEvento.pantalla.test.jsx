// La ventana «Día del evento» (v66-66.1): el estado en texto y el botón con
// lo que hace; cerrar las llegadas pregunta antes.
import { it, expect } from "vitest";
import { montar } from "../../pruebas/dibujar";
import { VentanaDiaEvento } from "./VentanaDiaEvento";

const boton = (texto) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === texto);

it("cerradas: dice «cerradas» y «Abrir» las abre sin preguntar", () => {
  const guardados = [];
  const vista = montar(<VentanaDiaEvento data={{ evento: { asistenciaAbierta: false }, persistEvento: (e) => guardados.push(e) }} onCerrar={() => {}} />);
  expect(document.body.textContent).toContain("Llegadas · cerradas");
  vista.pulsar(boton("Abrir"));
  expect(guardados).toEqual([{ asistenciaAbierta: true }]);
  vista.desmontar();
});

it("abiertas: «Cerrar» pregunta antes, y con «Sí» las cierra", () => {
  const guardados = [];
  const vista = montar(<VentanaDiaEvento data={{ evento: { asistenciaAbierta: true }, persistEvento: (e) => guardados.push(e) }} onCerrar={() => {}} />);
  vista.pulsar(boton("Cerrar"));
  expect(document.body.textContent).toContain("¿Cerrar las llegadas?");
  expect(guardados).toEqual([]);
  vista.pulsar(boton("Sí"));
  expect(guardados).toEqual([{ asistenciaAbierta: false }]);
  vista.desmontar();
});
