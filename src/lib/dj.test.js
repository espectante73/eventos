import { describe, it, expect } from "vitest";
import { filasDelDj, filtrarPeticiones } from "./dj";
import { construirEnlaceDj } from "./url";

const datos = {
  peticiones: [
    { cancion: "Despacito — Luis Fonsi\n\nBailando", edad: 62 },
    { cancion: "despacito", edad: 16 },
    { cancion: "Mi jaca — Estrellita Castro", edad: null },
  ],
};

describe("la página del DJ (v81)", () => {
  it("una fila por petición, con su edad y las veces de esa canción; sin nombres", () => {
    const filas = filasDelDj(datos);
    expect(filas.map((f) => `${f.veces}|${f.cancion}|${f.edad}`)).toEqual([
      "2|Despacito — Luis Fonsi|62",
      "1|Bailando|62",
      "2|Despacito — Luis Fonsi|16",
      "1|Mi jaca — Estrellita Castro|null",
    ]);
  });

  it("filtra por canción o artista (sin tildes) y por tramo de edad", () => {
    const filas = filasDelDj(datos);
    expect(filtrarPeticiones(filas, { texto: "fonsi" }).length).toBe(2);
    expect(filtrarPeticiones(filas, { texto: "JACA" }).map((f) => f.cancion)).toEqual(["Mi jaca — Estrellita Castro"]);
    expect(filtrarPeticiones(filas, { desde: "40" }).map((f) => f.edad)).toEqual([62, 62]);
    expect(filtrarPeticiones(filas, { desde: "10", hasta: "20" }).map((f) => f.edad)).toEqual([16]);
    expect(filtrarPeticiones(filas, {}).length).toBe(4);
  });

  it("el enlace", () => {
    expect(construirEnlaceDj("https://nexuspoint.rsvp/", "abc")).toBe("https://nexuspoint.rsvp?dj=abc");
    expect(construirEnlaceDj("", "abc")).toBe("");
  });
});
