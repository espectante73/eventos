// Las tarjetas de acomodación (él, v97; el nombre es suyo, no «de sitio»):
// el nombre de cada invitado en su mesa, de pie, para que cada uno
// encuentre su sitio. Una por invitado, BEBÉS
// INCLUIDOS (él: «tarjetas para todos»): los confirmados con mesa.
//
// Cómo son (decidido con él a base de bocetos):
// - doblada a lo largo: dos caras iguales, CADA UNA del alto de una
//   tarjeta bancaria, 5,4 cm (él, v98.9: «la medida de tarjeta bancaria por
//   cada lado»; antes las dos juntas medían eso), la de arriba girada 180°
//   para leerse desde el otro lado de la mesa (como las tarjetas QR); de
//   ancho, el de la bancaria, 8,56 cm, el único (él, v98.9: retiró el de
//   9,5 cm: «nos quedamos con el modelo de tarjeta bancaria»);
// - fondo verde del evento a sangre, letra champán, marco fino;
// - el APELLIDO arriba, en mayúsculas y negrita para que no se confundan
//   («MESA, Sara», «TOMÁS, Elena»), y el nombre debajo (él, v98.9; antes
//   «APELLIDO, Nombre» en una línea); si no cabe, la letra encoge;
// - el número de la mesa en un círculo dorado;
// - la letra de su familia DENTRO de la mesa (A, B, C…), pequeña, en la
//   esquina: se imprimen mesa por mesa y familia seguida, y así no se
//   separa a nadie al repartirlas (el apellido no basta: matrimonios con
//   apellidos distintos, Abreu01 y Abreu02). Solo la llevan las familias
//   de dos o más en esa mesa: quien viene solo, sin letra (él, v98.9: dos
//   solteros con A y B parecían ir juntos);
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

// Las hojas que se pueden elegir (él), en milímetros.
export const HOJAS = {
  a4: { rotulo: "A4", ancho: 210, alto: 297 },
  a3: { rotulo: "A3", ancho: 297, alto: 420 },
};
// La tarjeta bancaria: su ancho, y cada cara de su alto (él, v98.9);
// abierta, el doble de alto.
export const ANCHO_TARJETA = 85.6;
export const ALTO_CARA = 53.98;
export const ALTO_TARJETA = 2 * ALTO_CARA;
// Lo mínimo hasta el borde del papel: menos, y la impresora cortaría el
// verde.
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
  // Blanco con el rectángulo dorado (él, v98.2: «quitamos el dorado
  // exterior, pero dejamos el rectángulo dorado»): el marco, grueso y en el
  // dorado del círculo. Antes llevaba todo el borde dorado, y por eso el
  // doblez y los cortes iban en verde; sobre blanco, los de siempre. El id
  // se queda: es lo que cada aparato tiene guardado.
  { id: "recuadroBlancoDorado", rotulo: "Blanco, rectángulo dorado", fondo: null, recuadro: null, marco: C.goldClaro, grosorMarco: 1.5, letra: C.ink, familia: C.ink, contornoNumero: C.gold },
];
const acabado = (id) => ACABADOS.find((a) => a.id === id) || ACABADOS[0];
// Con qué se van a cortar, y así, qué marcas lleva la hoja (él, v99: «la
// opción de poner unas marcas u otras para el corte»; lo decide quien
// corta, el rotulista):
// - guillotina: las marcas de imprenta, cortas, en los bordes (v98.9);
// - tijera o cúter: la línea entera de cada corte, de punta a punta;
// - plóter: marcas de REGISTRO en las cuatro esquinas, las que lee la
//   máquina para saber dónde está la hoja (un cuadrado y tres escuadras,
//   las más corrientes; cada marca de plóter tiene las suyas).
export const CORTES = [
  { id: "guillotina", rotulo: "Guillotina" },
  { id: "tijera", rotulo: "Tijera o cúter" },
  { id: "ploter", rotulo: "Plóter" },
];
export const OPCIONES_POR_DEFECTO = { hoja: "a3", corte: CORTES[0].id, acabado: ACABADOS[0].id };

const MM = PUNTOS_POR_MM;

// Cuántas caben por hoja, con el margen mínimo alrededor.
export function rejilla(hoja) {
  const papel = HOJAS[hoja] || HOJAS.a3;
  const columnas = Math.max(1, Math.floor((papel.ancho - 2 * MARGEN_MINIMO + 0.01) / ANCHO_TARJETA));
  const filas = Math.max(1, Math.floor((papel.alto - 2 * MARGEN_MINIMO + 0.01) / ALTO_TARJETA));
  return { columnas, filas, porHoja: columnas * filas };
}

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
    let letras = 0;
    for (const clave of familias) {
      const suyos = deLaMesa
        .filter((g) => claveFamiliaMesa(g) === clave)
        .sort((a, b) => (ORDEN_ROL[a.rolFamiliar] ?? 2) - (ORDEN_ROL[b.rolFamiliar] ?? 2) || comparar(a.nombre, b.nombre));
      const letra = suyos.length > 1 ? letraFamilia(letras++) : "";
      for (const g of suyos)
        tarjetas.push({
          id: g.id,
          nombre: String(g.nombre || "").trim(),
          apellido: String(g.apellido || "").trim(),
          mesa,
          familia: letra,
        });
    }
  }
  return { tarjetas, sinMesa: vienen.length - conMesa.length };
}

// ---------- El dibujo ----------

// Con la cara del doble de alto (v98.9), todo algo más grande; el ancho es
// el mismo, así que el nombre sigue encogiendo si no cabe.
const MARCO = 14; // del corte (o del doblez) al marco, en puntos
const R_NUM = 30; // el círculo del número
const TAM_NUMERO = 40;
const TAM_NOMBRE = 20; // el de entrada; si no cabe, encoge
const TAM_FAMILIA = 11;
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
  pdf.setLineWidth(3);
  pdf.circle(...p(nx, cy), R_NUM - 1.5, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(TAM_NUMERO);
  pdf.setTextColor(C.ink);
  escribir(String(t.mesa), nx, cy + (TAM_NUMERO * ALTO_CIFRA) / 2, { centrado: true });
  // En dos líneas (él, v98.9, con la cara del doble de alto): arriba el
  // APELLIDO, en mayúsculas y negrita para que no se confundan («MESA,
  // Sara», «TOMÁS, Elena»), y debajo el nombre; ya sin la coma. Centrado en
  // el hueco de la izquierda, las dos de la misma letra; si alguna no cabe,
  // encogen las dos (hasta 7 puntos: más vale pequeño que montado sobre el
  // círculo). Sin apellido, solo el nombre.
  const apellido = t.apellido ? t.apellido.toLocaleUpperCase("es") : "";
  const desde = x + MARCO + 8;
  const hasta = nx - R_NUM - 7;
  const medio = (desde + hasta) / 2;
  let tam = TAM_NOMBRE;
  const anchos = () => {
    pdf.setFontSize(tam);
    pdf.setFont("helvetica", "bold");
    const a = pdf.getTextWidth(apellido);
    pdf.setFont("helvetica", "normal");
    return [a, pdf.getTextWidth(t.nombre)];
  };
  while (tam > 7 && Math.max(...anchos()) > hasta - desde) tam -= 0.5;
  const [anchoApellido, anchoNombre] = anchos();
  const alto1 = tam * ALTO_CIFRA;
  const entreLineas = tam * 1.3;
  pdf.setTextColor(estilo.letra);
  if (apellido) {
    // Las dos líneas, centradas en alto: de lo alto de las mayúsculas a la
    // base del nombre.
    const base1 = cy + (alto1 - entreLineas) / 2;
    pdf.setFont("helvetica", "bold");
    escribir(apellido, medio - anchoApellido / 2, base1);
    pdf.setFont("helvetica", "normal");
    escribir(t.nombre, medio - anchoNombre / 2, base1 + entreLineas);
  } else {
    pdf.setFont("helvetica", "normal");
    escribir(t.nombre, medio - anchoNombre / 2, cy + alto1 / 2);
  }
  // La letra de su familia en la mesa, pequeña, en la esquina de abajo.
  if (t.familia) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(TAM_FAMILIA);
    pdf.setTextColor(estilo.familia);
    escribir(t.familia, x + MARCO + 6, y + alto - MARCO - 6);
  }
}

// Una tarjeta abierta: la cara de arriba, girada, y la de abajo. Las dos
// iguales, salvo en la hoja de muestra (una con cada acabado): por eso cada
// cara lleva lo suyo, [tarjeta, estilo].
function tarjeta(pdf, x, y, ancho, [tArriba, estiloArriba], [tAbajo, estiloAbajo] = [tArriba, estiloArriba]) {
  const alto = ALTO_CARA * MM;
  cara(pdf, x, y, ancho, alto, true, tArriba, estiloArriba);
  cara(pdf, x, y + alto, ancho, alto, false, tAbajo, estiloAbajo);
  // El doblez, de puntos.
  pdf.setDrawColor(estiloAbajo.lineas || C.line);
  pdf.setLineWidth(estiloAbajo.grosorLineas || 0.4);
  pdf.setLineDashPattern([1, 2], 0);
  pdf.line(x, y + alto, x + ancho, y + alto);
  pdf.setLineDashPattern([], 0);
}

// Todas las hojas: las tarjetas en rejilla, centradas, y por fuera las
// marcas para cortar, las de la forma de cortar elegida. `pdf` es un jsPDF o un
// PdfEnLienzo (la vista previa). Devuelve cuántas hojas salieron.
export function dibujarTarjetasAcomodacion(pdf, tarjetas, { hoja = OPCIONES_POR_DEFECTO.hoja, corte = OPCIONES_POR_DEFECTO.corte, acabado: idAcabado } = {}) {
  const estilo = acabado(idAcabado);
  const sitio = colocacion(hoja);
  const hojas = Math.max(1, Math.ceil(tarjetas.length / sitio.porHoja));
  for (let h = 0; h < hojas; h++) {
    if (h > 0) pdf.addPage(hoja, "portrait");
    const deEsta = tarjetas.slice(h * sitio.porHoja, (h + 1) * sitio.porHoja);
    deEsta.forEach((t, i) => tarjeta(pdf, ...sitio.hueco(i), sitio.W, [t, estilo]));
    marcasDeLaHoja(pdf, sitio, deEsta.length, corte);
  }
  return hojas;
}

// Dónde va cada tarjeta en la hoja: la rejilla, centrada. Una sola cuenta
// para las tarjetas y para la hoja de muestra.
function colocacion(hoja) {
  const papel = HOJAS[hoja] || HOJAS.a3;
  const { columnas, filas, porHoja } = rejilla(hoja);
  const W = ANCHO_TARJETA * MM;
  const H = ALTO_TARJETA * MM;
  const x0 = (papel.ancho * MM - columnas * W) / 2;
  const y0 = (papel.alto * MM - filas * H) / 2;
  const hueco = (i) => [x0 + (i % columnas) * W, y0 + Math.floor(i / columnas) * H];
  return { papel, columnas, filas, porHoja, W, H, x0, y0, hueco };
}

// Las marcas para cortar de una hoja con `cuantas` tarjetas. Las de
// registro, en el mismo sitio en todas las hojas: las esquinas de la
// rejilla entera, haya o no tarjetas.
function marcasDeLaHoja(pdf, { columnas, filas, W, H, x0, y0 }, cuantas, corte) {
  if (corte === "ploter") marcasDeRegistro(pdf, x0, y0, x0 + columnas * W, y0 + filas * H);
  marcasDeCorte(pdf, x0, y0, W, H, Math.min(columnas, Math.max(1, cuantas)), Math.max(1, Math.ceil(cuantas / columnas)), corte);
}

// ---------- La hoja de muestra ----------

// La tarjeta de ejemplo: la de las muestras de la paleta y la de la hoja de
// muestra. La mesa, de dos cifras (v99.1): se ve cómo queda en el círculo y
// no se confunde con el número del acabado de la esquina (del 1 al 6).
const EJEMPLO = { nombre: "Luis", apellido: "Abreu", mesa: 12, familia: "A" };

// Él (v99.1): «una hoja modelo… que me aparezcan los 6 modelos… y poder
// verlo en vivo». Tres tarjetas de ejemplo, cada CARA con un acabado (en
// una cara uno y en la otra otro): los seis en una sola hoja, por una sola
// cara del papel. En la esquina de cada cara, donde va la letra de la
// familia, su número; y arriba, la leyenda, en el orden de la paleta.
export const ARCHIVO_MUESTRA_ACABADOS = "muestra-acabados-tarjetas.pdf";
const TAM_LEYENDA = 9;
export function dibujarMuestraAcabados(pdf, { hoja = OPCIONES_POR_DEFECTO.hoja, corte = OPCIONES_POR_DEFECTO.corte } = {}) {
  const sitio = colocacion(hoja);
  const conNumero = (i) => [{ ...EJEMPLO, familia: String(i + 1) }, ACABADOS[i]];
  const cuantas = Math.ceil(ACABADOS.length / 2);
  for (let i = 0; i < cuantas; i++) {
    const abajo = ACABADOS[2 * i + 1] ? conNumero(2 * i + 1) : conNumero(2 * i);
    tarjeta(pdf, ...sitio.hueco(i), sitio.W, conNumero(2 * i), abajo);
  }
  marcasDeLaHoja(pdf, sitio, cuantas, corte);
  // La leyenda, centrada en el margen de arriba, de tres en tres.
  const lineas = [
    `Muestra de los ${ACABADOS.length} acabados: el número de cada uno, en la esquina de su cara.`,
    ...[0, 3].map((d) => ACABADOS.slice(d, d + 3).map((a, i) => `${d + i + 1} ${a.rotulo}`).join("  ·  ")),
  ];
  pdf.setFontSize(TAM_LEYENDA);
  pdf.setTextColor(C.ink);
  lineas.forEach((texto, i) => {
    pdf.setFont("helvetica", i === 0 ? "bold" : "normal");
    pdf.text(texto, (sitio.papel.ancho * MM - pdf.getTextWidth(texto)) / 2, (10 + 4.5 * i) * MM);
  });
  return 1;
}

export async function pdfMuestraAcabados(opciones) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: opciones?.hoja || OPCIONES_POR_DEFECTO.hoja });
  dibujarMuestraAcabados(pdf, opciones);
  return pdf.output("blob");
}

// La hoja de muestra, como imagen (el boceto y las pruebas).
export function vistaPreviaMuestraAcabados(opciones, { escala = 1.4, crearLienzo = crearCanvas } = {}) {
  const papel = HOJAS[opciones?.hoja] || HOJAS[OPCIONES_POR_DEFECTO.hoja];
  const lienzo = new PdfEnLienzo({ medida: { ancho: papel.ancho * MM, alto: papel.alto * MM }, escala, crearLienzo });
  dibujarMuestraAcabados(lienzo, opciones);
  return lienzo.ctx ? lienzo.paginas[0].toDataURL("image/jpeg", 0.85) : "";
}

// Las marcas de corte, como las de imprenta (él, v98.9: las pidió el
// rotulista; las rayas grises de puntos de antes, de lado a lado, no se
// veían): cortas, negras y continuas, FUERA de las tarjetas, una en cada
// extremo de cada corte, con un hueco para que no asomen en la tarjeta
// cortada. A los lados, a la altura de cada doblez, otra discontinua. Solo
// hasta donde hay tarjetas. El largo, el que quepa en el margen, dejando
// 3 mm hasta el borde del papel. Con tijera o cúter, cada corte entero, de
// la marca de un lado a la del otro; con el plóter, solo las del doblez
// (dónde cortar lo saca él de las marcas de registro).
const HUECO_MARCA = 2 * MM;
const LARGO_MARCA = 6 * MM;
const BORDE_PAPEL = 3 * MM;
function marcasDeCorte(pdf, x0, y0, W, H, columnas, filas, corte) {
  const xFin = x0 + columnas * W;
  const yFin = y0 + filas * H;
  const largo = (margen) => Math.max(2 * MM, Math.min(LARGO_MARCA, margen - HUECO_MARCA - BORDE_PAPEL));
  const largoV = largo(y0);
  const largoH = largo(x0);
  const entera = corte === "tijera";
  const vertical = (x) => {
    if (entera) return pdf.line(x, y0 - HUECO_MARCA - largoV, x, yFin + HUECO_MARCA + largoV);
    pdf.line(x, y0 - HUECO_MARCA - largoV, x, y0 - HUECO_MARCA);
    pdf.line(x, yFin + HUECO_MARCA, x, yFin + HUECO_MARCA + largoV);
  };
  const horizontal = (y, toda = entera) => {
    if (toda) return pdf.line(x0 - HUECO_MARCA - largoH, y, xFin + HUECO_MARCA + largoH, y);
    pdf.line(x0 - HUECO_MARCA - largoH, y, x0 - HUECO_MARCA, y);
    pdf.line(xFin + HUECO_MARCA, y, xFin + HUECO_MARCA + largoH, y);
  };
  pdf.setDrawColor(C.negro);
  pdf.setLineWidth(0.5);
  if (corte !== "ploter") {
    for (let c = 0; c <= columnas; c++) vertical(x0 + c * W);
    for (let f = 0; f <= filas; f++) horizontal(y0 + f * H);
  }
  // El doblez, en medio de cada fila.
  pdf.setLineDashPattern([2, 2], 0);
  for (let f = 0; f < filas; f++) horizontal(y0 + f * H + H / 2, false);
  pdf.setLineDashPattern([], 0);
}

// Las marcas de registro del plóter: un cuadrado negro arriba a la
// izquierda y una escuadra en cada una de las otras tres esquinas, a 4 mm
// de las tarjetas (fuera de lo que se corta).
const LADO_REGISTRO = 5 * MM;
const BRAZO_REGISTRO = 10 * MM;
const GROSOR_REGISTRO = 0.5 * MM;
const AIRE_REGISTRO = 4 * MM;
function marcasDeRegistro(pdf, x0, y0, xFin, yFin) {
  const izq = x0 - AIRE_REGISTRO - LADO_REGISTRO;
  const arr = y0 - AIRE_REGISTRO - LADO_REGISTRO;
  const der = xFin + AIRE_REGISTRO + LADO_REGISTRO;
  const aba = yFin + AIRE_REGISTRO + LADO_REGISTRO;
  pdf.setFillColor(C.negro);
  pdf.rect(izq, arr, LADO_REGISTRO, LADO_REGISTRO, "F");
  // La escuadra con el pico en (x, y); sus brazos van hacia dentro.
  const escuadra = (x, y, haciaDerecha, haciaAbajo) => {
    pdf.rect(haciaDerecha ? x : x - BRAZO_REGISTRO, haciaAbajo ? y : y - GROSOR_REGISTRO, BRAZO_REGISTRO, GROSOR_REGISTRO, "F");
    pdf.rect(haciaDerecha ? x : x - GROSOR_REGISTRO, haciaAbajo ? y : y - BRAZO_REGISTRO, GROSOR_REGISTRO, BRAZO_REGISTRO, "F");
  };
  escuadra(der, arr, false, true);
  escuadra(izq, aba, true, false);
  escuadra(der, aba, false, false);
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
// ejemplo, del mismo dibujo que el PDF. En la esquina, su número, el mismo
// que en la hoja de muestra (v99.1): lo impreso y la paleta, a la par.
export function muestraAcabado(idAcabado, { escala = 1, crearLienzo = crearCanvas } = {}) {
  const medida = { ancho: ANCHO_TARJETA * MM, alto: ALTO_CARA * MM };
  const lienzo = new PdfEnLienzo({ medida, escala, crearLienzo });
  const numero = ACABADOS.findIndex((a) => a.id === idAcabado) + 1;
  cara(lienzo, 0, 0, medida.ancho, medida.alto, false, { ...EJEMPLO, familia: numero ? String(numero) : EJEMPLO.familia }, acabado(idAcabado));
  return lienzo.ctx ? lienzo.paginas[0].toDataURL("image/png") : "";
}
