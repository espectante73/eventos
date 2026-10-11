import { describe, it, expect } from "vitest";
import { familiasDelEvento, lineaFamilia, mesasYCantidad, filasAcomodadores } from "./familiasInvitacion";

const inv = (id, nombre, apellido, grupoFamiliar, mesa, extra = {}) => ({
  id, nombre, apellido, grupoFamiliar, mesa, confirmado: true, pagado: true, ...extra,
});

const invitados = [
  inv("f1", "Benito", "Fariña", "Fariña01", 5),
  inv("f2", "Meritxell", "Fariña", "Fariña01", 5),
  inv("f3", "Pablo", "Fariña", "Fariña01", 5),
  inv("a1", "Ana", "Álvarez", "Alvarez01", 6),
  inv("r1", "Rosa", "Ruiz", "Ruiz01", 5),
  inv("r2", "Luis", "Ruiz", "Ruiz01", 2),
  inv("s1", "Sara", "Sosa", "Sosa01", null),
  inv("t1", "Tomás", "Toledo", "Toledo01", 1, { confirmado: false }),
];

describe("la etiqueta de la familia, la misma que la invitación", () => {
  it("«Fariña: Benito, Meritxell y Pablo»", () => {
    expect(lineaFamilia("Fariña", ["Benito", "Meritxell", "Pablo"])).toBe("Fariña: Benito, Meritxell y Pablo");
  });

  it("respeta el orden de nombres que puso el anfitrión", () => {
    const [fariña] = familiasDelEvento(invitados, { Fariña01: { orden: ["f3", "f1"] } });
    expect(fariña.confirmados.map((m) => m.nombre)).toEqual(["Pablo", "Benito", "Meritxell"]);
  });

  it("mesas sin repetir y cuántos son", () => {
    const ruiz = familiasDelEvento(invitados).find((f) => f.clave === "Ruiz01");
    expect(mesasYCantidad(ruiz)).toEqual({ mesas: [5, 2], cantidad: 2 });
  });
});

describe("la lista para acomodadores (v63.4)", () => {
  it("una fila por familia confirmada, de la A a la Z", () => {
    const { principal, equipo } = filasAcomodadores(invitados, {});
    expect(principal.map((f) => f.apellido)).toEqual(["Álvarez", "Fariña", "Ruiz", "Sosa"]);
    expect(equipo).toEqual([]);
    expect(principal[1]).toMatchObject({ linea: "Fariña: Benito, Meritxell y Pablo", mesas: [5], cantidad: 3 });
  });

  it("al final, aparte, las familias de colaboradores y de acomodadores", () => {
    const conAcomodador = invitados.map((g) => (g.id === "s1" ? { ...g, rolesTrabajo: ["Acomodadora"] } : g));
    const { principal, equipo } = filasAcomodadores(conAcomodador, {}, [{ id: "c1", invitadoId: "f2" }]);
    expect(principal.map((f) => f.apellido)).toEqual(["Álvarez", "Ruiz"]);
    expect(equipo.map((f) => f.apellido)).toEqual(["Fariña", "Sosa"]);
  });

  it("otro papel de trabajo no cuenta; un colaborador sin ficha enlazada, tampoco", () => {
    const cocina = invitados.map((g) => (g.id === "s1" ? { ...g, rolesTrabajo: ["Cocina"] } : g));
    expect(filasAcomodadores(cocina, {}, [{ id: "c2", invitadoId: null }]).equipo).toEqual([]);
  });

  it("sin nadie confirmado, ninguna fila", () => {
    expect(filasAcomodadores([inv("x", "X", "X", "X01", 1, { confirmado: false })], {})).toEqual({ principal: [], equipo: [] });
  });
});
