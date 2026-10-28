// v75.2 (él): en la Lista, quién ha entrado al tablón, con un circulito.
import { describe, it, expect } from "vitest";
import { estadoTablon, contarTablon } from "./entradasTablon";

const evento = { fecha: "2026-12-11" };
const g = (extra = {}) => ({ id: "1", confirmado: true, anioNacimiento: "1980", ...extra });
const entradas = { 1: "2026-10-27T17:40:00Z" };

describe("estadoTablon", () => {
  it("verde si ha entrado, rojo si no", () => {
    expect(estadoTablon(g(), entradas, evento)).toEqual({ entro: true, cuando: "2026-10-27T17:40:00Z" });
    expect(estadoTablon(g(), {}, evento)).toEqual({ entro: false, sinAnio: false });
  });

  it("nada mientras no han llegado las entradas", () => {
    expect(estadoTablon(g(), null, evento)).toBe(null);
  });

  it("solo quien puede entrar: confirmado, no excluido, sin «No asiste»", () => {
    expect(estadoTablon(g({ confirmado: false }), {}, evento)).toBe(null);
    expect(estadoTablon(g({ excluidoTablon: true }), {}, evento)).toBe(null);
    expect(estadoTablon(g({ noAsiste: true }), {}, evento)).toBe(null);
  });

  it("los de 16 cumplidos sí; los menores, no", () => {
    expect(estadoTablon(g({ anioNacimiento: "2010" }), {}, evento)).toEqual({ entro: false, sinAnio: false });
    expect(estadoTablon(g({ anioNacimiento: "2011" }), {}, evento)).toBe(null);
  });

  it("sin año no puede entrar todavía: rojo, y se dice por qué", () => {
    expect(estadoTablon(g({ anioNacimiento: "" }), {}, evento)).toEqual({ entro: false, sinAnio: true });
  });
});

describe("contarTablon", () => {
  it("cuenta los circulitos verdes y los rojos; los que no llevan, no cuentan", () => {
    const lista = [g(), g({ id: "2" }), g({ id: "3", confirmado: false }), g({ id: "4", anioNacimiento: "2015" })];
    expect(contarTablon(lista, entradas, evento)).toEqual({ entraron: 1, sinEntrar: 1 });
    expect(contarTablon(lista, null, evento)).toBe(null);
  });
});
