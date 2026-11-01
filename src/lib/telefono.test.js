// v78 (él): el teléfono del invitado, para llamarle o escribirle.
import { describe, it, expect } from "vitest";
import { limpiarTelefono, telefonoValido, telefonoParaVer, enlaceLlamar, enlaceWhatsApp, pideTelefono } from "./telefono";

describe("el teléfono", () => {
  it("se escribe como sea y se guarda limpio, con su prefijo", () => {
    expect(limpiarTelefono("612 34 56 78")).toBe("+34612345678");
    expect(limpiarTelefono("612-345-678")).toBe("+34612345678");
    expect(limpiarTelefono("+34 612 34 56 78")).toBe("+34612345678");
    expect(limpiarTelefono("0034612345678")).toBe("+34612345678");
    expect(limpiarTelefono("+44 7911 123456")).toBe("+447911123456");
    expect(limpiarTelefono("  ")).toBe("");
  });

  it("dice si parece un teléfono", () => {
    expect(telefonoValido("612 34 56 78")).toBe(true);
    expect(telefonoValido("6123")).toBe(false);
  });

  it("se lee como se dicta, y los enlaces llevan el prefijo", () => {
    expect(telefonoParaVer("+34612345678")).toBe("612 34 56 78");
    expect(telefonoParaVer("+447911123456")).toBe("+447911123456");
    expect(enlaceLlamar("612 34 56 78")).toBe("tel:+34612345678");
    expect(enlaceWhatsApp("612 34 56 78")).toBe("https://wa.me/34612345678");
  });

  it("como el email, desde los 16 años", () => {
    const evento = { fecha: "2026-12-11" };
    expect(pideTelefono({ anioNacimiento: "2010" }, evento)).toBe(true);
    expect(pideTelefono({ anioNacimiento: "2011" }, evento)).toBe(false);
  });
});
