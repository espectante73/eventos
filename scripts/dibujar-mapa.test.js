// El plano de la aplicación (docs/mapa-de-la-aplicacion.png) se dibuja con
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
// Lo que NO comprueba: que la imagen esté regenerada. Solo que las listas
// coinciden. Si este test pasa, basta con ejecutar el script para tener el
// plano al día (ver la cabecera de dibujar-mapa.mjs).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ORDEN_VENTANAS, ETIQUETAS_VENTANAS } from "../src/components/VentanaFlotante";
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
