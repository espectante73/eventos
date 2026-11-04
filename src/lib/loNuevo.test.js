import { describe, it, expect } from "vitest";
import { queVerLoNuevo, marcarVisto, leerVisto, LO_NUEVO } from "./loNuevo";

// Un aparato de mentira: táctil o no, con la app instalada o no, con
// memoria o sin ella (Safari privado lanza al tocar localStorage).
function aparato({ tactil = true, instalada = false, memoria = "si" } = {}) {
  const guardado = {};
  const localStorage = { getItem: (k) => guardado[k] ?? null, setItem: (k, v) => (guardado[k] = String(v)) };
  const w = {
    matchMedia: (q) => ({ matches: (q.includes("pointer: coarse") && tactil) || (q.includes("standalone") && instalada) }),
    navigator: {},
  };
  if (memoria === "si") w.localStorage = localStorage;
  else Object.defineProperty(w, "localStorage", { get: () => { throw new Error("bloqueado"); } });
  return { w, guardado };
}

describe("«Lo nuevo» (v81.7)", () => {
  it("de entrada, lo nuevo sale; «Entendido» lo quita en ese aparato", () => {
    const { w, guardado } = aparato();
    expect(queVerLoNuevo(w).verNovedades).toBe(true);
    marcarVisto(w);
    expect(leerVisto(w)).toBe(true);
    expect(queVerLoNuevo(w).verNovedades).toBe(false);
    expect(Object.keys(guardado)).toEqual([`lo-nuevo-visto:${LO_NUEVO}`]);
  });

  it("«Instala la app»: solo en el móvil y mientras no se abra instalada", () => {
    expect(queVerLoNuevo(aparato({ tactil: true, instalada: false }).w).verInstalar).toBe(true);
    expect(queVerLoNuevo(aparato({ tactil: true, instalada: true }).w).verInstalar).toBe(false);
    expect(queVerLoNuevo(aparato({ tactil: false }).w).verInstalar).toBe(false);
  });

  it("sin memoria en el navegador no se rompe: vuelve a salir, nada más", () => {
    const { w } = aparato({ memoria: "no" });
    expect(() => marcarVisto(w)).not.toThrow();
    expect(queVerLoNuevo(w).verNovedades).toBe(true);
  });
});
