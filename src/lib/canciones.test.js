import { describe, it, expect } from "vitest";
import { huecosCanciones, textoDeHuecos, cancionesDe, tieneCancion, resumenCanciones } from "./canciones";

describe("hasta 3 canciones, con título y artista (v69)", () => {
  it("la de antes, escrita en un solo hueco, pasa entera al título de la primera", () => {
    expect(huecosCanciones("Despacito - Luis Fonsi")).toEqual([
      { titulo: "Despacito - Luis Fonsi", artista: "" },
      { titulo: "", artista: "" },
      { titulo: "", artista: "" },
    ]);
    expect(cancionesDe("Despacito - Luis Fonsi")).toEqual(["Despacito - Luis Fonsi"]);
  });

  it("de los huecos al campo y vuelta, sin perder nada", () => {
    const huecos = [
      { titulo: "Bailando", artista: "Enrique Iglesias" },
      { titulo: "", artista: "" },
      { titulo: "Vivir mi vida", artista: "Marc Anthony" },
    ];
    const texto = textoDeHuecos(huecos);
    expect(texto).toBe("Bailando — Enrique Iglesias\n\nVivir mi vida — Marc Anthony");
    // El hueco vacío de en medio se queda en su sitio: nada salta mientras se escribe.
    expect(huecosCanciones(texto)).toEqual(huecos);
    expect(cancionesDe(texto)).toEqual(["Bailando — Enrique Iglesias", "Vivir mi vida — Marc Anthony"]);
  });

  it("mientras se teclea no se recorta nada; al enseñarlas, sí", () => {
    expect(textoDeHuecos([{ titulo: "Hotel ", artista: "" }])).toBe("Hotel ");
    expect(cancionesDe("Hotel ")).toEqual(["Hotel"]);
  });

  it("solo el artista, o solo el título, también valen", () => {
    const texto = textoDeHuecos([{ titulo: "", artista: "Rosalía" }]);
    expect(huecosCanciones(texto)[0]).toEqual({ titulo: "", artista: "Rosalía" });
    expect(cancionesDe(texto)).toEqual(["Rosalía"]);
  });

  it("sin nada escrito, el campo queda vacío y no cuenta como canción", () => {
    expect(textoDeHuecos([{ titulo: "", artista: "" }, { titulo: "  ", artista: "" }, { titulo: "", artista: "" }])).toBe("");
    expect(tieneCancion({ cancion: "\n\n" })).toBe(false);
    expect(tieneCancion({ cancion: "\nLa bamba" })).toBe(true);
  });

  it("nunca más de 3, y el resumen en una línea", () => {
    expect(cancionesDe("a\nb\nc\nd")).toEqual(["a", "b", "c"]);
    expect(resumenCanciones("Bailando — Enrique Iglesias\nLa bamba")).toBe("Bailando — Enrique Iglesias · La bamba");
  });
});
