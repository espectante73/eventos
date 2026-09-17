import { describe, it, expect } from "vitest";
import { nombreArchivoFamilia } from "./fotosAlmacen";

// El nombre del archivo tiene que ser ESTABLE: volver a subir la foto de una
// familia debe reemplazar la suya, no dejar un archivo nuevo cada vez. Si
// alguien cambia esta función sin querer, las fotos ya subidas se quedan
// huérfanas en el almacén y la ventana enseña huecos grises.
describe("nombreArchivoFamilia", () => {
  it("quita acentos, espacios y mayúsculas", () => {
    expect(nombreArchivoFamilia("Martínez Ruiz")).toBe("martinez-ruiz");
    expect(nombreArchivoFamilia("PÉREZ")).toBe("perez");
  });

  it("da el mismo nombre para la misma familia, se escriba como se escriba", () => {
    expect(nombreArchivoFamilia("  García  ")).toBe(nombreArchivoFamilia("garcia"));
  });

  it("no deja guiones sueltos en los extremos", () => {
    expect(nombreArchivoFamilia("¡Núñez!")).toBe("nunez");
    expect(nombreArchivoFamilia("--Ruiz--")).toBe("ruiz");
  });

  it("aguanta una familia vacía sin devolver un nombre inservible", () => {
    expect(nombreArchivoFamilia("")).toBe("sin-familia");
    expect(nombreArchivoFamilia(null)).toBe("sin-familia");
    expect(nombreArchivoFamilia("///")).toBe("sin-familia");
  });
});
