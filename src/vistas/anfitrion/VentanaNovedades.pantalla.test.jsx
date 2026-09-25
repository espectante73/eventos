// Novedades, DIBUJADA de verdad.
//
// Lo que se vigila aquí: si un guardado falla, la ventana lo DICE. La
// lista vuelve a como estaba (persistNovedades lo hace sola), y sin aviso
// lo escrito desaparecía sin explicación.
import { describe, it, expect } from "vitest";
import { act } from "react";
import { dibujarYSoltar, montar } from "../../pruebas/dibujar";
import { VentanaNovedades } from "./VentanaNovedades";

const data = {
  evento: { fecha: "2026-11-13", urlPublica: "https://ejemplo.com" },
  persistEvento: () => {},
  novedades: [
    { id: "n1", titulo: "El autobús", cuerpo: "Sale a las 17:00", publicada: true, esNovedad: true, creadaEn: "2026-09-01T10:00:00Z" },
  ],
  persistNovedades: async () => true,
  tokenTablon: "",
  preguntaTablon: "",
  persistPreguntaTablon: async () => true,
  obtenerHistorialTexto: async () => [],
  accesosTablonSospechosos: [],
};

const botonNueva = (vista) =>
  [...vista.contenedor.querySelectorAll("button")].find((b) => b.textContent.includes("Nueva"));

describe("Novedades se puede dibujar", () => {
  it("con sus novedades", () => {
    expect(dibujarYSoltar(<VentanaNovedades data={data} ventana={null} />)).toContain("El autobús");
  });

  it("para un colaborador que solo edita el texto", () => {
    expect(() => dibujarYSoltar(<VentanaNovedades data={data} ventana={null} soloTexto />)).not.toThrow();
  });

  it("si el guardado falla, lo avisa en la propia ventana", async () => {
    const vista = montar(
      <VentanaNovedades data={{ ...data, persistNovedades: async () => false }} ventana={null} />
    );
    await act(async () => {
      botonNueva(vista).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    const html = vista.html;
    vista.desmontar();
    expect(html).toContain("No se ha podido guardar");
  });

  it("si el guardado sale bien, no hay aviso", async () => {
    const vista = montar(<VentanaNovedades data={data} ventana={null} />);
    await act(async () => {
      botonNueva(vista).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    const html = vista.html;
    vista.desmontar();
    expect(html).not.toContain("No se ha podido guardar");
  });
});
