import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { partirManual, bloques, trozosEnLinea, contarPalabras } from "./manual";
import { huellaDe } from "../../scripts/huellaManual.mjs";
import sello from "./manual-sello.json";

const ejemplo = `# Título

## Cómo está ordenado

Texto del encabezado.

# PARTE 1 — Reglas

## 1.1 Primera

Una regla.

## 1.2 Segunda

Otra regla, más larga.

======

# PARTE 2 — Trampas

### 2.1 La única trampa

Pasó esto.
`;

describe("partirManual", () => {
  const m = partirManual(ejemplo);

  it("separa encabezado, reglas y trampas", () => {
    expect(m.partes.map((p) => p.titulo)).toEqual(["PARTE 1 — Reglas", "PARTE 2 — Trampas"]);
    expect(m.encabezado.texto).toContain("Texto del encabezado");
    expect(m.encabezado.texto).not.toContain("===");
  });

  it("numera cada sección con su número del documento", () => {
    expect(m.partes[0].secciones.map((s) => s.num)).toEqual(["1.1", "1.2"]);
    expect(m.partes[1].secciones.map((s) => s.num)).toEqual(["2.1"]);
    expect(m.partes[0].secciones[1].titulo).toBe("Segunda");
  });

  it("la línea de iguales que separa las partes no se cuela en la última sección", () => {
    expect(m.partes[0].secciones[1].texto).not.toContain("===");
  });

  it("cuenta las palabras de cada sección, con su título", () => {
    expect(m.partes[0].secciones[0].palabras).toBe(contarPalabras("## 1.1 Primera\n\nUna regla."));
  });

  it("un texto sin partes no revienta", () => {
    expect(() => partirManual("solo texto")).not.toThrow();
    expect(partirManual("").partes).toEqual([]);
  });
});

describe("bloques y trozos en línea", () => {
  it("reconoce párrafos, listas, código y títulos", () => {
    const b = bloques("Uno\ndos.\n\n- a\n- b\n\n1. x\n2. y\n\n```\ncódigo\n```\n\n### Sub");
    expect(b.map((x) => x.tipo)).toEqual(["p", "ul", "ol", "codigo", "titulo"]);
    expect(b[0].texto).toBe("Uno dos.");
  });

  it("una línea con sangría sigue al punto de la lista", () => {
    const [lista] = bloques("- primera parte\n  y su continuación");
    expect(lista.items).toEqual(["primera parte y su continuación"]);
  });

  it("negrita, cursiva y código dentro del texto", () => {
    expect(trozosEnLinea("a **b** *c* `d`").map((t) => t.tipo)).toEqual([
      "texto", "negrita", "texto", "cursiva", "texto", "codigo",
    ]);
  });
});

// El documento de verdad. Se lee dentro de la app (Mi cuenta → Diseño
// app), así que tiene que seguir numerado y sin saltos: si alguien añade
// una sección sin número, o salta del 2.7 al 2.9, esto se pone en rojo.
describe("CLAUDE.md sigue numerado, sin saltos", () => {
  const real = partirManual(readFileSync("CLAUDE.md", "utf-8"));

  it("tiene sus dos partes", () => {
    expect(real.partes).toHaveLength(2);
  });

  for (const [indice, prefijo] of [[0, "1"], [1, "2"]]) {
    it(`la PARTE ${prefijo} va de ${prefijo}.1 en adelante, seguida`, () => {
      const nums = real.partes[indice].secciones.map((s) => s.num);
      expect(nums.length).toBeGreaterThan(0);
      expect(nums).toEqual(nums.map((_, i) => `${prefijo}.${i + 1}`));
    });
  }

  it("ningún título de sección se quedó sin número", () => {
    const texto = readFileSync("CLAUDE.md", "utf-8");
    const p1 = texto.slice(texto.indexOf("# PARTE 1"), texto.indexOf("# PARTE 2"));
    const p2 = texto.slice(texto.indexOf("# PARTE 2"));
    expect(p1.match(/^## (?!1\.\d+ ).+$/gm) || []).toEqual([]);
    expect(p2.match(/^### (?!2\.\d+ ).+$/gm) || []).toEqual([]);
  });
});

// La cabecera de "Diseño app" enseña la hora del último cambio. Sale de
// manual-sello.json, y solo es verdad si se selló DESPUÉS de tocar el
// documento: igual que el mapa, regenerarlo es parte del cambio.
describe("el sello del CLAUDE.md está al día", () => {
  it("la huella coincide (si no: node scripts/sellar-manual.mjs)", () => {
    const real = readFileSync("CLAUDE.md", "utf-8");
    expect(sello.huella, "CLAUDE.md cambió sin sellar: node scripts/sellar-manual.mjs").toBe(huellaDe(real));
  });
});
