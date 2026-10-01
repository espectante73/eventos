// La pantalla de la tele (?pantalla), DIBUJADA. El canal del mando y el
// almacén de vídeos del navegador se simulan: aquí se comprueba qué se
// pone en pantalla y cuándo, no cómo se ve (para eso, su captura).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";

let ordenes = null; // el onOrden que la pantalla le da al canal
const estados = [];
vi.mock("../lib/useMandoMusica", () => ({
  CANAL_VIDEO: "video-evento",
  useMandoMusica: ({ onOrden }) => {
    ordenes = onOrden;
    return { enviarEstado: (e) => estados.push(e), enviarOrden: () => {}, hayPantalla: false };
  },
}));
let guardados = {};
vi.mock("../lib/almacenPistas", () => ({ leerTodosLosVideos: async () => guardados }));

const { PaginaPantalla } = await import("./PaginaPantalla");

beforeEach(() => {
  Object.defineProperty(navigator, "locks", { configurable: true, value: { request: async (_n, _o, alObtener) => alObtener({}) } });
  URL.createObjectURL = (blob) => `blob:${blob}`;
  URL.revokeObjectURL = () => {};
  estados.length = 0;
});
afterEach(() => {
  delete navigator.locks;
});

async function abrir() {
  let vista;
  await act(async () => {
    vista = montar(<PaginaPantalla />);
  });
  await act(async () => {}); // lee los vídeos
  return vista;
}
const videos = () => [...document.body.querySelectorAll("video")];
const visible = () => videos().find((v) => v.style.opacity === "1");

describe("la pantalla de la tele", () => {
  it("sin el vídeo del logo, lo dice y no pone nada", async () => {
    guardados = {};
    const vista = await abrir();
    expect(document.body.textContent).toContain("Falta el vídeo del logo");
    expect(visible()).toBeUndefined();
    vista.desmontar();
  });

  it("al abrir pone el logo, en bucle y en silencio", async () => {
    guardados = { logo: { nombre: "logo.mp4", datos: "LOGO" } };
    const vista = await abrir();
    const logo = visible();
    expect(logo.getAttribute("src")).toBe("blob:LOGO");
    expect(logo.loop).toBe(true);
    expect(logo.muted).toBe(true);
    expect(document.body.textContent).toContain("Pantalla completa");
    vista.desmontar();
  });

  it("«Fotos 1» entra con un fundido, una sola vez, y al terminar vuelve solo al logo", async () => {
    guardados = { logo: { nombre: "logo.mp4", datos: "LOGO" }, fotos1: { nombre: "f1.mp4", datos: "F1" } };
    const vista = await abrir();
    await act(async () => ordenes({ accion: "poner", valor: "fotos1" }));
    const fotos = visible();
    expect(fotos.getAttribute("src")).toBe("blob:F1");
    expect(fotos.loop).toBe(false);
    expect(fotos.style.transition).toContain("opacity");
    await act(async () => fotos.dispatchEvent(new Event("ended")));
    expect(visible().getAttribute("src")).toBe("blob:LOGO");
    vista.desmontar();
  });

  it("le cuenta al mando qué se ve y qué tiene cargado", async () => {
    guardados = { logo: { nombre: "logo.mp4", datos: "LOGO" } };
    const vista = await abrir();
    expect(estados.at(-1)).toEqual({ poniendo: "logo", hay: { logo: true, fotos1: false, fotos2: false } });
    vista.desmontar();
  });
});
