import { describe, it, expect, beforeEach } from "vitest";
import {
  esVistaMusica,
  abrirVentanaMusica,
  cogerCerrojoMusica,
  rolRecordado,
  recordarRol,
  NOMBRE_VENTANA_MUSICA,
} from "./ventanaMusica";

const URL = "https://nexuspoint.rsvp/?musica=1";

// Una ventana de mentira: lo justo para saber si se recargó o solo se trajo al frente.
function ventanaFalsa(search) {
  const v = { location: { search, href: `https://nexuspoint.rsvp/${search}` }, enfocada: false };
  v.focus = () => (v.enfocada = true);
  return v;
}

describe("la página de Música (?musica)", () => {
  it("se reconoce por su dirección", () => {
    expect(esVistaMusica("?musica=1")).toBe(true);
    expect(esVistaMusica("?tablon=abc")).toBe(false);
    expect(esVistaMusica("")).toBe(false);
  });
});

describe("abrirVentanaMusica", () => {
  it("si ya está abierta, la trae al frente SIN recargarla (cortaría la música)", () => {
    const yaAbierta = ventanaFalsa("?musica=1");
    const hrefAntes = yaAbierta.location.href;
    expect(abrirVentanaMusica({ abrir: () => yaAbierta, url: URL })).toBe(true);
    expect(yaAbierta.location.href).toBe(hrefAntes);
    expect(yaAbierta.enfocada).toBe(true);
  });

  it("si es nueva (o una vieja de antes de v56), carga la de Música", () => {
    const nueva = ventanaFalsa("");
    abrirVentanaMusica({ abrir: () => nueva, url: URL });
    expect(nueva.location.href).toBe(URL);
  });

  it("la busca por su nombre, con su tamaño", () => {
    const llamadas = [];
    abrirVentanaMusica({ abrir: (...a) => (llamadas.push(a), ventanaFalsa("")), url: URL });
    expect(llamadas).toEqual([["", NOMBRE_VENTANA_MUSICA, "width=940,height=800"]]);
  });

  it("si el navegador la bloquea, devuelve false (y la app la abre dentro)", () => {
    expect(abrirVentanaMusica({ abrir: () => null, url: URL })).toBe(false);
  });
});

describe("una sola Música por aparato", () => {
  const cerrojosFalsos = (libre) => ({
    request: async (_nombre, _opciones, alObtener) => alObtener(libre ? {} : null),
  });

  it("la primera coge el cerrojo", async () => {
    let resultado;
    cogerCerrojoMusica((r) => (resultado = r), cerrojosFalsos(true));
    await Promise.resolve();
    expect(resultado).toBe(true);
  });

  it("la segunda no: ya hay otra abierta", async () => {
    let resultado;
    cogerCerrojoMusica((r) => (resultado = r), cerrojosFalsos(false));
    await Promise.resolve();
    expect(resultado).toBe(false);
  });

  it("un navegador sin cerrojos la deja pasar", () => {
    let resultado;
    cogerCerrojoMusica((r) => (resultado = r), undefined);
    expect(resultado).toBe(true);
  });
});

describe("el móvil recuerda que es el mando", () => {
  beforeEach(() => localStorage.clear());

  it("en un aparato táctil, se guarda y se recuerda", () => {
    recordarRol("mando", true);
    expect(rolRecordado(true)).toBe("mando");
  });

  it("en el Mac, nunca: tiene que poder elegir siempre ser el que suena", () => {
    recordarRol("mando", false);
    expect(rolRecordado(false)).toBe(null);
  });
});
