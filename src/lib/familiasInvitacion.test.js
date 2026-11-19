import { describe, it, expect } from "vitest";
import { familiasDelEvento, lineaFamilia, mesasYCantidad, filasAcomodadores, motivosNoLista } from "./familiasInvitacion";

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


describe("por qué una familia aún no tiene invitación (v90.8)", () => {
  const p = (extra = {}) => ({ confirmado: true, pagado: true, mesa: 3, ...extra });
  it("nadie confirmado: sin confirmar, o «No asiste(n)» si todos lo dijeron", () => {
    expect(motivosNoLista([p({ confirmado: false })], [], {})).toEqual(["Sin confirmar"]);
    expect(motivosNoLista([p({ confirmado: false, noAsiste: true })], [], {})).toEqual(["No asiste"]);
    const dos = [p({ confirmado: false, noAsiste: true }), p({ confirmado: false, noAsiste: true })];
    expect(motivosNoLista(dos, [], {})).toEqual(["No asisten"]);
    expect(motivosNoLista([dos[0], p({ confirmado: false })], [], {})).toEqual(["Sin confirmar"]);
  });

  it("con confirmados: cuántos sin pagar y cuántos sin mesa; lista, nada", () => {
    const c = [p({ pagado: false }), p({ pagado: false, mesa: null }), p()];
    expect(motivosNoLista(c, c, {})).toEqual(["Sin pagar 2", "Sin mesa 1"]);
    expect(motivosNoLista([p()], [p()], {})).toEqual([]);
  });

  it("en Modo Pruebas basta un confirmado, como para enviarla", () => {
    const c = [p({ pagado: false, mesa: null })];
    expect(motivosNoLista(c, c, { modoPruebasActivo: true })).toEqual([]);
  });
});

describe("las cuentas cuadran (v90.8)", () => {
  it("listas + no listas = todas las familias", () => {
    const inv = [
      { id: "1", apellido: "A", confirmado: true, pagado: true, mesa: 1 },
      { id: "2", apellido: "B", confirmado: true, pagado: false, mesa: 1 },
      { id: "3", apellido: "C", confirmado: false },
    ];
    const todas = familiasDelEvento(inv, {}, {});
    expect(todas.filter((f) => f.listaParaInvitacion).length + todas.filter((f) => !f.listaParaInvitacion).length).toBe(3);
    expect(todas.find((f) => f.clave === "B").motivos).toEqual(["Sin pagar 1"]);
    expect(todas.find((f) => f.clave === "C").miembros).toBe(1);
  });
});
