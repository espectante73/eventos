// La página de Música (?musica), DIBUJADA de verdad, con la ventana de
// Música dentro. Lo que sale de la pantalla (el canal del mando, el
// almacén de pistas del navegador, el fondo en Supabase) se simula: aquí
// se comprueba que la página y la ventana se pueden abrir.
import { describe, it, expect, vi, afterEach } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";

vi.mock("../lib/useMandoMusica", () => ({
  CANAL_VIDEO: "video-evento",
  useMandoMusica: () => ({
    conectado: true,
    estadoCanal: "SUBSCRIBED",
    detalleCanal: "",
    hayReproductor: false,
    hayMando: false,
    enviarOrden: () => {},
    enviarEstado: () => {},
  }),
}));
vi.mock("../lib/almacenPistas", () => ({
  guardarPista: async () => {},
  leerTodasLasPistas: async () => ({}),
  guardarVideo: async () => {},
  leerTodosLosVideos: async () => ({ logo: { nombre: "logo.mp4" } }),
}));
vi.mock("../lib/fondoMusica", async (original) => ({ ...(await original()), leerFondo: async () => null }));

const { PaginaMusica } = await import("./PaginaMusica");

const data = {
  evento: {
    fecha: "2026-11-13",
    cronogramaHoraInicio: "18:00",
    cronogramaBloques: [
      { texto: "Recepción", duracionMin: 15 },
      { texto: "Cóctel", duracionMin: 30 },
      { texto: "Baile", duracionMin: 140 },
    ],
  },
  persistEvento: () => {},
};

const conCerrojos = (libre) =>
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: { request: async (_n, _o, alObtener) => alObtener(libre ? {} : null) },
  });

afterEach(() => {
  delete navigator.locks;
  localStorage.clear();
});

async function dibujar() {
  let vista;
  await act(async () => {
    vista = montar(<PaginaMusica data={data} />);
  });
  const texto = document.body.textContent;
  vista.desmontar();
  return texto;
}

describe("la página de Música", () => {
  it("la primera de este aparato abre la ventana de Música (VentanaMusicaEvento)", async () => {
    conCerrojos(true);
    expect(await dibujar()).toContain("¿Qué papel tiene este aparato?");
  });

  it("un móvil que ya fue mando no vuelve a preguntar", async () => {
    conCerrojos(true);
    const matchMediaAntes = window.matchMedia;
    window.matchMedia = () => ({ matches: true });
    localStorage.setItem("musica-evento-rol", "mando");
    try {
      expect(await dibujar()).not.toContain("¿Qué papel tiene este aparato?");
    } finally {
      window.matchMedia = matchMediaAntes;
    }
  });

  // Multimedia → Vídeo (PanelVideo, v58): los tres botones y, en el
  // ordenador, los vídeos de este Mac y abrir la pantalla.
  it("la pestaña Vídeo: Logo, Fotos 1 y Fotos 2, y los vídeos de este ordenador (PanelVideo)", async () => {
    conCerrojos(true);
    let vista;
    await act(async () => {
      vista = montar(<PaginaMusica data={data} />);
    });
    const boton = (texto) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === texto);
    await act(async () => boton("Vídeo").dispatchEvent(new MouseEvent("click", { bubbles: true })));
    const texto = document.body.textContent;
    for (const t of ["Logo", "Fotos 1", "Fotos 2", "Vídeos de este ordenador", "logo.mp4", "Abrir la pantalla", "La pantalla no está abierta"]) {
      expect(texto).toContain(t);
    }
    // Sin pantalla abierta, un botón lo dice en vez de no hacer nada.
    await act(async () => boton("Fotos 1").dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(document.body.textContent).toContain("Ábrela en el ordenador de la tele");
    vista.desmontar();
  });

  it("si ya hay otra abierta, lo dice y no monta un segundo reproductor", async () => {
    conCerrojos(false);
    const texto = await dibujar();
    expect(texto).toContain("Multimedia ya está abierta");
    expect(texto).not.toContain("¿Qué papel tiene este aparato?");
  });
});
