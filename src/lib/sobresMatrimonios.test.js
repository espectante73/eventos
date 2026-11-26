import { describe, it, expect } from "vitest";
import { sobresDeMatrimonios, dibujarSobres, SOBRES } from "./sobresMatrimonios";
import { matrimoniosConLosQueVienenSolos } from "./matrimonios";
import { C } from "../theme";

const g = (id, nombre, apellido, grupoFamiliar, rolFamiliar, mesa, extra = {}) => ({ id, nombre, apellido, grupoFamiliar, rolFamiliar, mesa, confirmado: true, ...extra });
const INVITADOS = [
  g("1", "Luis", "Abreu", "M1", "esposo", 7),
  g("2", "Ana", "Medina", "M1", "esposa", 7),
  g("3", "Leo", "Abreu", "M1", "hijo", 7),
  g("4", "Jacob", "Barrios", "B1", "esposo", 3),
  g("5", "Lucía", "Pacheco", "B1", "esposa", 3),
  g("6", "Daniel", "Suárez", "S1", "esposo", null),
  g("7", "Sara", "Mesa", "S1", "esposa", null),
  // Sin confirmar los dos: no es un matrimonio confirmado.
  g("8", "Pedro", "Afonso", "A1", "esposo", 5),
  g("9", "Elena", "Tomás", "A1", "esposa", 5, { confirmado: false }),
];

describe("sobresDeMatrimonios", () => {
  it("uno por matrimonio confirmado, los mismos que cuenta Aniversarios (norma 7)", () => {
    const { sobres } = sobresDeMatrimonios(INVITADOS, "2026-12-11");
    expect(sobres).toHaveLength(matrimoniosConLosQueVienenSolos(INVITADOS, "2026-12-11").filter((m) => m.confirmados).length);
    expect(sobres).toHaveLength(3);
  });
  it("en el orden de las mesas, el esposo primero; los que no tienen mesa, al final y contados", () => {
    const { sobres, sinMesa } = sobresDeMatrimonios(INVITADOS, "2026-12-11");
    expect(sobres.map((s) => [s.mesa, s.nombres])).toEqual([
      [3, "Jacob y Lucía"],
      [7, "Luis y Ana"],
      [null, "Daniel y Sara"],
    ]);
    expect(sinMesa).toBe(1);
  });
});

function hojaDePega() {
  const textos = [];
  const imagenes = [];
  const paginas = [];
  const circulos = [];
  let fuente = "";
  let color = null;
  const pdf = {
    addPage: (formato, orientacion) => paginas.push([formato, orientacion]),
    getTextWidth: (t) => t.length * 6,
    text: (t, x, y, o = {}) => textos.push({ t, x, y, fuente, color, ...o }),
    setTextColor: (c) => (color = c),
    addImage: (...a) => imagenes.push(a),
    setFont: (f) => (fuente = f),
    circle: (x, y, r) => circulos.push({ x, y, r }),
  };
  for (const f of ["setFillColor", "setDrawColor", "setLineWidth", "setFontSize"]) pdf[f] = () => {};
  return { pdf, textos, imagenes, paginas, circulos };
}
const LOGO = { dato: "data:image/png;base64,AAA", imagen: null, proporcion: 0.9 };
const ADORNOS = { corazon: { dato: "data:image/png;base64,COR", imagen: null, proporcion: 0.12 }, fuentes: {} };

describe("dibujarSobres", () => {
  const { sobres } = sobresDeMatrimonios(INVITADOS, "2026-12-11");
  it("una página por sobre, del tamaño del sobre elegido", () => {
    const h = hojaDePega();
    expect(dibujarSobres(h.pdf, sobres, { sobre: "c6", nombre: "centro", logo: "encima" }, LOGO)).toBe(3);
    expect(h.paginas).toHaveLength(2);
    const mm = 72 / 25.4;
    expect(h.paginas[0][0][0]).toBeCloseTo(SOBRES.c6.ancho * mm);
  });
  it("«Jacob y Lucía» (por defecto) o, con el apellido, «BARRIOS» encima; y el número de su mesa; sin mesa, sin número", () => {
    const solo = hojaDePega();
    dibujarSobres(solo.pdf, sobres, { sobre: "americano", nombre: "abajoDerecha", logo: "sin" }, LOGO);
    expect(solo.textos.map((x) => x.t)).toEqual(["Jacob y Lucía", "3", "Luis y Ana", "7", "Daniel y Sara"]);
    const con = hojaDePega();
    dibujarSobres(con.pdf, sobres, { sobre: "americano", formato: "apellido", nombre: "abajoDerecha", logo: "sin" }, LOGO);
    expect(con.textos.map((x) => x.t).slice(0, 3)).toEqual(["BARRIOS", "Jacob y Lucía", "3"]);
    expect(con.imagenes).toHaveLength(0);
  });
  // v99.3 (él): la letra y el corazón de las tarjetas, y la mesa DEBAJO
  // («con la mesa al lado queda mal el encuadre»): una columna centrada.
  it("con las letras de la invitación: APELLIDO, nombres, corazón y mesa, de arriba abajo y centrados", () => {
    const h = hojaDePega();
    dibujarSobres(h.pdf, [sobres[0]], { sobre: "c6", formato: "apellido", nombre: "centro", logo: "sin" }, LOGO, ADORNOS);
    const [apellido, nombres, mesa] = h.textos;
    expect([apellido.t, nombres.t, mesa.t]).toEqual(["BARRIOS", "Jacob y Lucía", "3"]);
    expect([apellido.fuente, nombres.fuente, mesa.fuente]).toEqual(["fraunces", "alexbrush", "fraunces"]);
    expect(apellido.charSpace).toBeGreaterThan(0);
    const corazon = h.imagenes.find((i) => i[0] === ADORNOS.corazon.dato);
    const [, , cx, cy, cw, ch] = corazon;
    expect(apellido.y).toBeLessThan(nombres.y);
    expect(nombres.y).toBeLessThan(cy);
    const [circulo] = h.circulos;
    expect(cy + ch).toBeLessThan(circulo.y - circulo.r);
    // Todo, centrado en el mismo eje (la mitad del sobre).
    const medio = (SOBRES.c6.ancho * 72) / 25.4 / 2;
    expect(cx + cw / 2).toBeCloseTo(medio);
    expect(circulo.x).toBeCloseTo(medio);
    expect(nombres.x + (nombres.t.length * 6) / 2).toBeCloseTo(medio);
  });
  it("bajo un nombre largo, el corazón no crece más que bajo uno corto, y el nombre cabe en el sobre", () => {
    const largo = { ...sobres[0], nombres: "Richard y María del Carmen" };
    const h = hojaDePega();
    dibujarSobres(h.pdf, [largo, sobres[0]], { sobre: "c6", nombre: "centro", logo: "sin" }, LOGO, ADORNOS);
    const [conLargo, conCorto] = h.imagenes.map((i) => i[4]);
    expect(conLargo).toBeLessThanOrEqual(150);
    expect(conCorto).toBeLessThanOrEqual(conLargo);
    const nombre = h.textos.find((x) => x.t === largo.nombres);
    const mm = 72 / 25.4;
    expect(nombre.x).toBeGreaterThanOrEqual(15 * mm - 0.01);
  });
  it("sin las letras (no se cargaron): la de siempre y sin corazón, pero la mesa también debajo", () => {
    const h = hojaDePega();
    dibujarSobres(h.pdf, [sobres[0]], { sobre: "c6", nombre: "centro", logo: "sin" }, LOGO, null);
    expect(h.textos.map((x) => x.fuente)).toEqual(["helvetica", "helvetica"]);
    expect(h.imagenes).toHaveLength(0);
    expect(h.textos[0].y).toBeLessThan(h.circulos[0].y - h.circulos[0].r);
  });
  it("el logo donde se elige; sin logo cargado, no se dibuja", () => {
    for (const logo of ["encima", "debajo", "alLado", "centro"]) {
      const h = hojaDePega();
      dibujarSobres(h.pdf, [sobres[0]], { sobre: "americano", nombre: "abajoDerecha", logo }, LOGO);
      expect(h.imagenes, logo).toHaveLength(1);
    }
    const sin = hojaDePega();
    dibujarSobres(sin.pdf, [sobres[0]], { sobre: "americano", nombre: "centro", logo: "encima" }, null);
    expect(sin.imagenes).toHaveLength(0);
  });
  // v102 (él): «falta fecha evento… en la parte más baja, en línea con el
  // resto de la impresión, color dorado».
  it("la fecha del evento: abajo del todo, en dorado y alineada como el nombre; sin fecha, nada", () => {
    const mm = 72 / 25.4;
    const alto = SOBRES.c6.alto * mm;
    const ancho = SOBRES.c6.ancho * mm;
    const fecha = "11 diciembre 2026";
    const anchoFecha = fecha.length * 6 + 1 * (fecha.length - 1);
    const centro = hojaDePega();
    dibujarSobres(centro.pdf, [sobres[0]], { sobre: "c6", formato: "apellido", nombre: "centro", logo: "sin", fecha }, LOGO, ADORNOS);
    const abajo = centro.textos.at(-1);
    expect([abajo.t, abajo.fuente, abajo.color]).toEqual([fecha, "fraunces", C.gold]);
    expect(abajo.y).toBeCloseTo(alto - 15 * mm);
    expect(abajo.x + anchoFecha / 2).toBeCloseTo(ancho / 2);
    expect(centro.textos.slice(0, -1).every((x) => x.y < abajo.y - 8)).toBe(true);
    const derecha = hojaDePega();
    dibujarSobres(derecha.pdf, [sobres[0]], { sobre: "c6", nombre: "abajoDerecha", logo: "sin", fecha }, LOGO, ADORNOS);
    expect(derecha.textos.at(-1).x + anchoFecha).toBeCloseTo(ancho - 15 * mm);
    const sin = hojaDePega();
    dibujarSobres(sin.pdf, [sobres[0]], { sobre: "c6", nombre: "centro", logo: "sin" }, LOGO, ADORNOS);
    expect(sin.textos.map((x) => x.t)).not.toContain(fecha);
  });
  it("con el nombre abajo, sube lo justo para no pisar la fecha", () => {
    const con = hojaDePega();
    dibujarSobres(con.pdf, [sobres[0]], { sobre: "americano", nombre: "abajoDerecha", logo: "sin", fecha: "11 diciembre 2026" }, LOGO, ADORNOS);
    const sin = hojaDePega();
    dibujarSobres(sin.pdf, [sobres[0]], { sobre: "americano", nombre: "abajoDerecha", logo: "sin" }, LOGO, ADORNOS);
    const fecha = con.textos.at(-1);
    const circulo = con.circulos[0];
    expect(circulo.y + circulo.r).toBeLessThan(fecha.y - 11 * 0.716);
    expect(circulo.y).toBeLessThan(sin.circulos[0].y);
  });
  it("nombre abajo a la derecha: dentro del margen, pegado a la derecha y abajo", () => {
    const h = hojaDePega();
    dibujarSobres(h.pdf, [sobres[0]], { sobre: "americano", nombre: "abajoDerecha", logo: "sin" }, LOGO);
    const mm = 72 / 25.4;
    const ancho = SOBRES.americano.ancho * mm;
    const alto = SOBRES.americano.alto * mm;
    for (const x of h.textos) {
      expect(x.x).toBeGreaterThan(ancho / 2);
      expect(x.x).toBeLessThan(ancho - 15 * mm);
      expect(x.y).toBeGreaterThan(alto / 2);
      expect(x.y).toBeLessThan(alto - 15 * mm);
    }
  });
});
