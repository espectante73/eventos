import { describe, it, expect } from "vitest";
import { familiaDe, preguntaFamilia, textoPreguntaFamilia, euros } from "./familiaCobroLlegada";

const evento = { fecha: "2026-11-13", precioAdulto: "45", precioNino: "20", edadNinoDesde: "3", edadNinoHasta: "12" };
const g = (id, nombre, extra = {}) => ({
  id, nombre, apellido: "Abreu", grupoFamiliar: "Abreu01", confirmado: true,
  anioNacimiento: "1980", alergias: "No", pagado: false, presente: false, colaboradorId: "c1", ...extra,
});
const invitados = [
  g("a", "Gustavo"),
  g("b", "Míriam", { colaboradorId: "c2" }), // la lleva OTRO colaborador
  g("c", "Lucía", { anioNacimiento: "2018" }),
  g("d", "Primo", { confirmado: false }),
  { ...g("e", "Otro"), apellido: "Pérez", grupoFamiliar: "Perez01" },
];

describe("la familia para el pago y la llegada", () => {
  it("son los confirmados de la misma familia, aunque los lleve otro colaborador", () => {
    expect(familiaDe(invitados, invitados[0]).map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("al cobrar, suma el importe de cada uno (la niña, precio niño)", () => {
    const p = preguntaFamilia(familiaDe(invitados, invitados[0]), "pagado", true, { evento });
    expect(p.total).toBe(45 + 45 + 20);
    expect(p.puedeTodos).toBe(true);
  });

  it("si a alguien le faltan datos, no se puede a toda la familia y dice quién", () => {
    const lista = invitados.map((x) => (x.id === "c" ? { ...x, alergias: "" } : x));
    const p = preguntaFamilia(familiaDe(lista, lista[0]), "pagado", true, { evento });
    expect(p.puedeTodos).toBe(false);
    expect(textoPreguntaFamilia(p, "pagado", true, evento)).toContain("Abreu, Lucía: le faltan datos obligatorios.");
  });

  it("la llegada exige haber pagado, y que el anfitrión haya abierto el control", () => {
    const pagados = invitados.map((x) => ({ ...x, pagado: x.id !== "b" }));
    const p = preguntaFamilia(familiaDe(pagados, pagados[0]), "presente", true, { marcadoAbierto: true });
    expect(p.bloqueados.map((b) => b.m.id)).toEqual(["b"]);
    const cerrado = preguntaFamilia(familiaDe(pagados, pagados[0]), "presente", true, { marcadoAbierto: false });
    expect(cerrado.puedeTodos).toBe(false);
  });

  it("deshacer no se bloquea nunca, y solo cuenta a quien ya estaba marcado", () => {
    const lista = invitados.map((x) => ({ ...x, pagado: x.id === "a" || x.id === "b", alergias: "" }));
    const p = preguntaFamilia(familiaDe(lista, lista[0]), "pagado", false, { evento });
    expect(p.puedeTodos).toBe(true);
    expect(p.aCambiar.map((m) => m.id)).toEqual(["a", "b"]);
    expect(p.total).toBeNull();
  });

  it("los euros, en formato de aquí: 110,00 €", () => {
    expect(euros(110).replace(/\s/g, " ")).toBe("110,00 €");
  });
});
