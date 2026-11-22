import { describe, it, expect } from "vitest";
import { PERMISOS, ETIQUETAS_PERMISOS, PERMISOS_DE_VISTA, PERMISOS_DE_EDICION, PERMISOS_EN_LA_APP, esDeEdicion, esDeLaApp, tienePermiso, GRUPOS_PERMISOS, ordenarPermisos } from "./permisos";

// El fallo que da origen a esto (usuario, 2026-09-21): el aviso rojo del
// colaborador decía "Tienes permisos de edición" y metía en la lista
// "Ver el código de la app", que no deja editar nada. Se escribió para
// los de edición y los de vista se colaron después.
describe("los dos tipos de permiso", () => {
  const claves = Object.values(PERMISOS);

  it("todos tienen etiqueta: sin ella, al colaborador le sale la clave en crudo", () => {
    for (const clave of claves) expect(ETIQUETAS_PERMISOS[clave], clave).toBeTruthy();
  });

  it("ver el código y ver el mapa NO son de edición", () => {
    expect(esDeEdicion(PERMISOS.REPOSITORIO_VER)).toBe(false);
    expect(esDeEdicion(PERMISOS.MAPA_SITIO_VER)).toBe(false);
  });

  it("de edición, solo los que cambian texto: Novedades y datos del evento (él, v91.4)", () => {
    expect(esDeEdicion(PERMISOS.NOVEDADES_EDITAR)).toBe(true);
    expect(esDeEdicion(PERMISOS.DATOS_EVENTO_EDITAR)).toBe(true);
    expect(esDeEdicion(PERMISOS.INVITACIONES_ENVIAR)).toBe(false);
    expect(esDeEdicion(PERMISOS.MULTIMEDIA)).toBe(false);
  });

  it("enviar invitaciones, Multimedia y acreditar son permisos en la app (y van en el aviso rojo)", () => {
    expect(esDeLaApp(PERMISOS.INVITACIONES_ENVIAR)).toBe(true);
    // Manejar la música en plena boda es responsabilidad.
    expect(esDeLaApp(PERMISOS.MULTIMEDIA)).toBe(true);
    expect(esDeLaApp(PERMISOS.ACREDITAR_ENTRADA)).toBe(true);
    // v95.1 (él: «no aparece el banner de permisos que tienen los demás»):
    // repasar la contabilidad solo mira, pero es una responsabilidad.
    expect(esDeLaApp(PERMISOS.CONTABILIDAD_VER)).toBe(true);
    expect(esDeLaApp(PERMISOS.NOVEDADES_EDITAR)).toBe(false);
  });

  it("cada permiso, en una sola de las tres clases", () => {
    for (const clave of claves) {
      const en = [PERMISOS_DE_EDICION, PERMISOS_EN_LA_APP, PERMISOS_DE_VISTA].filter((l) => l.includes(clave)).length;
      expect(en, clave).toBe(1);
    }
  });

  it("la lista de vista solo contiene permisos que existen", () => {
    for (const clave of PERMISOS_DE_VISTA) expect(claves).toContain(clave);
  });

  it("un permiso que solo deja mirar no enciende el aviso rojo", () => {
    const soloMira = { permisos: [PERMISOS.REPOSITORIO_VER] };
    expect(soloMira.permisos.filter(esDeEdicion)).toEqual([]);
    expect(soloMira.permisos.filter(esDeLaApp)).toEqual([]);
    // Pero el permiso sigue estando: el enlace tiene que verse.
    expect(tienePermiso(soloMira, PERMISOS.REPOSITORIO_VER)).toBe(true);
  });

  // La etiqueta dio dos vueltas el mismo día. Primero era "Ver el código
  // de la app (enlace a GitHub)" dentro de una frase que prometía
  // "permisos de edición": el problema no era nombrar GitHub, era la
  // frase. Con la frase arreglada, el usuario pidió justo lo contrario
  // -- que se vea claro que lleva a GitHub, porque el link ES el
  // permiso.
  it("la etiqueta dice a dónde lleva", () => {
    expect(ETIQUETAS_PERMISOS[PERMISOS.REPOSITORIO_VER]).toMatch(/github/i);
  });
});

// Permisos, por zona de la app (él, v91.7): Multimedia y Canciones para
// bailar, juntas en «Música».
describe("los grupos de la ventana Permisos", () => {
  const claves = Object.values(PERMISOS);
  const agrupadas = GRUPOS_PERMISOS.flatMap((g) => g.claves);

  it("cada permiso, en un solo grupo: uno nuevo sin grupo no saldría en la ventana", () => {
    for (const clave of claves) expect(agrupadas.filter((c) => c === clave).length, clave).toBe(1);
    expect(agrupadas.length).toBe(claves.length);
  });

  it("la música, junta", () => {
    const musica = GRUPOS_PERMISOS.find((g) => g.titulo === "Música");
    expect(musica.claves).toEqual([PERMISOS.MULTIMEDIA, PERMISOS.CANCIONES_DJ]);
  });

  it("ordenarPermisos sigue el orden de los grupos y deja al final lo que ya no existe", () => {
    expect(ordenarPermisos(["viejo", PERMISOS.CANCIONES_DJ, PERMISOS.NOVEDADES_EDITAR, PERMISOS.MULTIMEDIA])).toEqual([
      PERMISOS.NOVEDADES_EDITAR,
      PERMISOS.MULTIMEDIA,
      PERMISOS.CANCIONES_DJ,
      "viejo",
    ]);
  });
});
