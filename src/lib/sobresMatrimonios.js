// Los sobres de los matrimonios (él, v98): uno por matrimonio confirmado,
// para imprimir directamente en el sobre: los nombres, el número de su mesa
// en el círculo dorado de las tarjetas de acomodación y el logo del evento.
//
// Qué es un matrimonio confirmado, lo dice UNA pieza (norma 7): la de
// Aniversarios (lib/matrimonios.js), así la cuenta de sobres es la misma
// que ve allí: esposo y esposa de una familia que vienen los dos, y los
// casados que vienen sin su pareja dados por buenos en la Revisión.
//
// Con la letra y el corazón de las tarjetas de acomodación (él, v99.3:
// «aprovechamos esta tipografía y filigrana para los sobres»), en una sola
// columna centrada (él: con la mesa al lado «queda mal el encuadre»): el
// APELLIDO del esposo arriba, si se elige, en mayúsculas y con la letra de
// «LAS BODAS»; los nombres en la caligráfica dorada («Luis y Ana»); el
// corazón; y debajo, la mesa. Por defecto, solo los nombres (él: «como es
// más cercana, le podemos quitar el apellido»; con la mesa, no se confunde
// con otra familia). Si no se cargan las letras, la de siempre y sin
// corazón: se sigue pudiendo imprimir.
//
// Se configura (él): el tamaño del sobre, el nombre con o sin apellido,
// dónde va (una esquina o el centro) y dónde el logo (encima, debajo o al lado del nombre, en el
// centro del sobre o sin logo). Una página por sobre, del tamaño del
// sobre: la impresora lo imprime directamente en él.
//
// Un solo dibujo para el PDF y la vista previa (PdfEnLienzo).
import { C } from "../theme";
import { matrimoniosConLosQueVienenSolos, nombresMatrimonio } from "./matrimonios";
import { PdfEnLienzo, PUNTOS_POR_MM as MM, crearCanvas, cargarImagen } from "./pdfEnLienzo";
import { SERIF, CALIGRAFICA, ALTO_CALIGRAFICA, ESPACIADO_APELLIDO, registrarLetras } from "./tarjetasAcomodacion";

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
// Las letras: cada una, si no cabe, encoge. Cinco puntos más que el primer
// boceto (él, v99.3: «a los dos que ya subiste, 3 puntos más»), en todos
// los sobres.
const TAM_APELLIDO = 18;
const TAM_NOMBRES = 35; // en la caligráfica
const TAM_NOMBRES_SIN_LETRAS = 18; // si no se cargaron las de la invitación
const TAM_MINIMO = 10;
const R_MESA = 19; // el círculo de la mesa
const TAM_MESA = 24;
const ALTO_CIFRA = 0.716; // alto de las mayúsculas y las cifras, por punto de letra
// El corazón, un poco más ancho que el nombre, pero no más que bajo uno
// corto («Luis y Ana»): bajo «Richard y María del Carmen» se comía el sobre.
const CORAZON = 1.15;
const ANCHO_CORAZON_MAXIMO = 150;
const ENTRE_APELLIDO = 8; // del APELLIDO a los nombres
const ENTRE_CORAZON = 5; // de los nombres al corazón
const ENTRE_MESA = 6; // del corazón (o los nombres) a la mesa
const HUECO = 10; // entre el bloque del nombre y el logo
const ALTO_LOGO = 24 * MM; // pegado al nombre
const ALTO_LOGO_CENTRO = 40 * MM; // solo, en el centro del sobre
// La fecha del evento, abajo del todo (v102), y lo que deja libre encima.
const TAM_FECHA = 11;
const ESPACIADO_FECHA = 1;
const ENTRE_FECHA = 10;

// El bloque del nombre, una columna centrada: el APELLIDO (si se elige), los
// nombres, el corazón y la mesa. `cabe`: el ancho que tiene.
function medirNombre(pdf, sobre, formato, cabe, adornos) {
  const [serif, estiloSerif] = adornos ? [SERIF, "normal"] : ["helvetica", "bold"];
  const caligrafica = adornos ? CALIGRAFICA : "helvetica";
  const apellido = formato === "apellido" && sobre.apellido ? sobre.apellido.toLocaleUpperCase("es") : "";
  const anchoApellido = (tam) => {
    if (!apellido) return 0;
    pdf.setFont(serif, estiloSerif);
    pdf.setFontSize(tam);
    return pdf.getTextWidth(apellido) + ESPACIADO_APELLIDO * (apellido.length - 1);
  };
  const anchoNombres = (tam) => {
    pdf.setFont(caligrafica, "normal");
    pdf.setFontSize(tam);
    return pdf.getTextWidth(sobre.nombres);
  };
  let ta = TAM_APELLIDO;
  while (ta > TAM_MINIMO && anchoApellido(ta) > cabe) ta -= 0.5;
  let tn = adornos ? TAM_NOMBRES : TAM_NOMBRES_SIN_LETRAS;
  while (tn > TAM_MINIMO && anchoNombres(tn) > cabe) tn -= 0.5;
  const anchoTexto = Math.max(anchoApellido(ta), anchoNombres(tn));
  const anchoCorazon = adornos ? Math.min(anchoTexto * CORAZON, ANCHO_CORAZON_MAXIMO, cabe) : 0;
  const altoCorazon = adornos ? anchoCorazon * adornos.corazon.proporcion : 0;
  const subeNombres = tn * (adornos ? ALTO_CALIGRAFICA : ALTO_CIFRA);
  const conMesa = sobre.mesa != null;
  const alto =
    (apellido ? ta * ALTO_CIFRA + ENTRE_APELLIDO : 0) + subeNombres + (altoCorazon ? ENTRE_CORAZON + altoCorazon : 0) + (conMesa ? ENTRE_MESA + 2 * R_MESA : 0);
  return {
    apellido,
    ta,
    tn,
    serif,
    estiloSerif,
    caligrafica,
    subeNombres,
    anchoCorazon,
    altoCorazon,
    ancho: Math.max(anchoTexto, anchoCorazon, conMesa ? 2 * R_MESA : 0),
    alto,
  };
}

// Cada línea, centrada en el bloque, de arriba abajo.
function dibujarNombre(pdf, sobre, m, x, y, adornos) {
  const medio = x + m.ancho / 2;
  let base = y;
  if (m.apellido) {
    base += m.ta * ALTO_CIFRA;
    pdf.setFont(m.serif, m.estiloSerif);
    pdf.setFontSize(m.ta);
    pdf.setTextColor(C.ink);
    const w = pdf.getTextWidth(m.apellido) + ESPACIADO_APELLIDO * (m.apellido.length - 1);
    pdf.text(m.apellido, medio - w / 2, base, { charSpace: ESPACIADO_APELLIDO });
    base += ENTRE_APELLIDO;
  }
  base += m.subeNombres;
  pdf.setFont(m.caligrafica, "normal");
  pdf.setFontSize(m.tn);
  pdf.setTextColor(C.gold);
  pdf.text(sobre.nombres, medio - pdf.getTextWidth(sobre.nombres) / 2, base);
  if (m.altoCorazon) {
    pdf.addImage(adornos.corazon.dato, "PNG", medio - m.anchoCorazon / 2, base + ENTRE_CORAZON, m.anchoCorazon, m.altoCorazon, "corazon", "FAST");
    base += ENTRE_CORAZON + m.altoCorazon;
  }
  if (sobre.mesa == null) return;
  // El círculo dorado de las tarjetas de acomodación.
  const cy = base + ENTRE_MESA + R_MESA;
  pdf.setFillColor(C.goldClaro);
  pdf.setDrawColor(C.gold);
  pdf.setLineWidth(2);
  pdf.circle(medio, cy, R_MESA - 1, "FD");
  pdf.setFont(m.serif, m.estiloSerif);
  pdf.setFontSize(TAM_MESA);
  pdf.setTextColor(C.ink);
  const numero = String(sobre.mesa);
  pdf.text(numero, medio - pdf.getTextWidth(numero) / 2, cy + (TAM_MESA * ALTO_CIFRA) / 2);
}

function dibujarSobre(pdf, sobre, opciones, logo, adornos, W, H) {
  const posLogo = logo ? opciones.logo : "sin";
  // El logo en el centro con el nombre también en el centro: encima.
  const logoSuelto = posLogo === "centro" && opciones.nombre !== "centro";
  const logoPegado = posLogo !== "sin" && !logoSuelto ? (posLogo === "centro" ? "encima" : posLogo) : null;
  const tamLogo = (alto) => ({ ancho: alto / logo.proporcion, alto });
  const lp = logoPegado ? tamLogo(ALTO_LOGO) : null;
  const nombre = medirNombre(pdf, sobre, opciones.formato, W - 2 * MARGEN - (logoPegado === "alLado" ? lp.ancho + HUECO : 0), adornos);

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
  // Con la fecha abajo, el bloque nunca baja hasta ella: abajo, sube lo
  // justo; en el centro, solo si no cabe.
  const fecha = opciones.fecha || "";
  const suelo = H - MARGEN - (fecha ? TAM_FECHA * ALTO_CIFRA + ENTRE_FECHA : 0);
  const by = pos.startsWith("arriba") ? MARGEN : pos.startsWith("abajo") ? suelo - altoBloque : Math.min((H - altoBloque) / 2, suelo - altoBloque);
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
  dibujarNombre(pdf, sobre, nombre, nx, ny, adornos);

  if (logoSuelto) {
    const ls = tamLogo(Math.min(ALTO_LOGO_CENTRO, H - 2 * MARGEN));
    pdf.addImage(logo.dato, "PNG", (W - ls.ancho) / 2, (H - ls.alto) / 2, ls.ancho, ls.alto, "logo", "FAST");
  }

  // La fecha del evento (él, v102: «11 diciembre 2026… en la parte más
  // baja, en línea con el resto de la impresión, color dorado»): abajo del
  // todo, alineada como el nombre (a su izquierda, a su derecha o al centro).
  if (fecha) {
    pdf.setFont(...(adornos ? [SERIF, "normal"] : ["helvetica", "bold"]));
    pdf.setFontSize(TAM_FECHA);
    pdf.setTextColor(C.gold);
    const anchoFecha = pdf.getTextWidth(fecha) + ESPACIADO_FECHA * (fecha.length - 1);
    pdf.text(fecha, enLinea(anchoFecha), H - MARGEN, { charSpace: ESPACIADO_FECHA });
  }
}

const medidaSobre = (opciones) => {
  const s = SOBRES[opciones?.sobre] || SOBRES[OPCIONES_SOBRES_POR_DEFECTO.sobre];
  return { ancho: s.ancho * MM, alto: s.alto * MM };
};

// Todos los sobres, uno por página. `logo`: { dato (data URL del PNG),
// imagen (la misma, cargada), proporcion (alto / ancho) }, o null.
// `adornos`: las letras y el corazón de la invitación (cargarAdornos de las
// tarjetas de acomodación), o null. `opciones.fecha`: la del evento, ya
// escrita (fechaImpresa), o nada.
export function dibujarSobres(pdf, sobres, opciones = OPCIONES_SOBRES_POR_DEFECTO, logo = null, adornos = null) {
  const o = { ...OPCIONES_SOBRES_POR_DEFECTO, ...opciones };
  const { ancho, alto } = medidaSobre(o);
  sobres.forEach((s, i) => {
    if (i > 0) pdf.addPage([ancho, alto], "landscape");
    dibujarSobre(pdf, s, o, logo, adornos, ancho, alto);
  });
  return Math.max(1, sobres.length);
}

// El PDF para descargar: cada página, del tamaño del sobre.
export async function pdfSobres(sobres, opciones, logo, adornos = null) {
  const { jsPDF } = await import("jspdf");
  const { ancho, alto } = medidaSobre(opciones);
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: [ancho, alto] });
  registrarLetras(pdf, adornos);
  dibujarSobres(pdf, sobres, opciones, logo, adornos);
  return pdf.output("blob");
}

// Los sobres de la vista previa, como imágenes.
export function vistaPreviaSobres(sobres, opciones, logo, adornos = null, { escala = 1.2, crearLienzo = crearCanvas } = {}) {
  const imagenes = new Map([logo, adornos?.corazon].filter(Boolean).map((i) => [i.dato, i.imagen]));
  const lienzo = new PdfEnLienzo({ medida: medidaSobre(opciones), escala, crearLienzo, imagenes });
  dibujarSobres(lienzo, sobres, opciones, logo, adornos);
  if (!lienzo.ctx) return [];
  return lienzo.paginas.map((p) => p.toDataURL("image/jpeg", 0.85));
}

// El logo, cargado una vez: el dato para el PDF y la imagen para el lienzo.
export const cargarLogo = (ruta = RUTA_LOGO) => cargarImagen(ruta);
