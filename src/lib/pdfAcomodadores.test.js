// Los dos PDF de acomodadores, con jsPDF simulado: se comprueba QUÉ se
// escribe y se descarga, no cómo se ve (para eso, su captura: norma 10).
import { describe, it, expect, vi, beforeEach } from "vitest";

const descargas = [];
const hojas = [];

vi.mock("jspdf", () => ({
  jsPDF: class {
    constructor() {
      this.textos = [];
      this.rayas = [];
      this.colorRaya = null;
      hojas.push(this);
    }
    setFont() {}
    setFontSize() {}
    setTextColor() {}
    setFillColor() {}
    setLineWidth() {}
    setDrawColor(c) { this.colorRaya = c; }
    line(...p) { this.rayas.push([this.colorRaya, ...p]); }
    rect() {}
    addImage() {}
    addPage() {}
    getTextWidth(t) { return t.length * 5; }
    text(t) { this.textos.push(t); }
    output() { return "blob"; }
  },
}));
vi.mock("./iconosPdf", () => ({ iconosAcomodadores: async () => ({ mesa: "m", persona: "p" }) }));
vi.mock("./descargas", () => ({ descargarBlob: (nombre) => descargas.push(nombre) }));

const { descargarListasAcomodadores, TITULOS } = await import("./pdfAcomodadores");
const { C } = await import("../theme");

const inv = (id, nombre, apellido, mesa) => ({ id, nombre, apellido, grupoFamiliar: apellido, mesa, confirmado: true });

beforeEach(() => {
  descargas.length = 0;
  hojas.length = 0;
});

describe("descargarListasAcomodadores", () => {
  it("descarga los dos, por mesa y por familia, sin preguntar", async () => {
    const n = await descargarListasAcomodadores({ invitados: [inv("1", "Ana", "Ruiz", 3), inv("2", "Luis", "Ruiz", 3)] });
    expect(n).toBe(1);
    expect(descargas).toEqual(["acomodadores-por-mesa.pdf", "acomodadores-por-familia.pdf"]);
    expect(hojas[0].textos).toEqual([TITULOS.mesa, "3", "2", "Ruiz: Ana y Luis"]);
    expect(hojas[1].textos).toEqual([TITULOS.familia, "3", "2", "Ruiz: Ana y Luis"]);
  });

  it("sin mesa: ninguna palabra, la mesa tachada en rojo", async () => {
    await descargarListasAcomodadores({ invitados: [inv("1", "Sara", "Sosa", null)] });
    expect(hojas[0].textos).toEqual([TITULOS.mesa, "1", "Sosa: Sara"]);
    expect(hojas[0].rayas.some(([color]) => color === C.peligro)).toBe(true);
  });

  it("si no cabe, se recorta con «…» en su línea", async () => {
    const largos = ["Francisco Javier", "María del Carmen", "Alejandro", "Lucía", "Guillermo", "Inmaculada"];
    await descargarListasAcomodadores({ invitados: largos.map((n, i) => inv(String(i), n, "Hernández-Rodríguez", 4)) });
    const linea = hojas[0].textos.at(-1);
    expect(linea.endsWith("…")).toBe(true);
  });

  it("sin familias confirmadas, no descarga nada", async () => {
    expect(await descargarListasAcomodadores({ invitados: [] })).toBe(0);
    expect(descargas).toEqual([]);
  });
});
