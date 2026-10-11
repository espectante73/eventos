// El PDF de acomodadores, con jsPDF simulado: se comprueba QUÉ se
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

const { descargarListaAcomodadores, TITULO, TITULO_EQUIPO, SIN_MESA } = await import("./pdfAcomodadores");
const { C } = await import("../theme");

const inv = (id, nombre, apellido, mesa) => ({ id, nombre, apellido, grupoFamiliar: apellido, mesa, confirmado: true });

beforeEach(() => {
  descargas.length = 0;
  hojas.length = 0;
});

describe("descargarListaAcomodadores (v63.4: uno solo, por familia)", () => {
  it("descarga uno, por familia, sin preguntar", async () => {
    const n = await descargarListaAcomodadores({ invitados: [inv("1", "Ana", "Ruiz", 3), inv("2", "Luis", "Ruiz", 3)] });
    expect(n).toBe(1);
    expect(descargas).toEqual(["acomodadores.pdf"]);
    expect(hojas).toHaveLength(1);
    expect(hojas[0].textos).toEqual([TITULO, "Familia", "Ruiz: Ana y Luis", "3", "2"]);
  });

  it("el equipo, al final y con su título", async () => {
    const invitados = [inv("1", "Ana", "Ruiz", 3), { ...inv("2", "Eva", "Abreu", 4), rolesTrabajo: ["acomodador"] }, inv("3", "Iván", "Toledo", 5)];
    const n = await descargarListaAcomodadores({ invitados, colaboradores: [{ id: "c", invitadoId: "3" }] });
    expect(n).toBe(3);
    const t = hojas[0].textos;
    expect(t.indexOf("Ruiz: Ana")).toBeLessThan(t.indexOf(TITULO_EQUIPO));
    expect(t.slice(t.indexOf(TITULO_EQUIPO))).toEqual([TITULO_EQUIPO, "Abreu: Eva", "4", "1", "Toledo: Iván", "5", "1"]);
  });

  it("los iconos, solo en la cabecera: en las filas, solo números", async () => {
    await descargarListaAcomodadores({ invitados: [inv("1", "Ana", "Ruiz", 3), inv("2", "Eva", "Sosa", 4), inv("3", "Iván", "Toledo", 5)] });
    expect(hojas[0].imagenes).toBe(2);
  });

  it("sin mesa: «NO» en rojo", async () => {
    await descargarListaAcomodadores({ invitados: [inv("1", "Sara", "Sosa", null)] });
    const hoja = hojas[0];
    expect(hoja.textos).toEqual([TITULO, "Familia", "Sosa: Sara", SIN_MESA, "1"]);
    expect(hoja.colores[3]).toBe(C.peligro);
    expect(hoja.colores[4]).toBe(C.ink);
  });

  it("si no cabe, se recorta con «…» en su línea", async () => {
    const largos = ["Francisco Javier", "María del Carmen", "Alejandro", "Lucía", "Guillermo", "Inmaculada"];
    await descargarListaAcomodadores({ invitados: largos.map((n, i) => inv(String(i), n, "Hernández-Rodríguez", 4)) });
    expect(hojas[0].textos[2].endsWith("…")).toBe(true);
  });

  it("sin familias confirmadas, no descarga nada", async () => {
    expect(await descargarListaAcomodadores({ invitados: [] })).toBe(0);
    expect(descargas).toEqual([]);
  });
});
