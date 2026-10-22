// v73 (él): las zonas en orden alfabético, «imparcial», y tal como están en la Lista.
import { it, expect } from "vitest";
import { ordenarZonas, pieZonas, tituloZonas, TITULO_ZONAS } from "./zonasTablon";

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
  expect(pieZonas([{ zona: "Icod", confirmados: 34 }, { zona: "Puerto", confirmados: 8 }])).toBe("42 confirmados · 2 zonas");
  expect(pieZonas([{ zona: "Icod", confirmados: 1 }])).toBe("1 confirmado · 1 zona");
});

it("el título: el suyo, o el de siempre si lo deja vacío", () => {
  expect(tituloZonas({ zonasTablonTitulo: "¿De dónde somos?" })).toBe("¿De dónde somos?");
  expect(tituloZonas({ zonasTablonTitulo: "  " })).toBe(TITULO_ZONAS);
  expect(tituloZonas(null)).toBe(TITULO_ZONAS);
});
