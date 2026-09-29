import { it, expect } from "vitest";
import { esFalloDelServidor } from "./servidor";

it("distingue «el servidor no contesta» de «la respuesta es no»", () => {
  expect(esFalloDelServidor({ error: null, status: 200 })).toBe(false);
  expect(esFalloDelServidor({ error: { message: "TypeError: Failed to fetch" }, status: 0 })).toBe(true);
  expect(esFalloDelServidor({ error: { message: "<html>522</html>" }, status: 522 })).toBe(true);
  expect(esFalloDelServidor({ error: { message: "permission denied", code: "42501" }, status: 403 })).toBe(false);
});
