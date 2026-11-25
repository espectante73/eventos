import { describe, it, expect } from "vitest";
import { faltaSqlMesasLocal, mesasLocalDe, usoDelLocal, subirSitio, anadirMesaDelLocal, limpiarMesasLocal, totalDelLocal, SITIOS_MESA_NUEVA } from "./mesasLocal";

// Su ejemplo: 4 mesas de 11 y 10 de 9.
const LOCAL = [
  { sitios: 11, cuantas: 4 },
  { sitios: 9, cuantas: 10 },
];
const mesas = (...capacidades) => capacidades.map((capacidad, i) => ({ numero: i + 1, capacidad }));
const capacidades = (lista) => lista.map((m) => m.capacidad);

describe("mesasLocalDe y faltaSqlMesasLocal", () => {
  it("sin la columna, falta el SQL; con ella vacía, sin configurar", () => {
    expect(faltaSqlMesasLocal({})).toBe(true);
    expect(faltaSqlMesasLocal({ mesasLocal: null })).toBe(false);
    expect(mesasLocalDe({ mesasLocal: null })).toEqual([]);
  });

  it("de mayor a menor, sin lo que no vale", () => {
    const evento = { mesasLocal: [{ sitios: 9, cuantas: 10 }, { sitios: 11, cuantas: "4" }, { sitios: 0, cuantas: 3 }, null] };
    expect(mesasLocalDe(evento)).toEqual(LOCAL);
  });
});

describe("usoDelLocal", () => {
  it("cada mesa gasta la más pequeña en que cabe: una de 10, una de 11", () => {
    expect(usoDelLocal(LOCAL, mesas(11, 10, 9, 8))).toEqual([
      { sitios: 11, cuantas: 4, usadas: 2, faltan: 0 },
      { sitios: 9, cuantas: 10, usadas: 2, faltan: 0 },
    ]);
  });

  it("sin mesas de 9 libres, una de 9 va a una de 11", () => {
    const local = [{ sitios: 11, cuantas: 2 }, { sitios: 9, cuantas: 1 }];
    expect(usoDelLocal(local, mesas(9, 9))).toEqual([
      { sitios: 11, cuantas: 2, usadas: 1, faltan: 0 },
      { sitios: 9, cuantas: 1, usadas: 1, faltan: 0 },
    ]);
  });

  it("con más mesas de las que hay, cuenta cuántas faltan y de qué tamaño", () => {
    const uso = usoDelLocal(LOCAL, mesas(11, 11, 10, 10, 11));
    expect(uso[0]).toEqual({ sitios: 11, cuantas: 4, usadas: 4, faltan: 1 });
    // Una más grande que todas, falta en la más grande.
    expect(usoDelLocal(LOCAL, mesas(12))[0].faltan).toBe(1);
  });

  it("sin configurar, nada", () => {
    expect(usoDelLocal([], mesas(10))).toEqual([]);
  });
});

describe("subirSitio, el «+» de una mesa", () => {
  it("con mesas de 11 libres, sube", () => {
    const r = subirSitio(mesas(9, 9), 2, LOCAL);
    expect(r.aviso).toBe("");
    expect(capacidades(r.mesas)).toEqual([9, 10]);
  });

  it("ninguna pasa de 11", () => {
    const r = subirSitio(mesas(11), 1, LOCAL);
    expect(capacidades(r.mesas)).toEqual([11]);
    expect(r.aviso).toBe("La mesa 1 ya tiene 11 sitios: el local no tiene mesas más grandes. Si el local tiene más, ponlas en «Del local».");
  });

  it("con las 4 de 11 puestas, una de 9 se queda en 9, y dice cuántas son", () => {
    const antes = mesas(11, 11, 10, 11, 9);
    const r = subirSitio(antes, 5, LOCAL);
    expect(r.mesas).toBe(antes);
    expect(r.aviso).toBe("No quedan mesas de 11 libres en el local: son 4 y ya están todas puestas. Para subir la mesa 5, baja otra. Si el local tiene más, ponlas en «Del local».");
  });

  it("bajar una de 11 a 9 libera una de 11 para otra", () => {
    expect(subirSitio(mesas(11, 11, 11, 9, 9), 5, LOCAL).aviso).toBe("");
    expect(subirSitio(mesas(11, 11, 11, 11, 9), 5, LOCAL).aviso).not.toBe("");
  });

  it("con una sola de 11: dos de 9 pueden subir una; con una de 10 ya puesta, no", () => {
    const local = [{ sitios: 11, cuantas: 1 }, { sitios: 9, cuantas: 1 }];
    // La 2 sube a 10 y gasta la de 11; la 1 se queda con la de 9.
    expect(subirSitio(mesas(9, 9), 2, local).aviso).toBe("");
    expect(subirSitio(mesas(10, 9), 2, local).aviso).toContain("solo hay 1 y ya está puesta");
  });

  it("si ya hay más mesas de las que tiene el local, no sube ninguna hasta arreglarlo", () => {
    const local = [{ sitios: 11, cuantas: 1 }, { sitios: 9, cuantas: 1 }];
    expect(subirSitio(mesas(11, 9, 7), 3, local).aviso).toContain("Ya hay más mesas de las que tiene el local");
    expect(capacidades(subirSitio(mesas(9, 7), 2, local).mesas)).toEqual([9, 8]);
  });

  it("sin configurar, siempre", () => {
    expect(capacidades(subirSitio(mesas(30), 1, []).mesas)).toEqual([31]);
  });
});

describe("anadirMesaDelLocal", () => {
  it("del tamaño más grande que quede libre", () => {
    expect(capacidades(anadirMesaDelLocal(mesas(9), LOCAL).mesas)).toEqual([9, 11]);
    const r = anadirMesaDelLocal(mesas(11, 11, 10, 11), LOCAL);
    expect(r.mesas.at(-1)).toEqual({ numero: 5, capacidad: 9 });
  });

  it("con todas puestas, no la crea y lo dice", () => {
    const todas = mesas(11, 11, 11, 11, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9);
    const r = anadirMesaDelLocal(todas, LOCAL);
    expect(r.mesas).toBe(todas);
    expect(r.aviso).toBe("El local no tiene más mesas: las 14 ya están puestas. Si el local tiene más, ponlas en «Del local».");
  });

  it("sin configurar, de 10 como siempre, con el número siguiente", () => {
    expect(anadirMesaDelLocal([{ numero: 3, capacidad: 8 }], []).mesas.at(-1)).toEqual({ numero: 4, capacidad: SITIOS_MESA_NUEVA });
  });
});

describe("limpiarMesasLocal, lo escrito en «Mesas del local»", () => {
  it("quita las líneas vacías y ordena de mayor a menor", () => {
    const filas = [{ sitios: "9", cuantas: "10" }, { sitios: "", cuantas: " " }, { sitios: " 11", cuantas: "4" }];
    expect(limpiarMesasLocal(filas)).toEqual({ valor: LOCAL, aviso: "" });
    expect(limpiarMesasLocal([])).toEqual({ valor: [], aviso: "" });
  });

  it("una línea a medias o con decimales no se guarda, y dice cuál", () => {
    expect(limpiarMesasLocal([{ sitios: "11", cuantas: "4" }, { sitios: "9", cuantas: "" }]).aviso).toContain("En la línea 2 falta un número");
    expect(limpiarMesasLocal([{ sitios: "9,5", cuantas: "2" }]).valor).toBe(null);
  });

  it("dos líneas del mismo tamaño, que se sumen", () => {
    expect(limpiarMesasLocal([{ sitios: "9", cuantas: "4" }, { sitios: "9", cuantas: "6" }]).aviso).toBe("Hay dos líneas de mesas de 9 sitios: súmalas en una.");
  });
});

it("totalDelLocal: 14 mesas y hasta 134 comensales", () => {
  expect(totalDelLocal(LOCAL)).toEqual({ mesas: 14, sitios: 134 });
});
