// El diseño de la app (CLAUDE.md) partido para leerlo DENTRO de la app
// (usuario, 2026-09-24). Funciones puras: reciben el texto y devuelven su
// estructura, sin pintar nada, para poder probarlas sin dibujar pantallas.
//
// ⚠️ El documento es también una pantalla. Solo se entiende lo que hay
// aquí abajo: párrafos, listas, bloques de código, títulos y negrita,
// cursiva y `código` dentro del texto. Si CLAUDE.md empieza a usar otra
// cosa (tablas, enlaces), aquí saldrá como texto plano.

export function contarPalabras(texto) {
  return String(texto || "").split(/\s+/).filter(Boolean).length;
}

function trocear(texto, patron) {
  const marcas = [...texto.matchAll(patron)];
  return marcas.map((m, i) => {
    const fin = i + 1 < marcas.length ? marcas[i + 1].index : texto.length;
    const cuerpo = texto.slice(m.index, fin).replace(/\n=+\s*$/, "").trimEnd();
    return {
      num: m[1],
      titulo: m[2].trim(),
      texto: cuerpo.split("\n").slice(1).join("\n"),
      palabras: contarPalabras(cuerpo),
    };
  });
}

// Las reglas de una sección son sus puntos NUMERADOS de primer nivel
// (norma de escritura 6 del encabezado). Las viñetas no cuentan: son
// detalle de una regla, o cosas en espera (la 1.12).
export function contarReglas(texto) {
  return bloques(texto)
    .filter((b) => b.tipo === "ol")
    .reduce((s, b) => s + b.items.length, 0);
}

// El documento tiene tres trozos: el encabezado (cómo está ordenado), la
// PARTE 1 (reglas, secciones "## 1.N") y la PARTE 2 (trampas, "### 2.N").
export function partirManual(texto) {
  const t = String(texto || "");
  const i1 = t.indexOf("# PARTE 1");
  const i2 = t.indexOf("# PARTE 2");
  if (i1 < 0 || i2 < 0) {
    return { encabezado: { texto: t, palabras: contarPalabras(t) }, partes: [], palabras: contarPalabras(t) };
  }
  const encabezado = t.slice(0, i1);
  const p1 = t.slice(i1, i2);
  const p2 = t.slice(i2);
  const titulo = (trozo) => trozo.split("\n")[0].replace(/^#\s*/, "").trim();
  const partes = [
    { titulo: titulo(p1), secciones: trocear(p1, /^## (1\.\d+) (.+)$/gm) },
    { titulo: titulo(p2), secciones: trocear(p2, /^### (2\.\d+) (.+)$/gm) },
  ].map((p) => ({
    ...p,
    palabras: p.secciones.reduce((s, x) => s + x.palabras, 0),
    reglas: p.secciones.reduce((s, x) => s + contarReglas(x.texto), 0),
  }));
  return {
    encabezado: {
      texto: encabezado.split("\n").slice(1).join("\n").replace(/\n=+\s*$/, "").trimEnd(),
      palabras: contarPalabras(encabezado.replace(/\n=+\s*$/, "")),
    },
    partes,
    // El total es la SUMA de lo que se enseña (encabezado + cada parte):
    // contado aparte, los títulos de las partes y las líneas de iguales
    // lo hacían no cuadrar con las cifras de abajo.
    palabras: contarPalabras(encabezado.replace(/\n=+\s*$/, "")) + partes.reduce((s, p) => s + p.palabras, 0),
  };
}

// De texto a bloques: párrafo, título, lista, lista numerada, código.
//
// Una lista puede llevar otra DENTRO de un punto (norma 4, norma 11): se
// reconoce por la sangría. Cada punto es { texto, sub, despues }: `sub`,
// la lista de dentro; `despues`, el texto con sangría que sigue a esa
// lista y es del punto de fuera. Sin esto, la lista de dentro partía la
// de fuera y la numeración volvía a empezar en 1.
export function bloques(texto) {
  const salida = [];
  let parrafo = [];
  let lista = null;
  let codigo = null;
  const cerrarParrafo = () => {
    if (parrafo.length) salida.push({ tipo: "p", texto: parrafo.join(" ") });
    parrafo = [];
  };
  const cerrarLista = () => {
    if (lista) salida.push(lista);
    lista = null;
  };
  for (const linea of String(texto || "").split("\n")) {
    if (linea.trim().startsWith("```")) {
      if (codigo) {
        salida.push({ tipo: "codigo", texto: codigo.join("\n") });
        codigo = null;
      } else {
        cerrarParrafo();
        cerrarLista();
        codigo = [];
      }
      continue;
    }
    if (codigo) {
      codigo.push(linea);
      continue;
    }
    if (/^#{1,4} /.test(linea)) {
      cerrarParrafo();
      cerrarLista();
      salida.push({ tipo: "titulo", texto: linea.replace(/^#+\s*/, "") });
      continue;
    }
    const marca = linea.match(/^(\s*)(?:([-•])|(\d+)\.) (.*)$/);
    const sangria = linea.length - linea.trimStart().length;
    const punto = lista && lista.items[lista.items.length - 1];
    if (marca) {
      const tipo = marca[2] ? "ul" : "ol";
      // Con sangría y dentro de una lista: es un punto de la lista de dentro.
      if (punto && sangria >= 2) {
        if (!punto.sub) punto.sub = { tipo, inicio: Number(marca[3]) || 1, sangria, items: [] };
        punto.sub.items.push({ texto: marca[4] });
        continue;
      }
      cerrarParrafo();
      if (lista && lista.tipo !== tipo) cerrarLista();
      if (!lista) lista = { tipo, inicio: Number(marca[3]) || 1, items: [] };
      lista.items.push({ texto: marca[4] });
      continue;
    }
    if (!linea.trim()) {
      cerrarParrafo();
      cerrarLista();
      continue;
    }
    if (punto && sangria >= 2) {
      const sub = punto.sub;
      if (sub && sangria > sub.sangria && !punto.despues) {
        sub.items[sub.items.length - 1].texto += " " + linea.trim();
      } else if (sub) {
        punto.despues = (punto.despues ? punto.despues + " " : "") + linea.trim();
      } else {
        punto.texto += " " + linea.trim();
      }
      continue;
    }
    cerrarLista();
    parrafo.push(linea.trim());
  }
  if (codigo) salida.push({ tipo: "codigo", texto: codigo.join("\n") });
  cerrarParrafo();
  cerrarLista();
  return salida;
}

// Dentro de una línea: **negrita**, *cursiva* y `código`.
export function trozosEnLinea(texto) {
  const salida = [];
  const patron = /`([^`]+)`|\*\*(.+?)\*\*|(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])/g;
  let ultimo = 0;
  for (const m of String(texto || "").matchAll(patron)) {
    if (m.index > ultimo) salida.push({ tipo: "texto", texto: texto.slice(ultimo, m.index) });
    if (m[1] !== undefined) salida.push({ tipo: "codigo", texto: m[1] });
    else if (m[2] !== undefined) salida.push({ tipo: "negrita", texto: m[2] });
    else salida.push({ tipo: "cursiva", texto: m[3] });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < String(texto || "").length) salida.push({ tipo: "texto", texto: texto.slice(ultimo) });
  return salida;
}
