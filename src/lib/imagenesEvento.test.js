// La norma dice que las imágenes viven FUERA de la base. Estas pruebas
// vigilan las dos piezas que lo deciden: reconocer una imagen que está
// dentro de la ficha, y saber lo que pesa para poder explicarlo.
import { describe, it, expect } from "vitest";
import { estaDentroDeLaFicha, pesoEnKB } from "./imagenesEvento";

describe("reconocer una imagen metida dentro de la ficha", () => {
  it("un 'data:' está dentro; una dirección, no", () => {
    expect(estaDentroDeLaFicha("data:image/jpeg;base64,AAAA")).toBe(true);
    expect(estaDentroDeLaFicha("/cabecera-defecto.jpg")).toBe(false);
    expect(estaDentroDeLaFicha("https://ejemplo.com/portada.jpg")).toBe(false);
  });

  it("sin imagen tampoco es un problema", () => {
    expect(estaDentroDeLaFicha("")).toBe(false);
    expect(estaDentroDeLaFicha(null)).toBe(false);
    expect(estaDentroDeLaFicha(undefined)).toBe(false);
  });
});

describe("cuánto pesa lo que está dentro", () => {
  it("lo dice en KB, para poder explicarlo", () => {
    // 4 caracteres de base64 son 3 bytes: 1.400.000 caracteres ≈ 1.025 KB.
    expect(pesoEnKB("d".repeat(1400000))).toBe(1025);
  });

  it("sin nada, cero", () => {
    expect(pesoEnKB("")).toBe(0);
    expect(pesoEnKB(null)).toBe(0);
  });
});
