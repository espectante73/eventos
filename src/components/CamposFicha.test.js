// Las alergias se guardan en un solo texto (v88.8, él: «no me deja escribir
// sino 15 caracteres» y el invitado tiene «GAMBAS, NUECES Y ALMENDRAS»).
import { describe, it, expect } from "vitest";
import { parsearAlergias, textoAlergias, MAX_OTRAS_ALERGIAS } from "./CamposFicha";

describe("las alergias", () => {
  it("caben «GAMBAS, NUECES Y ALMENDRAS» y más", () => {
    expect(MAX_OTRAS_ALERGIAS).toBeGreaterThanOrEqual("GAMBAS, NUECES Y ALMENDRAS".length);
  });
  it("lo de «Otras» vuelve entero, con sus comas", () => {
    const guardado = textoAlergias({ no: false, gluten: true, lactosa: false, otras: "GAMBAS, NUECES Y ALMENDRAS" });
    expect(guardado).toBe("Gluten, GAMBAS, NUECES Y ALMENDRAS");
    expect(parsearAlergias(guardado)).toEqual({ no: false, gluten: true, lactosa: false, otras: "GAMBAS, NUECES Y ALMENDRAS" });
  });
  it("lo de siempre, igual", () => {
    expect(parsearAlergias("No")).toEqual({ no: true, gluten: false, lactosa: false, otras: "" });
    expect(parsearAlergias("Gluten, Lactosa")).toEqual({ no: false, gluten: true, lactosa: true, otras: "" });
    expect(parsearAlergias("Marisco")).toEqual({ no: false, gluten: false, lactosa: false, otras: "Marisco" });
  });
});
