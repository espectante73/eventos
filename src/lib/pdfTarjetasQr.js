// Las tarjetas QR de las mesas, en PDF (él, v67.7): tarjetas de pie, que
// se doblan y se leen por las dos caras (él: «A6 doble»). Un folio A4 da
// DOS: se corta a lo alto (línea discontinua) y cada tira se dobla a lo
// ancho (línea de puntos). La cara de arriba va girada 180°: doblada, se
// lee derecha desde el otro lado de la mesa. El QR abre el tablón —el
// mismo enlace que ya tienen en WhatsApp—, donde suben sus fotos de la
// fiesta tras entrar con su nombre.
//
// Hoja blanca y los colores del evento con discreción (él): textos en el
// verde de la app, una línea dorada fina y el marco dorado de cada cara.
// El QR, en el verde más oscuro: contrasta con el blanco como el negro.
// Se dibuja con cuadrados del propio PDF, no como imagen: sale nítido a
// cualquier tamaño de impresión.
import { C } from "../theme";
import { descargarBlob } from "./descargas";
import { FRASE_HORIZONTAL } from "./fotosFiesta";

export const ARCHIVO_TARJETAS_QR = "tarjetas-qr.pdf";
export const TITULO_TARJETA = ["Sube tus fotos", "del evento."];
// En dos líneas parejas, partidas a mano: suelta, «nombre.» quedaba sola.
export const ENTRAR_TARJETA = ["Escanea el código y entra", "con tu apellido y tu nombre."];

// A4 vertical en puntos, partido en 2 x 2: cada cara, un A6.
const ANCHO_PAGINA = 595.28;
const ALTO_PAGINA = 841.89;
const ANCHO_CARA = ANCHO_PAGINA / 2;
const ALTO_CARA = ALTO_PAGINA / 2;
const MARCO = 14; // del corte (o del doblez) al marco dorado
const MARGEN_TEXTO = 34;
const LADO_QR = 160;

// Lo que se dibuja en una cara, en sus coordenadas de siempre; si va
// girada, cada punto se da la vuelta alrededor del centro de la cara.
function lienzo(pdf, x0, y0, girada) {
  const cx = x0 + ANCHO_CARA / 2;
  const cy = y0 + ALTO_CARA / 2;
  const punto = (x, y) => (girada ? [2 * cx - x, 2 * cy - y] : [x, y]);
  const caja = (x, y, w, h) => (girada ? [2 * cx - x - w, 2 * cy - y - h, w, h] : [x, y, w, h]);
  return {
    cx,
    rect: (x, y, w, h) => pdf.rect(...caja(x, y, w, h), "F"),
    marco: (x, y, w, h, r) => pdf.roundedRect(...caja(x, y, w, h), r, r),
    line: (x1, y1, x2, y2) => pdf.line(...punto(x1, y1), ...punto(x2, y2)),
    // Líneas centradas en xc, la primera en y. Girada, cada línea empieza
    // por su otro extremo y se escribe del revés.
    centrado(lineas, xc, y, interlineado) {
      lineas.forEach((linea, i) => {
        const base = y + i * interlineado;
        if (!girada) pdf.text(linea, xc, base, { align: "center" });
        else pdf.text(linea, ...punto(xc - pdf.getTextWidth(linea) / 2, base), { angle: 180 });
      });
    },
  };
}

// El QR, fila a fila: los cuadrados oscuros seguidos van en un solo
// rectángulo, y cada fila pisa un pelo la de abajo (SOLAPE), para que el
// visor no deje rayas blancas finas entre ellas.
const SOLAPE = 0.3;
function dibujarQr(pdf, l, qr, x, y, lado) {
  const n = qr.getModuleCount();
  const celda = lado / n;
  pdf.setFillColor(C.ink);
  for (let fila = 0; fila < n; fila++) {
    let desde = -1;
    for (let col = 0; col <= n; col++) {
      const oscuro = col < n && qr.isDark(fila, col);
      if (oscuro && desde < 0) desde = col;
      if (!oscuro && desde >= 0) {
        l.rect(x + desde * celda, y + fila * celda, (col - desde) * celda, celda + SOLAPE);
        desde = -1;
      }
    }
  }
}

function dibujarCara(pdf, qr, x, y, girada, nombreEvento) {
  const l = lienzo(pdf, x, y, girada);
  const anchoTexto = ANCHO_CARA - 2 * MARGEN_TEXTO;

  pdf.setDrawColor(C.gold);
  pdf.setLineWidth(0.6);
  l.marco(x + MARCO, y + MARCO, ANCHO_CARA - 2 * MARCO, ALTO_CARA - 2 * MARCO, 6);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(C.ink);
  l.centrado(TITULO_TARJETA, l.cx, y + 54, 21.6);

  pdf.setLineWidth(0.8);
  l.line(l.cx - 20, y + 92, l.cx + 20, y + 92);

  dibujarQr(pdf, l, qr, l.cx - LADO_QR / 2, y + 106, LADO_QR);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  l.centrado(ENTRAR_TARJETA, l.cx, y + 290, 14.3);

  pdf.setFontSize(9);
  pdf.setTextColor(C.charcoal);
  l.centrado(pdf.splitTextToSize(FRASE_HORIZONTAL, anchoTexto), l.cx, y + 290 + ENTRAR_TARJETA.length * 15 + 10, 11.7);

  if (nombreEvento) {
    pdf.setTextColor(C.gold);
    l.centrado([nombreEvento], l.cx, y + ALTO_CARA - MARCO - 14, 0);
  }
}

// Las dos tarjetas: la línea de corte, a lo alto y discontinua; la del
// doblez, a lo ancho y de puntos. Finas las dos.
export function dibujarTarjetasQr(pdf, qr, nombreEvento) {
  pdf.setDrawColor(C.line);
  pdf.setLineWidth(0.4);
  pdf.setLineDashPattern([4, 3], 0);
  pdf.line(ANCHO_CARA, 0, ANCHO_CARA, ALTO_PAGINA);
  pdf.setLineDashPattern([1, 2], 0);
  pdf.line(0, ALTO_CARA, ANCHO_PAGINA, ALTO_CARA);
  pdf.setLineDashPattern([], 0);
  for (const x of [0, ANCHO_CARA]) {
    dibujarCara(pdf, qr, x, 0, true, nombreEvento);
    dibujarCara(pdf, qr, x, ALTO_CARA, false, nombreEvento);
  }
}

// El QR del enlace: corrección «M», la de siempre para impresos.
export function crearQr(qrcode, enlace) {
  const qr = qrcode(0, "M");
  qr.addData(enlace);
  qr.make();
  return qr;
}

export async function descargarTarjetasQr({ enlace, nombreEvento }) {
  // jsPDF y el QR pesan: se cargan solo al usarlos, como en acomodadores.
  const [{ jsPDF }, { default: qrcode }] = await Promise.all([import("jspdf"), import("qrcode-generator")]);
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  dibujarTarjetasQr(pdf, crearQr(qrcode, enlace), nombreEvento);
  descargarBlob(ARCHIVO_TARJETAS_QR, pdf.output("blob"));
}
