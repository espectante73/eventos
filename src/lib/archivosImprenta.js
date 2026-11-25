// Los archivos para el rotulista (él, v101.7: «al rotulista no le vale el
// formato actual… cada una de las 14 tarjetas QR es un archivo
// independiente, y lo mismo con las 126 tarjetas de acomodación… sin
// cambiar las medidas»; y «formato salida añadimos PNG»). Lo comparten las
// tarjetas de acomodación y las QR (norma 7): cada página, su archivo, en
// PDF o en PNG, y todos juntos en un .zip (el navegador no deja bajar 126
// archivos de golpe: Safari bloquea una descarga detrás de otra).
//
// ⚠️ El PNG lleva dentro su resolución (el bloque pHYs): sin ella, los
// programas de imprenta lo leen a 72 ppp y la tarjeta de 8,56 cm sale de
// 35 cm. Con ella, la medida es la de siempre.
import { crc32, crearZip } from "./zip";
import { PdfEnLienzo, crearCanvas } from "./pdfEnLienzo";

export const SALIDAS = ["pdf", "png"];
// Calidad de imprenta.
export const PPP_IMPRENTA = 300;
// El lienzo más grande que dibuja el iPhone (4096 × 4096): un A3 a 300 ppp
// no cabe y saldría en blanco; baja lo justo (unos 287 ppp).
const PIXELES_MAXIMOS = 16_000_000;
const PULGADA_EN_PUNTOS = 72;

// Píxeles por punto para una página de `ancho` × `alto` puntos.
export const escalaImprenta = (ancho, alto) => Math.min(PPP_IMPRENTA / PULGADA_EN_PUNTOS, Math.sqrt(PIXELES_MAXIMOS / (ancho * alto)));

// El PNG con su resolución dentro: quita la que trajera y pone la suya
// justo tras la cabecera (IHDR), en píxeles por metro.
export function pngConPpp(bytes, ppp) {
  const vista = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const trozos = [bytes.subarray(0, 8)];
  for (let pos = 8; pos < bytes.length; ) {
    const largo = vista.getUint32(pos);
    const tipo = String.fromCharCode(...bytes.subarray(pos + 4, pos + 8));
    const fin = pos + 12 + largo;
    if (tipo !== "pHYs") trozos.push(bytes.subarray(pos, fin));
    if (tipo === "IHDR") trozos.push(bloquePhys(ppp));
    pos = fin;
  }
  const salida = new Uint8Array(trozos.reduce((s, t) => s + t.length, 0));
  let pos = 0;
  for (const t of trozos) {
    salida.set(t, pos);
    pos += t.length;
  }
  return salida;
}

function bloquePhys(ppp) {
  const porMetro = Math.round(ppp / 0.0254);
  const bloque = new Uint8Array(21);
  const vista = new DataView(bloque.buffer);
  vista.setUint32(0, 9);
  bloque.set([0x70, 0x48, 0x59, 0x73], 4); // «pHYs»
  vista.setUint32(8, porMetro);
  vista.setUint32(12, porMetro);
  bloque[16] = 1; // en metros
  vista.setUint32(17, crc32(bloque.subarray(4, 17)));
  return bloque;
}

// Una página dibujada en un lienzo de imprenta, como PNG con su
// resolución. `dibujar(lienzo)` dibuja UNA página (el mismo dibujo que el
// PDF); `medida`, la página en puntos.
export async function paginaEnPng(dibujar, medida, { imagenes, crearLienzo = crearCanvas } = {}) {
  const escala = escalaImprenta(medida.ancho, medida.alto);
  const lienzo = new PdfEnLienzo({ medida, escala, crearLienzo, imagenes });
  dibujar(lienzo);
  if (!lienzo.ctx) throw new Error("Este navegador no ha podido dibujar la tarjeta.");
  const blob = await new Promise((r) => lienzo.paginas[0].toBlob(r, "image/png"));
  if (!blob) throw new Error("La imagen es demasiado grande para este navegador.");
  return pngConPpp(new Uint8Array(await blob.arrayBuffer()), escala * PULGADA_EN_PUNTOS);
}

// Un nombre de archivo que vale en cualquier ordenador (el del rotulista
// puede ser Windows): sin tildes ni signos.
export const nombreDeArchivo = (...partes) =>
  partes
    .map((p) =>
      String(p ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^A-Za-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .filter(Boolean)
    .join("-");

// Dos cifras (o tres): así el Finder y Windows los ordenan bien.
export const conCeros = (n, cifras = 2) => (/^\d+$/.test(String(n)) ? String(n).padStart(cifras, "0") : String(n));

// Hace los archivos uno a uno (`hacer(i)` → { nombre, datos }) y los mete
// en un .zip. Uno a uno: 126 lienzos a 300 ppp a la vez no caben en un
// móvil. Entre uno y otro, un respiro, para que el botón cuente
// (`alAvanzar(hechos, total)`).
export async function zipDeArchivos(total, hacer, alAvanzar = () => {}) {
  const archivos = [];
  for (let i = 0; i < total; i++) {
    archivos.push(await hacer(i));
    alAvanzar(i + 1, total);
    await new Promise((r) => setTimeout(r, 0));
  }
  return new Blob([crearZip(archivos)], { type: "application/zip" });
}

// Los bytes de un jsPDF, para meterlo en el .zip.
export const bytesDePdf = (pdf) => new Uint8Array(pdf.output("arraybuffer"));
