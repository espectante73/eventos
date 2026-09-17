import { describe, it, expect } from "vitest";
import { crc32, crearZip } from "./zip";

const leer32 = (b, i) => new DataView(b.buffer, b.byteOffset).getUint32(i, true);
const leer16 = (b, i) => new DataView(b.buffer, b.byteOffset).getUint16(i, true);

describe("crc32", () => {
  it("coincide con el valor de referencia", () => {
    // CRC-32 estándar de "123456789".
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });
});

describe("crearZip", () => {
  const archivos = [
    { nombre: "Abreu01 - Gustavo y Míriam - 1998.jpg", datos: new Uint8Array([1, 2, 3]) },
    { nombre: "Núñez01 - sin año.jpg", datos: new Uint8Array([9, 8, 7, 6]) },
  ];
  const zip = crearZip(archivos, new Date(2026, 8, 17, 12, 0, 0));

  it("empieza por una cabecera local y acaba con el cierre de directorio", () => {
    expect(leer32(zip, 0)).toBe(0x04034b50);
    expect(leer32(zip, zip.length - 22)).toBe(0x06054b50);
  });

  it("declara el número de archivos que lleva", () => {
    expect(leer16(zip, zip.length - 22 + 10)).toBe(2);
  });

  it("marca los nombres como UTF-8, para que las tildes no salgan rotas", () => {
    expect(leer16(zip, 6) & 0x0800).toBe(0x0800);
    const n = new TextEncoder().encode(archivos[0].nombre);
    expect(Array.from(zip.slice(30, 30 + n.length))).toEqual(Array.from(n));
  });

  it("guarda el contenido tal cual, sin comprimir", () => {
    const n = new TextEncoder().encode(archivos[0].nombre).length;
    expect(Array.from(zip.slice(30 + n, 30 + n + 3))).toEqual([1, 2, 3]);
  });
});
