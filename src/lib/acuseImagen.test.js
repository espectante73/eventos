import { describe, it, expect } from "vitest";
import { repartirFilas } from "./acuseImagen";

// v94.6 (él: «el acuse de Raúl Sierra se ve incompleto por la cantidad de
// invitados»): se daba por hecho un máximo de 12-14 invitados, y con más la
// lista se salía de la hoja con el total, la fecha y la firma. Ahora sigue en
// otra hoja. Las medidas, las del dibujo (pt de un A4).
const LIMITE_FOOTER = 841.89 - 118;
const PRIMERA = 272;
const SIGUIENTES = 188;
const CIERRE = 121;

describe("el acuse en varias hojas", () => {
  it("hasta 15 filas, una sola hoja, como siempre", () => {
    for (let n = 0; n <= 15; n++) expect(repartirFilas(n)).toHaveLength(1);
  });

  it("con muchas filas, ninguna se pierde y ninguna hoja se sale", () => {
    for (let n = 16; n <= 120; n++) {
      const hojas = repartirFilas(n);
      expect(hojas.reduce((s, k) => s + k, 0)).toBe(n);
      hojas.forEach((k, i) => {
        const inicio = i === 0 ? PRIMERA : SIGUIENTES;
        const ultima = i === hojas.length - 1;
        // La línea base de la última fila + su alto (+ el cierre en la última).
        expect(inicio + (k - 1) * 22 + 22 + (ultima ? CIERRE : 0)).toBeLessThanOrEqual(LIMITE_FOOTER);
        expect(k).toBeGreaterThan(0);
      });
      // El total y la firma nunca se quedan solos en una hoja.
      expect(hojas[hojas.length - 1]).toBeGreaterThanOrEqual(2);
    }
  });

  it("30 invitados: dos hojas", () => {
    expect(repartirFilas(30)).toHaveLength(2);
  });
});
