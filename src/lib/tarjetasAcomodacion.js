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
// - con el estilo de la invitación (v99.2, la línea que él eligió): papel
//   blanco, el adorno de hojas y volutas en la esquina (el suyo, v99.4) y
//   el marco dorado, fino o doble (ACABADOS);
// - el APELLIDO arriba, en mayúsculas para que no se confundan («MESA,
//   Sara», «TOMÁS, Elena»), y el nombre debajo en caligráfica dorada, con
//   el corazón de la invitación (él, v98.9; antes «APELLIDO, Nombre» en
//   una línea); si no cabe, la letra encoge;
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
import { PdfEnLienzo, PUNTOS_POR_MM, crearCanvas, cargarImagen } from "./pdfEnLienzo";

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
// El acabado: la línea de la invitación (él, v99.2: «con esta parte de la
// invitación, poner su motivo o estilo en la tarjeta en modo claro»; eligió
// el boceto 3 y, con el doble marco del 2, las dos maneras; luego: «me quedo
// solo con estos 3 modelos que serán la nueva línea y los otros 6 los
// desechamos»). Papel blanco, el adorno de la esquina, el APELLIDO en Fraunces (la letra de «LAS BODAS»), el nombre en
// letra caligráfica dorada («de todos») con el corazón debajo, y el número
// de la mesa en el círculo dorado. Cambia el marco: `marcos`, cada uno
// [distancia al corte, grosor]; el grueso, 3, y 6 entre las dos líneas (él,
// v99.6: «el grueso más grueso, el doble; el aire, el doble»; eran 1,5 y 3).
// Esquinas rectas (él, v99.6: «recuadro menos redondeado», eligió la recta
// del todo). (Los seis de
// antes —verdes, champán, rectángulo dorado— y el del aura, quitados por
// él: no volver a ellos.)
const LINEA_INVITACION = { marco: C.gold, letra: C.ink, letraNombre: C.gold, familia: C.ink, contornoNumero: C.gold };
export const ACABADOS = [
  { ...LINEA_INVITACION, id: "blancoHojas", rotulo: "Marco fino", marcos: [[9, 0.5]] },
  { ...LINEA_INVITACION, id: "blancoHojasGruesoFuera", rotulo: "Doble marco, grueso fuera", marcos: [[8, 3], [14, 0.4]] },
  { ...LINEA_INVITACION, id: "blancoHojasGruesoDentro", rotulo: "Doble marco, grueso dentro", marcos: [[8, 0.4], [14, 3]] },
  // El plan B (él, v99.7: «añadimos a las 3 opciones existentes B2»): sin
  // círculo; «MESA» y el número grande a la derecha, tras una línea dorada.
  { ...LINEA_INVITACION, id: "blancoHojasNumeroGrande", rotulo: "Marco fino, número grande", marcos: [[9, 0.5]], numero: "grande" },
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
// Plegada o de una cara (él, v99.8: «que tenga la opción de tarjeta para
// plegar o que sea solo tamaño de una cara tarjeta bancaria»): de una cara,
// plana, sin doblez; caben el doble y algo más por hoja.
export const FORMATOS = [
  { id: "plegar", rotulo: "Para plegar" },
  { id: "cara", rotulo: "Una cara" },
];
export const OPCIONES_POR_DEFECTO = { hoja: "a3", corte: CORTES[0].id, acabado: ACABADOS[0].id, formato: FORMATOS[0].id };
const deUnaCara = (formato) => formato === "cara";

const MM = PUNTOS_POR_MM;

// Cuántas caben por hoja, con el margen mínimo alrededor.
export function rejilla(hoja, formato = OPCIONES_POR_DEFECTO.formato) {
  const papel = HOJAS[hoja] || HOJAS.a3;
  const columnas = Math.max(1, Math.floor((papel.ancho - 2 * MARGEN_MINIMO + 0.01) / ANCHO_TARJETA));
  const filas = Math.max(1, Math.floor((papel.alto - 2 * MARGEN_MINIMO + 0.01) / (deUnaCara(formato) ? ALTO_CARA : ALTO_TARJETA)));
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

// Las medidas de la cara, en puntos.
const MARCO = 14; // del corte (o del doblez) al hueco del nombre y la letra de la familia
// El círculo del número: 40 de ancho, con el número a su escala (él, v99.6:
// «baja el número con el círculo»; eran 60 y 38).
const R_NUM = 20;
const TAM_FAMILIA = 11;
const ALTO_CIFRA = 0.716; // alto de las mayúsculas y las cifras, por punto de letra
// El adorno de la esquina (él, v99.4): entero y con el marco pasando por
// debajo. Antes, unas hojas cortadas por el borde y el marco cortado donde
// empezaban: «mal presentado». Desde v99.6 (él: «más adentro, que apenas
// toque el marco grueso»), sus puntas llegan justo al centro de la línea
// gruesa (en el marco fino, de la única): con el grueso dentro, la fina de
// fuera queda fuera del adorno.
const ESQUINA_ANCHO = 82;
const lineaDelAdorno = (marcos) => marcos.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
const TAM_APELLIDO = 16; // el de entrada; si no cabe, encoge
export const ESPACIADO_APELLIDO = 1.5; // entre letras, como «LAS BODAS»
const TAM_NOMBRE = 30; // el de entrada; si no cabe, encoge
export const ALTO_CALIGRAFICA = 0.62; // lo que sube la caligráfica, por punto de letra
const TAM_NUMERO = 25;
// El número grande (plan B2): su columna, a la derecha de una línea dorada.
const COLUMNA_NUMERO = 56; // de la línea al hueco del marco
const TAM_NUMERO_GRANDE = 44;
const TAM_MESA = 8;
const ESPACIADO_MESA = 2.5;
const MEDIO_ALTO_LINEA = 46.5; // la línea, de arriba abajo desde el centro
// Los nombres de las dos letras de la invitación: en jsPDF y en el lienzo
// (pdfEnLienzo.js). Si no se cargaron, las de siempre de jsPDF. También
// las usan los sobres de los matrimonios (v99.3).
export const SERIF = "fraunces";
export const CALIGRAFICA = "alexbrush";

// Una cara de la tarjeta: el marco o los dos marcos, el adorno en la
// esquina de arriba a la izquierda, por encima del marco, el número de la
// mesa en su círculo dorado y, en medio del hueco de la izquierda, el
// APELLIDO, el nombre en caligráfica y el corazón. Si va girada, cada punto
// da la vuelta alrededor del centro de la cara. Sin `adornos` (no se
// cargaron), sin adorno ni corazón y con la letra de siempre: se sigue
// pudiendo imprimir.
function cara(pdf, x, y, ancho, alto, girada, t, estilo, adornos) {
  const cx = x + ancho / 2;
  const cy = y + alto / 2;
  const p = (px, py) => (girada ? [2 * cx - px, 2 * cy - py] : [px, py]);
  // Una caja, en su sitio de la cara girada (la imagen, ya girada).
  const caja = (bx, by, w, h) => (girada ? [2 * cx - bx - w, 2 * cy - by - h, w, h] : [bx, by, w, h]);
  const escribir = (texto, px, base, charSpace = 0) => {
    if (!girada) pdf.text(texto, px, base, { charSpace });
    else pdf.text(texto, ...p(px, base), { angle: 180, charSpace });
  };
  const imagen = (cual, bx, by, w) => {
    const im = girada ? adornos[`${cual}Girada`] : adornos[cual];
    pdf.addImage(im.dato, "PNG", ...caja(bx, by, w, w * im.proporcion), `${cual}${girada ? "Girada" : ""}`, "FAST");
  };
  const [serif, estiloSerif] = adornos ? [SERIF, "normal"] : ["helvetica", "bold"];
  const caligrafica = adornos ? CALIGRAFICA : "helvetica";
  // Los marcos (iguales girados: están centrados).
  pdf.setDrawColor(estilo.marco);
  for (const [m, grosor] of estilo.marcos) {
    pdf.setLineWidth(grosor);
    pdf.rect(x + m, y + m, ancho - 2 * m, alto - 2 * m, "S");
  }
  // El adorno, encima: el marco pasa por debajo, entero.
  const enLinea = lineaDelAdorno(estilo.marcos);
  if (adornos) imagen("esquina", x + enLinea, y + enLinea, ESQUINA_ANCHO);
  const numero = String(t.mesa);
  let hasta;
  if (estilo.numero === "grande") {
    // «MESA» y el número grande, en su columna tras la línea dorada; si un
    // número no cabe a lo ancho, encoge.
    const lx = x + ancho - MARCO - COLUMNA_NUMERO;
    const nx = lx + COLUMNA_NUMERO / 2;
    pdf.setDrawColor(estilo.marco);
    pdf.setLineWidth(0.6);
    pdf.line(...p(lx, cy - MEDIO_ALTO_LINEA), ...p(lx, cy + MEDIO_ALTO_LINEA));
    pdf.setFont(serif, estiloSerif);
    let tam = TAM_NUMERO_GRANDE;
    pdf.setFontSize(tam);
    while (tam > 20 && pdf.getTextWidth(numero) > COLUMNA_NUMERO - 6) pdf.setFontSize((tam -= 1));
    const altoBloque = TAM_MESA * ALTO_CIFRA + 6 + tam * ALTO_CIFRA;
    const anchoNumero = pdf.getTextWidth(numero);
    pdf.setTextColor(C.ink);
    escribir(numero, nx - anchoNumero / 2, cy + altoBloque / 2);
    pdf.setFontSize(TAM_MESA);
    pdf.setTextColor(estilo.marco);
    const anchoMesa = pdf.getTextWidth("MESA") + ESPACIADO_MESA * 3;
    escribir("MESA", nx - anchoMesa / 2, cy - altoBloque / 2 + TAM_MESA * ALTO_CIFRA, ESPACIADO_MESA);
    hasta = lx - 8;
  } else {
    // El número de la mesa, en su círculo dorado.
    const nx = x + ancho - MARCO - 8 - R_NUM;
    pdf.setFillColor(C.goldClaro);
    pdf.setDrawColor(estilo.contornoNumero);
    pdf.setLineWidth(3);
    pdf.circle(...p(nx, cy), R_NUM - 1.5, "FD");
    pdf.setFont(serif, estiloSerif);
    pdf.setFontSize(TAM_NUMERO);
    pdf.setTextColor(C.ink);
    escribir(numero, nx - pdf.getTextWidth(numero) / 2, cy + (TAM_NUMERO * ALTO_CIFRA) / 2);
    hasta = nx - R_NUM - 7;
  }
  // El nombre, en dos líneas (él, v98.9): arriba el APELLIDO, en
  // mayúsculas para que no se confundan («MESA, Sara», «TOMÁS, Elena»), y
  // debajo el nombre. Si no cabe, encoge cada línea por su lado.
  const desde = x + MARCO + 8;
  const medio = (desde + hasta) / 2;
  const hueco = hasta - desde;
  const apellido = t.apellido ? t.apellido.toLocaleUpperCase("es") : "";
  const anchoApellido = (tam) => {
    pdf.setFont(serif, estiloSerif);
    pdf.setFontSize(tam);
    return pdf.getTextWidth(apellido) + ESPACIADO_APELLIDO * Math.max(0, apellido.length - 1);
  };
  const anchoNombre = (tam) => {
    pdf.setFont(caligrafica, "normal");
    pdf.setFontSize(tam);
    return pdf.getTextWidth(t.nombre);
  };
  let ta = TAM_APELLIDO;
  while (apellido && ta > 8 && anchoApellido(ta) > hueco) ta -= 0.5;
  let tn = adornos ? TAM_NOMBRE : TAM_APELLIDO;
  while (tn > 8 && anchoNombre(tn) > hueco) tn -= 0.5;
  const anchoCorazon = hueco * 0.85;
  const altoCorazon = adornos ? anchoCorazon * adornos.corazon.proporcion : 0;
  const altoApellido = apellido ? ta * ALTO_CIFRA + 7 : 0;
  const altoNombre = tn * (adornos ? ALTO_CALIGRAFICA : ALTO_CIFRA);
  const bloque = altoApellido + altoNombre + (altoCorazon ? 4 + altoCorazon : 0);
  let base = cy - bloque / 2;
  if (apellido) {
    base += ta * ALTO_CIFRA;
    const w = anchoApellido(ta);
    pdf.setTextColor(estilo.letra);
    escribir(apellido, medio - w / 2, base, ESPACIADO_APELLIDO);
    base += 7;
  }
  base += altoNombre;
  const w = anchoNombre(tn);
  pdf.setTextColor(estilo.letraNombre);
  escribir(t.nombre, medio - w / 2, base);
  if (adornos) imagen("corazon", medio - anchoCorazon / 2, base + 4, anchoCorazon);
  // La letra de su familia dentro de la mesa (o, en la hoja de muestra, el
  // número del acabado), pequeña, en la esquina de abajo.
  if (t.familia) {
    pdf.setFont(serif, estiloSerif);
    pdf.setFontSize(TAM_FAMILIA);
    pdf.setTextColor(estilo.familia);
    escribir(t.familia, x + MARCO + 6, y + alto - MARCO - 6);
  }
}

// Una tarjeta abierta: la cara de arriba, girada, y la de abajo. Las dos
// iguales, salvo en la hoja de muestra (una con cada acabado): por eso cada
// cara lleva lo suyo, [tarjeta, estilo].
function tarjeta(pdf, x, y, ancho, adornos, [tArriba, estiloArriba], [tAbajo, estiloAbajo] = [tArriba, estiloArriba]) {
  const alto = ALTO_CARA * MM;
  cara(pdf, x, y, ancho, alto, true, tArriba, estiloArriba, adornos);
  cara(pdf, x, y + alto, ancho, alto, false, tAbajo, estiloAbajo, adornos);
  // El doblez, de puntos.
  pdf.setDrawColor(C.line);
  pdf.setLineWidth(0.4);
  pdf.setLineDashPattern([1, 2], 0);
  pdf.line(x, y + alto, x + ancho, y + alto);
  pdf.setLineDashPattern([], 0);
}

// Todas las hojas: las tarjetas en rejilla, centradas, y por fuera las
// marcas para cortar, las de la forma de cortar elegida. `pdf` es un jsPDF o un
// PdfEnLienzo (la vista previa); `adornos`, el adorno y las letras de la
// invitación (cargarAdornos), si se cargaron. Devuelve cuántas hojas salieron.
export function dibujarTarjetasAcomodacion(
  pdf,
  tarjetas,
  { hoja = OPCIONES_POR_DEFECTO.hoja, corte = OPCIONES_POR_DEFECTO.corte, acabado: idAcabado, formato = OPCIONES_POR_DEFECTO.formato } = {},
  adornos = null,
) {
  const estilo = acabado(idAcabado);
  const sitio = colocacion(hoja, formato);
  const hojas = Math.max(1, Math.ceil(tarjetas.length / sitio.porHoja));
  for (let h = 0; h < hojas; h++) {
    if (h > 0) pdf.addPage(hoja, "portrait");
    const deEsta = tarjetas.slice(h * sitio.porHoja, (h + 1) * sitio.porHoja);
    deEsta.forEach((t, i) => sitio.poner(pdf, ...sitio.hueco(i), adornos, [t, estilo]));
    marcasDeLaHoja(pdf, sitio, deEsta.length, corte);
  }
  return hojas;
}

// Dónde va cada tarjeta en la hoja: la rejilla, centrada, y cómo se pone
// (plegada: dos caras; de una cara: una, sin girar). Una sola cuenta para
// las tarjetas y para la hoja de muestra.
function colocacion(hoja, formato) {
  const papel = HOJAS[hoja] || HOJAS.a3;
  const { columnas, filas, porHoja } = rejilla(hoja, formato);
  const plegada = !deUnaCara(formato);
  const W = ANCHO_TARJETA * MM;
  const H = (plegada ? ALTO_TARJETA : ALTO_CARA) * MM;
  const x0 = (papel.ancho * MM - columnas * W) / 2;
  const y0 = (papel.alto * MM - filas * H) / 2;
  const hueco = (i) => [x0 + (i % columnas) * W, y0 + Math.floor(i / columnas) * H];
  const poner = plegada
    ? (pdf, x, y, adornos, arriba, abajo) => tarjeta(pdf, x, y, W, adornos, arriba, abajo)
    : (pdf, x, y, adornos, [t, estilo]) => cara(pdf, x, y, W, H, false, t, estilo, adornos);
  return { papel, columnas, filas, porHoja, W, H, x0, y0, hueco, poner, plegada };
}

// Las marcas para cortar de una hoja con `cuantas` tarjetas. Las de
// registro, en el mismo sitio en todas las hojas: las esquinas de la
// rejilla entera, haya o no tarjetas.
function marcasDeLaHoja(pdf, { columnas, filas, W, H, x0, y0, plegada }, cuantas, corte) {
  if (corte === "ploter") marcasDeRegistro(pdf, x0, y0, x0 + columnas * W, y0 + filas * H);
  marcasDeCorte(pdf, x0, y0, W, H, Math.min(columnas, Math.max(1, cuantas)), Math.max(1, Math.ceil(cuantas / columnas)), corte, plegada);
}

// ---------- La hoja de muestra ----------

// La tarjeta de ejemplo: la de las muestras de la paleta y la de la hoja de
// muestra. La mesa, de dos cifras (v99.1): se ve cómo queda en el círculo y
// no se confunde con el número del acabado de la esquina.
const EJEMPLO = { nombre: "Luis", apellido: "Abreu", mesa: 12, familia: "A" };

// Él (v99.1): «una hoja modelo… que me aparezcan los 6 modelos… y poder
// verlo en vivo». Tarjetas de ejemplo, cada CARA con un acabado (en una
// cara uno y en la otra otro), por una sola cara del papel. En la esquina
// de cada cara, donde va la letra de la familia, su número; y arriba, la
// leyenda, en el orden de la paleta. Si no caben en una hoja, siguen en la
// siguiente (con los cuatro de ahora, caben en una). Devuelve cuántas hojas.
export const ARCHIVO_MUESTRA_ACABADOS = "muestra-acabados-tarjetas.pdf";
const TAM_LEYENDA = 9;
export function dibujarMuestraAcabados(
  pdf,
  { hoja = OPCIONES_POR_DEFECTO.hoja, corte = OPCIONES_POR_DEFECTO.corte, formato = OPCIONES_POR_DEFECTO.formato } = {},
  adornos = null,
) {
  const sitio = colocacion(hoja, formato);
  const conNumero = (i) => [{ ...EJEMPLO, familia: String(i + 1) }, ACABADOS[i]];
  // Plegadas, un acabado en cada cara; de una cara, uno por tarjeta.
  const porTarjeta = sitio.plegada ? 2 : 1;
  const cuantas = Math.ceil(ACABADOS.length / porTarjeta);
  const hojas = Math.ceil(cuantas / sitio.porHoja);
  const lineas = [`Muestra de los ${ACABADOS.length} acabados: el número de cada uno, en la esquina de su cara.`];
  for (let d = 0; d < ACABADOS.length; d += 3) lineas.push(ACABADOS.slice(d, d + 3).map((a, i) => `${d + i + 1} ${a.rotulo}`).join("  ·  "));
  for (let h = 0; h < hojas; h++) {
    if (h > 0) pdf.addPage(hoja, "portrait");
    const deEsta = Math.min(sitio.porHoja, cuantas - h * sitio.porHoja);
    for (let j = 0; j < deEsta; j++) {
      const i = h * sitio.porHoja + j;
      const primera = porTarjeta * i;
      const abajo = sitio.plegada && ACABADOS[primera + 1] ? conNumero(primera + 1) : conNumero(primera);
      sitio.poner(pdf, ...sitio.hueco(j), adornos, conNumero(primera), abajo);
    }
    marcasDeLaHoja(pdf, sitio, deEsta, corte);
    // La leyenda, centrada en el margen de arriba, de tres en tres.
    pdf.setFontSize(TAM_LEYENDA);
    pdf.setTextColor(C.ink);
    lineas.forEach((texto, i) => {
      pdf.setFont("helvetica", i === 0 ? "bold" : "normal");
      pdf.text(texto, (sitio.papel.ancho * MM - pdf.getTextWidth(texto)) / 2, (10 + 4.5 * i) * MM);
    });
  }
  return hojas;
}

export async function pdfMuestraAcabados(opciones, adornos = null) {
  const pdf = await nuevoPdf(opciones, adornos);
  dibujarMuestraAcabados(pdf, opciones, adornos);
  return pdf.output("blob");
}

// ---------- El adorno, el corazón y las letras de la invitación ----------

// El adorno de la esquina, hojas de olivo y volutas doradas, sin fondo (lo
// dio él, v99.4); el corazón, recortado de la imagen de la invitación (sin
// el fondo crema); y sus dos letras: Fraunces SemiBold, la
// de la app, para el apellido, y Alex Brush, la caligráfica, para el
// nombre (licencia libre, public/tarjetas/LICENCIA-FUENTES.txt). En el PDF
// van dentro (jsPDF no tiene más que las suyas); en la vista previa, con
// el mismo archivo, para que se vea lo mismo.
export const RUTAS_ADORNOS = {
  esquina: "/tarjetas/esquina.png",
  corazon: "/tarjetas/corazon.png",
  serif: "/tarjetas/Fraunces-SemiBold.ttf",
  caligrafica: "/tarjetas/AlexBrush-Regular.ttf",
};
// El adorno, el corazón y las letras, cargados una vez (como el logo de los
// sobres): la imagen para el lienzo y el dato para el PDF, cada una también
// girada (la cara de arriba); las letras, registradas en el navegador para
// la vista previa y en base64 para meterlas en el PDF.
export async function cargarAdornos(rutas = RUTAS_ADORNOS) {
  const [esquina, corazon, serif, caligrafica] = await Promise.all([
    cargarImagen(rutas.esquina),
    cargarImagen(rutas.corazon),
    fetch(rutas.serif).then((r) => r.arrayBuffer()),
    fetch(rutas.caligrafica).then((r) => r.arrayBuffer()),
  ]);
  await Promise.all(
    [
      ["Fraunces Tarjeta", serif],
      ["Alex Brush Tarjeta", caligrafica],
    ].map(async ([nombre, datos]) => document.fonts.add(await new FontFace(nombre, datos).load())),
  );
  return {
    esquina,
    esquinaGirada: await girarImagen(esquina),
    corazon,
    corazonGirada: await girarImagen(corazon),
    fuentes: { [SERIF]: aBase64(serif), [CALIGRAFICA]: aBase64(caligrafica) },
  };
}

async function girarImagen({ imagen, proporcion }) {
  const lienzo = crearCanvas(imagen.naturalWidth, imagen.naturalHeight);
  const ctx = lienzo.getContext("2d");
  ctx.translate(lienzo.width, lienzo.height);
  ctx.rotate(Math.PI);
  ctx.drawImage(imagen, 0, 0);
  const dato = lienzo.toDataURL("image/png");
  const girada = new Image();
  girada.src = dato;
  await girada.decode();
  return { dato, imagen: girada, proporcion };
}

function aBase64(datos) {
  const bytes = new Uint8Array(datos);
  let texto = "";
  for (let i = 0; i < bytes.length; i += 0x8000) texto += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(texto);
}

// Las imágenes de los adornos, para el lienzo: por su dato, como addImage
// (también las tarjetas QR).
export const imagenesDe = (adornos) =>
  new Map(adornos ? ["esquina", "esquinaGirada", "corazon", "corazonGirada"].map((k) => [adornos[k].dato, adornos[k].imagen]) : []);

// Las dos letras de la invitación, dentro del PDF, si se cargaron (también
// en los sobres).
export function registrarLetras(pdf, adornos) {
  for (const [familia, datos] of Object.entries(adornos?.fuentes || {})) {
    pdf.addFileToVFS(`${familia}.ttf`, datos);
    pdf.addFont(`${familia}.ttf`, familia, "normal");
  }
}

// Un jsPDF, con las dos letras de la invitación dentro si se cargaron.
async function nuevoPdf(opciones, adornos) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: opciones?.hoja || OPCIONES_POR_DEFECTO.hoja });
  registrarLetras(pdf, adornos);
  return pdf;
}

// Las marcas de corte, como las de imprenta (él, v98.9: las pidió el
// rotulista; las rayas grises de puntos de antes, de lado a lado, no se
// veían): cortas, negras y continuas, FUERA de las tarjetas, una en cada
// extremo de cada corte, con un hueco para que no asomen en la tarjeta
// cortada. A los lados, a la altura de cada doblez (si se pliega), otra discontinua. Solo
// hasta donde hay tarjetas. El largo, el que quepa en el margen, dejando
// 3 mm hasta el borde del papel. Con tijera o cúter, cada corte entero, de
// la marca de un lado a la del otro; con el plóter, solo las del doblez
// (dónde cortar lo saca él de las marcas de registro).
const HUECO_MARCA = 2 * MM;
const LARGO_MARCA = 6 * MM;
const BORDE_PAPEL = 3 * MM;
function marcasDeCorte(pdf, x0, y0, W, H, columnas, filas, corte, plegada = true) {
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
  if (!plegada) return;
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
export async function pdfTarjetasAcomodacion(tarjetas, opciones, adornos = null) {
  const pdf = await nuevoPdf(opciones, adornos);
  dibujarTarjetasAcomodacion(pdf, tarjetas, opciones, adornos);
  return pdf.output("blob");
}

// ---------- La vista previa ----------

// Las hojas de la vista previa, como imágenes. `escala`: píxeles por punto.
export function vistaPreviaTarjetasAcomodacion(tarjetas, opciones, adornos = null, { escala = 1.4, crearLienzo = crearCanvas } = {}) {
  const papel = HOJAS[opciones?.hoja] || HOJAS[OPCIONES_POR_DEFECTO.hoja];
  const lienzo = new PdfEnLienzo({ medida: { ancho: papel.ancho * MM, alto: papel.alto * MM }, escala, crearLienzo, imagenes: imagenesDe(adornos) });
  dibujarTarjetasAcomodacion(lienzo, tarjetas, opciones, adornos);
  if (!lienzo.ctx) return [];
  return lienzo.paginas.map((p) => p.toDataURL("image/jpeg", 0.85));
}

// La muestra de un acabado, para elegirlo: una cara de una tarjeta de
// ejemplo, del mismo dibujo que el PDF. En la esquina, su número, el mismo
// que en la hoja de muestra (v99.1): lo impreso y la paleta, a la par.
export function muestraAcabado(idAcabado, adornos = null, { escala = 1, crearLienzo = crearCanvas } = {}) {
  const medida = { ancho: ANCHO_TARJETA * MM, alto: ALTO_CARA * MM };
  const lienzo = new PdfEnLienzo({ medida, escala, crearLienzo, imagenes: imagenesDe(adornos) });
  const numero = ACABADOS.findIndex((a) => a.id === idAcabado) + 1;
  cara(lienzo, 0, 0, medida.ancho, medida.alto, false, { ...EJEMPLO, familia: numero ? String(numero) : EJEMPLO.familia }, acabado(idAcabado), adornos);
  return lienzo.ctx ? lienzo.paginas[0].toDataURL("image/png") : "";
}
