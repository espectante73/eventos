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

// v83.9 (él): para ver cómo queda sin publicarla.
describe("la vista previa de «De dónde venimos»", () => {
  const previa = { miZona: "", zonas: [{ zona: "Icod", confirmados: 34 }], ninos: { de0a4: 3, de5a11: 7 } };
  const desplegar = (vista) => vista.pulsar(vista.contenedor.querySelector('button[aria-label="Desplegar"]'));
  const sinPublicar = { ...data, evento: { ...data.evento, zonasTablon: false } };

  it("sin publicarla, enseña las zonas y los niños; plegada, ni pregunta", async () => {
    let lecturas = 0;
    const obtenerZonasPrevia = async () => {
      lecturas += 1;
      return previa;
    };
    const vista = montar(<VentanaNovedades data={{ ...sinPublicar, obtenerZonasPrevia }} ventana={null} />);
    await act(async () => {});
    expect(lecturas).toBe(0);
    desplegar(vista);
    await act(async () => {});
    expect(lecturas).toBe(1);
    expect(vista.html).toContain("Vista previa");
    expect(vista.contenedor.textContent).toContain("34 confirmados · 1 zona");
    expect(vista.contenedor.textContent).toContain("Niños de 0 a 4 años: 3 · de 5 a 11: 7");
    // Con las piezas del tablón: su etiqueta y una zona en verde, de ejemplo.
    expect(vista.contenedor.textContent).toContain("NOVEDADES");
    expect(vista.contenedor.querySelector("[data-zona=\"Icod\"]").style.background).toBe("rgb(31, 58, 46)");
    vista.desmontar();
  });

  it("la casilla de la zona DJ guarda, y la vista previa se vuelve a leer ya guardada (v84.1)", async () => {
    let lecturas = 0;
    const guardados = [];
    const obtenerZonasPrevia = async () => {
      lecturas += 1;
      return previa;
    };
    const vista = montar(<VentanaNovedades data={{ ...sinPublicar, persistEvento: async (e) => guardados.push(e), obtenerZonasPrevia }} ventana={null} />);
    desplegar(vista);
    await act(async () => {});
    const casilla = [...vista.contenedor.querySelectorAll("label")].find((l) => l.textContent.includes("Zona DJ")).querySelector("input");
    expect(casilla.checked).toBe(false);
    await act(async () => casilla.click());
    expect(guardados.at(-1).zonaDjVisible).toBe(true);
    expect(lecturas).toBe(2);
    vista.desmontar();
  });

  it("si no se puede leer, lo dice", async () => {
    const vista = montar(<VentanaNovedades data={{ ...sinPublicar, obtenerZonasPrevia: async () => null }} ventana={null} />);
    desplegar(vista);
    await act(async () => {});
    expect(vista.html).toContain("No se ha podido cargar la vista previa");
    vista.desmontar();
  });

  it("el colaborador de Novedades no la ve: la cuenta es del anfitrión", async () => {
    const vista = montar(<VentanaNovedades data={{ ...sinPublicar, obtenerZonasPrevia: async () => previa }} ventana={null} soloTexto />);
    desplegar(vista);
    await act(async () => {});
    expect(vista.html).not.toContain("Vista previa");
    vista.desmontar();
  });
});

// v73 (él): «De dónde venimos», una noticia más, automática: su título y
// su casilla «Publicada», que guardan en el evento. Sin papelera.
it("la noticia de las zonas: sale como automática y su casilla la publica", () => {
  const guardados = [];
  const vista = montar(
    <VentanaNovedades data={{ ...data, evento: { ...data.evento, zonasTablon: false }, persistEvento: (e) => guardados.push(e) }} ventana={null} />
  );
  expect(vista.html).toContain("AUTOMÁTICA");
  expect(vista.contenedor.querySelector('input[aria-label="Título de la noticia de las zonas"]').value).toBe("De dónde venimos");
  const desplegar = [...vista.contenedor.querySelectorAll('button[aria-label="Desplegar"]')][0];
  vista.pulsar(desplegar);
  const casilla = [...vista.contenedor.querySelectorAll("label")].find((l) => l.textContent.includes("Publicada") && l.textContent.includes("tablón") && l.parentElement.textContent.includes("Se rellena sola"));
  vista.pulsar(casilla.querySelector("input"));
  expect(guardados.at(-1).zonasTablon).toBe(true);
  vista.desmontar();
});
