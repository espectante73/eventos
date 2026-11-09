import { describe, it, expect } from "vitest";
import { pantallaInicial, seleccionInicial, sePuedeMarcar, textoMesas } from "./acreditar";

const m = (id, extra = {}) => ({ id, nombre: id, presente: false, mesa: 5, enRegla: true, ...extra });
const datos = (miembros, exigir = true) => ({ familia: "Pacheco", abierta: true, exigir, miembros });

describe("la pantalla al leer el QR (v83.2)", () => {
  it("nadie dentro: «¿Vienen todos?»", () => {
    expect(pantallaInicial(datos([m("a"), m("b")]))).toBe("pregunta");
  });
  it("todos dentro: hecho", () => {
    expect(pantallaInicial(datos([m("a", { presente: true })]))).toBe("hecho");
  });
  it("alguno dentro, o alguno sin poder marcar: a elegir", () => {
    expect(pantallaInicial(datos([m("a", { presente: true }), m("b")]))).toBe("elegir");
    expect(pantallaInicial(datos([m("a"), m("b", { enRegla: false })]))).toBe("elegir");
  });
  it("en Modo Pruebas no se exige estar en regla", () => {
    expect(pantallaInicial(datos([m("a", { enRegla: false })], false))).toBe("pregunta");
    expect(sePuedeMarcar(m("a", { enRegla: false }), datos([], false))).toBe(true);
  });
  it("sin nadie dentro, salen marcados todos los que se pueden marcar; si no, los de dentro", () => {
    expect([...seleccionInicial(datos([m("a"), m("b", { enRegla: false })]))]).toEqual(["a"]);
    expect([...seleccionInicial(datos([m("a", { presente: true }), m("b")]))]).toEqual(["a"]);
  });
  it("la mesa, o las mesas si la familia estuviera repartida", () => {
    expect(textoMesas([m("a"), m("b")])).toBe("Mesa 5");
    expect(textoMesas([m("a", { mesa: 7 }), m("b", { mesa: 5 })])).toBe("Mesas 5, 7");
    expect(textoMesas([m("a", { mesa: null })])).toBe("Sin mesa");
  });
});
