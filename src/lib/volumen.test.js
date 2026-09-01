import { describe, it, expect } from "vitest";
import { porcentajeAVolumen, volumenAPorcentaje, ajustarPorcentaje, PASO_VOLUMEN, duracionCruce, CRUCE_POR_DEFECTO, CRUCE_MINIMO, CRUCE_MAXIMO } from "./volumen";

describe("porcentajeAVolumen", () => {
  it("los extremos son exactos", () => {
    expect(porcentajeAVolumen(0)).toBe(0);
    expect(porcentajeAVolumen(100)).toBe(1);
  });

  it("nunca se sale de 0-1, aunque le den un valor imposible", () => {
    expect(porcentajeAVolumen(-50)).toBe(0);
    expect(porcentajeAVolumen(300)).toBe(1);
    expect(porcentajeAVolumen("no es un número")).toBe(0);
  });

  it("la curva atenúa la zona baja (esa es toda su razón de ser)", () => {
    // Al 50% de la escala perceptual, el volumen real es MUY inferior a
    // 0.5 -- justo lo que hace que los pasos suenen parejos al oído.
    expect(porcentajeAVolumen(50)).toBeLessThan(0.2);
  });

  it("siempre sube al subir el porcentaje", () => {
    for (let p = 0; p < 100; p += PASO_VOLUMEN) {
      expect(porcentajeAVolumen(p + PASO_VOLUMEN)).toBeGreaterThan(porcentajeAVolumen(p));
    }
  });
});

describe("volumenAPorcentaje", () => {
  it("deshace porcentajeAVolumen", () => {
    for (const p of [0, 20, 50, 80, 100]) {
      expect(volumenAPorcentaje(porcentajeAVolumen(p))).toBe(p);
    }
  });
});

describe("ajustarPorcentaje", () => {
  it("sube y baja de paso en paso", () => {
    expect(ajustarPorcentaje(50, 1)).toBe(50 + PASO_VOLUMEN);
    expect(ajustarPorcentaje(50, -1)).toBe(50 - PASO_VOLUMEN);
  });

  it("se frena en los topes en vez de pasarse", () => {
    expect(ajustarPorcentaje(100, 1)).toBe(100);
    expect(ajustarPorcentaje(0, -1)).toBe(0);
  });
});

describe("duracionCruce", () => {
  it("usa el valor medio cuando no hay cortinilla que medir", () => {
    expect(duracionCruce(undefined)).toBe(CRUCE_POR_DEFECTO);
    expect(duracionCruce(NaN)).toBe(CRUCE_POR_DEFECTO);
    expect(duracionCruce(Infinity)).toBe(CRUCE_POR_DEFECTO);
    expect(duracionCruce(0)).toBe(CRUCE_POR_DEFECTO);
  });

  it("se ajusta a la cortinilla para que quepa entera", () => {
    expect(duracionCruce(3)).toBe(3000);
    expect(duracionCruce(4.5)).toBe(4500);
  });

  it("no baja de minimo ni pasa de maximo", () => {
    expect(duracionCruce(0.4)).toBe(CRUCE_MINIMO);
    expect(duracionCruce(20)).toBe(CRUCE_MAXIMO);
  });
});
