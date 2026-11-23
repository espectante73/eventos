// Las tarjetas QR de las mesas, en PDF (él, v67.7): tarjetas de pie, que
// se doblan y se leen por las dos caras (él: «A6 doble»). Un folio A4 da
// DOS: se corta a lo alto (línea discontinua) y cada tira se dobla a lo
// ancho (línea de puntos). La cara de arriba va girada 180°: doblada, se
// lee derecha desde el otro lado de la mesa. El QR abre el tablón, donde
// suben sus fotos de la fiesta. Desde v92.9, una cara lleva el texto y la
// otra el QR (él), y cada una dice que lo demás está al otro lado.
//
// Una tarjeta por mesa (él, v92.9): arriba, su número lo más grande que
// cabe («el número, lo protagonista»), en dorado sobre un círculo verde con
// doble aro, como el sello de la cuenta atrás. Sin la palabra «Mesa» (él:
// «es una obviedad»). Dos por folio, en el orden de las mesas; con un
// número impar, la última hoja lleva una sola.
//
// Cada QR, el de SU mesa (él, v93): el enlace del tablón con el número y el
// código secreto de la mesa (qr_mesas), que confirma el móvil para subir
// fotos sin preguntar nada. Se descargan solo con «Acomodación terminada».
//
// Hoja blanca y los colores del evento con discreción (él): textos en el
// verde de la app y el marco dorado de cada cara.
// El QR, en el verde más oscuro: contrasta con el blanco como el negro.
// Se dibuja con cuadrados del propio PDF, no como imagen: sale nítido a
// cualquier tamaño de impresión.
import { C } from "../theme";
import { descargarBlob } from "./descargas";
import { EDAD_EMAIL } from "./invitados";

export const ARCHIVO_TARJETAS_QR = "tarjetas-qr.pdf";
// Su texto (él, v68: 2 por persona de 16 o más), en dos líneas parejas.
export const TITULO_TARJETA = ["Puedes subir hasta", "2 fotos del evento:"];
// Qué foto es cada una (él, v92.9: «a cada familia le pedimos que suba una
// foto de ellos el día del evento; la otra, lo que significó para ti el
// evento, la instantánea de un momento que lo describa»; «la foto de la
// unidad familiar, hecha hoy, el día del evento»). El nombre del evento,
// entre comillas: es su nombre propio (él). Partidos a mano, por donde se
// lee mejor: sueltos, quedaban «hecha hoy, el / día del evento».
export const nombreEntreComillas = (nombreEvento) => `«${String(nombreEvento || "").trim().replace(/\.$/, "")}»`;
// Numerados (él: «dos párrafos numerados»): el número lo pone la cara.
export const queFotosTarjeta = (nombreEvento) => [
  ["La foto de tu unidad familiar,", "hecha hoy, el día del evento", "(la sube solo uno)."],
  ["Lo que para ti significó el evento:", "un momento que describa", `${nombreEvento ? nombreEntreComillas(nombreEvento) : "el evento"}.`],
];
// La edad y el permiso, en una sola frase y solo para los menores (él,
// v92.9: «si eres menor, solo a partir de 16 años» —15 desde la v98—, con el permiso de sus
// padres; la del permiso de abajo sobraba).
export const EDAD_TARJETA = [`Si eres menor, solo a partir de ${EDAD_EMAIL} años`, "y con el permiso de tus padres."];
// Ya no se entra con el apellido y el nombre (él, v92.9: «ha quedado
// obsoleto»): el QR abre el tablón, que en un móvil que ya entró con su
// enlace personal se abre solo. Sin la frase de horizontal o vertical
// (él), que sigue al subir la foto en el tablón.
export const ENTRAR_TARJETA = "Escanea el código: se abre tu tablón.";
// Por dónde se entra si el móvil no lo abre solo (él, v92.9): con «Solo con
// el enlace personal», el QR general abre el tablón en el móvil que ya
// entró con el suyo; si no, el de WhatsApp.
export const SI_NO_SE_ABRE_TARJETA = ["Si no se abre, usa el enlace que tu colaborador", "te envió a tu WhatsApp semanas antes."];
// Cada cara dice dónde está lo de la otra: media mesa ve una y media, otra.
export const VER_CODIGO_TARJETA = "El código para subirlas, al otro lado.";
export const VER_TEXTO_TARJETA = "Qué fotos subir, al otro lado.";

// A4 vertical en puntos, partido en 2 x 2: cada cara, un A6.
const ANCHO_PAGINA = 595.28;
const ALTO_PAGINA = 841.89;
const ANCHO_CARA = ANCHO_PAGINA / 2;
const ALTO_CARA = ALTO_PAGINA / 2;
const MARCO = 14; // del corte (o del doblez) al marco dorado
// El QR, solo en su cara (v92.9): 4,8 cm.
const LADO_QR = 136;
// El círculo del número y su letra, lo más grandes que caben: «12», la más
// ancha, cabe dentro del aro de dentro.
const RADIO_NUMERO = 68;
const LETRA_NUMERO = 90;
// Alto de las cifras de Helvetica negrita, por punto de letra: para
// centrarlas de arriba abajo en el círculo.
const ALTO_CIFRA = 0.716;

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
    circulo: (x, y, r, estilo) => pdf.circle(...punto(x, y), r, estilo),
    marco: (x, y, w, h, r) => pdf.roundedRect(...caja(x, y, w, h), r, r),
    // Líneas que empiezan en x, la primera en y (girada, del revés).
    izquierda(lineas, x, y, interlineado) {
      lineas.forEach((linea, i) => {
        const base = y + i * interlineado;
        if (!girada) pdf.text(linea, x, base);
        else pdf.text(linea, ...punto(x, base), { angle: 180 });
      });
    },
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

// El marco de la cara y, arriba, el número de la mesa en su círculo: igual
// en las dos caras.
function marcoYNumero(pdf, l, x, y, mesa) {
  pdf.setDrawColor(C.gold);
  pdf.setLineWidth(0.6);
  l.marco(x + MARCO, y + MARCO, ANCHO_CARA - 2 * MARCO, ALTO_CARA - 2 * MARCO, 6);
  const cy = y + 22 + RADIO_NUMERO;
  pdf.setFillColor(C.ink);
  pdf.setDrawColor(C.gold);
  pdf.setLineWidth(1.6);
  l.circulo(l.cx, cy, RADIO_NUMERO, "FD");
  pdf.setDrawColor(C.goldClaro);
  pdf.setLineWidth(0.5);
  l.circulo(l.cx, cy, RADIO_NUMERO - 5, "S");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(LETRA_NUMERO);
  pdf.setTextColor(C.goldClaro);
  l.centrado([String(mesa)], l.cx, cy + (LETRA_NUMERO * ALTO_CIFRA) / 2, 0);
}

function pie(pdf, l, y, nombreEvento) {
  if (!nombreEvento) return;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(C.gold);
  l.centrado([nombreEvento], l.cx, y + ALTO_CARA - MARCO - 7, 0);
}

// La cara del texto (él, v92.9: «todo el texto en un lado y el QR en el
// otro, y el número en los dos»): qué fotos y quién; abajo, que el código
// está al otro lado.
function caraTexto(pdf, x, y, girada, nombreEvento, mesa) {
  const l = lienzo(pdf, x, y, girada);
  marcoYNumero(pdf, l, x, y, mesa);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(C.ink);
  l.centrado(TITULO_TARJETA, l.cx, y + 186, 19);
  // Los dos párrafos numerados, como una lista: alineados a la izquierda,
  // el número por fuera, y el bloque entero centrado en la cara.
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  const parrafos = queFotosTarjeta(nombreEvento);
  const sangria = 15;
  const izquierda = l.cx - (Math.max(...parrafos.flat().map((t) => pdf.getTextWidth(t))) + sangria) / 2;
  let linea = y + 232;
  parrafos.forEach((lineas, i) => {
    pdf.setFont("helvetica", "bold");
    l.izquierda([`${i + 1}.`], izquierda, linea, 0);
    pdf.setFont("helvetica", "normal");
    l.izquierda(lineas, izquierda + sangria, linea, 14);
    linea += lineas.length * 14 + 6;
  });
  pdf.setFontSize(10);
  pdf.setTextColor(C.charcoal);
  l.centrado(EDAD_TARJETA, l.cx, linea + 8, 13);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10.5);
  pdf.setTextColor(C.ink);
  l.centrado([VER_CODIGO_TARJETA], l.cx, y + 370, 0);
  pie(pdf, l, y, nombreEvento);
}

// La cara del QR: el código bien grande, por dónde entrar si no se abre y,
// abajo, que lo que se sube se explica al otro lado.
function caraQr(pdf, qr, x, y, girada, nombreEvento, mesa) {
  const l = lienzo(pdf, x, y, girada);
  marcoYNumero(pdf, l, x, y, mesa);
  dibujarQr(pdf, l, qr, l.cx - LADO_QR / 2, y + 174, LADO_QR);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(C.ink);
  l.centrado([ENTRAR_TARJETA], l.cx, y + 330, 0);
  pdf.setFontSize(9.5);
  pdf.setTextColor(C.charcoal);
  l.centrado(SI_NO_SE_ABRE_TARJETA, l.cx, y + 346, 12);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10.5);
  pdf.setTextColor(C.ink);
  l.centrado([VER_TEXTO_TARJETA], l.cx, y + 382, 0);
  pie(pdf, l, y, nombreEvento);
}

// Una tarjeta por mesa, de menor a mayor y sin repetir: { numero, enlace }.
// `codigos`, lo que da anfitrion_qr_mesas ([{ numero, codigo }]);
// `enlaceDe(numero, codigo)`, el enlace de su QR. Sin código, sin tarjeta.
export function tarjetasDeMesas(codigos = [], enlaceDe) {
  const vistas = new Set();
  return codigos
    .filter((m) => Number.isInteger(m?.numero) && m.numero > 0 && m.codigo)
    .sort((a, b) => a.numero - b.numero)
    .filter((m) => !vistas.has(m.numero) && vistas.add(m.numero))
    .map((m) => ({ numero: m.numero, enlace: enlaceDe(m.numero, m.codigo) }))
    .filter((t) => t.enlace);
}

// Dos tarjetas por hoja: la línea de corte, a lo alto y discontinua; la
// del doblez, a lo ancho y de puntos, bajo las tarjetas que haya. Finas.
// `tarjetas`: [{ numero, qr }], cada una con el QR de su mesa.
export function dibujarTarjetasQr(pdf, nombreEvento, tarjetas) {
  for (let i = 0; i < tarjetas.length; i += 2) {
    if (i) pdf.addPage();
    const par = tarjetas.slice(i, i + 2);
    pdf.setDrawColor(C.line);
    pdf.setLineWidth(0.4);
    pdf.setLineDashPattern([4, 3], 0);
    pdf.line(ANCHO_CARA, 0, ANCHO_CARA, ALTO_PAGINA);
    pdf.setLineDashPattern([1, 2], 0);
    pdf.line(0, ALTO_CARA, par.length * ANCHO_CARA, ALTO_CARA);
    pdf.setLineDashPattern([], 0);
    par.forEach(({ numero, qr }, j) => {
      caraTexto(pdf, j * ANCHO_CARA, 0, true, nombreEvento, numero);
      caraQr(pdf, qr, j * ANCHO_CARA, ALTO_CARA, false, nombreEvento, numero);
    });
  }
}

// El QR del enlace: corrección «M», la de siempre para impresos.
export function crearQr(qrcode, enlace) {
  const qr = qrcode(0, "M");
  qr.addData(enlace);
  qr.make();
  return qr;
}

// `tarjetas`: las de las mesas (tarjetasDeMesas), al menos una.
export async function descargarTarjetasQr({ nombreEvento, tarjetas }) {
  // jsPDF y el QR pesan: se cargan solo al usarlos, como en acomodadores.
  const [{ jsPDF }, { default: qrcode }] = await Promise.all([import("jspdf"), import("qrcode-generator")]);
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  dibujarTarjetasQr(
    pdf,
    nombreEvento,
    tarjetas.map((t) => ({ numero: t.numero, qr: crearQr(qrcode, t.enlace) }))
  );
  descargarBlob(ARCHIVO_TARJETAS_QR, pdf.output("blob"));
}
