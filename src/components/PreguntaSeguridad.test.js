import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { montar } from "../pruebas/dibujar";
import { BotonQuitar } from "./PreguntaSeguridad";

// La norma: nada se quita ni se borra sin preguntar antes.
describe("BotonQuitar", () => {
  let vista;
  beforeEach(() => {
    vista = montar(createElement("span"));
  });
  afterEach(() => {
    vista.desmontar();
    document.body.innerHTML = "";
  });
  const pintar = (props) => vista.pintar(createElement(BotonQuitar, props));
  const pulsar = (el) => vista.pulsar(el);
  const botonCon = (texto) => [...document.querySelectorAll("button")].find((b) => b.textContent === texto);

  it("pulsarlo NO borra: primero pregunta", () => {
    const quitar = vi.fn();
    pintar({ titulo: "Quitar esta mesa", pregunta: { titulo: "¿Quitar la mesa 3?", rotulo: "Sí, quitarla" }, onClick: quitar });
    pulsar(document.querySelector('[aria-label="Quitar esta mesa"]'));
    expect(quitar).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain("¿Quitar la mesa 3?");
  });

  it("con «Sí» se quita, y con «Cancelar» no", () => {
    const quitar = vi.fn();
    pintar({ titulo: "Quitar", pregunta: { titulo: "¿Seguro?", rotulo: "Sí, quitarla" }, onClick: quitar });
    pulsar(document.querySelector('[aria-label="Quitar"]'));
    pulsar(botonCon("Cancelar"));
    expect(quitar).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toContain("¿Seguro?");

    pulsar(document.querySelector('[aria-label="Quitar"]'));
    pulsar(botonCon("Sí, quitarla"));
    expect(quitar).toHaveBeenCalledTimes(1);
  });

  it("todos miden lo mismo: 24px a la vista", () => {
    pintar({ titulo: "Quitar", pregunta: { titulo: "¿?" }, onClick: () => {} });
    const b = document.querySelector('[aria-label="Quitar"]');
    expect(b.style.width).toBe("24px");
    expect(b.style.height).toBe("24px");
    expect(b.className).toContain("boton-quitar");
  });
});
