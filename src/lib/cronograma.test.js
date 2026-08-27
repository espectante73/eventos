import { describe, it, expect } from "vitest";
import { calcularHorasAbsolutas } from "./cronograma";

const bloques = [
  { duracionMin: 15, texto: "Recepción" },
  { duracionMin: 30, texto: "Cóctel" },
  { duracionMin: 15, texto: "Foto 1" },
  { duracionMin: 15, texto: "Mesas" },
  { duracionMin: 90, texto: "Cena" },
  { duracionMin: 15, texto: "Foto 2" },
  { duracionMin: 15, texto: "Postre" },
  { duracionMin: 135, texto: "Baile" },
  { duracionMin: 15, texto: "Final" },
];

describe("calcularHorasAbsolutas", () => {
  it("calcula la hora de inicio de cada bloque sumando las duraciones anteriores", () => {
    expect(calcularHorasAbsolutas("18:00", bloques)).toEqual([
      "18:00",
      "18:15",
      "18:45",
      "19:00",
      "19:15",
      "20:45",
      "21:00",
      "21:15",
      "23:30",
    ]);
  });

  it("resuelve el cruce de medianoche", () => {
    const cruzaMedianoche = [
      { duracionMin: 60, texto: "Baile" },
      { duracionMin: 45, texto: "Final" },
    ];
    expect(calcularHorasAbsolutas("23:30", cruzaMedianoche)).toEqual(["23:30", "00:30"]);
  });

  it("un bloque sin duracionMin no rompe el cálculo (se trata como 0)", () => {
    const conHueco = [
      { texto: "Sin duración" },
      { duracionMin: 10, texto: "Siguiente" },
    ];
    expect(calcularHorasAbsolutas("10:00", conHueco)).toEqual(["10:00", "10:00"]);
  });
});
