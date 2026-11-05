import { describe, it, expect } from "vitest";
import { hayLoNuevo, LO_NUEVO_HASTA } from "./loNuevo";

const dia = (texto, hora = "12:00") => new Date(`${texto}T${hora}:00`);

describe("«Lo nuevo» en el Inicio (v81.9)", () => {
  it("sale hasta su fecha, incluido el último día entero, y luego se va sola", () => {
    expect(hayLoNuevo(dia("2026-11-04"))).toBe(true);
    expect(hayLoNuevo(dia(LO_NUEVO_HASTA, "23:59"))).toBe(true);
    const [a, m, d] = LO_NUEVO_HASTA.split("-").map(Number);
    expect(hayLoNuevo(new Date(a, m - 1, d + 1, 0, 1))).toBe(false);
  });
});
