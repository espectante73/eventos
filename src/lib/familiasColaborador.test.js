import { describe, it, expect } from "vitest";
import { familiaCerrada, agruparFamilias, miembrosDesdeLista } from "./familiasColaborador";
import { datosCompletos } from "./invitados";

const m = (id, nombre, extra = {}) => ({
  id, nombre, apellido: "Medina", grupoFamiliar: "Medina01", rolFamiliar: "hijo",
  anioNacimiento: "1990", anioBoda: "", datosCompletos: true, pagado: false, presente: false, esMio: true, ...extra,
});
const evento = { precioAdulto: "47", precioNino: "20", edadNinoDesde: "3", edadNinoHasta: "12", fecha: "2026-11-13" };

describe("familiaCerrada", () => {
  it("todos con sus datos: cerrada; uno a medias: no", () => {
    expect(familiaCerrada([m("1", "Ana"), m("2", "Luis")])).toBe(true);
    expect(familiaCerrada([m("1", "Ana"), m("2", "Luis", { datosCompletos: false })])).toBe(false);
    expect(familiaCerrada([m("1", "Ana")], { incompletas: new Set(["1"]) })).toBe(false);
  });

  it("con matrimonio: foto (con su año) o «No»", () => {
    const pareja = [m("1", "Ana", { rolFamiliar: "esposa" }), m("2", "Luis", { rolFamiliar: "esposo" })];
    expect(familiaCerrada(pareja)).toBe(false);
    expect(familiaCerrada(pareja, { fotosSinBoda: { Medina01: true } })).toBe(true);
    expect(familiaCerrada(pareja, { fotosFamiliares: { Medina01: "ruta" } })).toBe(false);
    const conAnio = pareja.map((x) => ({ ...x, anioBoda: "2010" }));
    expect(familiaCerrada(conAnio, { fotosFamiliares: { Medina01: "ruta" } })).toBe(true);
  });

  it("quien viene solo es su propia familia", () => {
    expect(familiaCerrada([m("1", "Sara", { apellido: "Sosa", grupoFamiliar: "Sosa01", rolFamiliar: "suelto" })])).toBe(true);
  });
});

describe("agruparFamilias", () => {
  it("una por familia, con lo que falta por pagar y quién responde por ella", () => {
    const [f] = agruparFamilias([m("1", "Ana", { pagado: true }), m("2", "Luis"), m("3", "Pablo", { esMio: false })], {}, evento);
    expect(f.etiqueta).toBe("Medina");
    expect(f.porPagar.map((x) => x.id)).toEqual(["2", "3"]);
    expect(f.totalPorPagar).toBe(94);
    expect(f.todosPagados).toBe(false);
    expect(f.representante.id).toBe("1");
  });

  it("dos familias con el mismo apellido llevan su número", () => {
    const familias = agruparFamilias([m("1", "Ana"), m("2", "Eva", { grupoFamiliar: "Medina02" })], {}, evento);
    expect(familias.map((f) => f.etiqueta)).toEqual(["Medina 1", "Medina 2"]);
  });
});

describe("miembrosDesdeLista", () => {
  it("las familias del colaborador, con los que lleva otro", () => {
    const invitados = [
      { id: "1", nombre: "Ana", apellido: "Medina", grupoFamiliar: "Medina01", colaboradorId: "c1", confirmado: true, anioNacimiento: "1990", alergias: "No" },
      { id: "2", nombre: "Luis", apellido: "Medina", grupoFamiliar: "Medina01", colaboradorId: "c2", confirmado: true },
      { id: "3", nombre: "Eva", apellido: "Ruiz", grupoFamiliar: "Ruiz01", colaboradorId: "c2", confirmado: true },
      { id: "4", nombre: "Pepe", apellido: "Medina", grupoFamiliar: "Medina01", colaboradorId: "c1", confirmado: false },
    ];
    const miembros = miembrosDesdeLista(invitados, "c1", datosCompletos);
    expect(miembros.map((x) => [x.id, x.esMio, x.datosCompletos])).toEqual([
      ["1", true, true],
      ["2", false, false],
    ]);
  });
});
