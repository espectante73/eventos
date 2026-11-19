// «Añadir a mi calendario» (v92.6, él): el archivo con el evento y su aviso
// la víspera; en Android, Google Calendar; sin fecha confirmada, nada.
import { describe, it, expect, vi } from "vitest";
import { crearManejador } from "./_calendario.js";

const env = { VITE_SUPABASE_URL: "https://base", VITE_SUPABASE_ANON_KEY: "anon" };
const EVENTO = { id: "e1", nombre: "Las Bodas de todos", fecha: "2026-12-11", hora: "19:00", cronogramaHoraFin: "23:45", lugar: "Rte. El Rincón", direccion: "Ctra. el Amparo 190, 38430 Icod de los Vinos", fechaSinConfirmar: false, tablonOcultarFecha: false };

function montar(evento, ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)") {
  const fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => evento }));
  const res = {
    codigo: 0, cuerpo: null, cabeceras: {},
    status(c) { this.codigo = c; return this; },
    send(b) { this.cuerpo = b; return this; },
    setHeader(k, v) { this.cabeceras[k] = v; },
  };
  const manejador = crearManejador({ fetch, env, ahora: () => Date.UTC(2026, 10, 19, 15, 0) });
  return { correr: () => manejador({ method: "GET", headers: { "user-agent": ua } }, res), res, fetch };
}

describe("/api/calendario", () => {
  it("en el iPhone, el archivo de calendario con el evento y su aviso un día antes", async () => {
    const { correr, res, fetch } = montar(EVENTO);
    await correr();
    expect(fetch.mock.calls[0][0]).toBe("https://base/rest/v1/rpc/evento_publico");
    expect(res.codigo).toBe(200);
    expect(res.cabeceras["Content-Type"]).toBe("text/calendar; charset=utf-8");
    const ics = res.cuerpo.replace(/\r\n /g, "");
    // 19:00 en Canarias en diciembre es 19:00 UTC; acaba a las 23:45.
    expect(ics).toContain("DTSTART:20261211T190000Z");
    expect(ics).toContain("DTEND:20261211T234500Z");
    expect(ics).toContain("SUMMARY:Las Bodas de todos");
    expect(ics).toContain("LOCATION:Rte. El Rincón\\, Ctra. el Amparo 190\\, 38430 Icod de los Vinos");
    expect(ics).toContain("TRIGGER:-P1D");
    expect(res.cuerpo.split("\r\n").every((l) => l.length <= 61)).toBe(true);
  });

  it("en Android, a Google Calendar con el evento ya escrito", async () => {
    const { correr, res } = montar(EVENTO, "Mozilla/5.0 (Linux; Android 14; SM-S911B)");
    await correr();
    expect(res.codigo).toBe(302);
    const url = new URL(res.cabeceras.Location);
    expect(url.host).toBe("calendar.google.com");
    expect(url.searchParams.get("dates")).toBe("20261211T190000Z/20261211T234500Z");
    expect(url.searchParams.get("text")).toBe("Las Bodas de todos");
  });

  it("sin fecha confirmada, o escondida, nada que apuntar", async () => {
    for (const cambio of [{ fechaSinConfirmar: true }, { tablonOcultarFecha: true }, { fecha: null }]) {
      const { correr, res } = montar({ ...EVENTO, ...cambio });
      await correr();
      expect(res.codigo).toBe(404);
      expect(res.cuerpo).toContain("Todavía no hay fecha confirmada");
    }
  });
});
