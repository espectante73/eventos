import { describe, it, expect } from "vitest";
import { entregasDe, porEntregar, itemsDeEntrega, propinasTotales, desglosePropinas, estadoEntregas, ordenarPorEntregas, cuadreEntregas } from "./entregas";

// v87 (él): un colaborador entrega lo cobrado en varias rondas; cada una con
// su importe, su propina y su acuse, solo con los invitados de esa entrega.
const evento = { fecha: "2026-12-11", precioAdulto: "47", precioNino: "35", edadNinoDesde: "4", edadNinoHasta: "8" };
const g = (id, apellido, extra = {}) => ({ id, nombre: "N", apellido, colaboradorId: "c1", confirmado: true, pagado: true, anioNacimiento: "1980", ...extra });

describe("las entregas de dinero de un colaborador", () => {
  const invitados = [g("a", "Ruiz"), g("b", "Abreu"), g("c", "Sosa", { pagado: false }), g("d", "Gil", { colaboradorId: "c2" }), g("e", "Paz", { confirmado: false })];

  it("sin entregas, por entregar son sus confirmados pagados, por apellido", () => {
    const { items, total } = porEntregar({ id: "c1" }, invitados, evento);
    expect(items.map((it) => it.id)).toEqual(["b", "a"]);
    expect(total).toBe(94);
  });

  it("los que ya entraron en una entrega no vuelven a salir", () => {
    const c = { id: "c1", entregas: [{ id: "e1", fecha: "2026-11-14T10:00:00Z", importe: 47, invitados: ["a"] }] };
    expect(porEntregar(c, invitados, evento).items.map((it) => it.id)).toEqual(["b"]);
  });

  it("cuando paga otro, sale en una entrega nueva", () => {
    const c = { id: "c1", entregas: [{ id: "e1", importe: 94, invitados: ["a", "b"] }] };
    expect(porEntregar(c, invitados, evento).items).toEqual([]);
    const pagaSosa = invitados.map((x) => (x.id === "c" ? { ...x, pagado: true } : x));
    expect(porEntregar(c, pagaSosa, evento).items.map((it) => it.id)).toEqual(["c"]);
  });

  it("uno ya entregado por otro colaborador no vuelve a salir al cambiarle de colaborador", () => {
    const otro = { id: "c2", entregas: [{ invitados: ["a"] }] };
    const c1 = { id: "c1" };
    expect(porEntregar(c1, invitados, evento, [c1, otro]).items.map((it) => it.id)).toEqual(["b"]);
  });

  it("una foto de Deshacer anterior trae la lista vacía: cuenta como ninguna", () => {
    expect(entregasDe({ entregas: null })).toEqual([]);
    expect(porEntregar({ id: "c1", entregas: null }, invitados, evento).items).toHaveLength(2);
  });

  it("el acuse de una entrega lleva solo sus invitados", () => {
    expect(itemsDeEntrega({ invitados: ["a"] }, invitados, evento)).toEqual([{ apellido: "Ruiz", nombre: "N", importe: 47 }]);
  });

  it("las propinas de todas las entregas, sumadas", () => {
    const colaboradores = [
      { id: "c1", entregas: [{ propina: 20 }, { propina: null }, { propina: 5 }] },
      { id: "c2", entregas: null },
    ];
    expect(propinasTotales(colaboradores)).toBe(25);
  });

  it("el desglose de las propinas: una por acuse con propina, y suman el total", () => {
    const colaboradores = [
      { id: "c2", nombre: "Sierra, Raúl", entregas: [{ id: "e3", fecha: "2026-11-20T10:00", propina: "6" }, { id: "e2", fecha: "2026-11-02", propina: 5 }] },
      { id: "c1", nombre: "Abreu, Ana", entregas: [{ id: "e1", fecha: "2026-11-10", propina: 0 }, { id: "e4", fecha: "2026-11-12", propina: 11 }] },
      { id: "c3", nombre: "Paz, Eva", entregas: null },
    ];
    const lineas = desglosePropinas(colaboradores);
    expect(lineas).toEqual([
      { id: "e4", colaborador: "Abreu, Ana", fecha: "2026-11-12", propina: 11 },
      { id: "e2", colaborador: "Sierra, Raúl", fecha: "2026-11-02", propina: 5 },
      { id: "e3", colaborador: "Sierra, Raúl", fecha: "2026-11-20", propina: 6 },
    ]);
    expect(lineas.reduce((s, l) => s + l.propina, 0)).toBe(propinasTotales(colaboradores));
  });

  it("arriba lo pendiente, luego sin empezar, abajo lo entregado", () => {
    const lista = [
      { id: "c2", nombre: "Todo", entregas: [{ invitados: ["d"] }] },
      { id: "c3", nombre: "Nada" },
      { id: "c1", nombre: "Pendiente" },
    ];
    expect(lista.map((c) => estadoEntregas(c, invitados, evento))).toEqual(["entregado", "sin empezar", "pendiente"]);
    expect(ordenarPorEntregas(lista, invitados, evento).map((c) => c.nombre)).toEqual(["Pendiente", "Nada", "Todo"]);
  });
});

// v94.5 (él: «no me cuadra», «todo se repasó antes de entregar acuse»): los
// acuses más lo que aún tienen los colaboradores tienen que dar lo recaudado
// más las propinas; si no, la diferencia y por qué.
describe("el cuadre de los acuses con lo recaudado", () => {
  const recaudadoDe = (lista) => lista.filter((x) => x.confirmado && x.pagado).reduce((s, x) => s + (x.anioNacimiento === "2020" ? 35 : 47), 0);

  it("cuadra: una entrega con su propina y lo que falta por entregar", () => {
    const invitados = [g("a", "Ruiz"), g("b", "Abreu"), g("n", "Sosa", { anioNacimiento: "2020" })];
    const colaboradores = [{ id: "c1", entregas: [{ id: "e1", importe: 82, propina: 5, invitados: ["b", "n"] }] }];
    const c = cuadreEntregas({ invitados, evento, colaboradores, recaudado: recaudadoDe(invitados), propinas: 5 });
    expect(c).toEqual({ entregado: 87, porEntregar: 47, diferencia: 0, sinColaborador: 0, yaNoPagados: 0, acusesDistintos: 0 });
  });

  it("un pagado sin colaborador: la diferencia es su entrada, y se dice", () => {
    const invitados = [g("a", "Ruiz"), g("s", "Gil", { colaboradorId: null })];
    const colaboradores = [{ id: "c1", entregas: [{ id: "e1", importe: 47, propina: 0, invitados: ["a"] }] }];
    const c = cuadreEntregas({ invitados, evento, colaboradores, recaudado: 94, propinas: 0 });
    expect(c.diferencia).toBe(47);
    expect(c.sinColaborador).toBe(1);
  });

  it("un acuse con otro importe que el de hoy, y uno de un acuse que ya no figura como pagado", () => {
    const invitados = [g("a", "Ruiz"), g("b", "Abreu", { pagado: false })];
    const colaboradores = [{ id: "c1", entregas: [{ id: "e1", importe: 90, propina: 0, invitados: ["a", "b"] }] }];
    const c = cuadreEntregas({ invitados, evento, colaboradores, recaudado: 47, propinas: 0 });
    expect(c.diferencia).toBe(-43);
    expect(c.yaNoPagados).toBe(1);
    expect(c.acusesDistintos).toBe(1);
  });

  // v95.6: el DJ no paga entrada, lo invita el evento. Su acuse se cerró
  // con él a 0 € y cuadra; la v95.5 lo daba por «no cuadra» (47 € de más).
  it("el acuse que lleva al DJ a 0 € cuadra: el evento lo invita", () => {
    const invitados = [
      { id: "a", colaboradorId: "c1", confirmado: true, pagado: true, anioNacimiento: "1980" },
      { id: "dj", colaboradorId: "c1", confirmado: true, pagado: true, anioNacimiento: "1975", zona: "DJ" },
    ];
    const colaboradores = [{ id: "c1", entregas: [{ id: "e1", importe: 47, invitados: ["a", "dj"] }] }];
    const c = cuadreEntregas({ invitados, evento, colaboradores, recaudado: 47, propinas: 0 });
    expect(c.diferencia).toBe(0);
    expect(c.acusesDistintos).toBe(0);
  });
});
