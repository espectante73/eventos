// La página de Música (?musica), DIBUJADA de verdad, con la ventana de
// Música dentro. Lo que sale de la pantalla (el canal del mando, el
// almacén de pistas del navegador, el fondo en Supabase) se simula: aquí
// se comprueba que la página y la ventana se pueden abrir.
import { describe, it, expect, vi, afterEach } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";

vi.mock("../lib/useMandoMusica", () => ({
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
vi.mock("../lib/almacenPistas", () => ({ guardarPista: async () => {}, leerTodasLasPistas: async () => ({}) }));
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

  it("si ya hay otra abierta, lo dice y no monta un segundo reproductor", async () => {
    conCerrojos(false);
    const texto = await dibujar();
    expect(texto).toContain("Multimedia ya está abierta");
    expect(texto).not.toContain("¿Qué papel tiene este aparato?");
  });
});
