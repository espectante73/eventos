// Las tarjetas QR, con jsPDF simulado y el QR de verdad: se comprueba QUÉ
// se escribe y se descarga, no cómo se ve (para eso, su captura: norma 10).
import { describe, it, expect, vi } from "vitest";

const descargas = [];
const hojas = [];

vi.mock("jspdf", () => ({
  jsPDF: class {
    constructor(opciones) {
      this.opciones = opciones;
      this.lineas = [];
      this.textos = [];
      this.cuadrados = 0;
      this.marcos = 0;
      this.giradas = 0;
      this.circulos = 0;
      this.paginas = 1;
      this.imagenes = [];
      this.fuentes = [];
      this.letras = [];
      hojas.push(this);
    }
    setFont(f) {
      this.fuentes.push(f);
    }
    addImage(dato) {
      this.imagenes.push(dato);
    }
    addFileToVFS() {}
    addFont(archivo, familia) {
      this.letras.push(familia);
    }
    setFontSize() {}
    setTextColor() {}
    setFillColor() {}
    setLineWidth() {}
    setDrawColor() {}
    setLineDashPattern() {}
    line(...l) {
      this.lineas.push(l);
    }
    rect() {
      this.cuadrados += 1;
    }
    roundedRect() {
      this.marcos += 1;
    }
    circle() {
      this.circulos += 1;
    }
    addPage() {
      this.paginas += 1;
    }
    splitTextToSize(t) {
      return [t];
    }
    getTextWidth(t) {
      return t.length * 5;
    }
    text(t, x, y, opciones = {}) {
      this.textos.push(t);
      if (opciones.angle === 180) this.giradas += 1;
    }
    output(tipo) {
      return tipo === "arraybuffer" ? new Uint8Array([37, 80, 68, 70]).buffer : "blob";
    }
  },
}));
vi.mock("./descargas", () => ({ descargarBlob: (nombre) => descargas.push(nombre) }));

const {
  descargarTarjetasQr,
  vistaPreviaTarjetasQr,
  crearQr,
  tarjetasDeMesas,
  nombreEntreComillas,
  queFotosTarjeta,
  TITULO_TARJETA,
  EDAD_TARJETA,
  ENTRAR_TARJETA,
  SI_NO_SE_ABRE_TARJETA,
  VER_CODIGO_TARJETA,
  VER_TEXTO_TARJETA,
  ARCHIVO_TARJETAS_QR,
  HOJAS_QR,
} = await import("./pdfTarjetasQr");
const { default: qrcode } = await import("qrcode-generator");

const ENLACE = "https://nexuspoint.rsvp?tablon=0f8fad5b-d9cb-469f-a165-70867728950e";
const enlaceDe = (numero, codigo) => `${ENLACE}&mesa=${numero}&qr=${codigo}`;
const tarjetas = (...numeros) => numeros.map((numero) => ({ numero, enlace: enlaceDe(numero, "a1b2c3d4e5f6") }));
const EVENTO = "Las Bodas de todos.";

describe("las tarjetas QR (v67.7; v92.9: una por mesa, texto en una cara y QR en la otra)", () => {
  it("un folio con 2 tarjetas: cada una con su número en las dos caras; el texto, girado, arriba; el QR, abajo", async () => {
    await descargarTarjetasQr({ nombreEvento: EVENTO, tarjetas: tarjetas(5, 12) });
    const hoja = hojas.at(-1);
    const cuenta = (t) => hoja.textos.filter((x) => x === t).length;
    expect(hoja.paginas).toBe(1);
    // El número, en las dos caras de su tarjeta, cada una en su círculo
    // (v99.4: el de los sobres, sin el aro de dentro).
    expect(cuenta("5")).toBe(2);
    expect(cuenta("12")).toBe(2);
    expect(hoja.circulos).toBe(4);
    // Sin el adorno y las letras (no se pasan): sin imágenes, la de siempre.
    expect(hoja.imagenes).toEqual([]);
    expect(hoja.fuentes).not.toContain("fraunces");
    // La cara del texto: una por tarjeta.
    const texto = [...TITULO_TARJETA, ...queFotosTarjeta(EVENTO).flat(), "1.", "2.", ...EDAD_TARJETA, VER_CODIGO_TARJETA];
    for (const linea of texto) expect(cuenta(linea)).toBe(2);
    // La cara del QR: una por tarjeta.
    for (const linea of [ENTRAR_TARJETA, ...SI_NO_SE_ABRE_TARJETA, VER_TEXTO_TARJETA]) expect(cuenta(linea)).toBe(2);
    // El nombre al pie de las 4 caras.
    expect(cuenta(EVENTO)).toBe(4);
    // Girada, la cara del texto entera: número, título (2), lista (2 números
    // y 6 líneas), edad (2), «al otro lado» y el pie.
    expect(hoja.giradas).toBe(2 * (1 + 2 + 8 + 2 + 1 + 1));
    expect(hoja.marcos).toBe(4);
    expect(hoja.cuadrados).toBeGreaterThan(2 * 50);
    expect(descargas.at(-1)).toBe(ARCHIVO_TARJETAS_QR);
  });

  it("con un número impar de mesas, la última hoja lleva una sola", async () => {
    await descargarTarjetasQr({ nombreEvento: EVENTO, tarjetas: tarjetas(1, 2, 3) });
    const hoja = hojas.at(-1);
    expect(hoja.paginas).toBe(2);
    expect(hoja.marcos).toBe(6);
    for (const n of ["1", "2", "3"]) expect(hoja.textos.filter((x) => x === n)).toHaveLength(2);
  });

  it("una tarjeta por mesa, ordenadas y sin repetir, cada una con el enlace de SU mesa (v93)", () => {
    const codigos = [
      { numero: 12, codigo: "cccccccccccc" },
      { numero: 3, codigo: "aaaaaaaaaaaa" },
      { numero: 3, codigo: "bbbbbbbbbbbb" },
      { numero: null, codigo: "dddddddddddd" },
      { numero: 0, codigo: "eeeeeeeeeeee" },
      { numero: 7, codigo: "" },
    ];
    expect(tarjetasDeMesas(codigos, enlaceDe)).toEqual([
      { numero: 3, enlace: enlaceDe(3, "aaaaaaaaaaaa") },
      { numero: 12, enlace: enlaceDe(12, "cccccccccccc") },
    ]);
    expect(tarjetasDeMesas(undefined, enlaceDe)).toEqual([]);
    // Sin enlace (falta la dirección pública), ninguna.
    expect(tarjetasDeMesas(codigos, () => "")).toEqual([]);
  });

  it("el nombre del evento, entre comillas y sin su punto (él: es su nombre propio)", () => {
    expect(nombreEntreComillas("Las Bodas de todos.")).toBe("«Las Bodas de todos»");
    expect(queFotosTarjeta("Las Bodas de todos.")[1].at(-1)).toBe("«Las Bodas de todos».");
    // Ya no se entra con el nombre: la tarjeta no lo pide.
    expect([ENTRAR_TARJETA, ...SI_NO_SE_ABRE_TARJETA].join(" ")).not.toMatch(/apellido/i);
  });

  it("el QR lleva sus tres esquinas de lectura, de 7 x 7", () => {
    const qr = crearQr(qrcode, ENLACE);
    const n = qr.getModuleCount();
    expect(n).toBeGreaterThanOrEqual(21);
    // Esquina de arriba a la izquierda: borde oscuro, anillo claro, centro oscuro.
    for (const [f, c] of [
      [0, 0],
      [0, n - 7],
      [n - 7, 0],
    ]) {
      expect(qr.isDark(f, c)).toBe(true);
      expect(qr.isDark(f + 1, c + 1)).toBe(false);
      expect(qr.isDark(f + 3, c + 3)).toBe(true);
    }
  });

  // v99.3 (él): «primero ver, después descargar». Del mismo dibujo, en un
  // lienzo de pega que apunta lo que se escribe.
  it("la vista previa: un folio por cada 2 mesas, del mismo dibujo que el PDF", async () => {
    const escritos = [];
    const ctx = new Proxy(
      { fillText: (t) => escritos.push(t), measureText: (t) => ({ width: 5 * t.length }) },
      { get: (o, k) => (k in o ? o[k] : () => {}) },
    );
    const crearLienzo = () => ({ getContext: () => ctx, toDataURL: () => "data:image/jpeg;base64,A" });
    const imagenes = await vistaPreviaTarjetasQr({ nombreEvento: EVENTO, tarjetas: tarjetas(1, 2, 3) }, null, { crearLienzo });
    expect(imagenes).toHaveLength(2);
    expect(escritos.filter((t) => t === TITULO_TARJETA[0])).toHaveLength(3);
    expect(escritos.filter((t) => t === ENTRAR_TARJETA)).toHaveLength(3);
    for (const n of ["1", "2", "3"]) expect(escritos.filter((t) => t === n)).toHaveLength(2);
  });

  // v99.4 (él): el número como en los sobres, con la letra de «LAS BODAS», y
  // el adorno de las tarjetas de acomodación en cada cara (girado arriba).
  it("con el adorno y las letras: el adorno en cada cara, girado en la de arriba, y el número en Fraunces dentro del PDF", async () => {
    const ADORNOS = {
      esquina: { dato: "esquina", proporcion: 0.7 },
      esquinaGirada: { dato: "esquinaGirada", proporcion: 0.7 },
      corazon: { dato: "corazon", proporcion: 0.12 },
      corazonGirada: { dato: "corazonGirada", proporcion: 0.12 },
      fuentes: { fraunces: "AAA", alexbrush: "BBB" },
    };
    await descargarTarjetasQr({ nombreEvento: EVENTO, tarjetas: tarjetas(5) }, ADORNOS);
    const hoja = hojas.at(-1);
    expect(hoja.imagenes).toEqual(["esquinaGirada", "esquina"]);
    expect(hoja.letras).toEqual(["fraunces", "alexbrush"]);
    expect(hoja.fuentes).toContain("fraunces");
  });

  // v101.7 (él): «cada una de las 14 tarjetas QR es un archivo
  // independiente», sin cambiar las medidas.
  it("«Suelta»: un PDF por mesa, de la medida de siempre (10,5 × 29,7 cm), sin la línea de corte y con el doblez; todos en un .zip", async () => {
    expect(HOJAS_QR.map((h) => h.rotulo)).toEqual(["A4", "Suelta"]);
    const antes = hojas.length;
    const r = await descargarTarjetasQr({ nombreEvento: EVENTO, tarjetas: tarjetas(1, 2, 12) }, null, { hoja: "suelta", salida: "pdf" });
    expect(r).toEqual({ nombre: "tarjetas-qr-sueltas-pdf.zip", archivos: 3 });
    expect(descargas.at(-1)).toBe("tarjetas-qr-sueltas-pdf.zip");
    const nuevas = hojas.slice(antes);
    expect(nuevas).toHaveLength(3);
    for (const h of nuevas) {
      expect(h.opciones.format).toEqual([595.28 / 2, 841.89]);
      expect(h.paginas).toBe(1);
      // Solo el doblez, a lo ancho y a media altura.
      expect(h.lineas).toEqual([[0, 841.89 / 2, 595.28 / 2, 841.89 / 2]]);
    }
  });

  it("con A4 en PDF, un solo archivo, como siempre (y la línea de corte a lo alto)", async () => {
    const r = await descargarTarjetasQr({ nombreEvento: EVENTO, tarjetas: tarjetas(1, 2) }, null, { hoja: "a4", salida: "pdf" });
    expect(r).toEqual({ nombre: ARCHIVO_TARJETAS_QR, archivos: 1 });
    const h = hojas.at(-1);
    expect(h.opciones.format).toBe("a4");
    expect(h.lineas[0]).toEqual([595.28 / 2, 0, 595.28 / 2, 841.89]);
  });

  it("la vista previa, suelta: una imagen por mesa, de la medida de la tarjeta", async () => {
    const medidas = [];
    const ctx = new Proxy({ measureText: (t) => ({ width: 5 * t.length }) }, { get: (o, k) => (k in o ? o[k] : () => {}) });
    const crearLienzo = (ancho, alto) => (medidas.push([ancho, alto]), { getContext: () => ctx, toDataURL: () => "data:image/jpeg;base64,A" });
    expect(await vistaPreviaTarjetasQr({ nombreEvento: EVENTO, tarjetas: tarjetas(1, 2, 3) }, null, { hoja: "suelta", escala: 1, crearLienzo })).toHaveLength(3);
    expect(medidas).toEqual(Array(3).fill([298, 842]));
  });
});
