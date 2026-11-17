import { describe, it, expect, beforeEach } from "vitest";
import { getRolFromUrl, codigoAcreditarDe, construirEnlaceAcreditar, enlaceNovedades } from "./url";

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

// v89.2 (él): «Novedades», en Mi cuenta, abre el enlace PERSONAL de quien lo
// pulsa; el general puede decir solo que pida el acceso (v88.6).
describe("el enlace de «Novedades» en Mi cuenta", () => {
  const url = "https://nexuspoint.rsvp/";
  const ficha = { confirmado: true, claveTablon: "0123456789abcdef" };
  it("con su ficha, su enlace personal", () => {
    expect(enlaceNovedades(url, "tok", { ficha })).toBe("https://nexuspoint.rsvp?tablon=tok&yo=0123456789abcdef");
  });
  it("sin su ficha a mano, con la clave que da la base", () => {
    expect(enlaceNovedades(url, "tok", { clave: "fedcba9876543210" })).toBe("https://nexuspoint.rsvp?tablon=tok&yo=fedcba9876543210");
  });
  it("si la puerta no le dejaría entrar, o no hay clave, el general", () => {
    expect(enlaceNovedades(url, "tok", { ficha: { ...ficha, noAsiste: true } })).toBe("https://nexuspoint.rsvp?tablon=tok");
    expect(enlaceNovedades(url, "tok", { ficha: { ...ficha, excluidoTablon: true } })).toBe("https://nexuspoint.rsvp?tablon=tok");
    expect(enlaceNovedades(url, "tok", { ficha: { ...ficha, confirmado: false } })).toBe("https://nexuspoint.rsvp?tablon=tok");
    expect(enlaceNovedades(url, "tok")).toBe("https://nexuspoint.rsvp?tablon=tok");
  });
  it("sin la llave del tablón, nada", () => {
    expect(enlaceNovedades(url, null, { ficha })).toBe("");
  });
});
