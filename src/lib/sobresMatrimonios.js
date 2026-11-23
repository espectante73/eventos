// Los sobres de los matrimonios (él, v98): uno por matrimonio confirmado,
// para imprimir directamente en el sobre: los nombres, el número de su mesa
// en el círculo dorado de las tarjetas de acomodación (él: «al lado del
// nombre, el circulito dorado con la mesa») y el logo del evento.
//
// Qué es un matrimonio confirmado, lo dice UNA pieza (norma 7): la de
// Aniversarios (lib/matrimonios.js), así la cuenta de sobres es la misma
// que ve allí: esposo y esposa de una familia que vienen los dos, y los
// casados que vienen sin su pareja dados por buenos en la Revisión.
//
// El nombre, en UNA línea (él): «Luis y Ana» o, con el apellido del
// esposo, «ABREU, Luis y Ana» («Apellido, Nombre», como en toda la app).
// Por defecto, solo los nombres (él: «como es más cercana, le podemos
// quitar el apellido»; con la mesa al lado, no se confunde con otra
// familia).
//
// Se configura (él): el tamaño del sobre, el nombre con o sin apellido,
// dónde va (una esquina o el centro) y dónde el logo (encima, debajo o al lado del nombre, en el
// centro del sobre o sin logo). Una página por sobre, del tamaño del
// sobre: la impresora lo imprime directamente en él.
//
// Un solo dibujo para el PDF y la vista previa (PdfEnLienzo).
import { C } from "../theme";
import { matrimoniosConLosQueVienenSolos, nombresMatrimonio } from "./matrimonios";
import { PdfEnLienzo, PUNTOS_POR_MM as MM, crearCanvas } from "./pdfEnLienzo";

export const ARCHIVO_SOBRES = "sobres-matrimonios.pdf";
// El logo del evento («Las bodas de todos»), sin fondo.
export const RUTA_LOGO = "/logo-evento.png";

// Los tamaños de sobre, en milímetros (apaisados). El primero y el de por
// defecto, el de una foto de 10 × 15 (él): el C6, donde cabe justa.
export const SOBRES = {
  c6: { rotulo: "Foto 10×15 (C6)", medida: "16,2 × 11,4 cm", ancho: 162, alto: 114 },
  americano: { rotulo: "Americano", medida: "22,5 × 11,5 cm", ancho: 225, alto: 115 },
  c5: { rotulo: "C5 (folio doblado)", medida: "22,9 × 16,2 cm", ancho: 229, alto: 162 },
};
export const FORMATOS_NOMBRE = [
  { id: "nombres", rotulo: "Solo nombres" },
  { id: "apellido", rotulo: "Con apellido" },
];
export const POSICIONES_NOMBRE = [
  { id: "arribaIzquierda", rotulo: "Arriba izquierda" },
  { id: "arribaDerecha", rotulo: "Arriba derecha" },
  { id: "centro", rotulo: "Centro" },
  { id: "abajoIzquierda", rotulo: "Abajo izquierda" },
  { id: "abajoDerecha", rotulo: "Abajo derecha" },
];
export const POSICIONES_LOGO = [
  { id: "encima", rotulo: "Encima" },
  { id: "debajo", rotulo: "Debajo" },
  { id: "alLado", rotulo: "Al lado" },
  { id: "centro", rotulo: "Centro del sobre" },
  { id: "sin", rotulo: "Sin logo" },
];
// `nombre`: dónde va; `formato`: con o sin apellido.
export const OPCIONES_SOBRES_POR_DEFECTO = { sobre: "c6", formato: "nombres", nombre: "centro", logo: "encima" };

const comparar = (a, b) => String(a ?? "").localeCompare(String(b ?? ""), "es", { numeric: true, sensitivity: "base" });

// Un sobre por matrimonio confirmado, en el orden de las mesas (como las
// tarjetas: se reparten mesa por mesa); los que aún no tienen mesa, al
// final. `sinMesa`: cuántos sobres salen sin número.
export function sobresDeMatrimonios(invitados = [], fechaEvento = "") {
  const sobres = matrimoniosConLosQueVienenSolos(invitados, fechaEvento)
    .filter((m) => m.confirmados)
    .map((m) => {
      const personas = [m.esposo, m.esposa].filter(Boolean);
      const mesa = personas.map((p) => p.mesa).find((v) => v != null && v !== "") ?? null;
      // El apellido, el del esposo (el primero: el de quien viene, si viene solo).
      return { clave: m.clave, familia: m.familia, mesa, apellido: String(personas[0]?.apellido || "").trim(), nombres: nombresMatrimonio(m) };
    })
    .sort((a, b) => (a.mesa == null) - (b.mesa == null) || comparar(a.mesa, b.mesa) || comparar(a.familia, b.familia));
  return { sobres, sinMesa: sobres.filter((s) => s.mesa == null).length };
}

// ---------- El dibujo ----------

const MARGEN = 15 * MM; // del borde del sobre a lo impreso
const TAM_NOMBRE = 18; // y si no cabe, encoge
const TAM_NOMBRE_MINIMO = 10;
const R_MESA = 17; // el círculo de la mesa
const TAM_MESA = 22;
const ALTO_CIFRA = 0.716; // alto de las cifras de Helvetica, por punto de letra
const HUECO = 10; // entre el nombre y el círculo, y entre el bloque y el logo
const ALTO_LOGO = 24 * MM; // pegado al nombre
const ALTO_LOGO_CENTRO = 40 * MM; // solo, en el centro del sobre

// El bloque del nombre: una línea y, a su derecha, el círculo con la mesa.
// `cabe`: el ancho que tiene; si no cabe, la letra encoge.
function medirNombre(pdf, sobre, formato, cabe) {
  const apellido = formato === "apellido" && sobre.apellido ? `${sobre.apellido.toLocaleUpperCase("es")}, ` : "";
  const conMesa = sobre.mesa != null;
  const deMesa = conMesa ? HUECO + 2 * R_MESA : 0;
  let tam = TAM_NOMBRE;
  const medir = () => {
    pdf.setFontSize(tam);
    pdf.setFont("helvetica", "bold");
    const anchoApellido = pdf.getTextWidth(apellido);
    pdf.setFont("helvetica", "normal");
    return { anchoApellido, anchoTexto: anchoApellido + pdf.getTextWidth(sobre.nombres) };
  };
  let m = medir();
  while (tam > TAM_NOMBRE_MINIMO && m.anchoTexto + deMesa > cabe) {
    tam -= 0.5;
    m = medir();
  }
  return { ...m, apellido, tam, ancho: m.anchoTexto + deMesa, alto: Math.max(tam * 1.3, conMesa ? 2 * R_MESA : 0) };
}

function dibujarNombre(pdf, sobre, medida, x, y) {
  const { apellido, anchoApellido, anchoTexto, tam, alto } = medida;
  const base = y + alto / 2 + (tam * ALTO_CIFRA) / 2;
  pdf.setFontSize(tam);
  pdf.setTextColor(C.ink);
  if (apellido) {
    pdf.setFont("helvetica", "bold");
    pdf.text(apellido, x, base);
  }
  pdf.setFont("helvetica", "normal");
  pdf.text(sobre.nombres, x + anchoApellido, base);
  if (sobre.mesa == null) return;
  // El círculo dorado de las tarjetas de acomodación.
  const cx = x + anchoTexto + HUECO + R_MESA;
  const cy = y + alto / 2;
  pdf.setFillColor(C.goldClaro);
  pdf.setDrawColor(C.gold);
  pdf.setLineWidth(2);
  pdf.circle(cx, cy, R_MESA - 1, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(TAM_MESA);
  pdf.setTextColor(C.ink);
  const numero = String(sobre.mesa);
  pdf.text(numero, cx - pdf.getTextWidth(numero) / 2, cy + (TAM_MESA * ALTO_CIFRA) / 2);
}

function dibujarSobre(pdf, sobre, opciones, logo, W, H) {
  const posLogo = logo ? opciones.logo : "sin";
  // El logo en el centro con el nombre también en el centro: encima.
  const logoSuelto = posLogo === "centro" && opciones.nombre !== "centro";
  const logoPegado = posLogo !== "sin" && !logoSuelto ? (posLogo === "centro" ? "encima" : posLogo) : null;
  const tamLogo = (alto) => ({ ancho: alto / logo.proporcion, alto });
  const lp = logoPegado ? tamLogo(ALTO_LOGO) : null;
  const nombre = medirNombre(pdf, sobre, opciones.formato, W - 2 * MARGEN - (logoPegado === "alLado" ? lp.ancho + HUECO : 0));

  // El bloque entero (nombre y, si va pegado, el logo).
  let anchoBloque = nombre.ancho;
  let altoBloque = nombre.alto;
  if (lp && (logoPegado === "encima" || logoPegado === "debajo")) {
    anchoBloque = Math.max(anchoBloque, lp.ancho);
    altoBloque += HUECO + lp.alto;
  } else if (lp) {
    anchoBloque += HUECO + lp.ancho;
    altoBloque = Math.max(altoBloque, lp.alto);
  }
  const pos = opciones.nombre;
  const izquierda = pos.endsWith("Izquierda");
  const derecha = pos.endsWith("Derecha");
  const alinear = izquierda ? "izquierda" : derecha ? "derecha" : "centro";
  const bx = izquierda ? MARGEN : derecha ? W - MARGEN - anchoBloque : (W - anchoBloque) / 2;
  const by = pos.startsWith("arriba") ? MARGEN : pos.startsWith("abajo") ? H - MARGEN - altoBloque : (H - altoBloque) / 2;
  // Dentro del bloque, cada parte alineada como el nombre.
  const enLinea = (ancho) => (alinear === "izquierda" ? bx : alinear === "derecha" ? bx + anchoBloque - ancho : bx + (anchoBloque - ancho) / 2);

  let ny = by;
  let nx = enLinea(nombre.ancho);
  if (lp && logoPegado === "encima") {
    pdf.addImage(logo.dato, "PNG", enLinea(lp.ancho), by, lp.ancho, lp.alto, "logo", "FAST");
    ny = by + lp.alto + HUECO;
  } else if (lp && logoPegado === "debajo") {
    pdf.addImage(logo.dato, "PNG", enLinea(lp.ancho), by + nombre.alto + HUECO, lp.ancho, lp.alto, "logo", "FAST");
  } else if (lp) {
    pdf.addImage(logo.dato, "PNG", bx, by + (altoBloque - lp.alto) / 2, lp.ancho, lp.alto, "logo", "FAST");
    nx = bx + lp.ancho + HUECO;
    ny = by + (altoBloque - nombre.alto) / 2;
  }
  dibujarNombre(pdf, sobre, nombre, nx, ny);

  if (logoSuelto) {
    const ls = tamLogo(Math.min(ALTO_LOGO_CENTRO, H - 2 * MARGEN));
    pdf.addImage(logo.dato, "PNG", (W - ls.ancho) / 2, (H - ls.alto) / 2, ls.ancho, ls.alto, "logo", "FAST");
  }
}

const medidaSobre = (opciones) => {
  const s = SOBRES[opciones?.sobre] || SOBRES[OPCIONES_SOBRES_POR_DEFECTO.sobre];
  return { ancho: s.ancho * MM, alto: s.alto * MM };
};

// Todos los sobres, uno por página. `logo`: { dato (data URL del PNG),
// imagen (la misma, cargada), proporcion (alto / ancho) }, o null.
export function dibujarSobres(pdf, sobres, opciones = OPCIONES_SOBRES_POR_DEFECTO, logo = null) {
  const o = { ...OPCIONES_SOBRES_POR_DEFECTO, ...opciones };
  const { ancho, alto } = medidaSobre(o);
  sobres.forEach((s, i) => {
    if (i > 0) pdf.addPage([ancho, alto], "landscape");
    dibujarSobre(pdf, s, o, logo, ancho, alto);
  });
  return Math.max(1, sobres.length);
}

// El PDF para descargar: cada página, del tamaño del sobre.
export async function pdfSobres(sobres, opciones, logo) {
  const { jsPDF } = await import("jspdf");
  const { ancho, alto } = medidaSobre(opciones);
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [ancho, alto] });
  dibujarSobres(pdf, sobres, opciones, logo);
  return pdf.output("blob");
}

// Los sobres de la vista previa, como imágenes.
export function vistaPreviaSobres(sobres, opciones, logo, { escala = 1.2, crearLienzo = crearCanvas } = {}) {
  const imagenes = logo ? new Map([[logo.dato, logo.imagen]]) : new Map();
  const lienzo = new PdfEnLienzo({ medida: medidaSobre(opciones), escala, crearLienzo, imagenes });
  dibujarSobres(lienzo, sobres, opciones, logo);
  if (!lienzo.ctx) return [];
  return lienzo.paginas.map((p) => p.toDataURL("image/jpeg", 0.85));
}

// El logo, cargado una vez: el dato para el PDF y la imagen para el lienzo.
export async function cargarLogo(ruta = RUTA_LOGO) {
  const blob = await (await fetch(ruta)).blob();
  const dato = await new Promise((ok, mal) => {
    const lector = new FileReader();
    lector.onload = () => ok(lector.result);
    lector.onerror = mal;
    lector.readAsDataURL(blob);
  });
  const imagen = new Image();
  imagen.src = dato;
  await imagen.decode();
  return { dato, imagen, proporcion: imagen.naturalHeight / imagen.naturalWidth };
}
