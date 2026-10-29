// v76 (él): los gastos como hoja de cálculo.
import { describe, it, expect } from "vitest";
import { hoy, conceptoDe, ordenarGastos, totalGastos, conceptosDe, conConcepto, sinConcepto, conPrecio, precioDe, nuevoGasto } from "./gastos";

describe("los gastos", () => {
  it("lo último apuntado, arriba; los de antes, al final en su orden", () => {
    const gastos = [{ id: "a" }, { id: "b", creadoEn: "2026-10-01T10:00:00Z" }, { id: "c" }, { id: "d", creadoEn: "2026-10-29T10:00:00Z" }];
    expect(ordenarGastos(gastos).map((g) => g.id)).toEqual(["d", "b", "a", "c"]);
  });

  it("el concepto; en los de antes, si solo tenían categoría, esa", () => {
    expect(conceptoDe({ concepto: "Música", categoria: "X" })).toBe("Música");
    expect(conceptoDe({ concepto: "", categoria: "Flores" })).toBe("Flores");
  });

  it("el total suma todo: todo gasto apuntado está pagado", () => {
    expect(totalGastos([{ importe: "20,50" }, { importe: "10" }])).toBe(30.5);
  });

  it("la fila de escribir: hace falta concepto e importe; la fecha, la elegida o hoy", () => {
    const ahora = new Date("2026-10-29T12:00:00");
    expect(nuevoGasto({ concepto: "", importe: "5" }, "1", ahora).aviso).toBe("Elige el concepto.");
    expect(nuevoGasto({ concepto: "App", importe: "" }, "1", ahora).aviso).toBe("Escribe el importe.");
    const { gasto } = nuevoGasto({ fecha: "2026-09-12", concepto: "App", importe: " 15 " }, "1", ahora);
    expect(gasto).toMatchObject({ id: "1", fecha: "2026-09-12", concepto: "App", importe: "15", pagado: true });
    expect(nuevoGasto({ concepto: "App", importe: "15" }, "1", ahora).gasto.fecha).toBe(hoy(ahora));
  });
});

describe("la lista de conceptos", () => {
  it("si no hay ninguna guardada, empieza con los de los gastos, sin repetir y en orden", () => {
    const gastos = [{ concepto: "Música" }, { concepto: "música" }, { concepto: "", categoria: "App" }, { concepto: "" }];
    expect(conceptosDe([], gastos)).toEqual([
      { nombre: "App", precio: "" },
      { nombre: "Música", precio: "" },
    ]);
    expect(conceptosDe([{ nombre: "Z", precio: "" }], gastos)).toEqual([{ nombre: "Z", precio: "" }]);
  });

  it("añadir: sin repetir (dan igual mayúsculas), con precio fijo si se sabe", () => {
    const lista = [{ nombre: "Música", precio: "" }];
    expect(conConcepto(lista, "música").aviso).toBe("«música» ya está en la lista.");
    expect(conConcepto(lista, "  ").aviso).toBe("Escribe el concepto.");
    const { conceptos } = conConcepto(lista, "Suscripción ChatGPT", "22,99");
    expect(conceptos).toEqual([
      { nombre: "Música", precio: "" },
      { nombre: "Suscripción ChatGPT", precio: "22,99" },
    ]);
    expect(precioDe(conceptos, "Suscripción ChatGPT")).toBe("22,99");
    expect(precioDe(conceptos, "Música")).toBe("");
  });

  it("quitar uno o cambiarle el precio", () => {
    const lista = [{ nombre: "A", precio: "1" }, { nombre: "B", precio: "" }];
    expect(sinConcepto(lista, "A")).toEqual([{ nombre: "B", precio: "" }]);
    expect(conPrecio(lista, "B", " 9 ")).toEqual([{ nombre: "A", precio: "1" }, { nombre: "B", precio: "9" }]);
  });
});
