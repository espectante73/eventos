// v73.1 (él): el equipo, alfabético por apellido y, en cada matrimonio, el esposo arriba.
import { it, expect } from "vitest";
import { ordenarEquipo, equipoDesdeDatos } from "./equipoColaboradores";
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
