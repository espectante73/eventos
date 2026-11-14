// "Progreso de recopilación", DIBUJADA: un recuadro por colaborador y,
// desde v58.7, la línea de su cuenta (cuándo entró, o «sin cuenta»).
import { describe, it, expect, vi } from "vitest";
import { act } from "react";
import { montar } from "../../pruebas/dibujar";

const hoy = new Date().toISOString();
vi.mock("../../supabaseClient", () => ({
  supabase: {
    rpc: async () => ({
      data: [
        { colaboradorId: "c1", tieneCuenta: true, ultimaEntrada: hoy },
        { colaboradorId: "c2", tieneCuenta: false, ultimaEntrada: null },
      ],
      error: null,
    }),
  },
}));
const { VentanaProgreso } = await import("./VentanaProgreso");

const data = {
  invitados: [{ id: "g1", nombre: "Ana", apellido: "Ruiz", colaboradorId: "c1", confirmado: true }],
  colaboradores: [
    { id: "c1", nombre: "Barrios, Jacob" },
    { id: "c2", nombre: "Pacheco, Omar" },
  ],
  ordenFamiliares: {},
};

describe("Progreso de recopilación", () => {
  it("cada colaborador con su cuenta: «hoy» o «sin cuenta»", async () => {
    let vista;
    await act(async () => {
      vista = montar(<VentanaProgreso data={data} anfitrionToken="t" onCerrar={() => {}} />);
    });
    const texto = document.body.textContent;
    expect(texto).toContain("Barrios, Jacob");
    expect(texto).toContain("hoy");
    expect(texto).toContain("sin cuenta");
    vista.desmontar();
  });

  it("sin la llave del anfitrión se dibuja igual, sin esa línea", async () => {
    let vista;
    await act(async () => {
      vista = montar(<VentanaProgreso data={data} onCerrar={() => {}} />);
    });
    expect(document.body.textContent).toContain("Pacheco, Omar");
    expect(document.body.textContent).not.toContain("sin cuenta");
    vista.desmontar();
  });

  // v86.2 (él): el que ha terminado su parte —datos y pagos al 100 % y el
  // dinero entregado— queda destacado. Las invitaciones no cuentan.
  it("destaca al que ha terminado: datos y pagos completos y todo entregado", async () => {
    const completo = { confirmado: true, anioNacimiento: "1980", alergias: "No", pagado: true };
    const datos = {
      invitados: [
        { id: "g1", nombre: "Ana", apellido: "Ruiz", colaboradorId: "c1", ...completo },
        { id: "g2", nombre: "Luis", apellido: "Sosa", colaboradorId: "c2", ...completo },
        { id: "g3", nombre: "Eva", apellido: "Gil", colaboradorId: "c3", ...completo, pagado: false },
        { id: "g4", nombre: "Leo", apellido: "Paz", colaboradorId: "c4", ...completo },
        { id: "g5", nombre: "Mar", apellido: "Paz", colaboradorId: "c4", ...completo },
      ],
      colaboradores: [
        { id: "c1", nombre: "Bravo, Yeray", entregas: [{ id: "e1", fecha: hoy, importe: 47, invitados: ["g1"] }] },
        { id: "c2", nombre: "Sin, Entregar" },
        { id: "c3", nombre: "Sin, Cobrar", entregas: [{ id: "e2", fecha: hoy, importe: 0, invitados: [] }] },
        // Entregó una vez, pero luego cobró a otro: no ha terminado (v87).
        { id: "c4", nombre: "Falta, Otra", entregas: [{ id: "e3", fecha: hoy, importe: 47, invitados: ["g4"] }] },
      ],
      ordenFamiliares: {},
    };
    let vista;
    await act(async () => {
      vista = montar(<VentanaProgreso data={datos} onCerrar={() => {}} />);
    });
    const destacados = [...document.querySelectorAll("[data-terminado]")].map((d) => d.textContent);
    expect(destacados).toHaveLength(1);
    expect(destacados[0]).toContain("Bravo, Yeray");
    vista.desmontar();
  });
});
