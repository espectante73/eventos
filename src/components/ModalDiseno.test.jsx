// La ventana "Diseño app" (Mi cuenta), dibujada de verdad con el
// CLAUDE.md real: que se abre, que todo empieza plegado y que solo hay
// UNA sección abierta a la vez (norma 6).
import { describe, it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import ModalDiseno from "./ModalDiseno";

const botones = () => [...document.body.querySelectorAll("button")];
const seccion = (texto) => botones().find((b) => b.textContent.includes(texto));

describe("Diseño app", () => {
  it("se abre con sus dos partes, todo plegado", () => {
    const vista = montar(<ModalDiseno onCerrar={() => {}} />);
    const html = document.body.innerHTML;
    expect(html).toContain("Diseño de la app");
    // Los sellos de la cabecera: palabras y hora del último cambio.
    expect(html).toMatch(/[\d.]+ palabras/);
    expect(html).toContain("2026");
    expect(html).toContain("PARTE 1");
    expect(html).toContain("PARTE 2");
    expect(seccion("1.1 ")).toBeTruthy();
    expect(seccion("2.1 ")).toBeTruthy();
    // Plegado: el texto de dentro de la 1.1 no está pintado.
    expect(html).not.toContain("Comprobar en la fuente");
    vista.desmontar();
  });

  it("al abrir una sección se ve su texto, y al abrir otra se cierra la primera", () => {
    const vista = montar(<ModalDiseno onCerrar={() => {}} />);
    vista.pulsar(seccion("1.1 "));
    expect(document.body.innerHTML).toContain("Comprobar en la fuente");
    vista.pulsar(seccion("1.2 "));
    const html = document.body.innerHTML;
    expect(html).not.toContain("Comprobar en la fuente");
    expect(html).toContain("Estandarizar");
    vista.desmontar();
  });
});
