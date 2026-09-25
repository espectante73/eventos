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

  it("el total es la suma exacta del encabezado y las partes", () => {
    const m = partirManual(readFileSync("CLAUDE.md", "utf-8"));
    expect(m.palabras).toBe(m.encabezado.palabras + m.partes.reduce((s, p) => s + p.palabras, 0));
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
    expect(lista.items.map((i) => i.texto)).toEqual(["primera parte y su continuación"]);
  });

  // La norma 4 lleva viñetas dentro y la 11 una lista numerada: antes
  // partían la lista de fuera y la numeración volvía a empezar en 1.
  it("una lista dentro de un punto no parte la de fuera", () => {
    const texto = [
      "4. **Piezas:**",
      "   - botón",
      "     con relieve",
      "   - link",
      "   Y lo de después.",
      "5. **Plegado.**",
      "11. **Junto:**",
      "    1. un dato",
      "       compartido",
      "    2. otro",
      "    Ante un dato nuevo.",
      "12. **Guardar.**",
    ].join("\n");
    const [lista, ...resto] = bloques(texto);
    expect(resto).toEqual([]);
    expect(lista.inicio).toBe(4);
    expect(lista.items.map((i) => i.texto)).toEqual(["**Piezas:**", "**Plegado.**", "**Junto:**", "**Guardar.**"]);
    expect(lista.items[0].sub.items.map((i) => i.texto)).toEqual(["botón con relieve", "link"]);
    expect(lista.items[0].despues).toBe("Y lo de después.");
    expect(lista.items[2].sub.tipo).toBe("ol");
    expect(lista.items[2].sub.items.map((i) => i.texto)).toEqual(["un dato compartido", "otro"]);
    expect(lista.items[2].despues).toBe("Ante un dato nuevo.");
  });

  it("con el documento real, las normas de 1.2 van de la 1 a la última sin volver a empezar", () => {
    const manual = partirManual(readFileSync("CLAUDE.md", "utf-8"));
    const s12 = manual.partes[0].secciones.find((s) => s.num === "1.2");
    const listas = bloques(s12.texto).filter((b) => b.tipo === "ol");
    expect(listas).toHaveLength(1);
    expect(listas[0].inicio).toBe(1);
    expect(listas[0].items.length).toBeGreaterThan(10);
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

// Una sola forma de escribir una lista dentro de otra (él, v45.6): con
// viñetas, para que los números sean solo de las normas y citarlas no sea
// un lío; y sin párrafo suelto al final, que no se sabe si es de la lista.
// Lo que haya que decir de la norma va en su frase, ANTES de la lista.
describe("las listas de dentro, todas iguales", () => {
  const manual = partirManual(readFileSync("CLAUDE.md", "utf-8"));
  const secciones = [{ num: "encabezado", texto: manual.encabezado.texto }, ...manual.partes.flatMap((p) => p.secciones)];
  const puntos = secciones.flatMap((s) =>
    bloques(s.texto)
      .filter((b) => b.items)
      .flatMap((b) => b.items.map((i) => ({ ...i, num: s.num })))
  );

  it("con viñetas, nunca numeradas", () => {
    expect(puntos.filter((i) => i.sub && i.sub.tipo !== "ul").map((i) => i.num)).toEqual([]);
  });

  it("sin párrafo suelto después de la lista", () => {
    expect(puntos.filter((i) => i.despues).map((i) => `${i.num}: ${i.despues.slice(0, 40)}`)).toEqual([]);
  });
});
