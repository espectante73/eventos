// Los dos PDF de acomodadores, con jsPDF simulado: se comprueba QUÉ se
// escribe y se descarga, no cómo se ve (para eso, su captura: norma 10).
import { describe, it, expect, vi, beforeEach } from "vitest";

const descargas = [];
const hojas = [];

vi.mock("jspdf", () => ({
  jsPDF: class {
    constructor() {
      this.textos = [];
      this.colores = [];
      this.imagenes = 0;
      this.colorTexto = null;
      hojas.push(this);
    }
    setFont() {}
    setFontSize() {}
    setTextColor(c) { this.colorTexto = c; }
    setFillColor() {}
    setLineWidth() {}
    setDrawColor() {}
    line() {}
    rect() {}
    addImage() { this.imagenes += 1; }
    addPage() {}
    getTextWidth(t) { return t.length * 5; }
    text(t) { this.textos.push(t); this.colores.push(this.colorTexto); }
    output() { return "blob"; }
  },
}));
vi.mock("./iconosPdf", () => ({ iconosAcomodadores: async () => ({ mesa: "m", persona: "p" }) }));
vi.mock("./descargas", () => ({ descargarBlob: (nombre) => descargas.push(nombre) }));

const { descargarListasAcomodadores: descargar, TITULOS, SIN_MESA } = await import("./pdfAcomodadores");
// Sin el respiro entre descargas: aquí no hay navegador que lo necesite.
const descargarListasAcomodadores = (datos) => descargar({ ...datos, pausa: 0 });
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

  it("sin mesa: «NO» en rojo en lugar del icono de la mesa", async () => {
    await descargarListasAcomodadores({ invitados: [inv("1", "Sara", "Sosa", null)] });
    const hoja = hojas[0];
    expect(hoja.textos).toEqual([TITULOS.mesa, SIN_MESA, "1", "Sosa: Sara"]);
    expect(hoja.colores[1]).toBe(C.peligro);
    expect(hoja.colores[2]).toBe(C.ink);
    expect(hoja.imagenes).toBe(1); // solo el de persona
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
