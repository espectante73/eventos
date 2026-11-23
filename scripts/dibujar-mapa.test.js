// El plano de la aplicación (public/mapa-de-la-aplicacion.png) lo dibuja
// scripts/dibujar-mapa.mjs a partir del menú DE VERDAD: lib/menuAnfitrion.js,
// la misma pieza con la que «Abrir sección…» arma sus botones. Antes el
// script llevaba la lista escrita a mano y se quedó atrás dos veces (la
// última, él, v96.2: faltaban «Avisar equipo» y lo de dentro de «Invitados»).
//
// Lo que se vigila aquí:
// - que el menú que se ve sale de esa pieza, entrada por entrada;
// - que la imagen se redibujó con el menú de ahora (la ficha
//   mapa-generado.json guarda lo que se dibujó) y con la versión de ahora.
// Si alguien cambia el menú y no la redibuja, esto se pone en rojo y git no
// deja subir.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { VERSION_APP } from "../src/constants.js";
import { estructuraMenuAnfitrion } from "../src/lib/menuAnfitrion.js";
import { DesplegableSecciones } from "../src/components/DesplegableSecciones";

const aqui = dirname(fileURLToPath(import.meta.url));
const script = readFileSync(join(aqui, "dibujar-mapa.mjs"), "utf-8");

// Igual que en el script: cada entrada por su nombre y lo que hay dentro.
// El tercer nivel (cada colaborador) cambia con los datos: no entra.
const resumen = (entradas) => entradas.map((e) => (e.submenu && !e.porColaborador ? { [e.etiqueta]: resumen(e.submenu) } : e.etiqueta));
const nada = () => {};
const menuQueSeVe = () =>
  DesplegableSecciones({
    abierto: {},
    toggle: nada,
    colaboradores: [{ id: "c1", nombre: "Ruiz, Ana" }],
    onCambiarRol: nada,
    anfitrionToken: "t",
    abrirNovedades: nada,
    abrirCronograma: nada,
    abrirMusicaEvento: nada,
    abrirInvitados: nada,
    abrirMesas: nada,
    abrirMiCuenta: nada,
  }).props.opciones;

describe("el menú y el mapa salen de la misma pieza", () => {
  it("«Abrir sección…» enseña, nivel a nivel, lo que dice lib/menuAnfitrion.js", () => {
    const quitarTercerNivel = (ops) => ops.map((o) => (o.submenu && o.id !== "colaboradores-formularios" ? { ...o, submenu: quitarTercerNivel(o.submenu) } : { ...o, submenu: undefined }));
    expect(resumen(quitarTercerNivel(menuQueSeVe()))).toEqual(resumen(estructuraMenuAnfitrion()));
  });

  it("cada botón del menú lleva su icono y hace algo al tocarlo", () => {
    const repasar = (ops) => {
      for (const o of ops) {
        expect(o.icono, `«${o.etiqueta}» sin icono`).toBeTruthy();
        if (o.submenu) repasar(o.submenu);
        else expect(typeof o.onClick, `«${o.etiqueta}» no hace nada`).toBe("function");
      }
    };
    repasar(menuQueSeVe());
  });

  it("la imagen se dibujó con el menú de ahora", () => {
    const ficha = JSON.parse(readFileSync(join(aqui, "mapa-generado.json"), "utf-8"));
    expect(
      ficha.menu,
      'El menú ha cambiado y el mapa no se ha redibujado. Regenéralo:  node scripts/dibujar-mapa.mjs'
    ).toEqual(resumen(estructuraMenuAnfitrion()));
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
