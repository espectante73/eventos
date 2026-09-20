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
      const m = linea.match(new RegExp(`${propiedad}: (\\d+(?:\\.\\d+)?)`));
      if (m) fallos.push(`${ruta}:${i + 1} -> ${propiedad}: ${m[1]}`);
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

  it("dos tonos para el texto secundario, y uno solo para líneas", () => {
    expect(OP.secundario).toBeGreaterThan(OP.tenue);
    expect(OP.tenue).toBeGreaterThan(OP.linea);
  });
});
