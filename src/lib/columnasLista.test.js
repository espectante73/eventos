// La Lista reducida (él, v89.3): ocultar columnas y volver a la original,
// recordado en cada aparato.
import { describe, it, expect } from "vitest";
import {
  COLUMNAS_LISTA,
  ANCHO_MINIMO_LISTA,
  CLAVE_COLUMNAS_OCULTAS,
  alternarColumna,
  anchoMinimoLista,
  columnaSombreada,
  filtrosSinOcultas,
  guardarColumnasOcultas,
  leerColumnasOcultas,
  ordenSinOcultas,
  plantillaColumnas,
  textoOcultas,
} from "./columnasLista";

const almacen = () => {
  const datos = new Map();
  return { getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => datos.set(k, String(v)), removeItem: (k) => datos.delete(k), datos };
};
const reducida = new Set(COLUMNAS_LISTA.filter((c) => !["invitado", "mesa", "pagado"].includes(c.id)).map((c) => c.id));

describe("las columnas de la Lista", () => {
  it("entera, la rejilla y el ancho de siempre", () => {
    expect(plantillaColumnas(new Set())).toBe("1.5fr 1fr 0.5fr 0.7fr 0.85fr 1.4fr 1fr 0.9fr 0.85fr 0.75fr 100px");
    expect(plantillaColumnas(new Set(), "120px").startsWith("1.5fr 120px 1fr")).toBe(true);
    expect(anchoMinimoLista(new Set())).toBe(ANCHO_MINIMO_LISTA);
  });

  it("reducida a Invitado, Mesa y Pagado: tres columnas que caben en un móvil", () => {
    expect(plantillaColumnas(reducida)).toBe("1.5fr 1fr 0.75fr");
    expect(anchoMinimoLista(reducida)).toBeLessThan(300);
  });

  it("el nombre no se oculta nunca", () => {
    const s = alternarColumna(new Set(), "invitado");
    expect(s.size).toBe(0);
    expect(alternarColumna(alternarColumna(new Set(), "pagado"), "pagado").size).toBe(0);
  });

  it("se recuerda en el aparato, y «Volver a la original» lo borra", () => {
    const a = almacen();
    guardarColumnasOcultas(new Set(["pagado", "datos", "invitado", "inventada"]), a);
    expect([...leerColumnasOcultas(a)].sort()).toEqual(["datos", "pagado"]);
    guardarColumnasOcultas(new Set(), a);
    expect(a.datos.has(CLAVE_COLUMNAS_OCULTAS)).toBe(false);
    expect(leerColumnasOcultas(a).size).toBe(0);
  });

  it("sin almacén o con algo ilegible, se ve todo y no falla", () => {
    const roto = { getItem: () => "{no es json", setItem: () => { throw new Error("lleno"); }, removeItem: () => {} };
    expect(leerColumnasOcultas(roto).size).toBe(0);
    expect(() => guardarColumnasOcultas(new Set(["zona"]), roto)).not.toThrow();
  });

  it("al ocultar una columna se quitan su filtro y su orden", () => {
    const filtros = { texto: "pa", pagado: "pendiente", colaboradorId: "c1", mesa: "" };
    expect(filtrosSinOcultas(filtros, new Set(["pagado", "colaborador"]))).toEqual({ texto: "pa", pagado: "", colaboradorId: "", mesa: "" });
    expect(filtrosSinOcultas(filtros, new Set(["mesa"]))).toBe(filtros);
    const orden = [{ columna: "pagado", direccion: "asc" }, { columna: "mesa", direccion: "desc" }];
    expect(ordenSinOcultas(orden, new Set(["pagado"]))).toEqual([{ columna: "mesa", direccion: "desc" }]);
    expect(ordenSinOcultas(orden, new Set(["zona"]))).toBe(orden);
  });

  it("el sombreado alterno cuenta solo las que se ven", () => {
    expect(columnaSombreada(reducida, "invitado")).toBe(false);
    expect(columnaSombreada(reducida, "mesa")).toBe(true);
    expect(columnaSombreada(reducida, "pagado")).toBe(false);
  });

  it("cómo se dice", () => {
    expect(textoOcultas(1)).toBe("1 columna oculta");
    expect(textoOcultas(9)).toBe("9 columnas ocultas");
  });
});
