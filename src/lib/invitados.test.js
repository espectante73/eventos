import { describe, it, expect } from "vitest";
import {
  datosCompletos,
  contarDatosRellenados,
  totalDatosInvitado,
  pideDatosDeBoda,
  esMenorDeEdad,
  pideEmail,
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
  const casado = { rolFamiliar: "esposo" };

  it("cuenta solo los campos no vacíos, sin espacios en blanco", () => {
    expect(contarDatosRellenados({}, false)).toBe(0);
    expect(contarDatosRellenados({ anioNacimiento: "1990" }, false)).toBe(1);
    expect(
      contarDatosRellenados(
        {
          ...casado,
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

  // Cambio de comportamiento del 2026-09-14: la foto es la foto DE BODA,
  // así que solo suma a quien se le pide (esposo/esposa). Antes sumaba a
  // cualquiera, incluido un hijo de 8 años.
  it("la foto solo cuenta si a esa persona se le pide foto de boda", () => {
    expect(contarDatosRellenados({}, true)).toBe(0);
    expect(contarDatosRellenados(casado, true)).toBe(1);
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

// ---------- Qué se le pide a cada persona (2026-09-14) ----------
describe("pideDatosDeBoda", () => {
  it("solo se lo pide a esposo y esposa", () => {
    expect(pideDatosDeBoda({ rolFamiliar: "esposo" })).toBe(true);
    expect(pideDatosDeBoda({ rolFamiliar: "esposa" })).toBe(true);
    expect(pideDatosDeBoda({ rolFamiliar: "hijo" })).toBe(false);
    expect(pideDatosDeBoda({ rolFamiliar: "padre" })).toBe(false);
    expect(pideDatosDeBoda({ rolFamiliar: "suelto" })).toBe(false);
  });

  it("sin rol marcado tampoco se pide: el anfitrión aún no lo ha revisado", () => {
    expect(pideDatosDeBoda({ rolFamiliar: "" })).toBe(false);
    expect(pideDatosDeBoda({})).toBe(false);
  });
});

describe("esMenorDeEdad / pideEmail", () => {
  const evento = { fecha: "2026-11-13" };

  it("usa la edad que tendrá el día del evento", () => {
    expect(esMenorDeEdad({ anioNacimiento: "2010" }, evento)).toBe(true); // 16
    expect(esMenorDeEdad({ anioNacimiento: "2008" }, evento)).toBe(false); // 18
    expect(esMenorDeEdad({ anioNacimiento: "1990" }, evento)).toBe(false);
  });

  it("los 18 justos ya son mayoría de edad", () => {
    expect(pideEmail({ anioNacimiento: "2008" }, evento)).toBe(true);
    expect(pideEmail({ anioNacimiento: "2009" }, evento)).toBe(false);
  });

  // Importante: si bloqueara el email por no saber la edad, el
  // colaborador se lo encontraría cerrado ANTES de poder escribir el año.
  it("sin año de nacimiento no se le trata como menor", () => {
    expect(esMenorDeEdad({ anioNacimiento: "" }, evento)).toBe(false);
    expect(pideEmail({}, evento)).toBe(true);
  });
});

describe("totalDatosInvitado", () => {
  const evento = { fecha: "2026-11-13" };

  it("a un esposo adulto se le piden los 7 de siempre", () => {
    expect(totalDatosInvitado({ rolFamiliar: "esposo", anioNacimiento: "1990" }, evento)).toBe(7);
  });

  it("a un hijo menor se le piden 4: sin año de boda, sin foto y sin email", () => {
    expect(totalDatosInvitado({ rolFamiliar: "hijo", anioNacimiento: "2015" }, evento)).toBe(4);
  });

  it("a un suelto adulto se le piden 5: sin año de boda y sin foto", () => {
    expect(totalDatosInvitado({ rolFamiliar: "suelto", anioNacimiento: "1990" }, evento)).toBe(5);
  });
});
