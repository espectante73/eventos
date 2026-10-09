import { describe, it, expect } from "vitest";
import { textoUltimaEntrada } from "./estadoCuentas";

describe("textoUltimaEntrada", () => {
  const ahora = new Date(2026, 9, 9, 18, 0);
  it("hoy, ayer y hace N días, por días de calendario", () => {
    expect(textoUltimaEntrada(new Date(2026, 9, 9, 8, 0).toISOString(), ahora)).toBe("hoy");
    expect(textoUltimaEntrada(new Date(2026, 9, 8, 23, 59).toISOString(), ahora)).toBe("ayer");
    expect(textoUltimaEntrada(new Date(2026, 9, 4, 12, 0).toISOString(), ahora)).toBe("hace 5 d");
  });
  it("con cuenta pero sin ninguna entrada", () => {
    expect(textoUltimaEntrada(null, ahora)).toBe("sin entrar");
  });
});
