// El buscador de canciones (v80), sin red: la base y Deezer, de mentira.
import { describe, it, expect, vi } from "vitest";
import { crearManejador, MAXIMO_CONSULTAS } from "./_buscarCanciones.js";

const env = { VITE_SUPABASE_URL: "https://base", VITE_SUPABASE_ANON_KEY: "anon" };
const DEEZER = {
  "chica yeye": { data: [{ id: 77, title: "Chica Ye-Ye (Remastered)", title_short: "Chica Ye-Ye", artist: { name: "Conchita Velasco" }, duration: 143 }] },
  inventada: { data: [], total: 0 },
  saturada: { error: { type: "Exception", message: "Quota limit exceeded", code: 4 } },
};

function montar({ llaveBuena = true } = {}) {
  const fetch = vi.fn(async (url) => {
    if (url.includes("/rpc/anfitrion_verificar_token")) return { ok: true, status: 200, json: async () => llaveBuena };
    const q = decodeURIComponent(new URL(url).searchParams.get("q"));
    if (q === "sin red") throw new Error("caída");
    return { ok: true, status: 200, json: async () => DEEZER[q] };
  });
  const res = { codigo: 0, cuerpo: null, status(c) { this.codigo = c; return this; }, json(b) { this.cuerpo = b; return this; } };
  return { manejador: crearManejador({ fetch, env }), fetch, res };
}

describe("el buscador de canciones", () => {
  it("con la llave del anfitrión: título corto, artista y duración; vacía si no está; «fallo» si Deezer no respondió", async () => {
    const { manejador, res } = montar();
    await manejador({ method: "POST", body: { token: "t", consultas: ["chica yeye", "inventada", "saturada", "sin red"] } }, res);
    expect(res.codigo).toBe(200);
    expect(res.cuerpo.resultados).toEqual([
      { pista: { titulo: "Chica Ye-Ye", artista: "Conchita Velasco", duracion: 143, deezer: 77 } },
      { pista: null },
      { fallo: true },
      { fallo: true },
    ]);
  });

  it("sin la llave del anfitrión, no pregunta a Deezer", async () => {
    const { manejador, fetch, res } = montar({ llaveBuena: false });
    await manejador({ method: "POST", body: { token: "t", consultas: ["chica yeye"] } }, res);
    expect(res.codigo).toBe(403);
    expect(fetch.mock.calls.some(([url]) => url.includes("deezer"))).toBe(false);
  });

  it("de 1 a 10 canciones por vez", async () => {
    const { manejador, res } = montar();
    await manejador({ method: "POST", body: { token: "t", consultas: Array(MAXIMO_CONSULTAS + 1).fill("x") } }, res);
    expect(res.codigo).toBe(400);
  });
});
