import { describe, it, expect } from "vitest";
import { calcularLimites, calcularDuraciones } from "./cronograma";

const bloques = [
  { hora: "18:00", texto: "Recepción" },
  { hora: "18:15", texto: "Cóctel" },
  { hora: "18:45", texto: "Foto 1" },
  { hora: "19:00", texto: "Mesas" },
  { hora: "19:15", texto: "Cena" },
  { hora: "20:45", texto: "Foto 2" },
  { hora: "21:00", texto: "Postre" },
  { hora: "21:15", texto: "Baile" },
  { hora: "23:30", texto: "Final" },
];
const HORA_FIN = "23:45";

describe("calcularDuraciones", () => {
  it("calcula la duración real de cada bloque hasta que empieza el siguiente", () => {
    expect(calcularDuraciones(bloques, HORA_FIN)).toEqual([15, 30, 15, 15, 90, 15, 15, 135, 15]);
  });

  it("resuelve el cruce de medianoche (el cierre es al día siguiente)", () => {
    const cruzaMedianoche = [
      { hora: "23:00", texto: "Baile" },
      { hora: "23:45", texto: "Final" },
    ];
    expect(calcularDuraciones(cruzaMedianoche, "00:30")).toEqual([45, 45]);
  });
});

describe("calcularLimites", () => {
  it("devuelve un límite más que bloques (el último es la hora de fin)", () => {
    expect(calcularLimites(bloques, HORA_FIN)).toHaveLength(bloques.length + 1);
  });
});
