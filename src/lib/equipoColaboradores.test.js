// v73.1 (él): el equipo, alfabético por apellido y, en cada matrimonio, el esposo arriba.
import { it, expect } from "vitest";
import { ordenarEquipo, equipoDesdeDatos, colaboradorEsDj, colaboradoresSinDj, equipoSinDj } from "./equipoColaboradores";
import { ROL_FAMILIAR } from "./rolFamiliar";

const p = (apellido, nombre, rol = "", grupo = `${apellido}01`) => ({ apellido, nombre, rolFamiliar: rol, grupoFamiliar: grupo });

it("alfabético por apellido, y en un matrimonio el esposo antes que la esposa", () => {
  const equipo = [
    p("Sierra", "Raul"),
    p("Álvarez", "Noelia", ROL_FAMILIAR.ESPOSA),
    p("Bravo", "Yeray"),
    p("Álvarez", "Rodrigo", ROL_FAMILIAR.ESPOSO),
  ];
  expect(ordenarEquipo(equipo).map((x) => `${x.apellido}, ${x.nombre}`)).toEqual([
    "Álvarez, Rodrigo",
    "Álvarez, Noelia",
    "Bravo, Yeray",
    "Sierra, Raul",
  ]);
});

it("mismo apellido y distinta familia: cada familia junta, por su nombre", () => {
  const equipo = [p("Luis", "Míriam", "", "Luis02"), p("Luis", "Dani", "", "Luis01")];
  expect(ordenarEquipo(equipo).map((x) => x.nombre)).toEqual(["Dani", "Míriam"]);
});

it("el anfitrión lo saca de sus datos: el nombre y la zona, de la ficha", () => {
  const colaboradores = [{ id: "c1", nombre: "Pacheo, Scarly", invitadoId: "g1" }, { id: "c2", nombre: "Sierra, Raul" }];
  const invitados = [{ id: "g1", apellido: "Pacheco", nombre: "Scarly", zona: "Icod", grupoFamiliar: "Pacheco01", rolFamiliar: "esposa" }];
  const equipo = equipoDesdeDatos(colaboradores, invitados, "c1");
  expect(equipo[0]).toMatchObject({ apellido: "Pacheco", nombre: "Scarly", zona: "Icod", esYo: true });
  expect(equipo[1]).toMatchObject({ apellido: "Sierra", nombre: "Raul", zona: "", esYo: false });
});

it("el DJ (v91.1): lo dice su ficha; fuera de las listas del equipo, salvo para él mismo", () => {
  const invitados = [
    { id: "g1", apellido: "Pacheco", nombre: "Scarly", zona: "Icod" },
    { id: "g9", apellido: "Brown", nombre: "Julien", zona: " dj " },
  ];
  const colaboradores = [{ id: "c1", invitadoId: "g1" }, { id: "c9", invitadoId: "g9" }, { id: "c2" }];
  expect(colaboradorEsDj(colaboradores[1], invitados)).toBe(true);
  expect(colaboradorEsDj(colaboradores[0], invitados)).toBe(false);
  expect(colaboradorEsDj(colaboradores[2], invitados)).toBe(false);
  expect(colaboradoresSinDj(colaboradores, invitados).map((c) => c.id)).toEqual(["c1", "c2"]);
  expect(equipoSinDj(equipoDesdeDatos(colaboradores, invitados, "c1")).map((x) => x.id)).toEqual(["c1", "c2"]);
  expect(equipoSinDj(equipoDesdeDatos(colaboradores, invitados, "c9")).map((x) => x.id)).toEqual(["c1", "c9", "c2"]);
});
