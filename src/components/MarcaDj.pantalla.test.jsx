// Los auriculares del DJ contratado (v84.2), DIBUJADOS de verdad.
import { it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import { MarcaDj } from "./MarcaDj";

it("sale solo junto a quien está en la zona DJ", () => {
  const dj = montar(<MarcaDj persona={{ nombre: "Julien", zona: "DJ" }} />);
  expect(dj.contenedor.querySelector('svg[aria-label="DJ"]')).toBeTruthy();
  dj.desmontar();
  const otro = montar(<MarcaDj persona={{ nombre: "Omar", zona: "Icod" }} />);
  expect(otro.contenedor.querySelector("svg")).toBeNull();
  otro.desmontar();
});
