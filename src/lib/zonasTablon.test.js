// v73 (él): las zonas en orden alfabético, «imparcial», y tal como están en la Lista.
import { it, expect } from "vitest";
import { deDosEnDos, familiasDeZona, ordenarZonas, pieNinos, pieZonas, tituloZonas, TITULO_ZONAS, zonaDeEjemplo } from "./zonasTablon";

it("los niños: las dos franjas, con sus cantidades como números (van en negrita)", () => {
  expect(pieNinos({ de0a4: 3, de5a11: 7 })).toEqual(["Niños de 0 a 4 años: ", 3, " · de 5 a 11: ", 7]);
  expect(pieNinos({ de0a4: 0, de5a11: 0 }).join("")).toBe("Niños de 0 a 4 años: 0 · de 5 a 11: 0");
  expect(pieNinos(undefined)).toEqual([]);
});

it("la zona de ejemplo de la vista previa: la de más confirmados; a igualdad, la primera", () => {
  expect(zonaDeEjemplo([{ zona: "Puerto", confirmados: 8 }, { zona: "Icod", confirmados: 34 }])).toBe("Icod");
  expect(zonaDeEjemplo([{ zona: "Puerto", confirmados: 8 }, { zona: "Icod", confirmados: 8 }])).toBe("Icod");
  expect(zonaDeEjemplo([])).toBe("");
});

it("en orden alfabético, no por cantidad", () => {
  const zonas = [
    { zona: "Puerto", confirmados: 8 },
    { zona: "Icod", confirmados: 34 },
    { zona: "F. España", confirmados: 3 },
    { zona: "Guargacho", confirmados: 4 },
  ];
  expect(ordenarZonas(zonas).map((z) => z.zona)).toEqual(["F. España", "Guargacho", "Icod", "Puerto"]);
});

it("las tildes y las mayúsculas no cambian el orden", () => {
  expect(ordenarZonas([{ zona: "Orotava" }, { zona: "Ártica" }, { zona: "buenavista" }]).map((z) => z.zona)).toEqual([
    "Ártica",
    "buenavista",
    "Orotava",
  ]);
});

it("el pie cuenta personas y zonas, con su singular", () => {
  expect(pieZonas([{ zona: "Icod", confirmados: 34 }, { zona: "Puerto", confirmados: 8 }])).toEqual([42, " confirmados · ", 2, " zonas"]);
  expect(pieZonas([{ zona: "Icod", confirmados: 1 }]).join("")).toBe("1 confirmado · 1 zona");
});

it("el título: el suyo, o el de siempre si lo deja vacío", () => {
  expect(tituloZonas({ zonasTablonTitulo: "¿De dónde somos?" })).toBe("¿De dónde somos?");
  expect(tituloZonas({ zonasTablonTitulo: "  " })).toBe(TITULO_ZONAS);
  expect(tituloZonas(null)).toBe(TITULO_ZONAS);
});

it("las familias de una zona: por apellido, sin tocar el orden de los nombres (v99.9)", () => {
  const zona = {
    zona: "Icod",
    familias: [
      { apellido: "Pérez", nombres: ["Tomás", "Elena"] },
      { apellido: "Ábalos", nombres: ["Rosa"] },
      { apellido: "medina", nombres: ["Juan", " ", "Carmen "] },
      { apellido: "Vacía", nombres: [] },
    ],
  };
  expect(familiasDeZona(zona)).toEqual([
    { apellido: "Ábalos", nombres: ["Rosa"] },
    { apellido: "medina", nombres: ["Juan", "Carmen"] },
    { apellido: "Pérez", nombres: ["Tomás", "Elena"] },
  ]);
});

it("sin familias del servidor (aún no subido), ninguna: la zona no se abre", () => {
  expect(familiasDeZona({ zona: "Icod", confirmados: 3 })).toEqual([]);
  expect(familiasDeZona(undefined)).toEqual([]);
});

it("las zonas, de dos en dos como se ven", () => {
  expect(deDosEnDos([1, 2, 3, 4, 5])).toEqual([[1, 2], [3, 4], [5]]);
  expect(deDosEnDos([])).toEqual([]);
});
