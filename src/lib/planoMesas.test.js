import { it, expect } from "vitest";
import { zoomSiguiente, tamanoMesasDe, tamanoMesasSiguiente, anchoMesaPlano, ANCHO_MESA_PLANO } from "./planoMesas";

it("el zoom va de paso en paso y se queda en los extremos", () => {
  // De 25 en 25 (él: «de 100 a 150 es mucha franja»).
  expect(zoomSiguiente(100, 1)).toBe(125);
  expect(zoomSiguiente(125, 1)).toBe(150);
  expect(zoomSiguiente(300, 1)).toBe(300);
  expect(zoomSiguiente(125, -1)).toBe(100);
  expect(zoomSiguiente(100, -1)).toBe(100);
  expect(zoomSiguiente(123, 1)).toBe(125);
});

it("el tamaño de las mesas: sin guardar es el 100 %, y no sale de sus límites", () => {
  expect(tamanoMesasDe(undefined)).toBe(100);
  expect(tamanoMesasDe({ tamanoMesasPlano: null })).toBe(100);
  expect(tamanoMesasDe({ tamanoMesasPlano: 120 })).toBe(120);
  expect(tamanoMesasDe({ tamanoMesasPlano: 900 })).toBe(200);
  expect(tamanoMesasSiguiente(100, 1)).toBe(110);
  expect(tamanoMesasSiguiente(50, -1)).toBe(50);
  expect(tamanoMesasSiguiente(200, 1)).toBe(200);
});

it("al 100 %, la mesa mide lo de siempre; al 120 %, un 20 % más", () => {
  expect(anchoMesaPlano(100)).toBe(ANCHO_MESA_PLANO);
  expect(anchoMesaPlano(120)).toBeCloseTo(ANCHO_MESA_PLANO * 1.2);
});
