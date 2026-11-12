// La ficha de instalación del tablón (v85.2): su acceso directo abre ESE
// tablón, no la portada de la app.
import { describe, it, expect } from "vitest";
import { manifestDelTablon, manejadorManifest } from "./_manifestTablon.js";

const token = "11111111-2222-3333-4444-555555555555";

describe("la ficha de instalación del tablón", () => {
  it("empieza en su tablón, con su enlace personal si lo trae, y con otro id que la app", () => {
    expect(manifestDelTablon({ t: token }).start_url).toBe(`/?tablon=${token}`);
    const personal = manifestDelTablon({ t: token, yo: "k7q2xw9a" });
    expect(personal.start_url).toBe(`/?tablon=${token}&yo=k7q2xw9a`);
    expect(personal.id).toBe(personal.start_url);
    expect(personal.scope).toBe("/");
  });

  it("solo con la forma de un enlace del tablón: nada inventado entra en la dirección", () => {
    expect(manifestDelTablon({ t: "x" })).toBeNull();
    expect(manifestDelTablon({ t: token, yo: "a&b=c" }).start_url).toBe(`/?tablon=${token}`);
  });

  it("la ruta responde la ficha, o 400 si el enlace no vale", () => {
    const res = { cabeceras: {}, codigo: 0, cuerpo: null, setHeader(k, v) { this.cabeceras[k] = v; }, status(c) { this.codigo = c; return this; }, send(b) { this.cuerpo = b; return this; }, json(b) { this.cuerpo = b; return this; } };
    manejadorManifest({ query: { t: token } }, res);
    expect(res.codigo).toBe(200);
    expect(res.cabeceras["Content-Type"]).toContain("manifest+json");
    expect(JSON.parse(res.cuerpo).start_url).toBe(`/?tablon=${token}`);
    manejadorManifest({ query: {} }, res);
    expect(res.codigo).toBe(400);
  });
});
