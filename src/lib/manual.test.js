import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { partirManual, bloques, trozosEnLinea, contarPalabras, contarReglas } from "./manual";
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

// Las reglas de la PARTE 1 van numeradas dentro de su sección, del 1
// seguido (encabezado, PARTE 1): así se citan ("1.6, regla 3") y la app
// las cuenta. La 1.12 no son reglas, sino cosas en espera: van con viñetas.
describe("las reglas de la PARTE 1, numeradas y contadas", () => {
  const manual = partirManual(readFileSync("CLAUDE.md", "utf-8"));
  const [parte1] = manual.partes;

  it("cuenta los puntos numerados, no las viñetas", () => {
    expect(contarReglas("1. **Una.**\n   - detalle\n2. **Dos.**\n\n- en espera")).toBe(2);
  });

  it("cada sección tiene reglas, salvo «Lo que está esperando»", () => {
    const sinReglas = parte1.secciones.filter((s) => contarReglas(s.texto) === 0).map((s) => s.num);
    expect(sinReglas).toEqual(["1.12"]);
  });

  it("dentro de cada sección van del 1 seguido, aunque haya código en medio", () => {
    for (const s of parte1.secciones) {
      let siguiente = 1;
      for (const b of bloques(s.texto).filter((x) => x.tipo === "ol")) {
        expect(b.inicio, `${s.num}: esperaba la regla ${siguiente}`).toBe(siguiente);
        siguiente += b.items.length;
      }
    }
  });

  it("el total de la PARTE 1 es la suma de sus secciones", () => {
    expect(parte1.reglas).toBe(parte1.secciones.reduce((s, x) => s + contarReglas(x.texto), 0));
    expect(parte1.reglas).toBeGreaterThan(40);
  });
});

// La app solo dibuja párrafos, listas, código, títulos, negrita y
// cursiva. Una cita (">"), una tabla ("|") o un enlace saldrían tal cual,
// con sus signos: pasó con las dos citas del encabezado.
describe("el CLAUDE.md solo usa lo que la app sabe dibujar", () => {
  it("sin citas, tablas ni enlaces (fuera de los bloques de código)", () => {
    const lineas = readFileSync("CLAUDE.md", "utf-8").split("\n");
    let enCodigo = false;
    const mal = [];
    lineas.forEach((l, i) => {
      if (l.trim().startsWith("```")) enCodigo = !enCodigo;
      else if (!enCodigo && (/^\s*[>|]/.test(l) || /\]\(/.test(l))) mal.push(`${i + 1}: ${l.slice(0, 40)}`);
    });
    expect(mal).toEqual([]);
  });
});

// Las salvaguardas del documento (encabezado del CLAUDE.md). Sin ellas
// volvió a engordar solo: de 15.000 a 30.000 palabras en una semana, con
// reglas que hablaban de archivos y funciones que ya no existían.
describe("salvaguardas del CLAUDE.md", () => {
  const texto = readFileSync("CLAUDE.md", "utf-8");
  const manual = partirManual(texto);
  // Fuera de los bloques de código: ahí van ejemplos, no citas.
  const prosa = texto.replace(/```[\s\S]*?```/g, "");
  const citas = [...prosa.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);

  // Pasar de aquí es una decisión suya, no algo que ocurre sin darse cuenta.
  const TECHO = 5000;
  it(`el documento entero, ${TECHO} palabras como mucho`, () => {
    expect(manual.palabras, "subir el techo lo decide él").toBeLessThanOrEqual(TECHO);
  });

  it("cada trampa, 8 líneas como mucho", () => {
    const largas = manual.partes[1].secciones
      .map((s) => [s.num, s.texto.split("\n").filter((l) => l.trim()).length])
      .filter(([, n]) => n > 8);
    expect(largas).toEqual([]);
  });

  it("ninguna fecha: casi siempre es relato", () => {
    expect(texto.match(/\b20\d\d-\d\d-\d\d\b/g) || []).toEqual([]);
  });

  // Todo el proyecto, para buscar lo que el documento nombra.
  const archivos = (function reunir(dir = ".", acc = []) {
    for (const n of readdirSync(dir)) {
      if (["node_modules", ".git", "dist"].includes(n)) continue;
      const r = join(dir, n);
      if (statSync(r).isDirectory()) reunir(r, acc);
      else acc.push(r);
    }
    return acc;
  })();

  // Nombrados A PROPÓSITO en negativo: "no se hace", "no se resucita".
  const QUE_NO_EXISTEN_A_PROPOSITO = ["DECISIONS.md", "lib/backup.js"];

  it("todo archivo que nombra existe", () => {
    const faltan = [...new Set(citas.filter((c) => /^[\w./-]+\.(jsx?|mjs|sql|ya?ml|md|css|json)$/.test(c)))]
      .filter((f) => !QUE_NO_EXISTEN_A_PROPOSITO.includes(f))
      .filter((f) => !archivos.some((r) => r === f || r.endsWith("/" + f)));
    expect(faltan).toEqual([]);
  });

  it("toda función que nombra existe", () => {
    const codigo = archivos
      .filter((r) => /\.(jsx?|mjs|sql)$/.test(r) && !r.endsWith(".test.js") && !r.endsWith(".test.jsx"))
      .map((r) => readFileSync(r, "utf-8"))
      .join("\n");
    const nombres = [
      ...new Set(
        citas
          .map((c) => c.match(/^([A-Za-z_]\w*)\(\)$/)?.[1] ?? (/^[a-z]+(_[a-z0-9]+)+$/.test(c) ? c : null))
          .filter(Boolean)
      ),
    ];
    expect(nombres.length).toBeGreaterThan(20);
    expect(nombres.filter((n) => !codigo.includes(n))).toEqual([]);
  });

  it("el sello guarda las palabras de verdad", () => {
    expect(sello.palabras).toBe(manual.palabras);
  });
});
