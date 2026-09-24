import { describe, it, expect } from "vitest";
import { calcularHorasAbsolutas, repartirEnFilas } from "./cronograma";

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

// El ancho de cada recuadro tiene que ser proporcional a sus minutos EN
// TODO el cronograma, no solo dentro de su fila. Él lo pidió así al
// diseñarlo (2026-08-27) y lo volvió a cazar el 2026-09-24: "Final
// apenas son unos minutos y se ve más grande que Baile".
describe("repartirEnFilas: el minuto vale lo mismo en todo el dibujo", () => {
  const conDuracion = (mins) => mins.map((m, i) => ({ duracion: m, texto: `B${i}` }));
  const todos = (filas) => filas.flat();

  it("el bloque más largo manda: ocupa el ancho entero y los demás se miden contra él", () => {
    const filas = repartirEnFilas(conDuracion([50, 100]), 400, 0, 0);
    expect(todos(filas).map((b) => b.ancho)).toEqual([200, 400]);
  });

  it("el doble de minutos es el doble de ancho, aunque caigan en filas distintas", () => {
    const [corto, largo] = todos(repartirEnFilas(conDuracion([20, 40, 200]), 400, 0, 0));
    expect(largo.ancho).toBe(corto.ancho * 2);
  });

  it("un bloque corto que se quede solo en su fila NO se estira", () => {
    // El caso de la captura: Baile llena una fila y Final cae detrás.
    const filas = repartirEnFilas(conDuracion([140, 20]), 400, 0, 0);
    expect(filas).toHaveLength(2);
    expect(filas[1][0].ancho).toBeLessThan(filas[0][0].ancho);
  });

  it("ningún recuadro se sale del ancho disponible", () => {
    for (const b of todos(repartirEnFilas(conDuracion([5, 600, 30]), 400))) {
      expect(b.ancho).toBeLessThanOrEqual(400);
    }
  });

  it("por debajo del mínimo se respeta el mínimo: si no, la hora no cabe", () => {
    const [diminuto] = todos(repartirEnFilas(conDuracion([5, 600]), 400, 8, 58));
    expect(diminuto.ancho).toBe(58);
  });

  it("caben varios en una fila mientras quepan, y el que no cabe abre fila", () => {
    // Tres cortos seguidos de uno largo: los tres cortos comparten fila y
    // el largo, que ya no cabe detrás, abre la suya.
    const filas = repartirEnFilas(conDuracion([10, 10, 10, 100]), 400, 0, 0);
    expect(filas.map((f) => f.length)).toEqual([3, 1]);
  });

  it("el orden nunca se toca: es una cronología, no un puzle", () => {
    const filas = repartirEnFilas(conDuracion([10, 100, 10]), 400, 0, 0);
    expect(filas.flat().map((b) => b.texto)).toEqual(["B0", "B1", "B2"]);
  });
});
