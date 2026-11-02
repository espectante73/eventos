// El «cartero» de los avisos (v79), sin red: la base y web-push, de mentira.
import { describe, it, expect, vi } from "vitest";
import { crearManejador } from "./_enviarAvisos.js";

const env = { VITE_SUPABASE_URL: "https://base", VITE_SUPABASE_ANON_KEY: "anon", VAPID_PRIVATE_KEY: "secreta" };
const SUSCRIPCIONES = [
  { id: "s1", endpoint: "https://push/1", p256dh: "a", auth: "b" },
  { id: "s2", endpoint: "https://push/2", p256dh: "c", auth: "d" },
];

function montar({ llaveBuena = true, falla410 = false, entorno = env } = {}) {
  const llamadas = [];
  const fetch = vi.fn(async (url, opciones) => {
    const nombre = url.split("/rpc/")[1];
    llamadas.push({ nombre, cuerpo: JSON.parse(opciones.body) });
    if (nombre === "anfitrion_verificar_token") return { ok: true, status: 200, json: async () => llaveBuena };
    if (nombre === "anfitrion_suscripciones_avisos") return { ok: true, status: 200, json: async () => SUSCRIPCIONES };
    if (nombre === "anfitrion_suscripciones_anfitrion") return { ok: true, status: 200, json: async () => [SUSCRIPCIONES[0]] };
    return { ok: true, status: 204, json: async () => null };
  });
  const webpush = {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(async (s) => {
      if (falla410 && s.endpoint.endsWith("2")) throw Object.assign(new Error("gone"), { statusCode: 410 });
    }),
  };
  const res = { codigo: 0, cuerpo: null, status(c) { this.codigo = c; return this; }, json(b) { this.cuerpo = b; return this; } };
  return { manejador: crearManejador({ webpush, fetch, env: entorno }), webpush, llamadas, res };
}

describe("el cartero de los avisos", () => {
  it("con la llave del anfitrión, manda el aviso a todos los móviles apuntados", async () => {
    const { manejador, webpush, res } = montar();
    await manejador({ method: "POST", body: { token: "t", titulo: "Novedad", texto: "Ya pueden llamar", url: "/" } }, res);
    expect(res.codigo).toBe(200);
    expect(res.cuerpo).toEqual({ enviados: 2, fallidos: 0 });
    expect(JSON.parse(webpush.sendNotification.mock.calls[0][1])).toEqual({ titulo: "Novedad", texto: "Ya pueden llamar", url: "/" });
  });

  it("sin la llave del anfitrión, nada", async () => {
    const { manejador, webpush, res } = montar({ llaveBuena: false });
    await manejador({ method: "POST", body: { token: "t", texto: "x" } }, res);
    expect(res.codigo).toBe(403);
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });

  it("sin la clave secreta en Vercel, lo dice", async () => {
    const { manejador, res } = montar({ entorno: { ...env, VAPID_PRIVATE_KEY: "" } });
    await manejador({ method: "POST", body: { token: "t", texto: "x" } }, res);
    expect(res.codigo).toBe(503);
    expect(res.cuerpo.error).toContain("VAPID_PRIVATE_KEY");
  });

  it("un móvil que ya no lo quiere (410) se borra de la lista", async () => {
    const { manejador, res, llamadas } = montar({ falla410: true });
    await manejador({ method: "POST", body: { token: "t", texto: "x" } }, res);
    expect(res.cuerpo).toEqual({ enviados: 1, fallidos: 1 });
    expect(llamadas.find((l) => l.nombre === "anfitrion_borrar_suscripcion").cuerpo).toEqual({ p_token: "t", p_id: "s2" });
  });

  it("a ciertos colaboradores, y el enlace siempre dentro de la app", async () => {
    const { manejador, webpush, res, llamadas } = montar();
    await manejador({ method: "POST", body: { token: "t", colaboradores: ["c1"], texto: "x", url: "https://otra.web" } }, res);
    expect(llamadas.find((l) => l.nombre === "anfitrion_suscripciones_avisos").cuerpo.p_colaboradores).toEqual(["c1"]);
    expect(JSON.parse(webpush.sendNotification.mock.calls[0][1]).url).toBe("/");
    const otra = montar();
    await otra.manejador({ method: "POST", body: { token: "t", texto: "x", url: "//otra.web" } }, otra.res);
    expect(JSON.parse(otra.webpush.sendNotification.mock.calls[0][1]).url).toBe("/");
  });

  // v79.3: lo que pide la atención del anfitrión, a SUS móviles, agrupado por tipo.
  it("para el anfitrión, solo a sus móviles y con su etiqueta", async () => {
    const { manejador, webpush, res, llamadas } = montar();
    await manejador({ method: "POST", body: { token: "t", para: "anfitrion", etiqueta: "pago", titulo: "Familia pagada", texto: "Familia Pacheco (4)" } }, res);
    expect(llamadas.map((l) => l.nombre)).not.toContain("anfitrion_suscripciones_avisos");
    expect(res.cuerpo).toEqual({ enviados: 1, fallidos: 0 });
    expect(JSON.parse(webpush.sendNotification.mock.calls[0][1])).toEqual({ titulo: "Familia pagada", texto: "Familia Pacheco (4)", url: "/", etiqueta: "pago" });
    const rara = montar();
    await rara.manejador({ method: "POST", body: { token: "t", etiqueta: "<b>", texto: "x" } }, rara.res);
    expect(JSON.parse(rara.webpush.sendNotification.mock.calls[0][1])).not.toHaveProperty("etiqueta");
  });
});
