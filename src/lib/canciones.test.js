import { describe, it, expect } from "vitest";
import {
  huecosCanciones,
  textoDeHuecos,
  cancionesDe,
  tieneCancion,
  resumenCanciones,
  cancionesPedidas,
  estrellas,
  ordenarCanciones,
  tocarOrdenCanciones,
  ORDEN_CANCIONES_INICIAL,
} from "./canciones";

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

describe("la lista para bailar (v79.5): una fila por petición, sin nombres", () => {
  const invitados = [
    { anio: 1964, cancion: "Despacito — Luis Fonsi\nBailando" },
    { anio: 2010, cancion: "despacito" },
    { anio: 1981, cancion: "DESPACITO — luis fonsi\n\nVivir mi vida — Marc Anthony" },
    { anio: null, cancion: "Vivir mi vida" },
    { anio: 1990, cancion: "Despasito" },
    { anio: 1970, cancion: "" },
  ];
  const filas = cancionesPedidas(invitados, (g) => (g.anio ? 2026 - g.anio : null));
  const ver = (lista) => lista.map((f) => `${f.veces}|${f.cancion}|${f.edad}`);

  it("cada petición es una fila, con la edad de quien la pidió; la misma canción cuenta junta y se escribe igual, una errata no", () => {
    expect(ver(filas)).toEqual([
      "3|Despacito — Luis Fonsi|62",
      "1|Bailando|62",
      "3|Despacito — Luis Fonsi|16",
      "3|Despacito — Luis Fonsi|45",
      "2|Vivir mi vida — Marc Anthony|45",
      "2|Vivir mi vida — Marc Anthony|null",
      "1|Despasito|36",
    ]);
  });

  it("al abrir, las más pedidas, juntas; dentro, de mayor a menor", () => {
    expect(ver(ordenarCanciones(filas, ORDEN_CANCIONES_INICIAL))).toEqual([
      "3|Despacito — Luis Fonsi|62",
      "3|Despacito — Luis Fonsi|45",
      "3|Despacito — Luis Fonsi|16",
      "2|Vivir mi vida — Marc Anthony|45",
      "2|Vivir mi vida — Marc Anthony|null",
      "1|Bailando|62",
      "1|Despasito|36",
    ]);
  });

  it("por edad: la primera vez de mayor a menor, la segunda al revés; sin edad, siempre al final", () => {
    const mayorAMenor = tocarOrdenCanciones(ORDEN_CANCIONES_INICIAL, "edad");
    expect(mayorAMenor).toEqual({ columna: "edad", direccion: "desc" });
    expect(ordenarCanciones(filas, mayorAMenor).map((f) => f.edad)).toEqual([62, 62, 45, 45, 36, 16, null]);
    const menorAMayor = tocarOrdenCanciones(mayorAMenor, "edad");
    expect(ordenarCanciones(filas, menorAMayor).map((f) => f.edad)).toEqual([16, 36, 45, 45, 62, 62, null]);
    expect(tocarOrdenCanciones(menorAMayor, "cancion")).toEqual({ columna: "cancion", direccion: "asc" });
  });

  it("una estrella por vez; de 6 en adelante, con la cifra", () => {
    expect(estrellas(1)).toBe("★");
    expect(estrellas(5)).toBe("★★★★★");
    expect(estrellas(7)).toBe("★ 7");
  });
});
