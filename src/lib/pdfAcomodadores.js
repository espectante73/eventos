// La lista para acomodadores, en dos PDF de una vez: por mesa y por
// familia (él, v54.1). Se descargan directamente, sin el cuadro de
// imprimir: el navegador solo saca un PDF por cada impresión.
//
// Una línea por familia (norma 6), para que el acomodador siga cada
// familia con el ojo; la columna por la que se ordena, primero. Delante
// de cada número su icono, para no leer dos números seguidos ("5 3") y
// confundirlos. Cuantas menos palabras, mejor: sin mesa, la mesa tachada
// en rojo y nada más. Hoja blanca y tinta oscura, trazo grueso: se
// imprime en papel normal, también en blanco y negro.
import { C } from "../theme";
import { filasAcomodadores } from "./familiasInvitacion";
import { iconosAcomodadores } from "./iconosPdf";
import { descargarBlob } from "./descargas";

// A4 vertical, en puntos (1pt = 1/72"), como el acuse (acuseImagen.js).
const PAGINA_ALTO = 841.89;
const MARGEN = 40;
const ANCHO_UTIL = 595.28 - 2 * MARGEN;
const ARRIBA_FILAS = 84;
const ALTO_FILA = 22;
const LETRA = 11;
const ICONO = 13;
const HUECO_ICONO = 18; // del icono al número
const FONDO_ALTERNO = "#F2F2F2"; // una fila sí y otra no: guía al ojo sin tapar nada en gris

// Los anchos de las columnas, definidos una sola vez (norma 6).
const ANCHO_MESA = 70;
const ANCHO_CANTIDAD = 45;
const SEPARACION = 6;
const ANCHO_FAMILIA = ANCHO_UTIL - ANCHO_MESA - ANCHO_CANTIDAD - 2 * SEPARACION;

// Dónde empieza cada columna según el orden: la que ordena, primero.
const COLUMNAS = {
  mesa: { mesa: 0, cantidad: ANCHO_MESA + SEPARACION, familia: ANCHO_MESA + ANCHO_CANTIDAD + 2 * SEPARACION },
  familia: { familia: 0, mesa: ANCHO_FAMILIA + SEPARACION, cantidad: ANCHO_FAMILIA + ANCHO_MESA + 2 * SEPARACION },
};

export const TITULOS = { mesa: "Lista para acomodadores · por mesa", familia: "Lista para acomodadores · por familia" };

// Si una familia no cabe en su línea, se recorta con "…" (norma 6).
function recortar(pdf, texto, ancho) {
  if (pdf.getTextWidth(texto) <= ancho) return texto;
  let corto = texto;
  while (corto.length > 1 && pdf.getTextWidth(`${corto}…`) > ancho) corto = corto.slice(0, -1);
  return `${corto.trimEnd()}…`;
}

function cabecera(pdf, orden) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(C.ink);
  pdf.text(TITULOS[orden], MARGEN, 52);
  pdf.setDrawColor(C.line);
  pdf.setLineWidth(0.5);
  pdf.line(MARGEN, 64, MARGEN + ANCHO_UTIL, 64);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(LETRA);
}

function dibujarLista(pdf, filas, orden, iconos) {
  const col = COLUMNAS[orden];
  const porPagina = Math.floor((PAGINA_ALTO - ARRIBA_FILAS - MARGEN) / ALTO_FILA);
  cabecera(pdf, orden);
  filas.forEach((f, i) => {
    if (i > 0 && i % porPagina === 0) {
      pdf.addPage();
      cabecera(pdf, orden);
    }
    const y = ARRIBA_FILAS + (i % porPagina) * ALTO_FILA;
    if (i % 2) {
      pdf.setFillColor(FONDO_ALTERNO);
      pdf.rect(MARGEN, y, ANCHO_UTIL, ALTO_FILA, "F");
    }
    const base = y + ALTO_FILA / 2 + LETRA * 0.35;
    const arribaIcono = y + (ALTO_FILA - ICONO) / 2;
    const xMesa = MARGEN + col.mesa;
    pdf.addImage(iconos.mesa, "PNG", xMesa, arribaIcono, ICONO, ICONO);
    if (f.mesas.length) {
      pdf.text(recortar(pdf, f.mesas.join(", "), ANCHO_MESA - HUECO_ICONO), xMesa + HUECO_ICONO, base);
    } else {
      // Sin mesa: la mesa tachada en rojo, sin palabras (él, v54.1).
      pdf.setDrawColor(C.peligro);
      pdf.setLineWidth(1.6);
      pdf.line(xMesa - 1, arribaIcono + ICONO + 1, xMesa + ICONO + 1, arribaIcono - 1);
    }
    pdf.addImage(iconos.persona, "PNG", MARGEN + col.cantidad, arribaIcono, ICONO, ICONO);
    pdf.text(String(f.cantidad), MARGEN + col.cantidad + HUECO_ICONO, base);
    pdf.text(recortar(pdf, f.linea, ANCHO_FAMILIA), MARGEN + col.familia, base);
  });
}

// Devuelve cuántas familias salen: con 0 no se descarga nada.
export async function descargarListasAcomodadores({ invitados, ordenFamiliares }) {
  const porOrden = {
    mesa: filasAcomodadores(invitados, ordenFamiliares, "mesa"),
    familia: filasAcomodadores(invitados, ordenFamiliares, "familia"),
  };
  if (porOrden.familia.length === 0) return 0;
  // jsPDF pesa: se carga solo al usarlo, como en el acuse.
  const { jsPDF } = await import("jspdf");
  const iconos = await iconosAcomodadores(C.ink);
  for (const orden of ["mesa", "familia"]) {
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    dibujarLista(pdf, porOrden[orden], orden, iconos);
    descargarBlob(`acomodadores-por-${orden}.pdf`, pdf.output("blob"));
  }
  return porOrden.familia.length;
}
