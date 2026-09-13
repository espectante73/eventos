import { describe, it, expect } from "vitest";
import { exportarTodo } from "./backup";

// Un `data` mínimo con la misma forma que devuelve useLedgerData:
// datos, funciones, y banderas de estado mezclados.
const datosDePrueba = () => ({
  evento: { nombre: "Boda", fecha: "2026-11-27" },
  invitados: [{ id: "a1", nombre: "Ana", pagado: true }],
  colaboradores: [{ id: "c1", nombre: "Ruiz, Luis", permisos: ["invitaciones_enviar"], authUserId: "u1" }],
  mesas: [{ numero: 1, capacidad: 10 }],
  fotosFamiliares: { Ruiz: "data:image/jpeg;base64,xxx" },
  ordenFamiliares: { Ruiz: { orden: ["a1"], invitacionEnviada: true } },
  gastos: [{ id: "g1", concepto: "Flores", importe: "200" }],
  novedades: [{ id: "n1", titulo: "Horario", publicada: true }],
  avisosEnviados: [{ id: "e1", exito: true }],
  accesosTablonSospechosos: [],
  preguntaTablon: "¿Cómo se llama el perro?",
  // No son datos del evento:
  loaded: true,
  esAnfitrion: true,
  asistenciaEnVivo: false,
  // Secreto: no debe salir en un archivo que se descarga.
  tokenTablon: "8f3a-secreto-del-tablon",
  // Funciones, que es la mayor parte de lo que devuelve el hook:
  persistEvento: () => {},
  persistInvitados: () => {},
  avisarColaborador: () => {},
});

describe("exportarTodo", () => {
  it("guarda todas las tablas de datos, no solo unas cuantas", () => {
    const copia = JSON.parse(exportarTodo(datosDePrueba()));
    // Las cinco de siempre...
    expect(copia.evento).toBeDefined();
    expect(copia.invitados).toHaveLength(1);
    expect(copia.colaboradores).toHaveLength(1);
    expect(copia.mesas).toHaveLength(1);
    expect(copia.fotosFamiliares).toBeDefined();
    // ...y las que se quedaban fuera y motivaron el cambio.
    expect(copia.ordenFamiliares).toBeDefined();
    expect(copia.gastos).toHaveLength(1);
    expect(copia.novedades).toHaveLength(1);
    expect(copia.avisosEnviados).toHaveLength(1);
    expect(copia.preguntaTablon).toBe("¿Cómo se llama el perro?");
  });

  it("conserva los ids y los permisos, que es lo que hacía inservible la copia vieja", () => {
    const copia = JSON.parse(exportarTodo(datosDePrueba()));
    expect(copia.invitados[0].id).toBe("a1");
    expect(copia.colaboradores[0].id).toBe("c1");
    expect(copia.colaboradores[0].permisos).toEqual(["invitaciones_enviar"]);
    expect(copia.colaboradores[0].authUserId).toBe("u1");
  });

  it("no guarda funciones ni banderas de la pantalla", () => {
    const copia = JSON.parse(exportarTodo(datosDePrueba()));
    expect(copia.persistEvento).toBeUndefined();
    expect(copia.avisarColaborador).toBeUndefined();
    expect(copia.loaded).toBeUndefined();
    expect(copia.esAnfitrion).toBeUndefined();
    expect(copia.asistenciaEnVivo).toBeUndefined();
  });

  it("no deja escapar el secreto del tablón a un archivo descargado", () => {
    const texto = exportarTodo(datosDePrueba());
    expect(texto).not.toContain("8f3a-secreto-del-tablon");
    expect(JSON.parse(texto).tokenTablon).toBeUndefined();
  });

  // La razón de ser del cambio: que nadie tenga que acordarse de tocar
  // este archivo al añadir una tabla. Si alguien vuelve a poner una
  // lista de nombres a mano, este test se pone rojo.
  it("recoge sola una tabla nueva que aparezca en el hook", () => {
    const copia = JSON.parse(exportarTodo({ ...datosDePrueba(), regalos: [{ id: "r1" }] }));
    expect(copia.regalos).toEqual([{ id: "r1" }]);
  });

  it("aguanta que no le pasen nada", () => {
    expect(() => exportarTodo(undefined)).not.toThrow();
    expect(JSON.parse(exportarTodo(undefined)).version).toBe(2);
  });
});
