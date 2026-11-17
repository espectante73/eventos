// Las alergias se guardan en un solo texto (v88.8, él: «no me deja escribir
// sino 15 caracteres» y el invitado tiene «GAMBAS, NUECES Y ALMENDRAS»), y
// salen uniformes (v88.9: «letra capital mayúscula y el resto minúscula»).
import { describe, it, expect } from "vitest";
import { parsearAlergias, textoAlergias, alergiasUniformes, MAX_OTRAS_ALERGIAS } from "./alergias";

describe("las alergias", () => {
  it("caben «GAMBAS, NUECES Y ALMENDRAS» y más", () => {
    expect(MAX_OTRAS_ALERGIAS).toBeGreaterThanOrEqual("GAMBAS, NUECES Y ALMENDRAS".length);
  });
  it("lo de «Otras» vuelve entero, con sus comas", () => {
    const guardado = textoAlergias({ no: false, gluten: true, lactosa: false, otras: "GAMBAS, NUECES Y ALMENDRAS" });
    expect(guardado).toBe("Gluten, Gambas, nueces y almendras");
    expect(parsearAlergias(guardado)).toEqual({ no: false, gluten: true, lactosa: false, otras: "Gambas, nueces y almendras" });
  });
  it("lo de siempre, igual", () => {
    expect(parsearAlergias("No")).toEqual({ no: true, gluten: false, lactosa: false, otras: "" });
    expect(parsearAlergias("Gluten, Lactosa")).toEqual({ no: false, gluten: true, lactosa: true, otras: "" });
    expect(parsearAlergias("Marisco")).toEqual({ no: false, gluten: false, lactosa: false, otras: "Marisco" });
  });
  it("lo ya escrito, uniforme: mayúscula la primera letra y el resto minúsculas", () => {
    expect(alergiasUniformes("MARISCO")).toBe("Marisco");
    expect(alergiasUniformes("marisco")).toBe("Marisco");
    expect(alergiasUniformes("tómate")).toBe("Tómate");
    expect(alergiasUniformes("Gluten, Lactosa, GAMBAS, NUECES Y ALMENDRAS")).toBe("Gluten, Lactosa, Gambas, nueces y almendras");
    expect(alergiasUniformes("No")).toBe("No");
    expect(alergiasUniformes("")).toBe("");
  });
});
