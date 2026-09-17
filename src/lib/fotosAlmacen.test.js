import { describe, it, expect } from "vitest";
import { nombreArchivoFamilia, esRutaAlmacen, nombreDescargaBoda } from "./fotosAlmacen";

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

describe("esRutaAlmacen", () => {
  it("distingue una ruta del cajón de lo que se enseña tal cual", () => {
    expect(esRutaAlmacen("boda/abreu01.jpg")).toBe(true);
    expect(esRutaAlmacen("data:image/jpeg;base64,xxx")).toBe(false);
    expect(esRutaAlmacen("https://ejemplo.com/foto.jpg")).toBe(false);
    expect(esRutaAlmacen("")).toBe(false);
    expect(esRutaAlmacen(null)).toBe(false);
  });
});

describe("nombreDescargaBoda", () => {
  const m = { familia: "Abreu01", esposo: { nombre: "Gustavo" }, esposa: { nombre: "Míriam" }, anioBoda: "1998" };

  it("lleva familia, los dos nombres y el año, con tildes", () => {
    expect(nombreDescargaBoda(m)).toBe("Abreu01 - Gustavo y Míriam - 1998.jpg");
  });

  it("dice 'sin año' en vez de dejar el año vacío", () => {
    expect(nombreDescargaBoda({ ...m, anioBoda: "" })).toBe("Abreu01 - Gustavo y Míriam - sin año.jpg");
  });

  it("quita los caracteres que no admite un nombre de archivo", () => {
    expect(nombreDescargaBoda({ ...m, familia: "Ruiz/Pérez" })).toBe("Ruiz-Pérez - Gustavo y Míriam - 1998.jpg");
  });
});
