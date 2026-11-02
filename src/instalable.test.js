// La app, instalable como una app del móvil (él, v78.4): sin tiendas, desde
// «Añadir a pantalla de inicio». Si esto se rompe, el iPhone vuelve a
// guardarla como un simple acceso directo y no hay avisos posibles.
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";

const manifiesto = JSON.parse(readFileSync("public/manifest.webmanifest", "utf-8"));
const html = readFileSync("index.html", "utf-8");

describe("la app se puede instalar", () => {
  it("con su nombre, su nombre corto (que quepa bajo el icono) y a pantalla completa", () => {
    expect(manifiesto.name).toBe("Las Bodas de todos");
    expect(manifiesto.short_name.length).toBeLessThanOrEqual(12);
    expect(manifiesto.display).toBe("standalone");
    expect(manifiesto.start_url).toBe("/");
  });

  it("con sus iconos, que existen", () => {
    const tamanos = manifiesto.icons.map((i) => i.sizes);
    expect(tamanos).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect(manifiesto.icons.some((i) => i.purpose === "maskable")).toBe(true);
    for (const i of manifiesto.icons) expect(existsSync(`public${i.src}`)).toBe(true);
    expect(existsSync("public/apple-touch-icon.png")).toBe(true);
  });

  it("la página lo enlaza, y el iPhone la abre como app", () => {
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" />');
    expect(html).toContain('<meta name="apple-mobile-web-app-capable" content="yes" />');
    expect(html).toContain(`<meta name="apple-mobile-web-app-title" content="${manifiesto.short_name}" />`);
  });
});
