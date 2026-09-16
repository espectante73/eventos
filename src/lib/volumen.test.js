import { describe, it, expect } from "vitest";
import { porcentajeAVolumen, volumenAPorcentaje, ajustarPorcentaje, PASO_VOLUMEN, duracionCruce, CRUCE_POR_DEFECTO, CRUCE_MINIMO, CRUCE_MAXIMO, volumenesDeCruce, porcentajeCortinilla, REALCE_CORTINILLA_POR_DEFECTO } from "./volumen";

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

describe("volumenesDeCruce", () => {
  const potencia = ({ saliente, entrante }) => Math.sqrt(saliente ** 2 + entrante ** 2);

  it("al empezar suena solo la que sale; al acabar solo la que entra", () => {
    expect(volumenesDeCruce(1, 0)).toEqual({ saliente: 1, entrante: 0 });
    const fin = volumenesDeCruce(1, 1);
    expect(fin.saliente).toBeCloseTo(0, 6);
    expect(fin.entrante).toBeCloseTo(1, 6);
  });

  // Lo que arregla el fallo: antes, a mitad de camino las dos estaban al
  // 12% y se oía un agujero. Con igual potencia, las dos al 71%.
  it("a mitad de camino las dos suenan al 71%, no al 12%", () => {
    const medio = volumenesDeCruce(1, 0.5);
    expect(medio.saliente).toBeCloseTo(0.707, 3);
    expect(medio.entrante).toBeCloseTo(0.707, 3);
  });

  it("la energía total se mantiene constante durante todo el cruce", () => {
    for (const avance of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
      expect(potencia(volumenesDeCruce(1, avance))).toBeCloseTo(1, 6);
    }
  });

  it("respeta el volumen al que hay que llegar", () => {
    expect(potencia(volumenesDeCruce(0.4, 0.3))).toBeCloseTo(0.4, 6);
    expect(volumenesDeCruce(0, 0.5)).toEqual({ saliente: 0, entrante: 0 });
  });

  it("aguanta valores fuera de rango o sin sentido", () => {
    expect(volumenesDeCruce(1, -1).saliente).toBe(1);
    expect(volumenesDeCruce(1, 5).entrante).toBeCloseTo(1, 6);
    expect(volumenesDeCruce(undefined, 0.5)).toEqual({ saliente: 0, entrante: 0 });
  });
});

describe("volumenesDeCruce con cortinilla (el moderador)", () => {
  const con = (avance) => volumenesDeCruce(1, avance, true);

  it("empieza con la que sale sola y acaba con la que entra sola", () => {
    expect(con(0).saliente).toBeCloseTo(1, 6);
    expect(con(0).entrante).toBe(0);
    expect(con(1).saliente).toBeCloseTo(0, 6);
    expect(con(1).entrante).toBeCloseTo(1, 6);
  });

  it("la que sale baja poco a poco, no de golpe", () => {
    expect(con(0.15).saliente).toBeCloseTo(0.924, 3);
    expect(con(0.3).saliente).toBeCloseTo(0.707, 3);
  });

  it("en el centro las dos se apartan para dejar sonar al moderador", () => {
    const medio = con(0.5);
    expect(medio.saliente).toBeCloseTo(0.259, 3);
    expect(medio.entrante).toBeCloseTo(0.259, 3);
  });

  // "La entrada tiene que ser como la salida" -- petición literal.
  it("la curva de entrada es la de salida del revés", () => {
    for (const a of [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1]) {
      expect(con(a).saliente).toBeCloseTo(con(1 - a).entrante, 6);
    }
  });

  it("nunca se quedan las dos a cero antes del final", () => {
    for (let a = 0; a < 1; a += 0.05) {
      const { saliente, entrante } = con(a);
      expect(saliente + entrante).toBeGreaterThan(0);
    }
  });

  it("sin cortinilla se mantiene el cruce de igual potencia", () => {
    expect(volumenesDeCruce(1, 0.5, false).saliente).toBeCloseTo(0.707, 3);
  });
});

describe("porcentajeCortinilla", () => {
  it("suma el realce al volumen de la música", () => {
    expect(porcentajeCortinilla(70, 15)).toBe(85);
    expect(porcentajeCortinilla(40, 0)).toBe(40);
    expect(porcentajeCortinilla(60, -20)).toBe(40);
  });

  it("sigue a la música al bajarla: nunca se queda atronando sola", () => {
    expect(porcentajeCortinilla(30, 15)).toBe(45);
    expect(porcentajeCortinilla(0, 15)).toBe(15);
  });

  it("no se pasa de 100 ni baja de 0", () => {
    expect(porcentajeCortinilla(95, 40)).toBe(100);
    expect(porcentajeCortinilla(5, -30)).toBe(0);
  });

  it("con un realce inservible usa el de por defecto", () => {
    expect(porcentajeCortinilla(50, undefined)).toBe(50 + REALCE_CORTINILLA_POR_DEFECTO);
    expect(porcentajeCortinilla(50, NaN)).toBe(50 + REALCE_CORTINILLA_POR_DEFECTO);
  });

  it("acota realces absurdos", () => {
    expect(porcentajeCortinilla(50, 999)).toBe(90);
    expect(porcentajeCortinilla(50, -999)).toBe(20);
  });
});
