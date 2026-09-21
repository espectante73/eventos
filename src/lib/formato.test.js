import { describe, it, expect } from "vitest";
import { formatearFecha, formatearDiaSemana, ordenarPorApellidoNombre, parsePrecio, listaConY, valorFechaEvento, TEXTO_SIN_FECHA } from "./formato";

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

describe("formatearDiaSemana", () => {
  it("calcula el día de la semana en español, en UTC", () => {
    expect(formatearDiaSemana("2026-11-13")).toBe("Viernes"); // boda real
  });
  it("devuelve vacío si no reconoce el formato", () => {
    expect(formatearDiaSemana("")).toBe("");
    expect(formatearDiaSemana("13/11/2026")).toBe("");
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

describe("parsePrecio", () => {
  it("admite coma decimal y limpia símbolos", () => {
    expect(parsePrecio("35,50 €")).toBe(35.5);
    expect(parsePrecio("40")).toBe(40);
    expect(parsePrecio("")).toBe(0);
    expect(parsePrecio(null)).toBe(0);
    expect(parsePrecio("abc")).toBe(0);
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

// "Todavía no hay fecha confirmada" (usuario, 2026-09-21): su boda no
// tiene día cerrado y un "—" no explica nada. UNA definición para la
// portada y el tablón, o acabarían diciendo cosas distintas.
describe("valorFechaEvento", () => {
  it("con fecha, día de la semana y fecha", () => {
    expect(valorFechaEvento({ fecha: "2026-11-27" })).toEqual(["Viernes", "27 noviembre 2026"]);
  });

  it("marcado \"sin confirmar\", lo dice — aunque haya fecha escrita", () => {
    expect(valorFechaEvento({ fecha: "2026-11-27", fechaSinConfirmar: true })).toBe(TEXTO_SIN_FECHA);
  });

  it("sin fecha y sin marcar, una raya: no es lo mismo \"no la he puesto\" que \"no la hay\"", () => {
    expect(valorFechaEvento({ fecha: "" })).toBe("—");
    expect(valorFechaEvento(undefined)).toBe("—");
  });

  it("la fecha escrita NO se borra: el año hace falta para los aniversarios", () => {
    const evento = { fecha: "2026-11-27", fechaSinConfirmar: true };
    expect(valorFechaEvento(evento)).toBe(TEXTO_SIN_FECHA);
    expect(evento.fecha).toBe("2026-11-27");
  });
});
