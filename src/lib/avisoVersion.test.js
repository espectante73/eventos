import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { leerVersionPublicada, textoAvisoVersion, TOPE_AVISO } from "./avisoVersion";
import { VERSION_APP, AVISO_VERSION } from "../constants";
import { motivoSinVersion, CAMBIA_LO_PUBLICADO } from "../../scripts/version-subida.mjs";

const respuesta = (cuerpo, ok = true) => async () => ({ ok, json: async () => cuerpo });

describe("el aviso de la versión (v81.6)", () => {
  it("lo de esta versión cabe en 2 o 3 líneas del móvil y no está vacío", () => {
    expect(AVISO_VERSION.trim().length).toBeGreaterThan(20);
    expect(AVISO_VERSION.length).toBeLessThanOrEqual(TOPE_AVISO);
  });

  it("cada publicación escribe /version.json con el número y el aviso de constants.js", () => {
    const config = readFileSync("vite.config.js", "utf-8");
    expect(config).toMatch(/fileName: "version\.json"/);
    expect(config).toMatch(/version: VERSION_APP, aviso: AVISO_VERSION/);
  });

  it("lee lo publicado y lo recorta al tope", async () => {
    const largo = "a".repeat(TOPE_AVISO + 30);
    expect(await leerVersionPublicada(respuesta({ version: "81.7", aviso: ` ${largo} ` }))).toEqual({ version: "81.7", aviso: "a".repeat(TOPE_AVISO) });
    expect(await leerVersionPublicada(respuesta({ version: "82" }))).toEqual({ version: "82", aviso: "" });
  });

  it("sin archivo, sin red o con algo que no es una versión: null", async () => {
    expect(await leerVersionPublicada(respuesta({}, false))).toBeNull();
    expect(await leerVersionPublicada(async () => Promise.reject(new Error("sin red")))).toBeNull();
    expect(await leerVersionPublicada(respuesta({ version: "<b>hola</b>", aviso: "x" }))).toBeNull();
    expect(await leerVersionPublicada(async () => ({ ok: true, json: async () => JSON.parse("<html>") }))).toBeNull();
  });

  it("con número nuevo: «Versión N» y lo que cambia, para todos", () => {
    const nueva = { version: "81.7", aviso: "Arreglado X." };
    for (const esAnfitrion of [true, false]) {
      expect(textoAvisoVersion({ actual: "81.6", nueva, esAnfitrion })).toEqual({ titulo: "Versión 81.7", texto: "Arreglado X." });
    }
  });

  it("sin número nuevo, el anfitrión lo ve y pregunta antes; el colaborador, el aviso de siempre", () => {
    const misma = { version: "81.6", aviso: "lo de antes" };
    expect(textoAvisoVersion({ actual: "81.6", nueva: misma, esAnfitrion: true }).titulo).toBe("Actualización sin número nuevo");
    expect(textoAvisoVersion({ actual: "81.6", nueva: misma, esAnfitrion: false })).toEqual({ titulo: "Hay una versión nueva de la app", texto: "" });
  });

  it("si no se pudo leer lo publicado, el aviso de siempre", () => {
    expect(textoAvisoVersion({ actual: VERSION_APP, nueva: null, esAnfitrion: true })).toEqual({ titulo: "Hay una versión nueva de la app", texto: "" });
  });
});

describe("el freno de subida: sin número nuevo y su aviso no se sube", () => {
  const v = (version, aviso) => ({ version, aviso });

  it("lo que cambia lo publicado cuenta; las pruebas y el SQL, no", () => {
    for (const f of ["src/App.jsx", "src/lib/x.js", "public/sw.js", "CLAUDE.md", "index.html", "package.json"]) expect(CAMBIA_LO_PUBLICADO.test(f), f).toBe(true);
    for (const f of ["src/lib/x.test.js", "src/App.test.jsx", "supabase/schema.sql", "scripts/x.mjs", ".githooks/pre-push"]) expect(CAMBIA_LO_PUBLICADO.test(f), f).toBe(false);
  });

  it("cambia lo publicado y sigue el mismo número: no", () => {
    expect(motivoSinVersion({ archivos: ["CLAUDE.md"], antes: v("81.5", "a"), ahora: v("81.5", "a") })).toMatch(/sigue la versión 81\.5/);
  });

  it("número nuevo con el aviso de la anterior, o sin aviso: no", () => {
    expect(motivoSinVersion({ archivos: ["src/App.jsx"], antes: v("81.6", "a"), ahora: v("81.7", "a") })).toMatch(/AVISO_VERSION/);
    expect(motivoSinVersion({ archivos: ["src/App.jsx"], antes: v("81.6", "a"), ahora: v("81.7", "") })).toMatch(/AVISO_VERSION/);
  });

  it("número y aviso nuevos, o nada publicado que cambie: sí", () => {
    expect(motivoSinVersion({ archivos: ["src/App.jsx"], antes: v("81.6", "a"), ahora: v("81.7", "b") })).toBe("");
    expect(motivoSinVersion({ archivos: ["supabase/schema.sql"], antes: v("81.6", "a"), ahora: v("81.6", "a") })).toBe("");
  });
});
