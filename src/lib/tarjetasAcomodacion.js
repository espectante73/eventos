// Las tarjetas de acomodación (él, v97; el nombre es suyo, no «de sitio»):
// el nombre de cada invitado en su mesa, de pie, para que cada uno
// encuentre su sitio. Una por invitado, BEBÉS
// INCLUIDOS (él: «tarjetas para todos»): los confirmados con mesa.
//
// Cómo son (decidido con él a base de bocetos):
// - del alto de una tarjeta bancaria, 5,4 cm, doblada a lo largo: dos caras
//   iguales de 2,7 cm, la de arriba girada 180° para leerse desde el otro
//   lado de la mesa (como las tarjetas QR); el ancho lo elige él: 8,56 cm
//   (la bancaria) o 9,5 cm (la que cabe a dos columnas en un A4);
// - fondo verde del evento a sangre, letra champán, marco fino;
// - «APELLIDO, Nombre» en una línea: el apellido en mayúsculas y negrita
//   para que no se confundan («MESA, Sara», «TOMÁS, Elena»); si no cabe,
//   la letra encoge;
// - el número de la mesa en un círculo dorado;
// - la letra de su familia DENTRO de la mesa (A, B, C…), pequeña, en la
//   esquina: se imprimen mesa por mesa y familia seguida, y así no se
//   separa a nadie al repartirlas (el apellido no basta: matrimonios con
//   apellidos distintos, Abreu01 y Abreu02).
//
// UN solo dibujo para el PDF y para la vista previa (él: «una vista previa
// antes de descargar, no sea que no me guste cómo quede»): se dibuja con
// las órdenes de jsPDF, y la vista previa le pasa un lienzo que entiende
// esas mismas órdenes (PdfEnLienzo). Lo que se ve es lo que se descarga.
import { C } from "../theme";
import { claveFamiliaMesa } from "./mesas";
import { ROL_FAMILIAR } from "./rolFamiliar";
import { PdfEnLienzo, PUNTOS_POR_MM, crearCanvas } from "./pdfEnLienzo";

export const ARCHIVO_TARJETAS_ACOMODACION = "tarjetas-de-acomodacion.pdf";

// Las hojas y los anchos que se pueden elegir (él), en milímetros.
export const HOJAS = {
  a4: { rotulo: "A4", ancho: 210, alto: 297 },
  a3: { rotulo: "A3", ancho: 297, alto: 420 },
};
export const ANCHOS_TARJETA = [85.6, 95];
// El alto, siempre el de la tarjeta bancaria (él).
export const ALTO_TARJETA = 53.98;
// Lo mínimo hasta el borde del papel: menos, y la impresora cortaría el
// verde (él eligió 9,5 cm para que en A4 quepan dos columnas con esto).
const MARGEN_MINIMO = 10;
// El acabado (él: «una paleta con cuatro o cinco posibilidades, y verlo
// antes»; luego pidió el sexto). `fondo`: el de toda la tarjeta, de corte a corte (null = el
// papel, blanco, sin tinta); `recuadro`: el relleno de dentro del marco
// (null = se ve el fondo); `marco`: su línea; el círculo del número, igual
// en todas (dorado), con su contorno; `lineas`: el doblez y los cortes, si
// el gris de siempre no se ve sobre el fondo (el dorado), y su grosor
// (`grosorLineas`); `familia`: la letra de la familia (sobre blanco,
// siempre el verde oscuro, él: se lee mejor que el dorado).
// (Hubo un séptimo, letra dorada con un aura verde difuminada: tras muchas
// pruebas, él lo quitó: no llegaba a lo que buscaba.)
export const ACABADOS = [
  // El de los bocetos: verde a sangre y letra champán.
  { id: "verde", rotulo: "Verde, letra champán", fondo: C.ink, recuadro: null, marco: C.champanClaro, grosorMarco: 0.3, letra: C.champan, familia: C.champanClaro, contornoNumero: C.champan },
  // Blanco con la letra «como está»: el champán no se lee sobre blanco, así
  // que va su tono oscuro, el dorado.
  { id: "blancoDorado", rotulo: "Blanco, letra dorada", fondo: null, recuadro: null, marco: C.gold, grosorMarco: 0.5, letra: C.gold, familia: C.ink, contornoNumero: C.gold },
  // Blanco, letra oscura y el marco en verde.
  { id: "blancoVerde", rotulo: "Blanco, letra verde y marco verde", fondo: null, recuadro: null, marco: C.ink, grosorMarco: 1, letra: C.ink, familia: C.ink, contornoNumero: C.gold },
  // El recuadro verde y por fuera blanco.
  { id: "recuadroVerde", rotulo: "Recuadro verde, borde blanco", fondo: null, recuadro: C.ink, marco: C.ink, grosorMarco: 0.3, letra: C.champan, familia: C.champanClaro, contornoNumero: C.champan },
  // Al revés: por fuera verde y el recuadro blanco.
  { id: "recuadroBlanco", rotulo: "Borde verde, recuadro blanco", fondo: C.ink, recuadro: C.blanco, marco: C.champanClaro, grosorMarco: 0.3, letra: C.ink, familia: C.ink, contornoNumero: C.gold },
  // El 5 con el borde dorado en vez de verde (él): el dorado del círculo.
  // El doblez y los cortes, en verde y más gruesos: en dorado no se veían
  // sobre el dorado (él).
  { id: "recuadroBlancoDorado", rotulo: "Borde dorado, recuadro blanco", fondo: C.goldClaro, recuadro: C.blanco, marco: C.gold, grosorMarco: 0.3, letra: C.ink, familia: C.ink, contornoNumero: C.gold, lineas: C.ink, grosorLineas: 0.7 },
];
const acabado = (id) => ACABADOS.find((a) => a.id === id) || ACABADOS[0];
export const OPCIONES_POR_DEFECTO = { hoja: "a3", ancho: 85.6, acabado: ACABADOS[0].id };

const MM = PUNTOS_POR_MM;

// Cuántas caben por hoja, con el margen mínimo alrededor.
export function rejilla(hoja, ancho) {
  const papel = HOJAS[hoja] || HOJAS.a3;
  const columnas = Math.max(1, Math.floor((papel.ancho - 2 * MARGEN_MINIMO + 0.01) / ancho));
  const filas = Math.max(1, Math.floor((papel.alto - 2 * MARGEN_MINIMO + 0.01) / ALTO_TARJETA));
  return { columnas, filas, porHoja: columnas * filas };
}

// «8,56 cm», como se escribe aquí.
export const textoAncho = (ancho) => `${String(Number((ancho / 10).toFixed(2))).replace(".", ",")} cm`;

const ORDEN_ROL = { [ROL_FAMILIAR.ESPOSO]: 0, [ROL_FAMILIAR.ESPOSA]: 1 };
const comparar = (a, b) => String(a || "").localeCompare(String(b || ""), "es", { numeric: true, sensitivity: "base" });
const letraFamilia = (i) => (i < 26 ? String.fromCharCode(65 + i) : `${String.fromCharCode(65 + Math.floor(i / 26) - 1)}${String.fromCharCode(65 + (i % 26))}`);

// Quién lleva tarjeta y en qué orden: los confirmados con mesa (también
// los bebés), mesa por mesa; dentro de cada mesa, familia por familia, con
// su letra; dentro de la familia, el matrimonio primero. `sinMesa`: los
// confirmados que se quedan sin tarjeta por no tener mesa todavía.
export function tarjetasDeAcomodacion(invitados = []) {
  const vienen = invitados.filter((g) => g.confirmado && !g.noAsiste);
  const conMesa = vienen.filter((g) => g.mesa != null && g.mesa !== "");
  const mesas = [...new Set(conMesa.map((g) => g.mesa))].sort(comparar);
  const tarjetas = [];
  for (const mesa of mesas) {
    const deLaMesa = conMesa.filter((g) => g.mesa === mesa);
    const familias = [...new Set(deLaMesa.map(claveFamiliaMesa))].sort(comparar);
    familias.forEach((clave, i) => {
      deLaMesa
        .filter((g) => claveFamiliaMesa(g) === clave)
        .sort((a, b) => (ORDEN_ROL[a.rolFamiliar] ?? 2) - (ORDEN_ROL[b.rolFamiliar] ?? 2) || comparar(a.nombre, b.nombre))
        .forEach((g) =>
          tarjetas.push({
            id: g.id,
            nombre: String(g.nombre || "").trim(),
            apellido: String(g.apellido || "").trim(),
            mesa,
            familia: letraFamilia(i),
          })
        );
    });
  }
  return { tarjetas, sinMesa: vienen.length - conMesa.length };
}

// ---------- El dibujo ----------

const MARCO = 11; // del corte (o del doblez) al marco, en puntos
const R_NUM = 20; // el círculo del número
const ALTO_CIFRA = 0.716; // alto de las cifras de Helvetica, por punto de letra

// Una cara de la tarjeta. Si va girada, cada punto da la vuelta alrededor
// del centro de la cara.
function cara(pdf, x, y, ancho, alto, girada, t, estilo) {
  const cx = x + ancho / 2;
  const cy = y + alto / 2;
  const p = (px, py) => (girada ? [2 * cx - px, 2 * cy - py] : [px, py]);
  const escribir = (texto, px, base, { centrado = false } = {}) => {
    const desde = centrado ? px - pdf.getTextWidth(texto) / 2 : px;
    if (!girada) pdf.text(texto, desde, base);
    else pdf.text(texto, ...p(desde, base), { angle: 180 });
  };
  // El fondo, de corte a corte (sin fondo, el papel).
  if (estilo.fondo) {
    pdf.setFillColor(estilo.fondo);
    pdf.rect(x, y, ancho, alto, "F");
  }
  // El marco, y lo de dentro si va relleno.
  pdf.setDrawColor(estilo.marco);
  pdf.setLineWidth(estilo.grosorMarco);
  if (estilo.recuadro) pdf.setFillColor(estilo.recuadro);
  const [fx, fy] = p(girada ? x + ancho - MARCO : x + MARCO, girada ? y + alto - MARCO : y + MARCO);
  pdf.roundedRect(fx, fy, ancho - 2 * MARCO, alto - 2 * MARCO, 3, 3, estilo.recuadro ? "FD" : "S");
  // El número de la mesa, en su círculo dorado.
  const nx = x + ancho - MARCO - 8 - R_NUM;
  pdf.setFillColor(C.goldClaro);
  pdf.setDrawColor(estilo.contornoNumero);
  pdf.setLineWidth(2.4);
  pdf.circle(...p(nx, cy), R_NUM - 1.2, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(26);
  pdf.setTextColor(C.ink);
  escribir(String(t.mesa), nx, cy + (26 * ALTO_CIFRA) / 2, { centrado: true });
  // «APELLIDO, Nombre», centrado en el hueco de la izquierda; si no cabe,
  // encoge (hasta 7 puntos: el boceto paraba en 9, pero más vale pequeño
  // que montado sobre el círculo).
  const apellido = t.apellido ? `${t.apellido.toLocaleUpperCase("es")}, ` : "";
  const desde = x + MARCO + 8;
  const hasta = nx - R_NUM - 7;
  let tam = 15;
  const anchoNombre = () => {
    pdf.setFontSize(tam);
    pdf.setFont("helvetica", "bold");
    const a = pdf.getTextWidth(apellido);
    pdf.setFont("helvetica", "normal");
    return a + pdf.getTextWidth(t.nombre);
  };
  while (tam > 7 && anchoNombre() > hasta - desde) tam -= 0.5;
  const total = anchoNombre();
  const x1 = (desde + hasta) / 2 - total / 2;
  const base = cy + (tam * ALTO_CIFRA) / 2;
  pdf.setFont("helvetica", "bold");
  const anchoApellido = pdf.getTextWidth(apellido);
  pdf.setTextColor(estilo.letra);
  escribir(apellido, x1, base);
  pdf.setFont("helvetica", "normal");
  escribir(t.nombre, x1 + anchoApellido, base);
  // La letra de su familia en la mesa, pequeña, en la esquina de abajo.
  if (t.familia) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(estilo.familia);
    escribir(t.familia, x + MARCO + 4, y + alto - MARCO - 4);
  }
}

function tarjeta(pdf, x, y, ancho, t, estilo) {
  const alto = (ALTO_TARJETA * MM) / 2;
  cara(pdf, x, y, ancho, alto, true, t, estilo);
  cara(pdf, x, y + alto, ancho, alto, false, t, estilo);
  // El doblez, de puntos.
  pdf.setDrawColor(estilo.lineas || C.line);
  pdf.setLineWidth(estilo.grosorLineas || 0.4);
  pdf.setLineDashPattern([1, 2], 0);
  pdf.line(x, y + alto, x + ancho, y + alto);
  pdf.setLineDashPattern([], 0);
}

// Todas las hojas: las tarjetas en rejilla, centradas, y los cortes
// discontinuos asomando un poco por fuera. `pdf` es un jsPDF o un
// PdfEnLienzo (la vista previa). Devuelve cuántas hojas salieron.
export function dibujarTarjetasAcomodacion(pdf, tarjetas, { hoja = OPCIONES_POR_DEFECTO.hoja, ancho = OPCIONES_POR_DEFECTO.ancho, acabado: idAcabado } = {}) {
  const papel = HOJAS[hoja] || HOJAS.a3;
  const estilo = acabado(idAcabado);
  const { columnas, filas, porHoja } = rejilla(hoja, ancho);
  const W = ancho * MM;
  const H = ALTO_TARJETA * MM;
  const x0 = (papel.ancho * MM - columnas * W) / 2;
  const y0 = (papel.alto * MM - filas * H) / 2;
  const hojas = Math.max(1, Math.ceil(tarjetas.length / porHoja));
  for (let h = 0; h < hojas; h++) {
    if (h > 0) pdf.addPage(hoja, "portrait");
    const deEsta = tarjetas.slice(h * porHoja, (h + 1) * porHoja);
    deEsta.forEach((t, i) => tarjeta(pdf, x0 + (i % columnas) * W, y0 + Math.floor(i / columnas) * H, W, t, estilo));
    // Los cortes, solo hasta donde hay tarjetas.
    const filasUsadas = Math.max(1, Math.ceil(deEsta.length / columnas));
    const columnasUsadas = Math.min(columnas, Math.max(1, deEsta.length));
    pdf.setDrawColor(estilo.lineas || C.line);
    pdf.setLineWidth(estilo.grosorLineas || 0.4);
    pdf.setLineDashPattern([4, 3], 0);
    for (let c = 0; c <= columnasUsadas; c++) pdf.line(x0 + c * W, y0 - 12, x0 + c * W, y0 + filasUsadas * H + 12);
    for (let f = 0; f <= filasUsadas; f++) pdf.line(x0 - 12, y0 + f * H, x0 + columnasUsadas * W + 12, y0 + f * H);
    pdf.setLineDashPattern([], 0);
  }
  return hojas;
}

// El PDF para descargar. jsPDF pesa: se carga solo al usarlo.
export async function pdfTarjetasAcomodacion(tarjetas, opciones) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: opciones?.hoja || OPCIONES_POR_DEFECTO.hoja });
  dibujarTarjetasAcomodacion(pdf, tarjetas, opciones);
  return pdf.output("blob");
}

// ---------- La vista previa ----------

// Las hojas de la vista previa, como imágenes. `escala`: píxeles por punto.
export function vistaPreviaTarjetasAcomodacion(tarjetas, opciones, { escala = 1.4, crearLienzo = crearCanvas } = {}) {
  const papel = HOJAS[opciones?.hoja] || HOJAS[OPCIONES_POR_DEFECTO.hoja];
  const lienzo = new PdfEnLienzo({ medida: { ancho: papel.ancho * MM, alto: papel.alto * MM }, escala, crearLienzo });
  dibujarTarjetasAcomodacion(lienzo, tarjetas, opciones);
  if (!lienzo.ctx) return [];
  return lienzo.paginas.map((p) => p.toDataURL("image/jpeg", 0.85));
}

// La muestra de un acabado, para elegirlo: una cara de una tarjeta de
// ejemplo, del mismo dibujo que el PDF.
const EJEMPLO = { nombre: "Luis", apellido: "Abreu", mesa: 3, familia: "A" };
export function muestraAcabado(idAcabado, ancho = OPCIONES_POR_DEFECTO.ancho, { escala = 1, crearLienzo = crearCanvas } = {}) {
  const medida = { ancho: ancho * MM, alto: (ALTO_TARJETA * MM) / 2 };
  const lienzo = new PdfEnLienzo({ medida, escala, crearLienzo });
  cara(lienzo, 0, 0, medida.ancho, medida.alto, false, EJEMPLO, acabado(idAcabado));
  return lienzo.ctx ? lienzo.paginas[0].toDataURL("image/png") : "";
}
