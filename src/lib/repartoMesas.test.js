// v74 (él): probar el reparto moviendo familias enteras; que no deje sentar
// a más de los que caben; y nada se guarda hasta «Aplicar a la Lista».
import { describe, it, expect } from "vitest";
import { conBorrador, familiasParaRepartir, moverFamilia, aplicarBorrador, familiasQueCambian, ocupacion } from "./repartoMesas";
import { ROL_FAMILIAR } from "./rolFamiliar";

const g = (id, apellido, nombre, rol, extra = {}) => ({ id, apellido, nombre, grupoFamiliar: `${apellido}01`, rolFamiliar: rol, confirmado: true, mesa: null, ...extra });
const invitados = [
  g("1", "García", "Isaias", ROL_FAMILIAR.ESPOSO),
  g("2", "García", "Ana", ROL_FAMILIAR.ESPOSA),
  g("3", "García", "Leo", ROL_FAMILIAR.HIJO),
  g("4", "Expósito", "Rosi", ROL_FAMILIAR.SUELTO, { mesa: 6 }),
  g("5", "Pérez", "Loli", ROL_FAMILIAR.ESPOSA),
  g("6", "Pérez", "Pablo", ROL_FAMILIAR.ESPOSO, { confirmado: false }),
];
const mesas = [
  { numero: 6, capacidad: 3 },
  { numero: 7, capacidad: 10 },
];

describe("familiasParaRepartir", () => {
  it("cada familia con su «O» (o su primer adulto) y cuántos confirmados son", () => {
    const familias = familiasParaRepartir(invitados);
    const garcia = familias.find((f) => f.clave === "garcía01");
    expect(garcia).toMatchObject({ nombre: "García, Isaias", cuantos: 3, mesa: null });
    expect(familias.find((f) => f.clave === "expósito01")).toMatchObject({ nombre: "Expósito, Rosi", cuantos: 1, mesa: 6 });
    // Pablo sin confirmar no cuenta ni da nombre.
    expect(familias.find((f) => f.clave === "pérez01")).toMatchObject({ nombre: "Pérez, Loli", cuantos: 1 });
  });
});

describe("moverFamilia", () => {
  it("la familia entera, solo en el borrador: la Lista no se toca", () => {
    const { borrador, aviso } = moverFamilia(invitados, {}, "1", 7, mesas);
    expect(aviso).toBe("");
    expect(borrador).toEqual({ 1: 7, 2: 7, 3: 7 });
    expect(invitados[0].mesa).toBeNull();
    expect(conBorrador(invitados, borrador).filter((x) => x.mesa === 7)).toHaveLength(3);
  });

  it("no deja sentar a más de los que caben, y dice cuántos sitios quedan", () => {
    const { borrador, aviso } = moverFamilia(invitados, {}, "1", 6, mesas);
    expect(borrador).toEqual({});
    expect(aviso).toContain("son 3");
    expect(aviso).toContain("solo quedan 2 sitios");
  });

  it("volver a su mesa de antes la quita del borrador", () => {
    const { borrador } = moverFamilia(invitados, {}, "4", 7, mesas);
    expect(borrador).toEqual({ 4: 7 });
    expect(moverFamilia(invitados, borrador, "4", 6, mesas).borrador).toEqual({});
  });
});

describe("aplicar", () => {
  it("solo cambian las mesas del borrador; cuenta las familias que cambian", () => {
    const borrador = { 1: 7, 2: 7, 3: 7 };
    const aplicada = aplicarBorrador(invitados, borrador);
    expect(aplicada.filter((x) => x.mesa === 7).map((x) => x.id)).toEqual(["1", "2", "3"]);
    expect(aplicada.find((x) => x.id === "4").mesa).toBe(6);
    expect(familiasQueCambian(invitados, borrador)).toBe(1);
  });
});

// v74.2 (él): «sentar también a los no confirmados para cuadrar con tiempo;
// si desactivo el check, no quitarlos de su asignación: que se sombreen
// hasta confirmar».
describe("los no confirmados", () => {
  const conTentativa = [
    ...invitados,
    g("7", "Luis", "Dani", ROL_FAMILIAR.ESPOSO, { confirmado: false }),
    g("8", "Luis", "Míriam", ROL_FAMILIAR.ESPOSA, { confirmado: false }),
    g("9", "Bravo", "Yeray", ROL_FAMILIAR.SUELTO, { confirmado: false, mesa: 7 }),
    g("10", "Sierra", "Raul", ROL_FAMILIAR.SUELTO, { confirmado: false, noAsiste: true }),
  ];

  it("sin la casilla, solo salen los que ya tienen sitio; con ella, todos menos «No asiste»", () => {
    const sin = familiasParaRepartir(conTentativa).map((f) => f.nombre);
    expect(sin).toContain("Bravo, Yeray");
    expect(sin).not.toContain("Luis, Dani");
    const con = familiasParaRepartir(conTentativa, { conSinConfirmar: true }).map((f) => f.nombre);
    expect(con).toContain("Luis, Dani");
    expect(con).not.toContain("Sierra, Raul");
    expect(familiasParaRepartir(conTentativa, { conSinConfirmar: true }).find((f) => f.nombre === "Luis, Dani").sinConfirmar).toBe(2);
  });

  it("con la casilla se sientan; su sitio cuenta en la mesa", () => {
    const { borrador, aviso } = moverFamilia(conTentativa, {}, "7", 7, mesas, { conSinConfirmar: true });
    expect(aviso).toBe("");
    expect(borrador).toEqual({ 7: 7, 8: 7 });
    expect(ocupacion(conBorrador(conTentativa, borrador), 7)).toBe(3);
  });

  it("sin la casilla, a quien no tiene sitio no se le sienta", () => {
    expect(moverFamilia(conTentativa, {}, "7", 7, mesas).aviso).toContain("todavía no está confirmado");
  });
});
