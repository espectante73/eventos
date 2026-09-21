import { describe, it, expect } from "vitest";
import { PERMISOS, ETIQUETAS_PERMISOS, PERMISOS_DE_VISTA, esDeEdicion, tienePermiso } from "./permisos";

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

  it("editar novedades, datos del evento y enviar invitaciones SÍ lo son", () => {
    expect(esDeEdicion(PERMISOS.NOVEDADES_EDITAR)).toBe(true);
    expect(esDeEdicion(PERMISOS.DATOS_EVENTO_EDITAR)).toBe(true);
    expect(esDeEdicion(PERMISOS.INVITACIONES_ENVIAR)).toBe(true);
  });

  it("la lista de vista solo contiene permisos que existen", () => {
    for (const clave of PERMISOS_DE_VISTA) expect(claves).toContain(clave);
  });

  it("un permiso que solo deja mirar no enciende el aviso rojo", () => {
    const soloMira = { permisos: [PERMISOS.REPOSITORIO_VER] };
    expect(soloMira.permisos.filter(esDeEdicion)).toEqual([]);
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
