import { describe, it, expect } from "vitest";
import { respuestaImpago, estadoImpago, textoAvisoImpago, impagosVencidos, fechaCorta, PLAZOS_MAX } from "./impagos";

const hoy = new Date(2026, 9, 10, 12, 0); // 10 de octubre

describe("respuestaImpago", () => {
  it("«No»: no asiste, sale de confirmados y de su mesa", () => {
    expect(respuestaImpago({ mesa: 5 }, false, hoy)).toEqual({ noAsiste: true, confirmado: false, mesa: null, pagoPendienteHasta: null });
  });

  it("«Sí»: una semana más, y cuenta el plazo", () => {
    expect(respuestaImpago({}, true, hoy)).toEqual({ pagoPendienteHasta: "2026-10-17", plazosPago: 1 });
    expect(respuestaImpago({ plazosPago: 2 }, true, hoy)).toEqual({ pagoPendienteHasta: "2026-10-17", plazosPago: 3 });
  });

  it(`como mucho ${PLAZOS_MAX} plazos: después, solo «No asiste»`, () => {
    expect(respuestaImpago({ plazosPago: PLAZOS_MAX }, true, hoy)).toBe(null);
  });
});

describe("el aviso del pago pendiente", () => {
  it("dentro de plazo, con su fecha y su plazo", () => {
    const g = { nombre: "Emiliano", apellido: "Medina", pagoPendienteHasta: "2026-10-17", plazosPago: 1 };
    expect(estadoImpago(g, hoy)).toMatchObject({ vencido: false, plazo: 1, quedanPlazos: true });
    expect(textoAvisoImpago(g, hoy)).toBe("Medina, Emiliano: pago pendiente hasta el 17 oct (1.º plazo)");
  });

  it("vencido, con plazos o sin ellos", () => {
    expect(textoAvisoImpago({ nombre: "Emiliano", apellido: "Medina", pagoPendienteHasta: "2026-10-09", plazosPago: 1 }, hoy)).toBe("Medina, Emiliano: plazo de pago vencido");
    expect(textoAvisoImpago({ nombre: "Emiliano", apellido: "Medina", pagoPendienteHasta: "2026-10-09", plazosPago: 3 }, hoy)).toBe("Medina, Emiliano: último plazo vencido");
  });

  it("el día que vence todavía vale; pagado, no hay aviso", () => {
    expect(estadoImpago({ pagoPendienteHasta: "2026-10-10", plazosPago: 1 }, hoy).vencido).toBe(false);
    expect(textoAvisoImpago({ nombre: "X", pagado: true, pagoPendienteHasta: "2026-10-09" }, hoy)).toBe("");
  });

  it("fecha corta", () => {
    expect(fechaCorta("2026-10-17")).toBe("17 oct");
  });
});

describe("impagosVencidos (para el anfitrión)", () => {
  it("cuenta los vencidos y los que ya no tienen más plazos", () => {
    const lista = [
      { confirmado: true, pagoPendienteHasta: "2026-10-09", plazosPago: 1 },
      { confirmado: true, pagoPendienteHasta: "2026-10-09", plazosPago: 3 },
      { confirmado: true, pagoPendienteHasta: "2026-10-20", plazosPago: 1 },
      { confirmado: false, noAsiste: true },
    ];
    expect(impagosVencidos(lista, hoy)).toEqual({ vencidos: 2, ultimos: 1 });
  });
});
