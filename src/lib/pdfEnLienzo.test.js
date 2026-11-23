// El lienzo de la vista previa (pdfEnLienzo.js): lo que se añadió para las
// tarjetas de la invitación (v99.2) y para las tarjetas QR (v99.3).
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

// v99.3: las tarjetas QR centran su texto con `align: "center"`, como jsPDF.
it("align «center»: el texto, centrado en x (también con aire entre letras)", () => {
  const { lienzo, letras } = lienzoDePega();
  lienzo.text("ABCD", 50, 0, { align: "center" });
  expect(letras).toEqual([["ABCD", -20]]);
  letras.length = 0;
  lienzo.text("AB", 50, 0, { align: "center", charSpace: 2 });
  expect(letras).toEqual([
    ["A", -11],
    ["B", 1],
  ]);
});
