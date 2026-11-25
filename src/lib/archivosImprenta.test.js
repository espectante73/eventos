// Los archivos para el rotulista (v101.7): el PNG con su medida dentro, los
// nombres que valen en cualquier ordenador y el .zip, uno a uno.
import { describe, it, expect } from "vitest";
import { pngConPpp, escalaImprenta, nombreDeArchivo, conCeros, zipDeArchivos, paginaEnPng, PPP_IMPRENTA } from "./archivosImprenta";
import { crc32 } from "./zip";

// Un PNG de mentira con sus bloques: la firma, IHDR, lo que se pida e IEND.
function bloque(tipo, datos = []) {
  const b = new Uint8Array(12 + datos.length);
  const v = new DataView(b.buffer);
  v.setUint32(0, datos.length);
  b.set([...tipo].map((c) => c.charCodeAt(0)), 4);
  b.set(datos, 8);
  v.setUint32(8 + datos.length, crc32(b.subarray(4, 8 + datos.length)));
  return [...b];
}
const FIRMA = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const png = (...bloques) => new Uint8Array([...FIRMA, ...bloque("IHDR", new Array(13).fill(1)), ...bloques.flat(), ...bloque("IEND")]);

// Los bloques de un PNG: [{ tipo, datos, crcBien }].
function bloquesDe(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const lista = [];
  for (let pos = 8; pos < bytes.length; ) {
    const largo = v.getUint32(pos);
    const tipo = String.fromCharCode(...bytes.subarray(pos + 4, pos + 8));
    const datos = bytes.subarray(pos + 8, pos + 8 + largo);
    lista.push({ tipo, datos, crcBien: v.getUint32(pos + 8 + largo) === crc32(bytes.subarray(pos + 4, pos + 8 + largo)) });
    pos += 12 + largo;
  }
  return lista;
}

describe("el PNG lleva su resolución dentro (si no, la tarjeta de 8,56 cm saldría de 35)", () => {
  it("a 300 ppp: 11.811 píxeles por metro, justo tras la cabecera y con su CRC", () => {
    const salida = pngConPpp(png(bloque("IDAT", [1, 2, 3])), 300);
    const bloques = bloquesDe(salida);
    expect(bloques.map((b) => b.tipo)).toEqual(["IHDR", "pHYs", "IDAT", "IEND"]);
    const phys = new DataView(bloques[1].datos.buffer, bloques[1].datos.byteOffset);
    expect([phys.getUint32(0), phys.getUint32(4), bloques[1].datos[8]]).toEqual([11811, 11811, 1]);
    expect(bloques.every((b) => b.crcBien)).toBe(true);
    expect([...salida.subarray(0, 8)]).toEqual(FIRMA);
  });

  it("la que trajera el navegador (72 ppp) se quita: queda una sola, la buena", () => {
    const de72 = bloque("pHYs", [0, 0, 0x0b, 0x13, 0, 0, 0x0b, 0x13, 1]);
    const bloques = bloquesDe(pngConPpp(png(de72, bloque("IDAT", [9])), 300));
    expect(bloques.filter((b) => b.tipo === "pHYs")).toHaveLength(1);
    expect(new DataView(bloques[1].datos.buffer, bloques[1].datos.byteOffset).getUint32(0)).toBe(11811);
  });
});

describe("escalaImprenta", () => {
  it("una tarjeta, a 300 ppp", () => {
    expect(escalaImprenta(242.6, 306) * 72).toBeCloseTo(PPP_IMPRENTA);
  });
  it("un A3 no cabe a 300 ppp en el lienzo de un iPhone: baja lo justo", () => {
    const escala = escalaImprenta(841.89, 1190.55);
    expect(escala * 72).toBeLessThan(300);
    expect(escala * 72).toBeGreaterThan(280);
    expect(841.89 * escala * 1190.55 * escala).toBeLessThanOrEqual(16_777_216);
  });
});

it("los nombres, sin tildes ni signos, para cualquier ordenador; los números con ceros, para ordenarlos", () => {
  expect(nombreDeArchivo(conCeros(7, 3), "mesa", conCeros(3), "DE LA CRUZ", "José María")).toBe("007-mesa-03-DE-LA-CRUZ-Jose-Maria");
  expect(nombreDeArchivo("mesa", conCeros(12), "MUÑOZ", "Iñaki")).toBe("mesa-12-MUNOZ-Inaki");
  expect(conCeros("B")).toBe("B");
});

it("el .zip: los archivos uno a uno, contando, y todos dentro", async () => {
  const pasos = [];
  const blob = await zipDeArchivos(3, async (i) => ({ nombre: `mesa-0${i + 1}.pdf`, datos: new Uint8Array([i]) }), (h, t) => pasos.push(`${h}/${t}`));
  expect(pasos).toEqual(["1/3", "2/3", "3/3"]);
  const texto = new TextDecoder("latin1").decode(new Uint8Array(await blob.arrayBuffer()));
  for (const n of ["mesa-01.pdf", "mesa-02.pdf", "mesa-03.pdf"]) expect(texto).toContain(n);
});

it("una página en PNG: del mismo dibujo, al tamaño de imprenta y con su resolución", async () => {
  const medidas = [];
  const ctx = new Proxy({}, { get: () => () => {} });
  const crearLienzo = (ancho, alto) => (medidas.push([ancho, alto]), { getContext: () => ctx, toBlob: (r) => r(new Blob([png()])) });
  let dibujada = 0;
  const datos = await paginaEnPng(() => (dibujada += 1), { ancho: 242.65, alto: 306.03 }, { crearLienzo });
  expect(dibujada).toBe(1);
  // 8,56 × 10,8 cm a 300 ppp.
  expect(medidas).toEqual([[1011, 1275]]);
  expect(bloquesDe(datos).map((b) => b.tipo)).toEqual(["IHDR", "pHYs", "IEND"]);
});

it("sin lienzo, lo dice en vez de dar una imagen en blanco", async () => {
  await expect(paginaEnPng(() => {}, { ancho: 10, alto: 10 }, { crearLienzo: () => ({ getContext: () => null }) })).rejects.toThrow("no ha podido dibujar");
});
