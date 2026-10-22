// v72.5 (él): «un orden no debe invalidar al otro: el primero que activo
// es el amo y el segundo, su esclavo».
import { describe, it, expect } from "vitest";
import { tocarTitulo, compararPorNiveles, MAX_NIVELES } from "./ordenNiveles";

describe("tocarTitulo", () => {
  it("cada título nuevo se suma debajo de los anteriores", () => {
    let n = tocarTitulo([], "zona");
    n = tocarTitulo(n, "grupoFamiliar");
    expect(n).toEqual([
      { columna: "zona", direccion: "asc" },
      { columna: "grupoFamiliar", direccion: "asc" },
    ]);
  });

  it("el mismo título: ▲, luego ▼, luego se quita y los de debajo suben", () => {
    let n = [{ columna: "zona", direccion: "asc" }, { columna: "mesa", direccion: "asc" }];
    n = tocarTitulo(n, "zona");
    expect(n[0]).toEqual({ columna: "zona", direccion: "desc" });
    n = tocarTitulo(n, "zona");
    expect(n).toEqual([{ columna: "mesa", direccion: "asc" }]);
  });

  it(`como mucho ${MAX_NIVELES}: uno más sustituye al último`, () => {
    let n = [];
    for (const c of ["zona", "grupoFamiliar", "mesa", "pagado"]) n = tocarTitulo(n, c);
    expect(n.map((x) => x.columna)).toEqual(["zona", "grupoFamiliar", "pagado"]);
  });
});

describe("compararPorNiveles", () => {
  const filas = [
    { nombre: "Loly", zona: "Sur", familia: "Barrios01" },
    { nombre: "Ana", zona: "Norte", familia: "Medina01" },
    { nombre: "Míriam", zona: "Norte", familia: "Abreu01" },
    { nombre: "Jacob", zona: "Sur", familia: "Barrios01" },
    { nombre: "Gustavo", zona: "Norte", familia: "Abreu01" },
  ];
  const valorDe = (f, c) => (c === "zona" ? f.zona : f.familia);
  const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, "es");

  it("por Zona y, dentro de cada zona, por Familia: las familias no se separan", () => {
    const orden = [{ columna: "zona", direccion: "asc" }, { columna: "familia", direccion: "asc" }];
    expect(filas.slice().sort(compararPorNiveles(orden, valorDe, porNombre)).map((f) => f.nombre)).toEqual([
      "Gustavo",
      "Míriam",
      "Ana",
      "Jacob",
      "Loly",
    ]);
  });

  it("el sentido de cada nivel es suyo", () => {
    const orden = [{ columna: "zona", direccion: "desc" }];
    expect(filas.slice().sort(compararPorNiveles(orden, valorDe, porNombre))[0].zona).toBe("Sur");
  });
});
