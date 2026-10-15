// La ventana «Día del evento» (v66): las llegadas se abren y se cierran
// aquí, y solo aquí.
import { it, expect } from "vitest";
import { montar } from "../../pruebas/dibujar";
import { VentanaDiaEvento } from "./VentanaDiaEvento";

it("abre y cierra las llegadas", () => {
  const guardados = [];
  const data = { evento: { asistenciaAbierta: false }, persistEvento: (e) => guardados.push(e) };
  const vista = montar(<VentanaDiaEvento data={data} onCerrar={() => {}} />);
  const boton = [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes("Llegadas:"));
  expect(boton.textContent).toContain("cerradas");
  vista.pulsar(boton);
  expect(guardados).toEqual([{ asistenciaAbierta: true }]);
  vista.desmontar();
});
