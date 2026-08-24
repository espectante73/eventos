import { describe, it, expect, beforeEach } from "vitest";
import { getRolFromUrl } from "./url";

describe("getRolFromUrl (depende de window.location)", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "https://ejemplo.com/?rol=abc123");
  });

  it("lee el parámetro ?rol= de la URL actual", () => {
    expect(getRolFromUrl()).toBe("abc123");
  });
});
