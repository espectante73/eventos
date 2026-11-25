import { describe, it, expect } from "vitest";
import {
  rejilla,
  tarjetasDeAcomodacion,
  dibujarTarjetasAcomodacion,
  dibujarMuestraAcabados,
  descargaTarjetasAcomodacion,
  vistaPreviaTarjetasAcomodacion,
  papelDe,
  HOJAS,
  ACABADOS,
  ANCHO_TARJETA,
  ALTO_CARA,
  OPCIONES_POR_DEFECTO,
  CORTES,
  FORMATOS,
} from "./tarjetasAcomodacion";
import { crc32 } from "./zip";
import { PdfEnLienzo, PUNTOS_POR_MM } from "./pdfEnLienzo";
import { C } from "../theme";

describe("rejilla (cuántas caben por hoja)", () => {
  // v98.9 (él): cada cara, del tamaño de la tarjeta bancaria; abierta, 10,8 cm.
  it("A4: 4; A3: 9", () => {
    expect(rejilla("a4")).toEqual({ columnas: 2, filas: 2, porHoja: 4 });
    expect(rejilla("a3")).toEqual({ columnas: 3, filas: 3, porHoja: 9 });
  });
  // v99.8 (él): «la opción de tarjeta para plegar o que sea solo tamaño de
  // una cara tarjeta bancaria».
  it("de una cara: A4, 10; A3, 21; para plegar, como siempre (y es lo de entrada)", () => {
    expect(FORMATOS.map((f) => [f.id, f.rotulo])).toEqual([["plegar", "Para plegar"], ["cara", "Una cara"]]);
    expect(OPCIONES_POR_DEFECTO.formato).toBe("plegar");
    expect(rejilla("a4", "cara")).toEqual({ columnas: 2, filas: 5, porHoja: 10 });
    expect(rejilla("a3", "cara")).toEqual({ columnas: 3, filas: 7, porHoja: 21 });
    expect(rejilla("a4", "plegar")).toEqual(rejilla("a4"));
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
  const imagenes = [];
  const posiciones = [];
  const trazos = [];
  const circulos = [];
  let grosor = 1;
  let tamano = 16;
  const lineas = [];
  let colorTexto = null;
  let fuente = "helvetica";
  const pdf = {
    setTextColor: (c) => (colorTexto = c),
    setFont: (f) => (fuente = f),
    // v99.6: los marcos, con esquinas rectas (rect con «S»); un relleno, con «F».
    rect: (x, y, w, h, estilo) => {
      (estilo === "S" ? recuadros : rellenos).push(estilo);
      if (estilo === "S") trazos.push({ x, y, grosor });
    },
    setLineWidth: (g) => (grosor = g),
    line: (x1, y1, x2, y2) => lineas.push({ x1, y1, x2, y2 }),
    setFontSize: (t) => (tamano = t),
    circle: (x, y, r) => circulos.push(r),
    roundedRect: (x, y, w, h, rx, ry, estilo) => recuadros.push(estilo),
    addImage: (dato, formato, x, y, w) => imagenes.push(dato) && posiciones.push({ dato, x, y, w }),
    paginas: 1,
    addPage() { this.paginas++; },
    getTextWidth: (t) => t.length * 5,
    text: (t, x, y, o) => textos.push({ t, x, y, angle: o?.angle || 0, color: colorTexto, fuente, charSpace: o?.charSpace || 0, tam: tamano }),
  };
  pdf.GState = class { constructor(o) { Object.assign(this, o); } };
  pdf.setGState = () => {};
  for (const f of ["setFillColor", "setDrawColor", "setLineDashPattern"]) pdf[f] = () => {};
  return { pdf, textos, rellenos, recuadros, imagenes, posiciones, trazos, circulos, lineas };
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
  it("el acabado: un marco por cara o dos, sin fondo de color; el nombre, dorado", () => {
    const ver = (acabado) => {
      const h = hojaDePega();
      dibujarTarjetasAcomodacion(h.pdf, [muchas[0]], { hoja: "a4", acabado });
      return { fondo: h.rellenos.length, marcos: h.recuadros.length, nombre: h.textos.find((x) => x.t === "Ana").color };
    };
    expect(ver("blancoHojas")).toEqual({ fondo: 0, marcos: 2, nombre: C.gold });
    expect(ver("blancoHojasGruesoFuera")).toEqual({ fondo: 0, marcos: 4, nombre: C.gold });
    expect(ver("blancoHojasGruesoDentro")).toEqual({ fondo: 0, marcos: 4, nombre: C.gold });
  });
  // v99.2 (él): «me quedo solo con estos 3 modelos que serán la nueva línea y los otros 6 los desechamos».
  it("solo los de la línea de la invitación (y el número grande, v99.7); uno de los de antes, guardado en un aparato, sale como el primero", () => {
    expect(ACABADOS.map((a) => a.id)).toEqual(["blancoHojas", "blancoHojasGruesoFuera", "blancoHojasGruesoDentro", "blancoHojasNumeroGrande"]);
    const textos = (acabado) => {
      const h = hojaDePega();
      dibujarTarjetasAcomodacion(h.pdf, [muchas[0]], { hoja: "a4", acabado });
      return { textos: h.textos, marcos: h.recuadros };
    };
    for (const antiguo of ["verde", "blancoDorado", "recuadroBlancoDorado", "blancoDoradoAura"]) expect(textos(antiguo)).toEqual(textos("blancoHojas"));
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

// v99.8 (él): la tarjeta de una cara, plana y sin doblez.
describe("de una cara", () => {
  const doce = Array.from({ length: 12 }, (_, i) => ({ id: String(i), nombre: "Ana", apellido: "Medina", mesa: 3, familia: "" }));
  it("una cara por tarjeta, sin girar; 12 en A4 son 2 hojas", () => {
    const h = hojaDePega();
    expect(dibujarTarjetasAcomodacion(h.pdf, doce, { hoja: "a4", formato: "cara" })).toBe(2);
    const apellidos = h.textos.filter((x) => x.t === "MEDINA");
    expect(apellidos).toHaveLength(12);
    expect(apellidos.every((x) => x.angle === 0)).toBe(true);
  });
  it("sin la raya discontinua del doblez; las de corte, sí", () => {
    const { pdf, lineas } = hojaQueApunta();
    dibujarTarjetasAcomodacion(pdf, doce.slice(0, 1), { hoja: "a4", formato: "cara" });
    expect(lineas.filter((l) => l.color === C.negro && l.discontinua)).toHaveLength(0);
    expect(lineas.filter((l) => l.color === C.negro && !l.discontinua)).toHaveLength(8);
  });
  it("la hoja de muestra: una tarjeta por acabado, cada una con su número", () => {
    const { pdf, textos, recuadros } = hojaDePega();
    expect(dibujarMuestraAcabados(pdf, { hoja: "a4", formato: "cara" })).toBe(1);
    expect(textos.filter((x) => x.t === "ABREU" && x.angle === 0)).toHaveLength(4);
    expect(["1", "2", "3", "4"].map((n) => textos.filter((x) => x.t === n).length)).toEqual([1, 1, 1, 1]);
    expect(recuadros).toHaveLength(6);
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

// v99.1 (él): «una hoja modelo… que me aparezcan los 6 modelos… y poder verlo en vivo».
describe("la hoja de muestra de los acabados", () => {
  it("cada cara con un acabado y su número en la esquina; los cuatro, en una hoja, A4 o A3", () => {
    for (const hoja of ["a4", "a3"]) {
      const { pdf, textos, recuadros } = hojaDePega();
      expect(dibujarMuestraAcabados(pdf, { hoja })).toBe(1);
      expect(pdf.paginas).toBe(1);
      // 2 tarjetas: 4 caras, una con cada acabado.
      expect(textos.filter((x) => x.t === "ABREU")).toHaveLength(4);
      expect(["1", "2", "3", "4"].map((n) => textos.filter((x) => x.t === n).length)).toEqual([1, 1, 1, 1]);
      // En orden: arriba (girada) el 1 y abajo el 2; luego el 3 y el 4. Marcos: 1 + 2 + 2 + 1.
      expect(recuadros).toHaveLength(6);
      expect(textos.filter((x) => x.t.startsWith("Muestra de los 4 acabados"))).toHaveLength(1);
    }
  });
  it("arriba, la leyenda: el nombre de cada acabado con su número", () => {
    const { pdf, textos } = hojaDePega();
    dibujarMuestraAcabados(pdf, { hoja: "a3" });
    const leyenda = textos.map((x) => x.t).join(" ");
    ACABADOS.forEach((a, i) => expect(leyenda).toContain(`${i + 1} ${a.rotulo}`));
  });
  it("con las marcas de la forma de cortar elegida", () => {
    const guillotina = hojaQueApunta();
    dibujarMuestraAcabados(guillotina.pdf, { hoja: "a3", corte: "guillotina" });
    // 2 tarjetas en una fila: 3 cortes de arriba abajo y 2 de lado a lado, con sus dos marcas.
    expect(guillotina.lineas.filter((l) => l.color === C.negro && !l.discontinua)).toHaveLength(10);
    const ploter = hojaQueApunta();
    dibujarMuestraAcabados(ploter.pdf, { hoja: "a3", corte: "ploter" });
    expect(ploter.negros).toHaveLength(7);
  });
});

// v99.2 (él): «con esta parte de la invitación, poner su motivo o estilo en la
// tarjeta en modo claro»; eligió el boceto 3 y, con el doble marco del 2, las dos maneras.
describe("los acabados de la invitación", () => {
  const ADORNOS = {
    esquina: { dato: "esquina", proporcion: 0.7 },
    esquinaGirada: { dato: "esquinaGirada", proporcion: 0.7 },
    corazon: { dato: "corazon", proporcion: 0.12 },
    corazonGirada: { dato: "corazonGirada", proporcion: 0.12 },
  };
  const ana = { id: "1", nombre: "Ana", apellido: "Medina", mesa: 3, familia: "A" };

  it("tres: uno de marco fino y dos de doble marco, grueso fuera y grueso dentro; la letra de la familia, en verde oscuro", () => {
    // v99.6 (él): «el grueso más grueso, el doble; el aire, el doble» (eran 1,5 y 3).
    expect(ACABADOS.map((a) => a.marcos)).toEqual([[[9, 0.5]], [[8, 3], [14, 0.4]], [[8, 0.4], [14, 3]], [[9, 0.5]]]);
    for (const a of ACABADOS) expect(a.familia).toBe(C.ink);
  });
  // v99.6 (él): «recuadro menos redondeado» (eligió la esquina recta), «el
  // adorno más adentro, que apenas toque el marco grueso» y el círculo de 40.
  it("esquinas rectas; el adorno, con sus puntas en la línea gruesa (o la única); el círculo del número, de 40", () => {
    for (const a of ACABADOS) {
      const h = hojaDePega();
      dibujarTarjetasAcomodacion(h.pdf, [ana], { hoja: "a4", acabado: a.id }, ADORNOS);
      // Ningún marco redondeado: todos son rect con «S».
      expect(h.trazos).toHaveLength(2 * a.marcos.length);
      const gruesa = Math.max(...a.marcos.map(([, g]) => g));
      const adorno = h.posiciones.find((p) => p.dato === "esquina");
      expect(h.trazos.some((t) => t.grosor === gruesa && t.x === adorno.x && t.y === adorno.y), a.id).toBe(true);
      // Radio 20 menos medio borde (el borde dorado, de 3, cae dentro de los
      // 40); el de número grande, sin círculo.
      expect(h.circulos).toEqual(a.numero === "grande" ? [] : [18.5, 18.5]);
    }
  });
  // v99.7 (él): el plan B2, como cuarta opción.
  it("número grande: sin círculo, «MESA» y el número tras una línea dorada; un número ancho encoge", () => {
    const h = hojaDePega();
    dibujarTarjetasAcomodacion(h.pdf, [ana], { hoja: "a4", acabado: "blancoHojasNumeroGrande" }, ADORNOS);
    expect(h.circulos).toEqual([]);
    // Una línea dorada por cara, de arriba abajo (las demás son marcas de corte).
    expect(h.lineas.filter((l) => l.x1 === l.x2 && Math.abs(l.y2 - l.y1) === 93)).toHaveLength(2);
    expect(h.textos.filter((x) => x.t === "MESA").map((x) => [x.angle, x.fuente, x.charSpace])).toEqual([
      [180, "fraunces", 2.5],
      [0, "fraunces", 2.5],
    ]);
    const derecha = (t) => h.textos.find((x) => x.t === t && x.angle === 0);
    // El número, debajo de «MESA» y a la derecha del nombre.
    expect(derecha("3").y).toBeGreaterThan(derecha("MESA").y);
    expect(derecha("3").x).toBeGreaterThan(derecha("MEDINA").x);
    expect(derecha("3").tam).toBe(44);
    const ancha = hojaDePega();
    // Aquí el ancho sí depende del tamaño de la letra.
    let tam = 16;
    const ponerTamano = ancha.pdf.setFontSize;
    ancha.pdf.setFontSize = (t) => ((tam = t), ponerTamano(t));
    ancha.pdf.getTextWidth = (t) => t.length * tam * 0.55;
    dibujarTarjetasAcomodacion(ancha.pdf, [{ ...ana, mesa: 12345 }], { hoja: "a4", acabado: "blancoHojasNumeroGrande" }, ADORNOS);
    expect(ancha.textos.find((x) => x.t === "12345" && x.angle === 0).tam).toBeLessThan(44);
  });
  it("cada cara: el adorno y el corazón (girados en la de arriba), el APELLIDO en Fraunces con aire entre letras y el nombre en la caligráfica dorada", () => {
    const { pdf, textos, imagenes, recuadros, rellenos } = hojaDePega();
    dibujarTarjetasAcomodacion(pdf, [ana], { hoja: "a4", acabado: "blancoHojasGruesoFuera" }, ADORNOS);
    expect(imagenes).toEqual(["esquinaGirada", "corazonGirada", "esquina", "corazon"]);
    // v99.4 (él): el marco, entero, pasa por debajo del adorno: nada lo tapa.
    expect(rellenos).toEqual([]);
    expect(textos.filter((x) => x.t === "MEDINA").map((x) => [x.angle, x.fuente, x.charSpace])).toEqual([
      [180, "fraunces", 1.5],
      [0, "fraunces", 1.5],
    ]);
    expect(textos.filter((x) => x.t === "Ana").map((x) => [x.fuente, x.color])).toEqual([
      ["alexbrush", C.gold],
      ["alexbrush", C.gold],
    ]);
    // Dos marcos por cara.
    expect(recuadros).toEqual(["S", "S", "S", "S"]);
    // En la cara derecha, el nombre debajo del apellido; la letra de la familia, en su esquina.
    const derecha = (t) => textos.find((x) => x.t === t && x.angle === 0);
    expect(derecha("Ana").y).toBeGreaterThan(derecha("MEDINA").y);
    expect(derecha("A").fuente).toBe("fraunces");
  });
  it("si el adorno y las letras no se cargaron, sale como uno blanco de marco dorado, con la letra de siempre", () => {
    const { pdf, textos, imagenes, rellenos } = hojaDePega();
    dibujarTarjetasAcomodacion(pdf, [ana], { hoja: "a4", acabado: "blancoHojas" });
    expect(imagenes).toHaveLength(0);
    expect(rellenos).toHaveLength(0);
    expect(textos.find((x) => x.t === "MEDINA").fuente).toBe("helvetica");
  });
});

// v101.7 (él): «al rotulista no le vale el formato actual… cada una es un
// archivo independiente… sin cambiar las medidas»; y la salida en PNG.
describe("«Suelta», para el rotulista: cada tarjeta, su archivo", () => {
  const MMp = PUNTOS_POR_MM;
  const tres = [
    { id: "1", nombre: "Luis", apellido: "Abreu", mesa: 1, familia: "A" },
    { id: "2", nombre: "José María", apellido: "de la Cruz", mesa: 1, familia: "" },
    { id: "3", nombre: "Ana", apellido: "Muñoz", mesa: 12, familia: "" },
  ];
  const latin1 = async (blob) => new TextDecoder("latin1").decode(new Uint8Array(await blob.arrayBuffer()));
  // Un lienzo de pega que da un PNG mínimo (firma, cabecera y fin).
  const bloque = (tipo, datos = []) => {
    const b = new Uint8Array(12 + datos.length);
    const v = new DataView(b.buffer);
    v.setUint32(0, datos.length);
    b.set([...tipo].map((c) => c.charCodeAt(0)), 4);
    b.set(datos, 8);
    v.setUint32(8 + datos.length, crc32(b.subarray(4, 8 + datos.length)));
    return [...b];
  };
  const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...bloque("IHDR", new Array(13).fill(1)), ...bloque("IEND")]);
  const ctx = new Proxy({ measureText: (t) => ({ width: 5 * t.length }) }, { get: (o, k) => (k in o ? o[k] : () => {}) });
  const medidas = [];
  const crearLienzo = (ancho, alto) => (medidas.push([ancho, alto]), { getContext: () => ctx, toBlob: (r) => r(new Blob([PNG])), toDataURL: () => "data:image/jpeg;base64,A" });

  it("una por página, de la medida de siempre: plegada, 8,56 × 10,8 cm; de una cara, 8,56 × 5,4", () => {
    expect(HOJAS.suelta.rotulo).toBe("Suelta");
    expect(rejilla("suelta")).toEqual({ columnas: 1, filas: 1, porHoja: 1 });
    expect(papelDe("suelta", "plegar")).toEqual({ ancho: 85.6, alto: 107.96 });
    expect(papelDe("suelta", "cara")).toEqual({ ancho: 85.6, alto: 53.98 });
    expect(papelDe("a4")).toBe(HOJAS.a4);
  });

  it("sin marcas de corte (el borde es el corte): solo el doblez de dentro, el de siempre", () => {
    const { pdf, lineas } = hojaDePega();
    expect(dibujarTarjetasAcomodacion(pdf, tres, { hoja: "suelta", corte: "ploter" })).toBe(3);
    expect(pdf.paginas).toBe(3);
    expect(lineas).toEqual(Array(3).fill({ x1: 0, y1: ALTO_CARA * MMp, x2: ANCHO_TARJETA * MMp, y2: ALTO_CARA * MMp }));
    const cara = hojaDePega();
    dibujarTarjetasAcomodacion(cara.pdf, tres, { hoja: "suelta", formato: "cara" });
    expect(cara.lineas).toEqual([]);
  });

  it("en PDF: un .zip con un archivo por tarjeta, en el orden de las mesas, cada uno de la medida de la tarjeta", async () => {
    const r = await descargaTarjetasAcomodacion(tres, { hoja: "suelta", formato: "plegar" }, null, { salida: "pdf" });
    expect([r.nombre, r.archivos]).toEqual(["tarjetas-de-acomodacion-sueltas-pdf.zip", 3]);
    const texto = await latin1(r.blob);
    for (const n of ["001-mesa-01-ABREU-Luis.pdf", "002-mesa-01-DE-LA-CRUZ-Jose-Maria.pdf", "003-mesa-12-MUNOZ-Ana.pdf"]) expect(texto).toContain(n);
    expect(texto.match(/\/MediaBox \[0 0 242\.6\d* 306\.0\d*\]/g)).toHaveLength(3);
    // De una cara, apaisada: 8,56 de ancho y 5,4 de alto.
    const cara = await latin1((await descargaTarjetasAcomodacion(tres.slice(0, 1), { hoja: "suelta", formato: "cara" }, null, { salida: "pdf" })).blob);
    expect(cara).toMatch(/\/MediaBox \[0 0 242\.6\d* 153\.0\d*\]/);
  });

  it("con A4 o A3, en PDF, un solo archivo, como siempre", async () => {
    const r = await descargaTarjetasAcomodacion(tres, { hoja: "a3" }, null, { salida: "pdf" });
    expect([r.nombre, r.archivos]).toEqual(["tarjetas-de-acomodacion.pdf", 1]);
  });

  it("en PNG: suelta, uno por tarjeta, a 300 ppp; con A3, uno por hoja; el botón cuenta", async () => {
    medidas.length = 0;
    const pasos = [];
    const r = await descargaTarjetasAcomodacion(tres, { hoja: "suelta" }, null, { salida: "png", crearLienzo, alAvanzar: (h, t) => pasos.push(`${h}/${t}`) });
    expect([r.nombre, r.archivos]).toEqual(["tarjetas-de-acomodacion-sueltas-png.zip", 3]);
    expect(await latin1(r.blob)).toContain("003-mesa-12-MUNOZ-Ana.png");
    expect(medidas).toEqual(Array(3).fill([1011, 1275]));
    expect(pasos).toEqual(["1/3", "2/3", "3/3"]);
    const a3 = await descargaTarjetasAcomodacion(tres, { hoja: "a3" }, null, { salida: "png", crearLienzo });
    expect([a3.nombre, a3.archivos]).toEqual(["tarjetas-de-acomodacion-png.zip", 1]);
    expect(await latin1(a3.blob)).toContain("hoja-01.png");
  });

  it("la vista previa, una imagen por tarjeta, de su medida", () => {
    medidas.length = 0;
    expect(vistaPreviaTarjetasAcomodacion(tres, { hoja: "suelta", formato: "cara" }, null, { escala: 1, crearLienzo })).toHaveLength(3);
    expect(medidas).toEqual(Array(3).fill([243, 153]));
  });

  it("la hoja de muestra, para imprimirla en casa: con «Suelta», en A4 y con su leyenda", () => {
    const suelta = hojaDePega();
    const a4 = hojaDePega();
    dibujarMuestraAcabados(suelta.pdf, { hoja: "suelta" });
    dibujarMuestraAcabados(a4.pdf, { hoja: "a4" });
    expect(suelta.textos).toEqual(a4.textos);
    expect(suelta.textos.some((x) => x.t.startsWith("Muestra de los"))).toBe(true);
  });
});
