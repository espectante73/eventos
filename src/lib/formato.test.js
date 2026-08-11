import { describe, it, expect } from "vitest";
import { formatearFecha, formatearDiaSemana, ordenarPorApellidoNombre, parsePrecio, listaConY } from "./formato";

describe("formatearFecha", () => {
  it("convierte ISO a formato largo en español", () => {
    expect(formatearFecha("2026-11-13")).toBe("13 noviembre 2026");
  });
  it("devuelve tal cual si no reconoce el formato", () => {
    expect(formatearFecha("")).toBe("");
    expect(formatearFecha("13/11/2026")).toBe("13/11/2026");
    expect(formatearFecha("2026-99-13")).toBe("2026-99-13");
  });
});

describe("formatearDiaSemana", () => {
  it("calcula el día de la semana en español, en UTC", () => {
    expect(formatearDiaSemana("2026-11-13")).toBe("Viernes"); // boda real
  });
  it("devuelve vacío si no reconoce el formato", () => {
    expect(formatearDiaSemana("")).toBe("");
    expect(formatearDiaSemana("13/11/2026")).toBe("");
  });
});

describe("ordenarPorApellidoNombre", () => {
  it("ordena por apellido y, en empate, por nombre — sin mutar el original", () => {
    const original = [
      { apellido: "Zeta", nombre: "Ana" },
      { apellido: "Alba", nombre: "Zoe" },
      { apellido: "Alba", nombre: "Ana" },
    ];
    const copia = [...original];
    const resultado = ordenarPorApellidoNombre(original);
    expect(resultado.map((g) => `${g.apellido} ${g.nombre}`)).toEqual([
      "Alba Ana",
      "Alba Zoe",
      "Zeta Ana",
    ]);
    expect(original).toEqual(copia); // no se toca el array de entrada
  });
});

describe("parsePrecio", () => {
  it("admite coma decimal y limpia símbolos", () => {
    expect(parsePrecio("35,50 €")).toBe(35.5);
    expect(parsePrecio("40")).toBe(40);
    expect(parsePrecio("")).toBe(0);
    expect(parsePrecio(null)).toBe(0);
    expect(parsePrecio("abc")).toBe(0);
  });
});

describe("listaConY", () => {
  it("junta con comas y un 'y' final, como en una frase", () => {
    expect(listaConY([])).toBe("");
    expect(listaConY(["Ana"])).toBe("Ana");
    expect(listaConY(["Ana", "Bea"])).toBe("Ana y Bea");
    expect(listaConY(["Ana", "Bea", "Cris"])).toBe("Ana, Bea y Cris");
  });
});
