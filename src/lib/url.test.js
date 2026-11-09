import { describe, it, expect, beforeEach } from "vitest";
import { getRolFromUrl, codigoAcreditarDe, construirEnlaceAcreditar } from "./url";

describe("codigoAcreditarDe: el código de un QR leído en la página (v83.8)", () => {
  it("lee el del enlace que lleva la invitación", () => {
    expect(codigoAcreditarDe(construirEnlaceAcreditar("https://nexuspoint.rsvp/", "a1b2c3d4e5f6"))).toBe("a1b2c3d4e5f6");
  });

  it("cualquier otra cosa no es una invitación", () => {
    for (const texto of ["https://otra.com", "WIFI:S:casa;;", "?acreditar=", "", null]) expect(codigoAcreditarDe(texto)).toBe("");
  });
});

describe("getRolFromUrl (depende de window.location)", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "https://ejemplo.com/?rol=abc123");
  });

  it("lee el parámetro ?rol= de la URL actual", () => {
    expect(getRolFromUrl()).toBe("abc123");
  });
});
