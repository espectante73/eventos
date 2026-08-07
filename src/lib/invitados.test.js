import { describe, it, expect } from "vitest";
import {
  datosCompletos,
  contarDatosRellenados,
  tieneAlergiaReal,
  calcularEdad,
  edadPromedio,
  importeEsperadoInvitado,
  resolverColaborador,
  parseImport,
} from "./invitados";

describe("datosCompletos", () => {
  it("exige año de nacimiento Y alergias, no solo uno de los dos", () => {
    expect(datosCompletos({ anioNacimiento: "1990", alergias: "No" })).toBe(true);
    expect(datosCompletos({ anioNacimiento: "1990", alergias: "" })).toBe(false);
    expect(datosCompletos({ anioNacimiento: "", alergias: "No" })).toBe(false);
    expect(datosCompletos({})).toBe(false);
  });
});

describe("tieneAlergiaReal", () => {
  it('"No" es una respuesta explícita, no cuenta como alergia', () => {
    expect(tieneAlergiaReal({ alergias: "No" })).toBe(false);
    expect(tieneAlergiaReal({ alergias: "  " })).toBe(false);
    expect(tieneAlergiaReal({ alergias: "" })).toBe(false);
    expect(tieneAlergiaReal({})).toBe(false);
  });
  it("cualquier otro texto sí cuenta", () => {
    expect(tieneAlergiaReal({ alergias: "Frutos secos" })).toBe(true);
  });
});

describe("contarDatosRellenados", () => {
  it("cuenta los 6 campos de texto no vacíos, más 1 si hay foto", () => {
    expect(contarDatosRellenados({}, false)).toBe(0);
    expect(contarDatosRellenados({ anioNacimiento: "1990" }, false)).toBe(1);
    expect(contarDatosRellenados({}, true)).toBe(1);
    expect(
      contarDatosRellenados(
        {
          anioNacimiento: "1990",
          anioBoda: "",
          email: "a@a.com",
          cancion: "",
          alergias: "No",
          observaciones: "  ", // solo espacios: no cuenta como relleno
        },
        true
      )
    ).toBe(4);
  });
});

describe("calcularEdad", () => {
  const evento = { fecha: "2026-11-13" };
  it("calcula respecto al año del evento, no al año actual", () => {
    expect(calcularEdad("1990", evento)).toBe(36);
  });
  it("descarta valores imposibles o vacíos", () => {
    expect(calcularEdad("", evento)).toBeNull();
    expect(calcularEdad("abc", evento)).toBeNull();
    expect(calcularEdad("2200", evento)).toBeNull(); // edad negativa
  });
});

describe("edadPromedio", () => {
  const evento = { fecha: "2026-11-13" };
  it("ignora a quien no tiene edad calculable", () => {
    const invitados = [
      { anioNacimiento: "1990" }, // 36
      { anioNacimiento: "2000" }, // 26
      { anioNacimiento: "" }, // se ignora
    ];
    expect(edadPromedio(invitados, evento)).toBe(31);
  });
  it("null si nadie tiene edad calculable", () => {
    expect(edadPromedio([{ anioNacimiento: "" }], evento)).toBeNull();
    expect(edadPromedio([], evento)).toBeNull();
  });
});

describe("importeEsperadoInvitado", () => {
  const evento = {
    fecha: "2026-11-13",
    edadNinoDesde: "2",
    edadNinoHasta: "12",
    precioAdulto: "50",
    precioNino: "25",
  };
  it("bebé por debajo de 'desde' no paga", () => {
    expect(importeEsperadoInvitado({ anioNacimiento: "2025" }, evento)).toBe(0);
  });
  it("entre 'desde' y 'hasta' paga precio niño", () => {
    expect(importeEsperadoInvitado({ anioNacimiento: "2020" }, evento)).toBe(25);
  });
  it("de 'hasta' en adelante paga precio adulto", () => {
    expect(importeEsperadoInvitado({ anioNacimiento: "1990" }, evento)).toBe(50);
  });
  it("sin año de nacimiento, se asume adulto", () => {
    expect(importeEsperadoInvitado({}, evento)).toBe(50);
  });
});

describe("resolverColaborador", () => {
  const colaboradores = [{ id: "c1", nombre: "Ana" }];
  it("devuelve null si no hay colaborador asignado", () => {
    expect(resolverColaborador({}, colaboradores)).toBeNull();
    expect(resolverColaborador({ colaboradorId: "no-existe" }, colaboradores)).toBeNull();
  });
  it("encuentra el colaborador por id", () => {
    expect(resolverColaborador({ colaboradorId: "c1" }, colaboradores)).toEqual(colaboradores[0]);
  });
});

describe("parseImport", () => {
  // Columnas, en orden: grupoFamiliar, apellido, nombre, colaborador, zona.
  const colaboradores = [{ id: "c1", nombre: "Ana Pérez" }];
  it("acepta filas separadas por tabulador o por coma", () => {
    const texto = "García,Pérez,Juan,Ana Pérez,Norte\nLópez\tGutiérrez\tMaría\t\tSur";
    const filas = parseImport(texto, colaboradores);
    expect(filas).toHaveLength(2);
    expect(filas[0]).toMatchObject({
      grupoFamiliar: "García",
      apellido: "Pérez",
      nombre: "Juan",
      colaboradorId: "c1",
    });
    expect(filas[1]).toMatchObject({
      grupoFamiliar: "López",
      apellido: "Gutiérrez",
      nombre: "María",
      colaboradorId: null,
    });
  });
  it("descarta filas de cabecera o sin nombre/apellido", () => {
    const texto = "Apellido,Nombre\n,SoloNombre\nSoloApellido,";
    expect(parseImport(texto, colaboradores)).toHaveLength(0);
  });
  it("empareja el nombre del colaborador sin distinguir mayúsculas", () => {
    const texto = ",Ruiz,Pedro,ana pérez,";
    const filas = parseImport(texto, colaboradores);
    expect(filas[0].colaboradorId).toBe("c1");
  });
});
