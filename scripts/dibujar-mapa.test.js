// El plano de la aplicación (public/mapa-de-la-aplicacion.png) se dibuja con
// scripts/dibujar-mapa.mjs, y ese script lleva la lista de secciones
// escrita a mano: no puede importar los componentes de la app porque son
// JSX y porque depende de `canvas`, que no está instalado en el proyecto.
//
// Esa copia a mano ya se quedó desactualizada una vez (el primer nivel del
// menú pasó de 14 entradas a 8 y el plano siguió mostrando las 14). Este
// test es el guardia: si alguien añade, quita o renombra una sección del
// menú y no toca el script, se pone en rojo aquí, en `npm test`, en vez de
// descubrirse meses después mirando la imagen.
//
// Y desde el 2026-09-23 comprueba TAMBIÉN que la imagen esté regenerada.
// Antes no: bastaba con que las listas coincidieran, así que el mapa podía
// llevar semanas enseñando una versión vieja sin que nada se quejara. Pasó
// (el usuario: "no coincide la versión del mapa con la que estamos"): la
// imagen era del 19 de septiembre y la app iba por la v39.4.
// El script deja una ficha (mapa-generado.json) con la versión que dibujó;
// aquí se compara con VERSION_APP. Regenerar pasa a ser parte de subir una
// versión, no algo que haya que acordarse de hacer.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ORDEN_VENTANAS, ETIQUETAS_VENTANAS } from "../src/components/VentanaFlotante";
import { VERSION_APP } from "../src/constants.js";
import { SUBMENU_CONFIGURACION } from "../src/components/DesplegableSecciones";

const aqui = dirname(fileURLToPath(import.meta.url));
const script = readFileSync(join(aqui, "dibujar-mapa.mjs"), "utf-8");

// Saca las etiquetas de un array del script: const nombre = [ ["Etiqueta", {...}], ... ];
function etiquetasDelScript(nombre) {
  const bloque = script.match(new RegExp(`const ${nombre} = \\[([\\s\\S]*?)\\n\\];`));
  expect(bloque, `no encuentro la lista \`${nombre}\` en dibujar-mapa.mjs`).not.toBeNull();
  return [...bloque[1].matchAll(/\[\s*"([^"]+)"/g)].map((m) => m[1]);
}

describe("el plano de la aplicación lista las mismas secciones que el menú", () => {
  it("primer nivel: las secciones de \"Abrir sección...\"", () => {
    const enLaApp = ORDEN_VENTANAS.map((clave) => ETIQUETAS_VENTANAS[clave]);
    expect(etiquetasDelScript("nivel1").sort()).toEqual([...enLaApp].sort());
  });

  it("segundo nivel: el submenú de Configuración", () => {
    const enLaApp = SUBMENU_CONFIGURACION.map((s) => s.etiqueta);
    expect(etiquetasDelScript("config").sort()).toEqual([...enLaApp].sort());
  });

  it("toda sección del menú tiene etiqueta (si no, el plano dibujaría un hueco)", () => {
    for (const clave of ORDEN_VENTANAS) {
      expect(ETIQUETAS_VENTANAS[clave], `falta la etiqueta de "${clave}"`).toBeTruthy();
    }
  });
});

// El mapa enseña "v39.4" en la esquina. Si la app sube de versión y nadie
// regenera la imagen, esa esquina miente.
describe("el mapa está al día", () => {
  const ficha = JSON.parse(readFileSync(join(aqui, "mapa-generado.json"), "utf-8"));

  it("se dibujó con la versión que corre ahora mismo", () => {
    expect(
      ficha.version,
      `El mapa se dibujó con la v${ficha.version} y la app va por la v${VERSION_APP}. ` +
        'Regenéralo:  (node -e "require(\'canvas\')" || npm i -D canvas --no-save) && node scripts/dibujar-mapa.mjs'
    ).toBe(VERSION_APP);
  });

  it("la imagen existe y no está vacía", () => {
    const png = readFileSync(join(aqui, "..", "public", "mapa-de-la-aplicacion.png"));
    expect(png.length).toBeGreaterThan(10000);
  });
});

// La paleta del mapa estuvo copiada a mano y derivó: dos dorados que no
// existían en la app. Ahora sale de theme.js; aquí se vigila que no
// vuelva a escribirse un color suelto (el blanco no es de la paleta).
describe("la paleta del mapa sale de theme.js", () => {
  it("ningún color escrito a mano en el script", () => {
    const sueltos = script
      .split("\n")
      .filter((l) => !l.trim().startsWith("//"))
      .flatMap((l) => l.match(/#[0-9A-Fa-f]{6}\b|rgba?\(\s*\d/g) || [])
      .filter((c) => c.toUpperCase() !== "#FFFFFF");
    expect(sueltos).toEqual([]);
  });
});
