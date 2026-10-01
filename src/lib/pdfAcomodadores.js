// La lista para acomodadores, en dos PDF de una vez: por mesa y por
// familia (él, v54.1). Se descargan directamente, sin el cuadro de
// imprimir: el navegador solo saca un PDF por cada impresión.
//
// Una línea por familia (norma 6), para que el acomodador siga cada
// familia con el ojo; la columna por la que se ordena, primero. Arriba,
// tres cabeceras: «Familia» y, en vez de palabras, el icono de la mesa y
// el de persona (él, v54.3); en las filas, solo los números. Sin mesa, un
// «NO» en rojo. Filas alternas en gris y la columna del medio con un tono
// muy suave, para distinguir las tres. Hoja blanca y tinta oscura: se
// imprime en papel normal, también en blanco y negro.
import { C } from "../theme";
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

// Los fondos: fila sí, fila no, en gris; y la columna del medio, un tono
// más, muy suave, en todas las filas (también en las grises).
const FONDO = {
  fila: "#F2F2F2",
  columna: "#F8F8F8",
  columnaEnFila: "#EAEAEA",
};

// Los anchos de las columnas, definidos una sola vez (norma 6).
const ANCHO = { mesa: 50, cantidad: 50 };
ANCHO.familia = ANCHO_UTIL - ANCHO.mesa - ANCHO.cantidad;

// El orden de las columnas: la que ordena, primero.
const ORDEN_COLUMNAS = { mesa: ["mesa", "cantidad", "familia"], familia: ["familia", "mesa", "cantidad"] };

function columnas(orden) {
  let x = MARGEN;
  return ORDEN_COLUMNAS[orden].map((nombre, i) => {
    const c = { nombre, x, ancho: ANCHO[nombre], centro: x + ANCHO[nombre] / 2, medio: i === 1 };
    x += ANCHO[nombre];
    return c;
  });
}

export const SIN_MESA = "NO";
// Safari guardaba solo la segunda de dos descargas seguidas (v54.1: le
// llegó "por familia" dos veces y "por mesa" ninguna). Con un respiro
// entre una y otra, cada una se descarga por su lado.
const PAUSA_ENTRE_DESCARGAS = 1500;

export const TITULOS = { mesa: "Lista para acomodadores · por mesa", familia: "Lista para acomodadores · por familia" };

// Si una familia no cabe en su línea, se recorta con "…" (norma 6).
function recortar(pdf, texto, ancho) {
  if (pdf.getTextWidth(texto) <= ancho) return texto;
  let corto = texto;
  while (corto.length > 1 && pdf.getTextWidth(`${corto}…`) > ancho) corto = corto.slice(0, -1);
  return `${corto.trimEnd()}…`;
}

function fondos(pdf, cols, y, gris) {
  for (const c of cols) {
    const color = c.medio ? (gris ? FONDO.columnaEnFila : FONDO.columna) : gris ? FONDO.fila : null;
    if (!color) continue;
    pdf.setFillColor(color);
    pdf.rect(c.x, y, c.ancho, ALTO_FILA, "F");
  }
}

// El título de la hoja y la fila de cabeceras, en cada página.
function cabecera(pdf, orden, cols, iconos) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(C.ink);
  pdf.text(TITULOS[orden], MARGEN, 52);
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

function dibujarLista(pdf, filas, orden, iconos) {
  const cols = columnas(orden);
  const arriba = ARRIBA_TABLA + ALTO_FILA;
  const porPagina = Math.floor((PAGINA_ALTO - arriba - MARGEN) / ALTO_FILA);
  cabecera(pdf, orden, cols, iconos);
  filas.forEach((f, i) => {
    if (i > 0 && i % porPagina === 0) {
      pdf.addPage();
      cabecera(pdf, orden, cols, iconos);
    }
    const y = arriba + (i % porPagina) * ALTO_FILA;
    fondos(pdf, cols, y, i % 2 === 1);
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
  });
}

// Devuelve cuántas familias salen: con 0 no se descarga nada.
export async function descargarListasAcomodadores({ invitados, ordenFamiliares, pausa = PAUSA_ENTRE_DESCARGAS }) {
  const porOrden = {
    mesa: filasAcomodadores(invitados, ordenFamiliares, "mesa"),
    familia: filasAcomodadores(invitados, ordenFamiliares, "familia"),
  };
  if (porOrden.familia.length === 0) return 0;
  // jsPDF pesa: se carga solo al usarlo, como en el acuse.
  const { jsPDF } = await import("jspdf");
  const iconos = await iconosAcomodadores(C.ink);
  for (const orden of ["mesa", "familia"]) {
    if (orden === "familia") await new Promise((r) => setTimeout(r, pausa));
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    dibujarLista(pdf, porOrden[orden], orden, iconos);
    descargarBlob(`acomodadores-por-${orden}.pdf`, pdf.output("blob"));
  }
  return porOrden.familia.length;
}
