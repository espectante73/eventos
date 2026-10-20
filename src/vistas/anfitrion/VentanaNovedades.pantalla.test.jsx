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

// v72.3: las novedades llegan al abrir la ventana. Hasta entonces, solo
// «Cargando…», sin montar nada: la pregunta del tablón se rellena al montar
// y, vacía, al salir de ella guardaría el vacío encima de la de verdad.
it("hasta que llegan sus datos, solo «Cargando…»; después, la ventana entera", () => {
  const pedidas = [];
  const delAnfitrion = {
    ...data,
    esAnfitrion: true,
    abrirSeccion: (n) => {
      pedidas.push(n);
      return () => {};
    },
    seccionesCargadas: {},
  };
  const vista = montar(<VentanaNovedades data={delAnfitrion} ventana={null} />);
  expect(pedidas).toEqual(["novedades"]);
  expect(vista.html).toContain("Cargando…");
  expect(vista.html).not.toContain("El autobús");
  expect(vista.contenedor.querySelector("textarea, input")).toBeNull();
  vista.pintar(<VentanaNovedades data={{ ...delAnfitrion, seccionesCargadas: { novedades: true } }} ventana={null} />);
  expect(vista.html).toContain("El autobús");
  expect(vista.html).not.toContain("Cargando…");
  vista.desmontar();
});
