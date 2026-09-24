// El guardia de la escala del acabado (theme.js, 2026-09-20).
//
// El repaso de acabados no sirve de nada si mañana alguien vuelve a
// escribir `fontSize: 13` a mano: en unos meses hay otra vez trece
// tamaños. Este test se pone en rojo en `npm test` en cuanto aparece un
// número suelto, que es cuando cuesta cero arreglarlo -- no meses
// después, mirando pantallazos.
//
// Mismo espíritu que scripts/dibujar-mapa.test.js: lo que se define en
// un sitio y se copia a mano en otros, deriva. Un test lo impide.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { T, R, S, OP } from "./theme";

// ⚠️ El mando de Música tiene lenguaje propio YA APROBADO (norma 11 del
// CLAUDE.md): paleta oscura suya, teclas con su relieve. No entra.
const FUERA = ["vistas/anfitrion/VentanaMusicaEvento.jsx"];

function archivosDeLaApp(dir = "src", encontrados = []) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) archivosDeLaApp(ruta, encontrados);
    else if (/\.jsx$/.test(nombre)) encontrados.push(ruta);
  }
  return encontrados;
}

const archivos = archivosDeLaApp().filter((r) => !FUERA.some((f) => r.endsWith(f)));

function numerosSueltos(propiedad) {
  const fallos = [];
  for (const ruta of archivos) {
    const texto = readFileSync(ruta, "utf-8");
    texto.split("\n").forEach((linea, i) => {
      // Salida de emergencia, a propósito estrecha: una línea marcada
      // con "escala-libre" y el motivo escrito al lado. Sirve para lo
      // que no es una caja ni un texto (un rombo de adorno, por
      // ejemplo). Si aparecen muchas, la escala está mal, no el sitio.
      if (linea.includes("escala-libre")) return;
      // Mira la expresión entera, no solo lo que viene justo detrás de
      // los dos puntos: el valor escondido en un "si pasa esto, tanto;
      // si no, cuanto" se coló en el primer repaso justo así
      // (`fontSize: grande ? 13 : 12`, en Seal).
      const expresion = linea.match(new RegExp(`${propiedad}:([^,}\\n]*)`));
      if (!expresion) return;
      // Fuera lo que YA sale de la escala (`${R.caja}px`), y fuera el 0
      // y el 1: no son un valor elegido a ojo, son "nada" y "del todo".
      const aOjo = [...expresion[1].replace(/\$\{[^}]*\}/g, "").matchAll(/(?<![\w.$])\d+(?:\.\d+)?/g)]
        .map((n) => n[0])
        .filter((n) => n !== "0" && n !== "1");
      if (aOjo.length) fallos.push(`${ruta}:${i + 1} -> ${propiedad}:${expresion[1]}`);
    });
  }
  return fallos;
}

describe("la escala del acabado no se escribe a mano", () => {
  it("hay archivos que mirar (si esto falla, el buscador está roto)", () => {
    expect(archivos.length).toBeGreaterThan(20);
  });

  it("ningún tamaño de letra suelto: se elige de T", () => {
    expect(numerosSueltos("fontSize")).toEqual([]);
  });

  it("ningún redondeo suelto: se elige de R", () => {
    expect(numerosSueltos("borderRadius")).toEqual([]);
  });

  // La cuarta, añadida el 2026-09-24 a petición suya: "¿el test debe
  // vigilar las 4 o solo las 3 que prometía?". Las cuatro -- una escala
  // con un agujero obliga a explicar el agujero.
  it("ninguna sombra suelta: se elige de S (o de DORADO)", () => {
    expect(numerosSueltos("boxShadow")).toEqual([]);
  });

  it("ninguna opacidad suelta: se elige de OP", () => {
    expect(numerosSueltos("opacity")).toEqual([]);
  });
});

describe("la escala es corta a propósito", () => {
  it("cinco tamaños de texto y uno para las cifras grandes", () => {
    expect(Object.keys(T)).toEqual(["micro", "pequeno", "normal", "destacado", "titulo", "cifra"]);
  });

  it("los tamaños van de menor a mayor, sin repetirse", () => {
    const valores = Object.values(T);
    expect(valores).toEqual([...new Set(valores)].sort((a, b) => a - b));
  });

  it("dos redondeos: caja y redondo del todo", () => {
    expect(Object.keys(R)).toEqual(["caja", "redondo"]);
  });

  it("tres sombras", () => {
    expect(Object.keys(S)).toHaveLength(3);
  });

  it("los tonos van de más visible a menos, sin repetirse", () => {
    const valores = Object.values(OP);
    expect(valores).toEqual([...new Set(valores)].sort((a, b) => b - a));
  });
});
