import { describe, it, expect } from "vitest";
import { asignarMesaConSuFamilia, confirmarConSuFamilia, claveFamiliaMesa } from "./mesas";

// La regla del usuario: una familia no se separa nunca.
const persona = (id, extra) => ({ id, nombre: id, apellido: "Abreu", grupoFamiliar: "Abreu01", confirmado: true, mesa: null, ...extra });
const mesas = [
  { numero: 1, capacidad: 10 },
  { numero: 2, capacidad: 3 },
];
const mesaDe = (lista, id) => lista.find((g) => g.id === id).mesa;

describe("una familia no se separa", () => {
  const familia = [persona("padre"), persona("hijo1"), persona("hijo2")];

  it("poner mesa a uno la pone a toda su familia", () => {
    const { invitados, aviso } = asignarMesaConSuFamilia(familia, "hijo1", 1, mesas);
    expect(aviso).toBe("");
    expect(invitados.map((g) => g.mesa)).toEqual([1, 1, 1]);
  });

  it("quitarla a uno la quita a todos", () => {
    const sentados = familia.map((g) => ({ ...g, mesa: 1 }));
    const { invitados } = asignarMesaConSuFamilia(sentados, "padre", null, mesas);
    expect(invitados.every((g) => g.mesa === null)).toBe(true);
  });

  it("si no caben todos, no se sienta a nadie y avisa", () => {
    const otros = [persona("x", { grupoFamiliar: "Otra" , mesa: 2 })];
    const { invitados, aviso } = asignarMesaConSuFamilia([...familia, ...otros], "padre", 2, mesas);
    expect(aviso).toContain("solo quedan 2 sitios");
    expect(mesaDe(invitados, "padre")).toBe(null);
    expect(mesaDe(invitados, "hijo1")).toBe(null);
  });

  it("otra familia (el hijo mayor con otro apellido) no se mueve", () => {
    const mayor = persona("mayor", { apellido: "Pérez", grupoFamiliar: "Pérez01" });
    const { invitados } = asignarMesaConSuFamilia([...familia, mayor], "padre", 1, mesas);
    expect(mesaDe(invitados, "mayor")).toBe(null);
  });

  it("los no confirmados de la familia se quedan sin mesa", () => {
    const conPendiente = [...familia, persona("tia", { confirmado: false })];
    const { invitados } = asignarMesaConSuFamilia(conPendiente, "padre", 1, mesas);
    expect(mesaDe(invitados, "tia")).toBe(null);
    expect(mesaDe(invitados, "hijo2")).toBe(1);
  });

  it("a un no confirmado no se le puede poner mesa", () => {
    const { aviso } = asignarMesaConSuFamilia([persona("a", { confirmado: false })], "a", 1, mesas);
    expect(aviso).toContain("confírmalo");
  });

  it("sin grupo familiar, la familia es el apellido (igual que el Auto-asignar)", () => {
    expect(claveFamiliaMesa({ apellido: " Abreu " })).toBe("abreu");
    expect(claveFamiliaMesa({ grupoFamiliar: "Abreu01", apellido: "Abreu" })).toBe("abreu01");
  });
});

describe("al confirmar, se sienta con los suyos", () => {
  it("si su familia ya tiene mesa, va a esa mesa", () => {
    const lista = [persona("padre", { mesa: 1 }), persona("hijo", { confirmado: false })];
    const { invitados, aviso } = confirmarConSuFamilia(lista, "hijo", mesas);
    expect(aviso).toBe("");
    expect(invitados.find((g) => g.id === "hijo")).toMatchObject({ confirmado: true, mesa: 1 });
  });

  it("si no cabe, se confirma igual pero sin mesa, y avisa", () => {
    const llena = [persona("a", { mesa: 2 }), persona("b", { mesa: 2 }), persona("c", { mesa: 2 }), persona("d", { confirmado: false })];
    const { invitados, aviso } = confirmarConSuFamilia(llena, "d", mesas);
    expect(invitados.find((g) => g.id === "d")).toMatchObject({ confirmado: true, mesa: null });
    expect(aviso).toContain("no queda sitio");
  });

  it("desconfirmar no toca la mesa de nadie", () => {
    const lista = [persona("padre", { mesa: 1 }), persona("hijo", { mesa: 1 })];
    const { invitados } = confirmarConSuFamilia(lista, "hijo", mesas);
    expect(invitados.map((g) => g.mesa)).toEqual([1, 1]);
    expect(invitados.find((g) => g.id === "hijo").confirmado).toBe(false);
  });
});
