// La página de Música (?musica), DIBUJADA de verdad, con la ventana de
// Música dentro. Lo que sale de la pantalla (el canal del mando, el
// almacén de pistas del navegador, el fondo en Supabase) se simula: aquí
// se comprueba que la página y la ventana se pueden abrir.
import { describe, it, expect, vi, afterEach } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";

// Cuántos OTROS aparatos del canal dicen que suenan (v102.2).
const presencia = vi.hoisted(() => ({ reproductoresOtros: 0 }));
vi.mock("../lib/useMandoMusica", () => ({
  CANAL_VIDEO: "video-evento",
  useMandoMusica: () => ({
    conectado: true,
    estadoCanal: "SUBSCRIBED",
    detalleCanal: "",
    hayReproductor: presencia.reproductoresOtros > 0,
    hayMando: false,
    reproductoresOtros: presencia.reproductoresOtros,
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
  presencia.reproductoresOtros = 0;
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

  // v102.2 (él: «dos MacBook a la vez con el multimedia… con el mando, ahí
  // se bloqueó»): los dos obedecían cada orden y sus estados se pisaban en
  // el mando. Solo puede sonar uno.
  it("si ya suena otro ordenador, este no puede ser el que suena: lo dice y sigue preguntando", async () => {
    conCerrojos(true);
    presencia.reproductoresOtros = 1;
    let vista;
    await act(async () => {
      vista = montar(<PaginaMusica data={data} />);
    });
    const boton = (texto) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes(texto));
    expect(boton("Este reproduce el sonido").textContent).toContain("Ya suena otro ordenador");
    await act(async () => boton("Este reproduce el sonido").dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(document.body.textContent).toContain("Ya hay otro ordenador que reproduce el sonido, y solo puede haber uno");
    expect(document.body.textContent).toContain("¿Qué papel tiene este aparato?");
    // Como mando, con uno solo que suena, todo normal.
    await act(async () => boton("Mando a distancia").dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(document.body.querySelector("[data-dos-reproductores]")).toBeNull();
    vista.desmontar();
  });

  it("si aun así suenan dos (los dos a la vez), el mando lo dice en rojo", async () => {
    conCerrojos(true);
    presencia.reproductoresOtros = 2;
    let vista;
    await act(async () => {
      vista = montar(<PaginaMusica data={data} />);
    });
    const boton = (texto) => [...document.body.querySelectorAll("button")].find((b) => b.textContent.includes(texto));
    await act(async () => boton("Mando a distancia").dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(document.body.querySelector("[data-dos-reproductores]").textContent).toContain("Hay dos ordenadores reproduciendo el sonido a la vez");
    vista.desmontar();
  });

  it("si ya hay otra abierta, lo dice y no monta un segundo reproductor", async () => {
    conCerrojos(false);
    const texto = await dibujar();
    expect(texto).toContain("Multimedia ya está abierta");
    expect(texto).not.toContain("¿Qué papel tiene este aparato?");
  });
});
