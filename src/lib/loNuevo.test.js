import { describe, it, expect } from "vitest";
import { queVerLoNuevo, LO_NUEVO_HASTA } from "./loNuevo";

// Un aparato de mentira: táctil o no, con la app instalada o no.
const aparato = ({ tactil = true, instalada = false } = {}) => ({
  matchMedia: (q) => ({ matches: (q.includes("pointer: coarse") && tactil) || (q.includes("standalone") && instalada) }),
  navigator: {},
});
const dia = (texto, hora = "12:00") => new Date(`${texto}T${hora}:00`);

describe("«Lo nuevo» en el Inicio (v81.9)", () => {
  it("sale hasta su fecha, incluido el último día entero, y luego se va sola", () => {
    expect(queVerLoNuevo(aparato(), dia("2026-11-04")).ver).toBe(true);
    expect(queVerLoNuevo(aparato(), dia(LO_NUEVO_HASTA, "23:59")).ver).toBe(true);
    expect(queVerLoNuevo(aparato(), dia("2026-11-19", "00:01")).ver).toBe(false);
  });

  it("«Instala la app»: solo en el móvil, sin instalar y mientras sale el aviso", () => {
    const hoy = dia("2026-11-10");
    expect(queVerLoNuevo(aparato({ tactil: true, instalada: false }), hoy).verInstalar).toBe(true);
    expect(queVerLoNuevo(aparato({ tactil: true, instalada: true }), hoy).verInstalar).toBe(false);
    expect(queVerLoNuevo(aparato({ tactil: false }), hoy).verInstalar).toBe(false);
    expect(queVerLoNuevo(aparato(), dia("2026-11-20")).verInstalar).toBe(false);
  });
});
