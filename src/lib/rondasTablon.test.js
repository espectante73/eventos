import { describe, it, expect } from "vitest";
import { rondasTablon } from "./rondasTablon";
import { euros } from "./formato";

const estados = (yo, evento = {}) => rondasTablon(yo, evento).map((r) => `${r.id}:${r.estado}`);

describe("la guía de las tres rondas, al ritmo de cada uno (v69.4)", () => {
  it("sin los datos completos, en Datos", () => {
    expect(estados({ datosCompletos: false, pagado: false, presente: false })).toEqual(["datos:ahora", "recaudacion:pendiente", "acreditacion:pendiente"]);
  });

  it("con los datos, en Recaudación, aunque nadie le haya pedido el dinero", () => {
    expect(estados({ datosCompletos: true, pagado: false, presente: false })).toEqual(["datos:hecha", "recaudacion:ahora", "acreditacion:pendiente"]);
  });

  it("pagado: «Pagado», claro, y espera al día del evento", () => {
    expect(estados({ datosCompletos: true, pagado: true, presente: false })).toEqual(["datos:hecha", "recaudacion:hecha", "acreditacion:pendiente"]);
  });

  it("con las Llegadas abiertas, todos en Acreditación; ya dentro, hecha", () => {
    const dia = { asistenciaAbierta: true };
    expect(estados({ datosCompletos: true, pagado: true, presente: false }, dia)).toEqual(["datos:hecha", "recaudacion:hecha", "acreditacion:ahora"]);
    expect(estados({ datosCompletos: true, pagado: true, presente: true }, dia)).toEqual(["datos:hecha", "recaudacion:hecha", "acreditacion:hecha"]);
  });

  it("sin los tres «sí/no» del servidor, no hay guía", () => {
    expect(rondasTablon({ nombre: "Medina, Ana" }, {})).toBeNull();
    expect(rondasTablon(null, {})).toBeNull();
  });
});

describe("«Pagado» con su importe (v70.1)", () => {
  const evento = { fecha: "2026-12-11", precioAdulto: "94", precioNino: "40", edadNinoDesde: "3", edadNinoHasta: "12" };
  const recaudacion = (yo) => rondasTablon({ datosCompletos: true, pagado: true, presente: false, ...yo }, evento)[1].nota;
  it("el de su entrada, según su edad", () => {
    expect(recaudacion({ anio: "1975" })).toBe(`Pagado · ${euros(94)}`);
    expect(recaudacion({ anio: "2018" })).toBe(`Pagado · ${euros(40)}`);
  });
  it("sin año, o si no paga (un bebé), solo «Pagado»", () => {
    expect(recaudacion({})).toBe("Pagado");
    expect(recaudacion({ anio: "2025" })).toBe("Pagado");
  });
});
