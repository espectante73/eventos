import { describe, it, expect } from "vitest";
import { rejilla, tarjetasDeAcomodacion, textoAncho, dibujarTarjetasAcomodacion, PdfEnLienzo, ACABADOS } from "./tarjetasAcomodacion";
import { C } from "../theme";

describe("rejilla (cuántas caben por hoja)", () => {
  it("A4: 10 con las dos medidas (9,5 cm cabe a dos columnas); A3: 21 o 14", () => {
    expect(rejilla("a4", 85.6)).toEqual({ columnas: 2, filas: 5, porHoja: 10 });
    expect(rejilla("a4", 95)).toEqual({ columnas: 2, filas: 5, porHoja: 10 });
    expect(rejilla("a3", 85.6)).toEqual({ columnas: 3, filas: 7, porHoja: 21 });
    expect(rejilla("a3", 95)).toEqual({ columnas: 2, filas: 7, porHoja: 14 });
  });
  it("el ancho se escribe como aquí", () => {
    expect(textoAncho(85.6)).toBe("8,56 cm");
    expect(textoAncho(95)).toBe("9,5 cm");
  });
});

const g = (id, nombre, apellido, mesa, extra = {}) => ({ id, nombre, apellido, mesa, confirmado: true, ...extra });

describe("tarjetasDeAcomodacion (quién lleva tarjeta y en qué orden)", () => {
  it("todos los confirmados con mesa, bebés incluidos; fuera quien no viene", () => {
    const { tarjetas, sinMesa } = tarjetasDeAcomodacion([
      g("1", "Ana", "Medina", 3),
      g("2", "Bebé", "Medina", 3, { anioNacimiento: "2026" }),
      g("3", "Luis", "Abreu", 3, { confirmado: false }),
      g("4", "Pedro", "Afonso", 3, { noAsiste: true }),
      g("5", "Rosa", "Delgado", null),
    ]);
    expect(tarjetas.map((t) => t.nombre)).toEqual(["Ana", "Bebé"]);
    expect(sinMesa).toBe(1);
  });

  it("mesa por mesa (en orden de número), familia seguida y con su letra; el matrimonio primero", () => {
    const { tarjetas } = tarjetasDeAcomodacion([
      g("a", "Omar", "Pacheco", 12, { grupoFamiliar: "Pacheco01" }),
      g("b", "Zoe", "Barrios", 5, { grupoFamiliar: "Barrios01", rolFamiliar: "hijo" }),
      g("c", "Lucía", "Pacheco", 5, { grupoFamiliar: "Pacheco01" }),
      g("d", "Jacob", "Barrios", 5, { grupoFamiliar: "Barrios01", rolFamiliar: "esposo" }),
      g("e", "Ana", "Torres", 5, { grupoFamiliar: "Barrios01", rolFamiliar: "esposa" }),
    ]);
    expect(tarjetas.map((t) => `${t.mesa}${t.familia} ${t.nombre}`)).toEqual(["5A Jacob", "5A Ana", "5A Zoe", "5B Lucía", "12A Omar"]);
  });
});

// Una hoja de pega que apunta lo que se dibuja: lo justo para contar.
function hojaDePega() {
  const textos = [];
  const rellenos = [];
  const recuadros = [];
  let colorTexto = null;
  const pdf = {
    setTextColor: (c) => (colorTexto = c),
    rect: (x, y, w, h, estilo) => rellenos.push(estilo),
    roundedRect: (x, y, w, h, rx, ry, estilo) => recuadros.push(estilo),
    paginas: 1,
    addPage() { this.paginas++; },
    getTextWidth: (t) => t.length * 5,
    text: (t, x, y, o) => textos.push({ t, x, y, angle: o?.angle || 0, color: colorTexto }),
  };
  pdf.GState = class { constructor(o) { Object.assign(this, o); } };
  pdf.setGState = () => {};
  for (const f of ["setFillColor", "setDrawColor", "setLineWidth", "setLineDashPattern", "setFont", "setFontSize", "circle", "line"]) pdf[f] = () => {};
  return { pdf, textos, rellenos, recuadros };
}

describe("dibujarTarjetasAcomodacion", () => {
  const muchas = Array.from({ length: 23 }, (_, i) => ({ id: String(i), nombre: "Ana", apellido: "Medina", mesa: 3, familia: "A" }));
  it("tantas hojas como hagan falta", () => {
    const a3 = hojaDePega();
    expect(dibujarTarjetasAcomodacion(a3.pdf, muchas, { hoja: "a3", ancho: 85.6 })).toBe(2);
    expect(a3.pdf.paginas).toBe(2);
    const a4 = hojaDePega();
    expect(dibujarTarjetasAcomodacion(a4.pdf, muchas, { hoja: "a4", ancho: 95 })).toBe(3);
  });
  it("cada tarjeta, por las dos caras: una derecha y otra girada, con «APELLIDO, » y el nombre", () => {
    const { pdf, textos } = hojaDePega();
    dibujarTarjetasAcomodacion(pdf, [muchas[0]], { hoja: "a4", ancho: 85.6 });
    expect(textos.filter((x) => x.t === "MEDINA, ").map((x) => x.angle)).toEqual([180, 0]);
    expect(textos.filter((x) => x.t === "Ana")).toHaveLength(2);
    expect(textos.filter((x) => x.t === "3")).toHaveLength(2);
  });
  it("el acabado: fondo a sangre solo si lo lleva, recuadro relleno solo si lo lleva, y el color de la letra", () => {
    const ver = (acabado) => {
      const h = hojaDePega();
      dibujarTarjetasAcomodacion(h.pdf, [muchas[0]], { hoja: "a4", ancho: 85.6, acabado });
      return { fondo: h.rellenos.length, recuadro: h.recuadros, letra: h.textos.find((x) => x.t === "Ana").color };
    };
    expect(ver("verde")).toEqual({ fondo: 2, recuadro: ["S", "S"], letra: C.champan });
    expect(ver("blancoVerde")).toEqual({ fondo: 0, recuadro: ["S", "S"], letra: C.ink });
    expect(ver("recuadroVerde")).toEqual({ fondo: 0, recuadro: ["FD", "FD"], letra: C.champan });
    expect(ver("recuadroBlanco")).toEqual({ fondo: 2, recuadro: ["FD", "FD"], letra: C.ink });
    // Uno que ya no exista (guardado de antes): el de siempre.
    expect(ver("otro")).toEqual(ver("verde"));
    expect(ACABADOS).toHaveLength(7);
  });
  it("el aura: el nombre se repite debajo en verde, y encima una sola vez en dorado claro", () => {
    const h = hojaDePega();
    dibujarTarjetasAcomodacion(h.pdf, [muchas[0]], { hoja: "a4", ancho: 85.6, acabado: "blancoDoradoAura" });
    const ana = h.textos.filter((x) => x.t === "Ana");
    expect(ana.filter((x) => x.color === C.goldClaro)).toHaveLength(2);
    expect(ana.filter((x) => x.color === C.ink).length).toBeGreaterThan(40);
    // Lo dorado, encima: después de su aura.
    expect(ana.at(-1).color).toBe(C.goldClaro);
  });
  it("sin lienzo (las pruebas) no se rompe", () => {
    const lienzo = new PdfEnLienzo({ hoja: "a4", escala: 1, crearLienzo: () => ({}) });
    expect(dibujarTarjetasAcomodacion(lienzo, muchas, { hoja: "a4", ancho: 85.6 })).toBe(3);
    expect(lienzo.paginas).toHaveLength(3);
  });
});
