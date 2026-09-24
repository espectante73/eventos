// Guardias de reglas que viven en el proyecto, no en una función.
//
// Idea del usuario (2026-09-23): **una trampa que puede tener un test,
// lo tiene.** Aquí no se prueba la app corriendo, se prueba lo que dice
// el repositorio — la misma técnica que `theme.test.js`, el test del
// mapa y `supabase/schema.test.js`.
//
// Cada `it` es una trampa que ya se pagó. Si se pone en rojo, es ese
// mismo fallo volviendo.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

function jsx(dir = "src", acc = []) {
  for (const n of readdirSync(dir)) {
    const r = join(dir, n);
    if (statSync(r).isDirectory()) jsx(r, acc);
    else if (/\.jsx?$/.test(n) && !/\.test\.js$/.test(n)) acc.push(r);
  }
  return acc;
}
const archivos = jsx();
const leer = (r) => readFileSync(r, "utf-8");
// Una línea que empieza por // o * es un comentario: ahí las palabras
// prohibidas se mencionan a propósito, explicando por qué no se usan.
const sinComentarios = (t) =>
  t.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");

describe("norma 12: nada de ventanas del navegador", () => {
  // Bloquean el navegador, y desde una ventana emergente salen en la
  // pestaña equivocada y la dejan colgada. Se migraron todas en la
  // v37.12; el guardia impide que vuelva a colarse una.
  it("ni window.alert ni window.confirm ni window.prompt", () => {
    const culpables = archivos.filter((r) => /window\.(alert|confirm|prompt)\s*\(/.test(sinComentarios(leer(r))));
    expect(culpables).toEqual([]);
  });
});

describe("norma 7: la fila del invitado, de una sola línea y a la misma altura", () => {
  // Él, 2026-09-24: con "Rodríguez, Natasha" la fila se deformaba y el
  // botón de llegada dejaba de caer donde el de las filas de al lado.
  // Las columnas son fijas y el nombre se recorta; lo que no puede
  // volver es una altura escrita a mano, que es como se descuadran.
  const fila = leer("src/vistas/VistaColaborador.jsx");

  it("el nombre se recorta con puntos suspensivos, nunca envuelve", () => {
    expect(fila).toMatch(/className="truncate"/);
  });

  it("las alturas de la fila salen todas de ALTO_BOTON_FILA", () => {
    const aMano = sinComentarios(fila).match(/height: \d+,/g) || [];
    expect(aMano).toEqual([]);
  });

  it("las columnas fijas están definidas una sola vez", () => {
    for (const medida of ["ANCHO_PAGO", "ANCHO_DATOS", "ALTO_BOTON_FILA"]) {
      expect((fila.match(new RegExp(`const ${medida} = `, "g")) || []).length).toBe(1);
    }
  });
});

describe("la Música del evento no se descarga en el local", () => {
  // Se abre en el local, con un wifi desconocido, delante de los
  // invitados: no puede quedarse descargando. Va DENTRO del trozo de
  // VistaAnfitrion a propósito, no en uno suyo.
  it("VentanaMusicaEvento no se carga con lazy()", () => {
    const culpables = archivos.filter((r) => /lazy\s*\([^)]*Musica/i.test(leer(r)));
    expect(culpables).toEqual([]);
  });
});

describe("una pestaña vieja tras un despliegue", () => {
  // Desde que la app se descarga a trozos, una pestaña abierta de antes
  // pide un trozo que ya no existe. Sin esto, se queda en blanco.
  it("main.jsx escucha vite:preloadError", () => {
    expect(leer("src/main.jsx")).toContain("vite:preloadError");
  });
});

describe("el tablón no enseña una fecha provisional", () => {
  // `tablonOcultarFecha` parece un resto de una opción retirada, pero
  // una foto de Deshacer o de Modo Pruebas ANTERIOR a la migración la
  // trae puesta: sin esta línea, al restaurarla se le escaparía la
  // fecha a los invitados sin que nadie se entere.
  it("VistaTablon sigue respetando tablonOcultarFecha", () => {
    expect(leer("src/vistas/VistaTablon.jsx")).toContain("tablonOcultarFecha");
  });
});

describe("el mapa no inventa colores", () => {
  // Tenía la paleta copiada a mano de theme.js y ya había derivado: sus
  // dos dorados no existían en la app.
  it("dibujar-mapa.mjs saca los colores de theme.js", () => {
    const t = leer("scripts/dibujar-mapa.mjs");
    expect(t).toContain('from "../src/theme.js"');
    const hex = [...t.matchAll(/"#[0-9A-Fa-f]{6}"/g)].map((m) => m[0]);
    // El blanco puro es el único literal admitido: no es de la paleta.
    expect(hex.filter((h) => h.toUpperCase() !== '"#FFFFFF"')).toEqual([]);
  });
});

describe("CI y la máquina de desarrollo, la misma versión de Node", () => {
  // 2026-09-20: el flujo pedía Node 20 y aquí se usa el 24. El
  // package-lock que escribe npm 11 se dejaba fuera una dependencia que
  // npm 10 exige, y `npm ci` reventaba. El flujo llevaba desde que se
  // creó sin pasar ni una vez.
  it(".nvmrc y pruebas.yml coinciden", () => {
    expect(existsSync(".nvmrc"), "falta .nvmrc").toBe(true);
    const nvmrc = leer(".nvmrc").trim().replace(/^v/, "").split(".")[0];
    const flujo = leer(".github/workflows/pruebas.yml");
    const m = flujo.match(/node-version:\s*"?(\d+)/);
    expect(m, "no encuentro node-version en pruebas.yml").not.toBeNull();
    expect(m[1]).toBe(nvmrc);
  });
});

describe("el guardado del anfitrión manda solo lo cambiado", () => {
  // La otra mitad del mismo arreglo: si el cliente vuelve a mandar
  // `next` entero, la función nueva ya no borra de más pero el anfitrión
  // seguiría pisando con su copia vieja lo que un colaborador acabe de
  // rellenar.
  const ledger = leer("src/useLedgerData.js");

  it("calcula las filas cambiadas contra la última verdad del servidor", () => {
    expect(ledger).toMatch(/const cambiadas = next\.filter/);
  });

  it("no manda la lista entera como p_filas", () => {
    expect(ledger).toContain("p_filas: cambiadas,");
    expect(ledger).not.toMatch(/anfitrion_guardar_invitados[\s\S]{0,120}p_filas:\s*next\b/);
  });

  it("manda aparte la lista completa de ids, para el borrado", () => {
    expect(ledger).toContain("p_ids: next.map((g) => g.id)");
  });

  // Norma 18, los otros dos sitios con más de un escritor. El usuario es
  // anfitrión Y colaborador a la vez (lleva 10 invitados suyos), así que
  // puede tener el móvil y el portátil escribiendo a la vez él solo.
  it("las novedades también mandan solo lo cambiado", () => {
    expect(ledger).toContain("p_filas: cambiadas,");
    expect(ledger).not.toMatch(/guardar_novedades[\s\S]{0,140}p_filas:\s*next\b/);
  });

  it("las fotos familiares también", () => {
    expect(ledger).toMatch(/const cambiadas = filas\.filter/);
    expect(ledger).not.toMatch(/guardar_fotos_familiares[\s\S]{0,120}p_filas:\s*filas\b/);
  });

  it("ninguna llamada de guardado manda una colección entera", () => {
    const sospechosas = [...ledger.matchAll(/p_filas:\s*(\w+)/g)].map((m) => m[1]);
    // `cambiadas` es lo correcto; cualquier otra cosa es la lista entera.
    expect([...new Set(sospechosas)]).toEqual(["cambiadas"]);
  });
});
