import { describe, it, expect, vi } from "vitest";
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

describe("la escucha previa (v81.1)", async () => {
  const { consultaDeFila, pedirMuestras } = await import("./escuchar");
  it("de una fila: canción y artista; y su número de Deezer si se encontró", () => {
    const f = { clave: "tucarinito", cancion: "Tu Cariñito — Edwin Rivera" };
    expect(consultaDeFila(f, {})).toEqual({ titulo: "Tu Cariñito", artista: "Edwin Rivera" });
    expect(consultaDeFila(f, { tucarinito: { titulo: "Tu Cariñito", deezer: 7 } })).toEqual({ titulo: "Tu Cariñito", artista: "Edwin Rivera", deezer: 7 });
    expect(consultaDeFila(f, { tucarinito: { noEncontrada: true, deezer: 7 } }).deezer).toBe(undefined);
  });

  it("al buscador: la llave, la sesión en la cabecera o el enlace y la clave del DJ", async () => {
    const f = vi.fn(async () => ({ ok: true, json: async () => ({ candidatos: [] }) }));
    await pedirMuestras({ consulta: { titulo: "x" }, sesion: "jwt" }, f);
    expect(f.mock.calls[0][1].headers.Authorization).toBe("Bearer jwt");
    await pedirMuestras({ consulta: { titulo: "x" }, dj: { token: "d", clave: "K" } }, f);
    expect(JSON.parse(f.mock.calls[1][1].body)).toEqual({ escuchar: { titulo: "x" }, dj: { token: "d", clave: "K" } });
  });
});
