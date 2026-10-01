// La barra de ventanas del móvil, DIBUJADA: la casita y un cuadradito por
// ventana abierta, cada una con su X encima (menos la casita).
import { describe, it, expect } from "vitest";
import { act } from "react";
import { montar } from "../pruebas/dibujar";
import { BarraVentanas, ALTO_BARRA } from "./BarraVentanas";

function dibujar(props = {}) {
  const llamadas = { elegir: [], cerrar: [] };
  const vista = montar(
    <BarraVentanas
      abiertas={["musica"]}
      delante="musica"
      onElegir={(c) => llamadas.elegir.push(c)}
      onCerrar={(c) => llamadas.cerrar.push(c)}
      {...props}
    />
  );
  const boton = (nombre) => [...document.body.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === nombre);
  return { vista, llamadas, boton };
}

describe("la barra de ventanas", () => {
  it("la casita y Multimedia; la de delante, marcada", () => {
    const { vista, boton } = dibujar();
    expect(boton("Inicio")).toBeTruthy();
    expect(boton("Multimedia").getAttribute("aria-pressed")).toBe("true");
    expect(boton("Inicio").getAttribute("aria-pressed")).toBe("false");
    vista.desmontar();
  });

  it("tocar un cuadradito pone esa ventana delante", () => {
    const { vista, llamadas, boton } = dibujar();
    vista.pulsar(boton("Inicio"));
    expect(llamadas.elegir).toEqual(["inicio"]);
    vista.desmontar();
  });

  it("la X cierra, pero pregunta antes; la casita no tiene X", async () => {
    const { vista, llamadas, boton } = dibujar();
    expect(boton("Cerrar Inicio")).toBeFalsy();
    vista.pulsar(boton("Cerrar Multimedia"));
    expect(document.body.textContent).toContain("¿Cerrar Multimedia?");
    expect(llamadas.cerrar).toEqual([]);
    const si = [...document.body.querySelectorAll("button")].find((b) => b.textContent.trim() === "Sí, cerrar");
    await act(async () => si.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(llamadas.cerrar).toEqual(["musica"]);
    vista.desmontar();
  });

  it("mientras se ve, las ventanas flotantes dejan su hueco abajo", () => {
    const { vista } = dibujar();
    expect(document.documentElement.style.getPropertyValue("--hueco-barra-ventanas")).toBe(`${ALTO_BARRA}px`);
    vista.desmontar();
    expect(document.documentElement.style.getPropertyValue("--hueco-barra-ventanas")).toBe("");
  });
});
