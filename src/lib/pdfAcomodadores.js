// La lista para acomodadores, en PDF (él, v54.1; un solo PDF por familia
// desde la v63.4). Se descarga directamente, sin el cuadro de imprimir.
//
// Una línea por familia (norma 6), para que el acomodador siga cada
// familia con el ojo, de la A a la Z. Al final, aparte, el EQUIPO: las
// familias de colaboradores y acomodadores, que se sientan las últimas.
// Arriba, tres cabeceras: «Familia» y, en vez de palabras, el icono de la
// mesa y el de persona (él, v54.3); en las filas, solo los números. Sin
// mesa, un «NO» en rojo. Filas alternas en gris y la columna del medio con
// un tono muy suave, para distinguir las tres. Hoja blanca y tinta oscura:
// se imprime en papel normal, también en blanco y negro.
import { C, IMPRESION } from "../theme";
import { filasAcomodadores } from "./familiasInvitacion";
import { iconosAcomodadores } from "./iconosPdf";
import { descargarBlob } from "./descargas";

// A4 vertical, en puntos (1pt = 1/72"), como el acuse (acuseImagen.js).
const PAGINA_ALTO = 841.89;
const MARGEN = 40;
const ANCHO_UTIL = 595.28 - 2 * MARGEN;
const ARRIBA_TABLA = 78; // la fila de las cabeceras
const ALTO_FILA = 22;
const LETRA = 11;
const ICONO = 13;
const RELLENO = 6; // del borde de la columna al texto de la familia

// Los fondos (IMPRESION, en theme.js): fila sí, fila no, en gris; y la
// columna del medio, un tono más, muy suave, en todas las filas.

// Los anchos de las columnas, definidos una sola vez (norma 6).
const ANCHO = { mesa: 50, cantidad: 50 };
ANCHO.familia = ANCHO_UTIL - ANCHO.mesa - ANCHO.cantidad;

// El orden de las columnas: la que ordena, primero.
const ORDEN_COLUMNAS = ["familia", "mesa", "cantidad"];

function columnas() {
  let x = MARGEN;
  return ORDEN_COLUMNAS.map((nombre, i) => {
    const c = { nombre, x, ancho: ANCHO[nombre], centro: x + ANCHO[nombre] / 2, medio: i === 1 };
    x += ANCHO[nombre];
    return c;
  });
}

export const SIN_MESA = "NO";
export const TITULO = "Lista para acomodadores";
export const TITULO_EQUIPO = "EQUIPO · se sientan al final";
export const ARCHIVO = "acomodadores.pdf";

// Si una familia no cabe en su línea, se recorta con "…" (norma 6).
function recortar(pdf, texto, ancho) {
  if (pdf.getTextWidth(texto) <= ancho) return texto;
  let corto = texto;
  while (corto.length > 1 && pdf.getTextWidth(`${corto}…`) > ancho) corto = corto.slice(0, -1);
  return `${corto.trimEnd()}…`;
}

function fondos(pdf, cols, y, gris) {
  for (const c of cols) {
    const color = c.medio ? (gris ? IMPRESION.columnaEnFila : IMPRESION.columna) : gris ? IMPRESION.fila : null;
    if (!color) continue;
    pdf.setFillColor(color);
    pdf.rect(c.x, y, c.ancho, ALTO_FILA, "F");
  }
}

// El título de la hoja y la fila de cabeceras, en cada página.
function cabecera(pdf, cols, iconos) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(C.ink);
  pdf.text(TITULO, MARGEN, 52);
  pdf.setFontSize(LETRA);
  fondos(pdf, cols, ARRIBA_TABLA, false);
  const base = ARRIBA_TABLA + ALTO_FILA / 2 + LETRA * 0.35;
  const arribaIcono = ARRIBA_TABLA + (ALTO_FILA - ICONO) / 2;
  for (const c of cols) {
    if (c.nombre === "familia") pdf.text("Familia", c.x + RELLENO, base);
    else pdf.addImage(c.nombre === "mesa" ? iconos.mesa : iconos.persona, "PNG", c.centro - ICONO / 2, arribaIcono, ICONO, ICONO);
  }
  pdf.setDrawColor(C.ink);
  pdf.setLineWidth(0.8);
  pdf.line(MARGEN, ARRIBA_TABLA + ALTO_FILA, MARGEN + ANCHO_UTIL, ARRIBA_TABLA + ALTO_FILA);
  pdf.setFont("helvetica", "normal");
}

function dibujarFila(pdf, cols, f, y, gris) {
  fondos(pdf, cols, y, gris);
  const base = y + ALTO_FILA / 2 + LETRA * 0.35;
  for (const c of cols) {
    if (c.nombre === "mesa" && !f.mesas.length) {
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(C.peligro);
      pdf.text(SIN_MESA, c.centro, base, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(C.ink);
    } else if (c.nombre === "mesa") {
      pdf.text(recortar(pdf, f.mesas.join(", "), c.ancho - 4), c.centro, base, { align: "center" });
    } else if (c.nombre === "cantidad") {
      pdf.text(String(f.cantidad), c.centro, base, { align: "center" });
    } else {
      pdf.text(recortar(pdf, f.linea, c.ancho - 2 * RELLENO), c.x + RELLENO, base);
    }
  }
}

// El título del equipo, en negrita y subrayado, en una fila propia.
function dibujarTituloEquipo(pdf, y) {
  pdf.setFont("helvetica", "bold");
  pdf.text(TITULO_EQUIPO, MARGEN + RELLENO, y + ALTO_FILA / 2 + LETRA * 0.35);
  pdf.setLineWidth(0.8);
  pdf.line(MARGEN, y + ALTO_FILA, MARGEN + ANCHO_UTIL, y + ALTO_FILA);
  pdf.setFont("helvetica", "normal");
}

function dibujarLista(pdf, { principal, equipo }, iconos) {
  const cols = columnas();
  const arriba = ARRIBA_TABLA + ALTO_FILA;
  const porPagina = Math.floor((PAGINA_ALTO - arriba - MARGEN) / ALTO_FILA);
  // La fila de la página en la que toca escribir.
  let hueco = 0;
  const nuevaPagina = () => {
    pdf.addPage();
    cabecera(pdf, cols, iconos);
    hueco = 0;
  };
  const fila = (f, i) => {
    if (hueco === porPagina) nuevaPagina();
    dibujarFila(pdf, cols, f, arriba + hueco * ALTO_FILA, i % 2 === 1);
    hueco += 1;
  };
  cabecera(pdf, cols, iconos);
  principal.forEach(fila);
  if (equipo.length) {
    // Una fila de aire antes; y el título nunca solo al pie de una hoja.
    if (hueco + 3 > porPagina) nuevaPagina();
    else if (hueco > 0) hueco += 1;
    dibujarTituloEquipo(pdf, arriba + hueco * ALTO_FILA);
    hueco += 1;
    equipo.forEach(fila);
  }
}

// Devuelve cuántas familias salen: con 0 no se descarga nada.
export async function descargarListaAcomodadores({ invitados, ordenFamiliares, colaboradores }) {
  const listas = filasAcomodadores(invitados, ordenFamiliares, colaboradores);
  const total = listas.principal.length + listas.equipo.length;
  if (total === 0) return 0;
  // jsPDF pesa: se carga solo al usarlo, como en el acuse.
  const { jsPDF } = await import("jspdf");
  const iconos = await iconosAcomodadores(C.ink);
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  dibujarLista(pdf, listas, iconos);
  descargarBlob(ARCHIVO, pdf.output("blob"));
  return total;
}
