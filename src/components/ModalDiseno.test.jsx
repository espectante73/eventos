// La ventana "Diseño app" (Mi cuenta), dibujada de verdad con el
// CLAUDE.md real: que se abre, que todo empieza plegado y que solo hay
// UNA sección abierta a la vez (norma 5).
import { describe, it, expect } from "vitest";
import { montar } from "../pruebas/dibujar";
import ModalDiseno, { diferenciaDeHoy } from "./ModalDiseno";

const botones = () => [...document.body.querySelectorAll("button")];
const seccion = (texto) => botones().find((b) => b.textContent.includes(texto));

describe("Diseño app", () => {
  it("se abre con sus dos partes, todo plegado", () => {
    const vista = montar(<ModalDiseno onCerrar={() => {}} />);
    const html = document.body.innerHTML;
    expect(html).toContain("Diseño de la app");
    // Los sellos de la cabecera: palabras y hora del último cambio.
    expect(html).toMatch(/[\d.]+ palabras( \(hoy [+−][\d.]+\))?/);
    expect(html).toContain("2026");
    expect(html).toContain("PARTE 1");
    expect(html).toContain("PARTE 2");
    expect(html).toMatch(/PARTE 1 — \d+ secciones/);
    expect(html).toMatch(/\d+ reglas que hay que obedecer siempre/);
    expect(html).toMatch(/PARTE 2 — \d+ trampas ya pagadas/);
    expect(html).toMatch(/· [\d.]+ palabras/);
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
    // Las normas de 1.2, en UNA lista numerada: la de dentro de la 4 no
    // la parte (antes volvía a empezar en 1).
    const abierta = document.body.querySelectorAll("ol");
    expect([...abierta].filter((ol) => !ol.parentElement.closest("ol")).length).toBe(1);
    vista.desmontar();
  });
});

describe("el sello dice lo que cambió HOY", () => {
  const sello = { palabras: 4557, dia: "2026-09-25", palabrasInicioDia: 4533 };
  it("el mismo día: hoy +24", () => {
    expect(diferenciaDeHoy(sello, new Date("2026-09-25T20:00:00Z"))).toBe(" (hoy +24)");
  });
  it("si bajó: hoy −18", () => {
    expect(diferenciaDeHoy({ ...sello, palabras: 4515 }, new Date("2026-09-25T08:00:00Z"))).toBe(" (hoy −18)");
  });
  it("otro día, o sin cambio, no sale nada", () => {
    expect(diferenciaDeHoy(sello, new Date("2026-09-26T09:00:00Z"))).toBe("");
    expect(diferenciaDeHoy({ ...sello, palabrasInicioDia: 4557 }, new Date("2026-09-25T09:00:00Z"))).toBe("");
  });
  it("el día cambia a medianoche de Canarias, no de Londres ni de Madrid", () => {
    // 23:30 del 25 en Canarias (verano, UTC+1) = 22:30 UTC: todavía es «hoy».
    expect(diferenciaDeHoy(sello, new Date("2026-09-25T22:30:00Z"))).toBe(" (hoy +24)");
    // 00:30 del 26 en Canarias = 23:30 UTC del 25: ya es otro día.
    expect(diferenciaDeHoy(sello, new Date("2026-09-25T23:30:00Z"))).toBe("");
  });
});
