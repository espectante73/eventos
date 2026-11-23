// El lienzo de la vista previa (pdfEnLienzo.js): lo que se añadió para las
// tarjetas de la invitación (v99.2).
import { it, expect } from "vitest";
import { PdfEnLienzo } from "./pdfEnLienzo";

function lienzoDePega() {
  const letras = [];
  const ctx = {
    scale() {},
    fillRect() {},
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    fillText: (t, x) => letras.push([t, x]),
    measureText: (t) => ({ width: 10 * t.length }),
  };
  const lienzo = new PdfEnLienzo({ medida: { ancho: 100, alto: 100 }, escala: 1, crearLienzo: () => ({ getContext: () => ctx }) });
  return { lienzo, ctx, letras };
}

it("el aire entre letras (charSpace, como jsPDF): letra a letra, cada una corrida su ancho y el aire", () => {
  const { lienzo, letras } = lienzoDePega();
  lienzo.text("ABC", 0, 0, { charSpace: 2 });
  expect(letras).toEqual([
    ["A", 0],
    ["B", 12],
    ["C", 24],
  ]);
  letras.length = 0;
  lienzo.text("ABC", 0, 0);
  expect(letras).toEqual([["ABC", 0]]);
});

it("las dos letras de la invitación, con el nombre con que las registra cargarAdornos", () => {
  const { lienzo, ctx } = lienzoDePega();
  lienzo.setFont("fraunces", "normal");
  expect(ctx.font).toContain("'Fraunces Tarjeta'");
  lienzo.setFont("alexbrush", "normal");
  expect(ctx.font).toContain("'Alex Brush Tarjeta'");
});
