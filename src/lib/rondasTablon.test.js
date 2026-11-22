import { describe, it, expect } from "vitest";
import { rondasTablon, pendientesDelTablon } from "./rondasTablon";
import { euros } from "./formato";

const estados = (yo, evento = {}) => rondasTablon(yo, evento).map((r) => `${r.id}:${r.estado}`);

describe("la guía de las tres rondas, al ritmo de cada uno (v69.4)", () => {
  // v84.2 el DJ no pagaba; v95.2 (él): paga como todos.
  it("el DJ contratado, «Pagado» con su importe como todos", () => {
    const evento = { fecha: "2026-12-11", precioAdulto: "45", precioNino: "20", edadNinoDesde: "2", edadNinoHasta: "12" };
    const yo = { datosCompletos: true, pagado: true, presente: false, anio: "1985" };
    expect(rondasTablon({ ...yo, zona: "DJ" }, evento)[1].nota).toBe(`Pagado · ${euros(45)}`);
    expect(rondasTablon(yo, evento)[1].nota).toBe(`Pagado · ${euros(45)}`);
  });

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

// v87.2 (él): «Te falta», al abrir el tablón.
describe("lo que le falta, al abrir el tablón", () => {
  const evento = { fecha: "2026-12-11", precioAdulto: "47", precioNino: "35", edadNinoDesde: "4", edadNinoHasta: "8" };
  const yo = { anio: "1980", pagado: false, datosCompletos: true, faltaFotoBoda: null, zona: "Icod" };

  it("sin pagar: el importe de su entrada, con su año", () => {
    expect(pendientesDelTablon(yo, evento)).toEqual({ importe: 47, fotoBoda: false, alergias: false });
    expect(pendientesDelTablon({ ...yo, anio: "2020" }, evento).importe).toBe(35);
  });

  it("pagado, el importe no sale; el DJ sin pagar, sí (v95.2: paga como todos)", () => {
    expect(pendientesDelTablon({ ...yo, pagado: true }, evento)).toBeNull();
    expect(pendientesDelTablon({ ...yo, zona: "DJ" }, evento)).toEqual(pendientesDelTablon(yo, evento));
  });

  it("la foto de boda y las alergias, también ya pagado", () => {
    expect(pendientesDelTablon({ ...yo, pagado: true, faltaFotoBoda: true, datosCompletos: false }, evento)).toEqual({ importe: 0, fotoBoda: true, alergias: true });
  });

  it("lo que la base no manda (SQL sin subir, o sin respuesta), no sale", () => {
    expect(pendientesDelTablon({ anio: "1980" }, evento)).toBeNull();
    expect(pendientesDelTablon(null, evento)).toBeNull();
  });
});
