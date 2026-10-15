// La ventana «Día del evento» (v66-67): el estado en texto y el botón con
// lo que hace; cerrar pregunta antes. Llegadas y fotos, la misma fila.
import { it, expect } from "vitest";
import { montar } from "../../pruebas/dibujar";
import { VentanaDiaEvento, cuentaFotosFiesta } from "./VentanaDiaEvento";

const botones = (texto) => [...document.body.querySelectorAll("button")].filter((b) => b.textContent.trim() === texto);
const boton = (texto) => botones(texto)[0];
const sinFotos = () => Promise.resolve([]);

it("cerradas: dice «cerradas» y «Abrir» las abre sin preguntar", () => {
  const guardados = [];
  const vista = montar(
    <VentanaDiaEvento data={{ evento: { asistenciaAbierta: false }, persistEvento: (e) => guardados.push(e), obtenerFotosFiesta: sinFotos }} onCerrar={() => {}} />
  );
  expect(document.body.textContent).toContain("Llegadas · cerradas");
  vista.pulsar(boton("Abrir"));
  expect(guardados).toEqual([{ asistenciaAbierta: true }]);
  vista.desmontar();
});

it("abiertas: «Cerrar» pregunta antes, y con «Sí» las cierra", () => {
  const guardados = [];
  const vista = montar(
    <VentanaDiaEvento data={{ evento: { asistenciaAbierta: true }, persistEvento: (e) => guardados.push(e), obtenerFotosFiesta: sinFotos }} onCerrar={() => {}} />
  );
  vista.pulsar(boton("Cerrar"));
  expect(document.body.textContent).toContain("¿Cerrar las llegadas?");
  expect(guardados).toEqual([]);
  vista.pulsar(boton("Sí"));
  expect(guardados).toEqual([{ asistenciaAbierta: false }]);
  vista.desmontar();
});

it("las fotos: «Abrir» las abre; «Cerrar» pregunta antes", () => {
  const guardados = [];
  const evento = { asistenciaAbierta: true, fotosFiestaAbierta: false };
  const vista = montar(
    <VentanaDiaEvento data={{ evento, persistEvento: (e) => guardados.push(e), obtenerFotosFiesta: sinFotos }} onCerrar={() => {}} />
  );
  expect(document.body.textContent).toContain("Fotos · cerradas");
  vista.pulsar(boton("Abrir"));
  expect(guardados).toEqual([{ asistenciaAbierta: true, fotosFiestaAbierta: true }]);
  vista.desmontar();

  const abiertas = montar(
    <VentanaDiaEvento
      data={{ evento: { fotosFiestaAbierta: true, asistenciaAbierta: false }, persistEvento: (e) => guardados.push(e), obtenerFotosFiesta: sinFotos }}
      onCerrar={() => {}}
    />
  );
  abiertas.pulsar(boton("Cerrar"));
  expect(document.body.textContent).toContain("¿Cerrar las fotos?");
  abiertas.pulsar(boton("Sí"));
  expect(guardados.at(-1)).toEqual({ fotosFiestaAbierta: false, asistenciaAbierta: false });
  abiertas.desmontar();
});

it("la cuenta: fotos y familias, cada familia una vez", () => {
  expect(cuentaFotosFiesta([])).toBe("Todavía no hay fotos.");
  expect(cuentaFotosFiesta([{ familia: "medina" }])).toBe("1 foto de 1 familia");
  expect(cuentaFotosFiesta([{ familia: "medina" }, { familia: "medina" }, { familia: "abreu01" }])).toBe("3 fotos de 2 familias");
});
