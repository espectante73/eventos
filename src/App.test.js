// Batería mínima de pruebas unitarias sobre las funciones puras de App.jsx
// (sin tocar ningún componente ni la base de datos real). Objetivo: tener
// una red de seguridad ANTES de abordar el reparto de App.jsx en varios
// ficheros (ver CLAUDE.md) — si al mover código algo cambia de
// comportamiento por accidente, esto debe fallar y decirlo, en vez de
// descubrirse semanas después con un dato real mal calculado.
import { describe, it, expect, beforeEach } from "vitest";
import {
  datosCompletos,
  contarDatosRellenados,
  tieneAlergiaReal,
  getRolFromUrl,
  buildLink,
  formatearFecha,
  ordenarPorApellidoNombre,
  calcularEdad,
  edadPromedio,
  parsePrecio,
  importeEsperadoInvitado,
  resolverColaborador,
  parseImport,
  listaConY,
} from "./App.jsx";

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

describe("formatearFecha", () => {
  it("convierte ISO a formato largo en español", () => {
    expect(formatearFecha("2026-11-13")).toBe("13 noviembre 2026");
  });
  it("devuelve tal cual si no reconoce el formato", () => {
    expect(formatearFecha("")).toBe("");
    expect(formatearFecha("13/11/2026")).toBe("13/11/2026");
    expect(formatearFecha("2026-99-13")).toBe("2026-99-13");
  });
});

describe("ordenarPorApellidoNombre", () => {
  it("ordena por apellido y, en empate, por nombre — sin mutar el original", () => {
    const original = [
      { apellido: "Zeta", nombre: "Ana" },
      { apellido: "Alba", nombre: "Zoe" },
      { apellido: "Alba", nombre: "Ana" },
    ];
    const copia = [...original];
    const resultado = ordenarPorApellidoNombre(original);
    expect(resultado.map((g) => `${g.apellido} ${g.nombre}`)).toEqual([
      "Alba Ana",
      "Alba Zoe",
      "Zeta Ana",
    ]);
    expect(original).toEqual(copia); // no se toca el array de entrada
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

describe("parsePrecio", () => {
  it("admite coma decimal y limpia símbolos", () => {
    expect(parsePrecio("35,50 €")).toBe(35.5);
    expect(parsePrecio("40")).toBe(40);
    expect(parsePrecio("")).toBe(0);
    expect(parsePrecio(null)).toBe(0);
    expect(parsePrecio("abc")).toBe(0);
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

describe("listaConY", () => {
  it("junta con comas y un 'y' final, como en una frase", () => {
    expect(listaConY([])).toBe("");
    expect(listaConY(["Ana"])).toBe("Ana");
    expect(listaConY(["Ana", "Bea"])).toBe("Ana y Bea");
    expect(listaConY(["Ana", "Bea", "Cris"])).toBe("Ana, Bea y Cris");
  });
});

describe("getRolFromUrl / buildLink (dependen de window.location)", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "https://ejemplo.com/?rol=abc123");
  });

  it("lee el parámetro ?rol= de la URL actual", () => {
    expect(getRolFromUrl()).toBe("abc123");
  });

  it("construye el enlace con el rol añadido, sobre la URL pública si se da una", () => {
    const link = buildLink("nuevo-id", "https://miboda.com/");
    expect(link).toBe("https://miboda.com/?rol=nuevo-id");
  });

  it("si no hay URL pública, usa la URL actual del navegador", () => {
    const link = buildLink("nuevo-id", "");
    expect(link).toBe("https://ejemplo.com/?rol=nuevo-id");
  });
});
