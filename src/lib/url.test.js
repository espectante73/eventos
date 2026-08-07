import { describe, it, expect, beforeEach } from "vitest";
import { getRolFromUrl, buildLink } from "./url";

describe("getRolFromUrl / buildLink (dependen de window.location)", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "https://ejemplo.com/?rol=abc123");
  });

  it("lee el parámetro ?rol= de la URL actual", () => {
    expect(getRolFromUrl()).toBe("abc123");
  });

  it("construye el enlace con el rol añadido, sobre la URL pública si se da una", () => {
    const link = buildLink("nuevo-id", "https://miboda.com/");
    expect(link).toBe("https://miboda.com/?rol=nuevo-id");
  });

  it("si no hay URL pública, usa la URL actual del navegador", () => {
    const link = buildLink("nuevo-id", "");
    expect(link).toBe("https://ejemplo.com/?rol=nuevo-id");
  });
});
