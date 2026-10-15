// Las tarjetas QR, con jsPDF simulado y el QR de verdad: se comprueba QUÉ
// se escribe y se descarga, no cómo se ve (para eso, su captura: norma 10).
import { describe, it, expect, vi } from "vitest";

const descargas = [];
const hojas = [];

vi.mock("jspdf", () => ({
  jsPDF: class {
    constructor() {
      this.textos = [];
      this.cuadrados = 0;
      this.marcos = 0;
      this.giradas = 0;
      hojas.push(this);
    }
    setFont() {}
    setFontSize() {}
    setTextColor() {}
    setFillColor() {}
    setLineWidth() {}
    setDrawColor() {}
    setLineDashPattern() {}
    line() {}
    rect() {
      this.cuadrados += 1;
    }
    roundedRect() {
      this.marcos += 1;
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
    output() {
      return "blob";
    }
  },
}));
vi.mock("./descargas", () => ({ descargarBlob: (nombre) => descargas.push(nombre) }));

const { descargarTarjetasQr, crearQr, TITULO_TARJETA, ENTRAR_TARJETA, ARCHIVO_TARJETAS_QR } = await import("./pdfTarjetasQr");
const { FRASE_HORIZONTAL } = await import("./fotosFiesta");
const { default: qrcode } = await import("qrcode-generator");

const ENLACE = "https://nexuspoint.rsvp?tablon=0f8fad5b-d9cb-469f-a165-70867728950e";

describe("las tarjetas QR (v67.7)", () => {
  it("un folio con 2 tarjetas de pie: 4 caras iguales, las de arriba giradas para leerse dobladas", async () => {
    await descargarTarjetasQr({ enlace: ENLACE, nombreEvento: "Las Bodas de todos." });
    const hoja = hojas.at(-1);
    const cuenta = (t) => hoja.textos.filter((x) => x === t).length;
    for (const linea of [...TITULO_TARJETA, ...ENTRAR_TARJETA, FRASE_HORIZONTAL, "Las Bodas de todos."]) expect(cuenta(linea)).toBe(4);
    // Media hoja, del revés: título (2), entrar (2), frase y evento, por 2 caras.
    expect(hoja.giradas).toBe(2 * 6);
    expect(hoja.marcos).toBe(4);
    expect(hoja.cuadrados).toBeGreaterThan(4 * 50);
    expect(descargas).toEqual([ARCHIVO_TARJETAS_QR]);
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
});
