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

// v81.1 (él): la escucha previa, tolerante con lo mal escrito.
describe("escuchar antes", () => {
  const PISTA = (id, titulo, artista) => ({ id, title_short: titulo, artist: { name: artista }, duration: 200, preview: `https://muestra/${id}.mp3` });
  const DEEZER2 = {
    "Tu cariñito Elvis Crespo": { data: [] },
    "Tu cariñito": { data: [PISTA(1, "Tu Cariñito", "Luisito Ayala"), { ...PISTA(2, "Tu Cariñito", "Edwin Rivera"), preview: "" }, PISTA(3, "Tu Cariñito", "Edén Muñoz")] },
    "despasito Luis Fonsi": { data: [PISTA(4, "Despacito", "Luis Fonsi")] },
  };
  function montar2({ colaborador = false, djBueno = true } = {}) {
    const llamadas = [];
    const fetch = vi.fn(async (url, opciones) => {
      if (url.includes("/rpc/")) {
        const nombre = url.split("/rpc/")[1];
        llamadas.push({ nombre, autorizacion: opciones.headers.Authorization });
        const respuesta = { anfitrion_verificar_token: true, dj_puede: djBueno, es_colaborador: colaborador }[nombre];
        return { ok: true, status: 200, json: async () => respuesta };
      }
      if (url.includes("/track/")) return { ok: true, json: async () => PISTA(99, "Exacta", "Por número") };
      const q = decodeURIComponent(new URL(url).searchParams.get("q"));
      return { ok: true, json: async () => DEEZER2[q] || { data: [] } };
    });
    const res = { codigo: 0, cuerpo: null, status(c) { this.codigo = c; return this; }, json(b) { this.cuerpo = b; return this; } };
    return { manejador: crearManejador({ fetch, env }), res, llamadas };
  }

  it("con el cantante equivocado, busca solo por el título y da hasta 3 que se puedan escuchar", async () => {
    const { manejador, res } = montar2();
    await manejador({ method: "POST", body: { token: "t", escuchar: { titulo: "Tu cariñito", artista: "Elvis Crespo" } } }, res);
    expect(res.cuerpo.soloTitulo).toBe(true);
    expect(res.cuerpo.candidatos.map((c) => c.artista)).toEqual(["Luisito Ayala", "Edén Muñoz"]);
    expect(res.cuerpo.candidatos[0].muestra).toBe("https://muestra/1.mp3");
  });

  it("con una letra mal, lo que da Deezer; con su número de Deezer, esa misma", async () => {
    const { manejador, res } = montar2();
    await manejador({ method: "POST", body: { token: "t", escuchar: { titulo: "despasito", artista: "Luis Fonsi" } } }, res);
    expect(res.cuerpo).toEqual({ candidatos: [{ titulo: "Despacito", artista: "Luis Fonsi", duracion: 200, deezer: 4, muestra: "https://muestra/4.mp3" }], soloTitulo: false });
    const otra = montar2();
    await otra.manejador({ method: "POST", body: { token: "t", escuchar: { titulo: "x", deezer: 99 } } }, otra.res);
    expect(otra.res.cuerpo.candidatos[0].titulo).toBe("Exacta");
  });

  it("un colaborador, con su sesión; sin ella, nada", async () => {
    const si = montar2({ colaborador: true });
    await si.manejador({ method: "POST", headers: { authorization: "Bearer sesion-del-colaborador" }, body: { escuchar: { titulo: "despasito", artista: "Luis Fonsi" } } }, si.res);
    expect(si.res.codigo).toBe(200);
    expect(si.llamadas.find((l) => l.nombre === "es_colaborador").autorizacion).toBe("Bearer sesion-del-colaborador");
    const no = montar2();
    await no.manejador({ method: "POST", headers: {}, body: { escuchar: { titulo: "despasito" } } }, no.res);
    expect(no.res.codigo).toBe(403);
  });

  it("el DJ, con su enlace y su clave", async () => {
    const no = montar2({ djBueno: false });
    await no.manejador({ method: "POST", body: { dj: { token: "d", clave: "MAL" }, escuchar: { titulo: "despasito" } } }, no.res);
    expect(no.res.codigo).toBe(403);
    const si = montar2();
    await si.manejador({ method: "POST", body: { dj: { token: "d", clave: "K7M4R" }, escuchar: { titulo: "despasito", artista: "Luis Fonsi" } } }, si.res);
    expect(si.res.codigo).toBe(200);
  });
});
