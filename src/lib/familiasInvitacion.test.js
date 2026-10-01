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

describe("la lista para acomodadores", () => {
  it("por familia: una fila por familia confirmada, de la A a la Z", () => {
    const filas = filasAcomodadores(invitados, {}, "familia");
    expect(filas.map((f) => f.apellido)).toEqual(["Álvarez", "Fariña", "Ruiz", "Sosa"]);
    expect(filas[1]).toMatchObject({ linea: "Fariña: Benito, Meritxell y Pablo", mesas: [5], cantidad: 3 });
  });

  it("por mesa: de la 1 en adelante, la repartida en cada una de sus mesas y sin mesa al final", () => {
    const filas = filasAcomodadores(invitados, {}, "mesa");
    expect(filas.map((f) => [f.mesaOrden, f.apellido])).toEqual([
      [2, "Ruiz"],
      [5, "Fariña"],
      [5, "Ruiz"],
      [6, "Álvarez"],
      [null, "Sosa"],
    ]);
  });

  it("sin nadie confirmado, ninguna fila", () => {
    expect(filasAcomodadores([inv("x", "X", "X", "X01", 1, { confirmado: false })], {}, "mesa")).toEqual([]);
  });
});
