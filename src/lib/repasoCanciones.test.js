import { describe, it, expect, vi } from "vitest";
import { cancionesPedidas } from "./canciones";
import {
  cancionesDistintas,
  consultaDe,
  sinBuscar,
  conResultados,
  repasoCanciones,
  aplicarRepaso,
  duracionTotal,
  textoDuracion,
  minutosYSegundos,
  buscarEnDeezer,
  DURACION_ESTIMADA,
} from "./repasoCanciones";

// Lo de verdad: canción y cantante en la misma casilla, y la misma canción
// escrita de dos maneras.
const invitados = [
  { id: "a", cancion: "Una Chica YE-YE - Concha Velasco" },
  { id: "b", cancion: "Mi jaca — Estrellita Castro\n\nUna Chica YE-YE - Concha Velasco" },
  { id: "c", cancion: "despacito" },
  { id: "d", cancion: "Canción inventada" },
  { id: "e", cancion: "" },
];
const distintas = cancionesDistintas(cancionesPedidas(invitados, () => 50));
const CLAVE_YEYE = "unachicayeyeconchavelasco";
const catalogo = {
  [CLAVE_YEYE]: { titulo: "Chica Ye-Ye", artista: "Conchita Velasco", duracion: 143 },
  mijaca: { titulo: "Mi jaca", artista: "Estrellita Castro", duracion: 211 },
  despacito: { titulo: "Despacito", artista: "Luis Fonsi", duracion: 228 },
  cancioninventada: { noEncontrada: true },
};

describe("repasar canciones con Deezer (v80)", () => {
  it("cada canción distinta, una vez, y lo que se le pregunta a Deezer", () => {
    expect(distintas.map((d) => `${d.clave}|${d.veces}`)).toEqual([`${CLAVE_YEYE}|2`, "mijaca|1", "despacito|1", "cancioninventada|1"]);
    expect(consultaDe("Una Chica YE-YE - Concha Velasco")).toBe("Una Chica YE-YE Concha Velasco");
    expect(consultaDe("Mi jaca — Estrellita Castro")).toBe("Mi jaca Estrellita Castro");
  });

  it("lo encontrado se apunta; si Deezer falló, se vuelve a buscar", () => {
    const c = conResultados({}, ["x", "y", "z"], [{ pista: { titulo: "X", artista: "A", duracion: 100 } }, { pista: null }, { fallo: true }]);
    expect(c).toEqual({ x: { titulo: "X", artista: "A", duracion: 100 }, y: { noEncontrada: true } });
    expect(sinBuscar([{ clave: "x" }, { clave: "z" }], c).map((d) => d.clave)).toEqual(["z"]);
  });

  it("propone separar canción y cantante; lo que ya está como en Deezer (salvo mayúsculas) está bien", () => {
    const r = repasoCanciones(distintas, catalogo);
    expect(r.proponer.map((p) => `${p.cancion} → ${p.propuesta}`)).toEqual([
      "Una Chica YE-YE - Concha Velasco → Chica Ye-Ye — Conchita Velasco",
      "despacito → Despacito — Luis Fonsi",
    ]);
    expect(r.bien.map((b) => b.cancion)).toEqual(["Mi jaca — Estrellita Castro"]);
    expect(r.noEncontradas.map((n) => n.cancion)).toEqual(["Canción inventada"]);
    expect(repasoCanciones(distintas, {}).pendientes).toBe(4);
  });

  it("aplicar corrige TODAS las fichas que la pidieron, y la forma nueva queda con su duración", () => {
    const { invitados: siguientes, catalogo: nuevo, aviso } = aplicarRepaso(invitados, catalogo, { aplicar: [CLAVE_YEYE], descartar: ["despacito"] });
    expect(siguientes.find((g) => g.id === "a").cancion).toBe("Chica Ye-Ye — Conchita Velasco");
    expect(siguientes.find((g) => g.id === "b").cancion).toBe("Mi jaca — Estrellita Castro\n\nChica Ye-Ye — Conchita Velasco");
    expect(siguientes.find((g) => g.id === "c")).toBe(invitados[2]);
    expect(aviso).toBe("Corregidas 2 peticiones.");
    expect(nuevo.chicayeye).toEqual({ titulo: "Chica Ye-Ye", artista: "Conchita Velasco", duracion: 143 });
    expect(nuevo.despacito.descartada).toBe(true);
    // Ya corregida, sale bien escrita; la descartada, sin marcar.
    const r = repasoCanciones(cancionesDistintas(cancionesPedidas(siguientes, () => 50)), nuevo);
    expect(r.bien.map((b) => b.cancion)).toContain("Chica Ye-Ye — Conchita Velasco");
    expect(r.proponer.find((p) => p.clave === "despacito").descartada).toBe(true);
  });

  it("sin nada que aplicar, la lista no se toca", () => {
    expect(aplicarRepaso(invitados, catalogo, { aplicar: [] }).invitados).toBe(invitados);
  });

  it("la duración total: la de Deezer, y 3½ min la que no la tiene (y se cuenta)", () => {
    expect(duracionTotal(distintas, catalogo)).toEqual({ segundos: 143 + 211 + 228 + DURACION_ESTIMADA, estimadas: 1 });
    expect(duracionTotal(distintas, { ...catalogo, despacito: { ...catalogo.despacito, descartada: true } }).estimadas).toBe(2);
    expect(textoDuracion(28200)).toBe("7 h 50 min");
    expect(textoDuracion(2700)).toBe("45 min");
    expect(minutosYSegundos(143)).toBe("2:23");
  });

  it("pide al buscador con la llave; si no llega, lo dice", async () => {
    const f = vi.fn(async () => ({ ok: true, json: async () => ({ resultados: [] }) }));
    expect(await buscarEnDeezer({ token: "t", consultas: ["x"] }, f)).toEqual({ resultados: [] });
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ token: "t", consultas: ["x"] });
    const roto = vi.fn(async () => {
      throw new Error("sin red");
    });
    expect((await buscarEnDeezer({ token: "t", consultas: ["x"] }, roto)).error).toContain("sin red");
  });
});
