import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement, act } from "react";
import { createRoot } from "react-dom/client";
import { BotonQuitar } from "./PreguntaSeguridad";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// La norma: nada se quita ni se borra sin preguntar antes.
describe("BotonQuitar", () => {
  let contenedor, raiz;
  beforeEach(() => {
    contenedor = document.createElement("div");
    document.body.appendChild(contenedor);
    raiz = createRoot(contenedor);
  });
  afterEach(() => {
    act(() => raiz.unmount());
    document.body.innerHTML = "";
  });
  const pintar = (props) => act(() => raiz.render(createElement(BotonQuitar, props)));
  const pulsar = (el) => act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
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
