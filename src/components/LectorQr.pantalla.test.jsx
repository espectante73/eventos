// La cámara dentro de la página (v83.8), DIBUJADA de verdad. Lo que no se
// puede hacer aquí es encender una cámara: eso se finge.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";

let leido = null;
vi.mock("jsqr", () => ({ default: () => leido }));
const { LectorQr } = await import("./LectorQr");

const pista = { stop: vi.fn() };
const flujo = { getTracks: () => [pista] };
const getUserMedia = vi.fn();
const espera = (ms) => act(async () => new Promise((listo) => setTimeout(listo, ms)));
const fijarOculto = (valor) => {
  Object.defineProperty(document, "hidden", { configurable: true, get: () => valor });
  return act(async () => document.dispatchEvent(new Event("visibilitychange")));
};

beforeEach(() => {
  leido = null;
  pista.stop.mockClear();
  getUserMedia.mockReset();
  getUserMedia.mockResolvedValue(flujo);
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLVideoElement.prototype, "videoWidth", "get").mockReturnValue(640);
  vi.spyOn(HTMLVideoElement.prototype, "videoHeight", "get").mockReturnValue(480);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  delete document.hidden;
});

describe("el lector de QR", () => {
  it("pide la cámara de atrás y entrega lo que lee", async () => {
    const textos = [];
    const vista = montar(<LectorQr onTexto={(t) => textos.push(t)} />);
    await espera(20);
    expect(getUserMedia.mock.calls[0][0].video.facingMode).toEqual({ ideal: "environment" });
    expect(document.body.textContent).toContain("Enfoca el QR");
    leido = { data: "https://x.rsvp?acreditar=abc" };
    await espera(260);
    expect(textos).toEqual(["https://x.rsvp?acreditar=abc"]);
    vista.desmontar();
  });

  it("el mismo QR delante de la cámara no se entrega una y otra vez; otro distinto, sí", async () => {
    const textos = [];
    const vista = montar(<LectorQr onTexto={(t) => textos.push(t)} />);
    leido = { data: "uno" };
    await espera(650);
    expect(textos).toEqual(["uno"]);
    leido = { data: "dos" };
    await espera(260);
    expect(textos).toEqual(["uno", "dos"]);
    vista.desmontar();
  });

  it("al salir apaga la cámara", async () => {
    const vista = montar(<LectorQr onTexto={() => {}} />);
    await espera(20);
    expect(pista.stop).not.toHaveBeenCalled();
    vista.desmontar();
    expect(pista.stop).toHaveBeenCalled();
  });

  it("con el móvil bloqueado la apaga, y al volver la enciende", async () => {
    const vista = montar(<LectorQr onTexto={() => {}} />);
    await espera(20);
    await fijarOculto(true);
    expect(pista.stop).toHaveBeenCalledTimes(1);
    await fijarOculto(false);
    await espera(20);
    expect(getUserMedia).toHaveBeenCalledTimes(2);
    vista.desmontar();
  });

  it("sin permiso lo dice y da la salida de la cámara normal", async () => {
    getUserMedia.mockRejectedValue(Object.assign(new Error("no"), { name: "NotAllowedError" }));
    const vista = montar(<LectorQr onTexto={() => {}} />);
    await espera(20);
    expect(document.body.textContent).toContain("no ha dado permiso");
    expect(document.body.textContent).toContain("cámara normal");
    vista.desmontar();
  });

  it("si la cámara no enciende (o el móvil no la ofrece a la página), también", async () => {
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: undefined });
    const vista = montar(<LectorQr onTexto={() => {}} />);
    await espera(20);
    expect(document.body.textContent).toContain("No se ha podido encender la cámara");
    vista.desmontar();
  });
});
