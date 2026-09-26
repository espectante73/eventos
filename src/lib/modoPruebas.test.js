// El Modo Pruebas se salta los requisitos de "antes rellena esto" (v49).
// Cada `it` es un paso del plan que el usuario aprobó.
import { describe, it, expect } from "vitest";
import { requisitosActivos } from "./modoPruebas";
import { familiaListaParaInvitacion, importeEsperadoInvitado } from "./invitados";
import { preguntaFamilia } from "./familiaCobroLlegada";

const normal = { fecha: "2026-11-13", precioAdulto: "47", precioNino: "35", edadNinoDesde: "2", edadNinoHasta: "12" };
const pruebas = { ...normal, modoPruebasActivo: true };
const sinNada = { id: "a", nombre: "Ana", apellido: "Abreu", anioNacimiento: "", alergias: "", datosCompletos: false, pagado: false, presente: false, mesa: null };

describe("Modo Pruebas", () => {
  it("una sola pieza decide si se exigen los requisitos", () => {
    expect(requisitosActivos(normal)).toBe(true);
    expect(requisitosActivos(pruebas)).toBe(false);
    expect(requisitosActivos(undefined)).toBe(true);
  });

  it("la invitación, sin pago ni mesa, solo en pruebas", () => {
    expect(familiaListaParaInvitacion([sinNada], normal)).toBe(false);
    expect(familiaListaParaInvitacion([sinNada], pruebas)).toBe(true);
    expect(familiaListaParaInvitacion([], pruebas)).toBe(false);
    expect(familiaListaParaInvitacion([{ ...sinNada, pagado: true, mesa: 3 }], normal)).toBe(true);
  });

  it("el pago, sin datos, solo en pruebas", () => {
    const familia = [sinNada, { ...sinNada, id: "b" }];
    expect(preguntaFamilia(familia, "pagado", true, { evento: normal }).puedeTodos).toBe(false);
    expect(preguntaFamilia(familia, "pagado", true, { evento: pruebas }).puedeTodos).toBe(true);
  });

  it("la llegada, sin datos, sin pago y con las llegadas cerradas, solo en pruebas", () => {
    const familia = [sinNada, { ...sinNada, id: "b" }];
    const cerrado = { marcadoAbierto: false };
    expect(preguntaFamilia(familia, "presente", true, { evento: normal, ...cerrado }).puedeTodos).toBe(false);
    expect(preguntaFamilia(familia, "presente", true, { evento: pruebas, ...cerrado }).puedeTodos).toBe(true);
  });

  it("sin año de nacimiento, el importe es el precio de adulto (47)", () => {
    expect(importeEsperadoInvitado(sinNada, pruebas)).toBe(47);
    expect(preguntaFamilia([sinNada, { ...sinNada, id: "b" }], "pagado", true, { evento: pruebas }).total).toBe(94);
  });
});
