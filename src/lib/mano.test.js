import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CLAVE_MANO, MANO, leerMano, manoEfectiva, guardarMano, aplicarMano, esZurdo, alCambiarMano } from "./mano";

// jsdom no trae matchMedia: se simula un móvil (táctil) o un ordenador.
function simularAparato(tactil) {
  window.matchMedia = vi.fn(() => ({ matches: tactil }));
}

describe("mano del móvil", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.mano;
  });
  afterEach(() => {
    delete window.matchMedia;
  });

  it("la izquierda solo manda en un aparato táctil", () => {
    expect(manoEfectiva(MANO.IZQUIERDA, true)).toBe(MANO.IZQUIERDA);
    expect(manoEfectiva(MANO.IZQUIERDA, false)).toBe(MANO.DERECHA);
    expect(manoEfectiva(MANO.DERECHA, true)).toBe(MANO.DERECHA);
    expect(manoEfectiva(null, true)).toBe(MANO.DERECHA);
  });

  it("sin elegir todavía, no hay mano (así se sabe que hay que preguntar)", () => {
    expect(leerMano()).toBe(null);
  });

  it("un valor raro guardado se ignora", () => {
    localStorage.setItem(CLAVE_MANO, "zurda");
    expect(leerMano()).not.toBe("zurda");
  });

  it("la elección se recuerda", () => {
    simularAparato(true);
    guardarMano(MANO.IZQUIERDA);
    expect(localStorage.getItem(CLAVE_MANO)).toBe(MANO.IZQUIERDA);
    expect(leerMano()).toBe(MANO.IZQUIERDA);
  });

  it("en el móvil, elegir la izquierda marca <html> y elegir la derecha lo quita", () => {
    simularAparato(true);
    guardarMano(MANO.IZQUIERDA);
    expect(esZurdo()).toBe(true);
    guardarMano(MANO.DERECHA);
    expect(esZurdo()).toBe(false);
    expect(document.documentElement.dataset.mano).toBeUndefined();
  });

  it("en el ordenador todo sigue a la derecha aunque se haya elegido la izquierda", () => {
    simularAparato(false);
    guardarMano(MANO.IZQUIERDA);
    aplicarMano();
    expect(esZurdo()).toBe(false);
  });

  it("avisa a quien escucha cuando cambia", () => {
    simularAparato(true);
    const avisar = vi.fn();
    const dejar = alCambiarMano(avisar);
    guardarMano(MANO.IZQUIERDA);
    expect(avisar).toHaveBeenCalledTimes(1);
    dejar();
    guardarMano(MANO.DERECHA);
    expect(avisar).toHaveBeenCalledTimes(1);
  });
});
