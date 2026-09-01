import { describe, it, expect, beforeEach } from "vitest";
import { leerAspecto, guardarAspecto, PANELES, TEMA_POR_DEFECTO } from "./temasMusica";

describe("leerAspecto", () => {
  beforeEach(() => localStorage.clear());

  it("devuelve el aspecto de fábrica cuando no hay nada guardado", () => {
    expect(leerAspecto()).toEqual({ tema: TEMA_POR_DEFECTO, fondoPropioActivo: false, imagenClara: false, disposicion: "horizontal", orden: PANELES });
  });

  it("conserva lo guardado", () => {
    guardarAspecto({ tema: "champan", fondoPropioActivo: true, disposicion: "vertical", orden: ["volumen", "bloques", "reproductor", "pistas"] });
    expect(leerAspecto()).toEqual({
      tema: "champan",
      fondoPropioActivo: true,
      imagenClara: false,
      disposicion: "vertical",
      orden: ["volumen", "bloques", "reproductor", "pistas"],
    });
  });

  it("ignora un tema que ya no existe en vez de dejar la ventana sin paleta", () => {
    guardarAspecto({ tema: "inventado", disposicion: "vertical", orden: PANELES });
    expect(leerAspecto().tema).toBe(TEMA_POR_DEFECTO);
  });

  // Los dos casos que protegen de una preferencia vieja tras cambiar la
  // lista de paneles: ni se pinta uno que ya no existe, ni se pierde
  // uno nuevo (se añade al final).
  it("descarta paneles desconocidos y completa los que falten", () => {
    guardarAspecto({ tema: "grafito", disposicion: "horizontal", orden: ["volumen", "fantasma"] });
    expect(leerAspecto().orden).toEqual(["volumen", ...PANELES.filter((p) => p !== "volumen")]);
  });

  it("no da por puesta la imagen de fondo si el guardado no lo dice", () => {
    guardarAspecto({ tema: "marfil", disposicion: "vertical", orden: PANELES });
    expect(leerAspecto().fondoPropioActivo).toBe(false);
  });

  it("aguanta un valor corrupto en el almacén", () => {
    localStorage.setItem("musica-evento-aspecto", "{no es json");
    expect(leerAspecto().tema).toBe(TEMA_POR_DEFECTO);
  });
});
