import { describe, it, expect } from "vitest";
import {
  nombreArchivoFamilia,
  esRutaAlmacen,
  nombreDescargaBoda,
  faltaParaEncargo,
  matrimoniosParaEncargo,
  hojaDeEncargo,
} from "./fotosAlmacen";

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

describe("matrimoniosParaEncargo", () => {
  it("deja fuera a los que no tienen foto de boda", () => {
    const lista = [{ familia: "Uno" }, { familia: "Dos" }];
    expect(matrimoniosParaEncargo(lista, { Dos: true }).map((m) => m.familia)).toEqual(["Uno"]);
    expect(matrimoniosParaEncargo(lista, undefined)).toHaveLength(2);
  });
});

describe("faltaParaEncargo", () => {
  const m = (familia, anioBoda) => ({ familia, anioBoda, esposo: { nombre: "A" }, esposa: { nombre: "B" } });

  it("da por completo solo si todos tienen año y foto", () => {
    const r = faltaParaEncargo([m("Uno", "1998")], { Uno: "boda/uno.jpg" });
    expect(r.completo).toBe(true);
  });

  it("señala a quién le falta el año y a quién la foto", () => {
    const r = faltaParaEncargo([m("Uno", ""), m("Dos", "2001")], { Dos: "boda/dos.jpg" });
    expect(r.completo).toBe(false);
    expect(r.sinAnio.map((x) => x.familia)).toEqual(["Uno"]);
    expect(r.sinFoto.map((x) => x.familia)).toEqual(["Uno"]);
  });
});

describe("hojaDeEncargo", () => {
  const uno = {
    familia: "Abreu01",
    esposo: { nombre: "Gustavo" },
    esposa: { nombre: "Míriam" },
    anioBoda: "1998",
    aniversario: 28,
  };

  it("nombra el archivo igual que la descarga, para que casen", () => {
    expect(hojaDeEncargo([uno])).toContain(nombreDescargaBoda(uno));
  });

  it("lleva los nombres, el año y los años que cumplen", () => {
    const t = hojaDeEncargo([uno]);
    expect(t).toContain("Nombres: Gustavo y Míriam. Año de boda: 1998. Cumplen 28 años.");
  });

  it("no inventa los años cumplidos si no se pueden calcular", () => {
    expect(hojaDeEncargo([{ ...uno, aniversario: null }])).not.toContain("Cumplen");
  });

  it("escribe un bloque por matrimonio", () => {
    const t = hojaDeEncargo([uno, { ...uno, familia: "Ruiz01" }]);
    expect(t.match(/Monta esta foto/g)).toHaveLength(2);
  });
});
