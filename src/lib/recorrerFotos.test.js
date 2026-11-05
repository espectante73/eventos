import { describe, it, expect } from "vitest";
import { vecina, posicion, versionDeBoda } from "./recorrerFotos";

const lista = ["a", "b", "c"];
const es = (x) => (y) => y === x;

describe("pasar por las fotos en grande (v82.2)", () => {
  it("la siguiente y la anterior, y en los extremos da la vuelta", () => {
    expect(vecina(lista, es("a"), 1)).toBe("b");
    expect(vecina(lista, es("c"), 1)).toBe("a");
    expect(vecina(lista, es("a"), -1)).toBe("c");
  });

  it("si la abierta ya no está, empieza por un extremo; sin fotos, nada", () => {
    expect(vecina(lista, es("z"), 1)).toBe("a");
    expect(vecina(lista, es("z"), -1)).toBe("c");
    expect(vecina([], es("a"), 1)).toBeNull();
  });

  it("«N de M»", () => {
    expect(posicion(lista, es("b"))).toEqual({ n: 2, de: 3 });
    expect(posicion(lista, es("z"))).toBeNull();
  });

  it("en Boda, la misma versión si la tiene; si no, la que haya", () => {
    expect(versionDeBoda("final", { original: "o", final: "f" })).toBe("final");
    expect(versionDeBoda("final", { original: "o", final: "" })).toBe("original");
    expect(versionDeBoda("original", { original: "", final: "f" })).toBe("final");
    expect(versionDeBoda("original", { original: "o", final: "f" })).toBe("original");
  });
});
