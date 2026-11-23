import { describe, it, expect } from "vitest";
import { rejilla, tarjetasDeAcomodacion, dibujarTarjetasAcomodacion, ACABADOS, ANCHO_TARJETA, OPCIONES_POR_DEFECTO, CORTES } from "./tarjetasAcomodacion";
import { PdfEnLienzo, PUNTOS_POR_MM } from "./pdfEnLienzo";
import { C } from "../theme";

describe("rejilla (cuántas caben por hoja)", () => {
  // v98.9 (él): cada cara, del tamaño de la tarjeta bancaria; abierta, 10,8 cm.
  it("A4: 4; A3: 9", () => {
    expect(rejilla("a4")).toEqual({ columnas: 2, filas: 2, porHoja: 4 });
    expect(rejilla("a3")).toEqual({ columnas: 3, filas: 3, porHoja: 9 });
  });
  // v98.9 (él): «retiramos la opción más ancha y nos quedamos con el modelo
  // de tarjeta bancaria».
  it("un solo ancho, el de la tarjeta bancaria; ya no se elige", () => {
    expect(ANCHO_TARJETA).toBe(85.6);
    expect(OPCIONES_POR_DEFECTO).not.toHaveProperty("ancho");
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
    // Lucía y Omar vienen solos a su mesa: sin letra (él, v98.9).
    expect(tarjetas.map((t) => `${t.mesa}${t.familia} ${t.nombre}`)).toEqual(["5A Jacob", "5A Ana", "5A Zoe", "5 Lucía", "12 Omar"]);
  });

  it("la letra, solo para las familias de dos o más; quien viene solo no la lleva ni gasta una", () => {
    const { tarjetas } = tarjetasDeAcomodacion([
      g("a", "Ana", "Abreu", 1, { grupoFamiliar: "Abreu01" }),
      g("b", "Luis", "Abreu", 1, { grupoFamiliar: "Abreu01" }),
      g("c", "Rosa", "Barrios", 1, { grupoFamiliar: "Barrios01" }),
      g("d", "Pedro", "Cruz", 1, { grupoFamiliar: "Cruz01" }),
      g("e", "Eva", "Cruz", 1, { grupoFamiliar: "Cruz01" }),
      g("f", "Darnell", "González", 1, { grupoFamiliar: "González01" }),
    ]);
    expect(tarjetas.map((t) => `${t.nombre}:${t.familia}`)).toEqual(["Ana:A", "Luis:A", "Rosa:", "Eva:B", "Pedro:B", "Darnell:"]);
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
    expect(dibujarTarjetasAcomodacion(a3.pdf, muchas, { hoja: "a3" })).toBe(3);
    expect(a3.pdf.paginas).toBe(3);
    const a4 = hojaDePega();
    expect(dibujarTarjetasAcomodacion(a4.pdf, muchas, { hoja: "a4" })).toBe(6);
  });
  // v98.9 (él): «APELLIDO, nombre en dos líneas».
  it("cada tarjeta, por las dos caras: una derecha y otra girada, con el APELLIDO arriba y el nombre debajo", () => {
    const { pdf, textos } = hojaDePega();
    dibujarTarjetasAcomodacion(pdf, [muchas[0]], { hoja: "a4" });
    expect(textos.filter((x) => x.t === "MEDINA").map((x) => x.angle)).toEqual([180, 0]);
    expect(textos.filter((x) => x.t === "Ana")).toHaveLength(2);
    // En la cara derecha, el nombre va debajo del apellido.
    const derecha = (t) => textos.find((x) => x.t === t && x.angle === 0);
    expect(derecha("Ana").y).toBeGreaterThan(derecha("MEDINA").y);
    expect(textos.filter((x) => x.t === "3")).toHaveLength(2);
  });
  it("el acabado: fondo a sangre solo si lo lleva, recuadro relleno solo si lo lleva, y el color de la letra", () => {
    const ver = (acabado) => {
      const h = hojaDePega();
      dibujarTarjetasAcomodacion(h.pdf, [muchas[0]], { hoja: "a4", acabado });
      return { fondo: h.rellenos.length, recuadro: h.recuadros, letra: h.textos.find((x) => x.t === "Ana").color };
    };
    expect(ver("verde")).toEqual({ fondo: 2, recuadro: ["S", "S"], letra: C.champan });
    expect(ver("blancoVerde")).toEqual({ fondo: 0, recuadro: ["S", "S"], letra: C.ink });
    expect(ver("recuadroVerde")).toEqual({ fondo: 0, recuadro: ["FD", "FD"], letra: C.champan });
    expect(ver("recuadroBlanco")).toEqual({ fondo: 2, recuadro: ["FD", "FD"], letra: C.ink });
    // Uno que ya no exista (guardado de antes): el de siempre.
    expect(ver("otro")).toEqual(ver("verde"));
    expect(ACABADOS).toHaveLength(6);
  });
  it("la letra de la familia, sobre blanco, en el verde oscuro (él); el modelo del aura, quitado", () => {
    for (const a of ACABADOS.filter((a) => !a.fondo && !a.recuadro)) expect(a.familia).toBe(C.ink);
    expect(ACABADOS.some((a) => a.id === "blancoDoradoAura")).toBe(false);
  });
  it("sin lienzo (las pruebas) no se rompe", () => {
    const lienzo = new PdfEnLienzo({ medida: { ancho: 210 * PUNTOS_POR_MM, alto: 297 * PUNTOS_POR_MM }, escala: 1, crearLienzo: () => ({}) });
    expect(dibujarTarjetasAcomodacion(lienzo, muchas, { hoja: "a4" })).toBe(6);
    expect(lienzo.paginas).toHaveLength(6);
  });
});

// Una hoja de pega que apunta las líneas y los rellenos negros: lo justo
// para mirar las marcas.
function hojaQueApunta() {
  const lineas = [];
  let color = null;
  let discontinua = false;
  const negros = [];
  let relleno = null;
  const pdf = {
    setDrawColor: (c) => (color = c),
    setFillColor: (c) => (relleno = c),
    setLineDashPattern: (p) => (discontinua = p.length > 0),
    line: (x1, y1, x2, y2) => lineas.push({ x1, y1, x2, y2, color, discontinua }),
    rect: (x, y, w, h, estilo) => relleno === C.negro && estilo === "F" && negros.push({ x, y, w, h }),
    addPage() {},
    getTextWidth: (t) => t.length * 5,
  };
  for (const f of ["setLineWidth", "setFont", "setFontSize", "setTextColor", "circle", "roundedRect", "text"]) pdf[f] = () => {};
  return { pdf, lineas, negros };
}

// v98.9 (él): el rotulista pidió marcas de corte que se vean, como las de imprenta.
describe("las marcas de corte", () => {
  const una = [{ id: "1", nombre: "Ana", apellido: "Medina", mesa: 3, familia: "A" }];

  it("negras, continuas y cortas, una en cada extremo de cada corte, y ninguna dentro de las tarjetas", () => {
    const { pdf, lineas } = hojaQueApunta();
    dibujarTarjetasAcomodacion(pdf, una, { hoja: "a4" });
    const corte = lineas.filter((l) => l.color === C.negro && !l.discontinua);
    // Una tarjeta: 2 cortes de arriba abajo y 2 de lado a lado, cada uno con sus dos marcas.
    expect(corte).toHaveLength(8);
    const W = 85.6 * PUNTOS_POR_MM;
    const H = 2 * 53.98 * PUNTOS_POR_MM;
    // La rejilla entera (2 × 2 en A4) va centrada; la tarjeta, en su primer hueco.
    const x0 = (210 * PUNTOS_POR_MM - 2 * W) / 2;
    const y0 = (297 * PUNTOS_POR_MM - 2 * H) / 2;
    const dentro = (x, y) => x > x0 - 1 && x < x0 + W + 1 && y > y0 - 1 && y < y0 + H + 1;
    for (const l of corte) {
      expect(dentro(l.x1, l.y1) && dentro(l.x2, l.y2)).toBe(false);
      expect(Math.hypot(l.x2 - l.x1, l.y2 - l.y1)).toBeLessThanOrEqual(6 * PUNTOS_POR_MM + 0.01);
    }
  });
  it("a los lados, la del doblez, discontinua; y ninguna llega al borde del papel", () => {
    const { pdf, lineas } = hojaQueApunta();
    dibujarTarjetasAcomodacion(pdf, una, { hoja: "a4" });
    expect(lineas.filter((l) => l.color === C.negro && l.discontinua)).toHaveLength(2);
    for (const l of lineas.filter((l) => l.color === C.negro)) {
      expect(Math.min(l.x1, l.x2)).toBeGreaterThanOrEqual(3 * PUNTOS_POR_MM - 0.01);
      expect(Math.max(l.x1, l.x2)).toBeLessThanOrEqual((210 - 3) * PUNTOS_POR_MM + 0.01);
    }
  });
});

// v99 (él): «la opción de poner unas marcas u otras para el corte».
describe("con qué se corta (las marcas de cada forma)", () => {
  const cuatro = Array.from({ length: 4 }, (_, i) => ({ id: String(i), nombre: "Ana", apellido: "Medina", mesa: 3, familia: "" }));
  const W = 85.6 * PUNTOS_POR_MM;
  const H = 2 * 53.98 * PUNTOS_POR_MM;
  const x0 = (210 * PUNTOS_POR_MM - 2 * W) / 2;
  const y0 = (297 * PUNTOS_POR_MM - 2 * H) / 2;
  const corte = (lineas) => lineas.filter((l) => l.color === C.negro && !l.discontinua);

  it("tres formas, en un desplegable; la guillotina, la de siempre", () => {
    expect(CORTES.map((c) => c.id)).toEqual(["guillotina", "tijera", "ploter"]);
    expect(OPCIONES_POR_DEFECTO.corte).toBe("guillotina");
  });
  it("tijera o cúter: cada corte, una línea entera que cruza todas las tarjetas", () => {
    const { pdf, lineas, negros } = hojaQueApunta();
    dibujarTarjetasAcomodacion(pdf, cuatro, { hoja: "a4", corte: "tijera" });
    // 2 columnas y 2 filas: 3 cortes de arriba abajo y 3 de lado a lado.
    expect(corte(lineas)).toHaveLength(6);
    for (const l of corte(lineas)) {
      if (l.x1 === l.x2) expect(Math.min(l.y1, l.y2) < y0 && Math.max(l.y1, l.y2) > y0 + 2 * H).toBe(true);
      else expect(Math.min(l.x1, l.x2) < x0 && Math.max(l.x1, l.x2) > x0 + 2 * W).toBe(true);
    }
    expect(negros).toHaveLength(0);
  });
  it("plóter: un cuadrado y tres escuadras en las esquinas, fuera de las tarjetas y del borde; sin rayas de corte", () => {
    const { pdf, lineas, negros } = hojaQueApunta();
    dibujarTarjetasAcomodacion(pdf, cuatro, { hoja: "a4", corte: "ploter" });
    expect(corte(lineas)).toHaveLength(0);
    // El doblez sigue marcado a los lados.
    expect(lineas.filter((l) => l.color === C.negro && l.discontinua)).toHaveLength(4);
    // Cuadrado (1) + 3 escuadras de 2 brazos.
    expect(negros).toHaveLength(7);
    const fuera = (r) => r.x + r.w <= x0 || r.x >= x0 + 2 * W || r.y + r.h <= y0 || r.y >= y0 + 2 * H;
    for (const r of negros) {
      expect(fuera(r)).toBe(true);
      expect(r.x).toBeGreaterThanOrEqual(3 * PUNTOS_POR_MM);
      expect(r.x + r.w).toBeLessThanOrEqual((210 - 3) * PUNTOS_POR_MM);
    }
  });
  it("plóter: las marcas, en el mismo sitio en todas las hojas, aunque la última vaya medio vacía", () => {
    const llena = hojaQueApunta();
    dibujarTarjetasAcomodacion(llena.pdf, cuatro, { hoja: "a4", corte: "ploter" });
    const una = hojaQueApunta();
    dibujarTarjetasAcomodacion(una.pdf, cuatro.slice(0, 1), { hoja: "a4", corte: "ploter" });
    expect(una.negros).toEqual(llena.negros);
  });
});
