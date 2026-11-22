// Genera el acuse de recogida de dinero como PDF (jsPDF) para adjuntarlo
// al email al colaborador — a petición del usuario (2026-08-12): el
// desglose por invitado, el importe total, la fecha y la firma van en un
// documento adjunto, no como texto suelto en el cuerpo del email. Se
// dibuja igual que la imagen de invitación (canvas) y luego se estampa
// en una única página de PDF.
//
// Rediseño 2026-08-12 ("pulido"): la versión anterior dibujaba el recibo
// a un tamaño propio (800px de ancho, alto según nº de invitados) y
// luego lo ESCALABA Y CENTRABA dentro de una hoja A4 -- eso producía dos
// problemas a la vez: (1) un margen blanco grande y desigual alrededor
// (el recibo nunca llegaba a ocupar la hoja de verdad), y (2) cualquier
// tamaño de fuente en el dibujo original salía encogido en el PDF final
// por el propio factor de escala (una letra "13px" acababa siendo ~8pt
// reales -- de ahí el pie de página "muy pequeño"). Ahora el lienzo se
// dibuja YA directamente a las medidas exactas de un A4 (595.28 x 841.89
// pt) y se estampa 1:1, sin ningún paso de escalado -- lo que se dibuja
// es exactamente el tamaño final.
//
// ⚠️ Con más filas de las que caben en una hoja (unas 15), el acuse sigue
// en otra (v94.6, él: «el acuse de Raúl Sierra se ve incompleto por la
// cantidad de invitados»): se daba por hecho un máximo de 12-14 invitados
// y la lista se salía por abajo, con el total, la fecha y la firma.
// `repartirFilas` decide cuántas van en cada hoja; con una sola, el dibujo
// es el de siempre.
import { formatearFecha, euros } from "./formato";
import { C, conAlfa } from "../theme";


// Medidas reales de un A4 vertical, en puntos (1pt = 1/72").
const PAGINA_ANCHO = 595.28;
const PAGINA_ALTO = 841.89;
const MARGEN = 50;
const X_IZQ = MARGEN;
const X_DER = PAGINA_ANCHO - MARGEN;
const CENTRO = PAGINA_ANCHO / 2;


// Se dibuja a 2x de resolución (misma medida física en pt, el doble de
// píxeles) para que el texto salga nítido en pantalla/impresión, en vez
// de pixelado -- jsPDF sigue colocando la imagen en el tamaño real (pt),
// el 2x es solo densidad de píxeles internos del PNG.
const ESCALA_RESOLUCION = 2;

// El pie de página siempre va a la misma distancia del borde inferior
// (ver más abajo), pero con pocos invitados eso dejaba un hueco enorme y
// vacío en mitad de la página, entre la firma y el pie -- un recibo de
// 3 invitados no debe verse como uno de 14 con la mitad en blanco. Se
// calcula por adelantado cuánto sitio le sobra al contenido natural
// (según items.length) antes de llegar al pie, y ese sobrante se reparte
// a partes iguales en 3 puntos del propio dibujo (tras la cabecera, tras
// la tabla, tras el total) -- así el documento se ve igual de "lleno" y
// equilibrado tenga 2 invitados o 14.
const LIMITE_FOOTER = PAGINA_ALTO - 78 - 20 - 20; // 20pt extra de aire antes de la línea del pie

// Lo que ocupa cada parte (en pt), las mismas cuentas del dibujo de abajo.
const ALTO_FILA = 22;
// Hasta la primera fila de la primera hoja: 100 (inicio) + 34 (título) + 40
// (subtítulo) + 34 (antes de la línea de cabecera) + 34 (hueco A, base) + 10
// (antes de la 2ª línea) + 20 (antes de la 1ª fila).
const Y_FILAS_PRIMERA = 100 + 34 + 40 + 34 + 34 + 10 + 20;
// En las hojas que siguen, una cabecera corta: 80 + 24 + 20 + 34 + 10 + 20.
const Y_FILAS_SIGUIENTES = 80 + 24 + 20 + 34 + 10 + 20;
// Tras la última fila: 4 (antes de la 3ª línea) + 34 (hueco B, base) + 31
// (medio alto de la caja de total) + 30 (hueco C, base) + 22 (fecha→firma).
const ALTO_CIERRE = 4 + 34 + 31 + 30 + 22;

// Cuántas filas van en cada hoja (las de los invitados y la de la propina).
// El cierre (total, fecha y firma) va en la última, que nunca queda con él
// solo: se lleva al menos dos filas.
export function repartirFilas(numFilas) {
  const n = Math.max(numFilas, 1);
  const cabe = (inicio, extra) => Math.floor((LIMITE_FOOTER - inicio - extra) / ALTO_FILA) + 1;
  const hojas = [];
  let resto = n;
  for (;;) {
    const inicio = hojas.length === 0 ? Y_FILAS_PRIMERA : Y_FILAS_SIGUIENTES;
    // La fila k (desde 0) tiene su línea base en inicio + k*22; tras la
    // última, el cierre. `cabe` cuenta las que caben con o sin él.
    const conCierre = cabe(inicio, ALTO_CIERRE + ALTO_FILA);
    if (resto <= conCierre) {
      hojas.push(resto);
      return hojas;
    }
    const sinCierre = cabe(inicio, ALTO_FILA);
    const aqui = Math.max(1, Math.min(sinCierre, resto - 2));
    hojas.push(aqui);
    resto -= aqui;
  }
}

function calcularHuecoExtra(numItems) {
  const n = Math.max(numItems, 1);
  // La altura de todo, hasta «Firmado» incluido, con los 3 huecos
  // repartibles a su valor BASE (ver las constantes de arriba).
  const alturaNatural = Y_FILAS_PRIMERA + n * ALTO_FILA + ALTO_CIERRE;
  return Math.max(0, LIMITE_FOOTER - alturaNatural) / 3;
}

function linea(ctx, y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X_IZQ, y);
  ctx.lineTo(X_DER, y);
  ctx.stroke();
}

// Una hoja del acuse. `filas`, las suyas: { texto, importe, cursiva, cebra }.
// La primera lleva la cabecera grande; las demás, una corta. La última, el
// cierre. Con más de una, «Hoja 1 de 2» al pie.
function dibujarHoja({ evento, colaborador, filas, primera, ultima, hoja, hojas, hueco, total, propina, fechaISO, vacia }) {
  const canvas = document.createElement("canvas");
  canvas.width = PAGINA_ANCHO * ESCALA_RESOLUCION;
  canvas.height = PAGINA_ALTO * ESCALA_RESOLUCION;
  const ctx = canvas.getContext("2d");
  ctx.scale(ESCALA_RESOLUCION, ESCALA_RESOLUCION);
  // A partir de aquí, todas las coordenadas están en pt reales de la
  // página (0..595.28 de ancho, 0..841.89 de alto) -- el font-size que
  // se ponga es el tamaño de letra final en el PDF, sin sorpresas.

  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, PAGINA_ANCHO, PAGINA_ALTO);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, PAGINA_ANCHO - 48, PAGINA_ALTO - 48);

  let y;
  ctx.textAlign = "center";
  if (primera) {
    // ---------- Encabezado ----------
    y = 100;
    // Nombre del evento en script dorado, a juego con "de todos" de la
    // plantilla de invitación (misma familia, Alex Brush).
    ctx.font = "34px 'Alex Brush', cursive";
    ctx.fillStyle = C.gold;
    ctx.fillText(evento?.nombre || "Evento", CENTRO, y);
    y += 34;

    ctx.font = "bold 32px 'Fraunces', serif";
    ctx.fillStyle = C.ink;
    ctx.fillText("Recibo de entrega", CENTRO, y);
    y += 40;

    ctx.font = "600 16px 'Inter', sans-serif";
    ctx.fillStyle = C.charcoal;
    ctx.fillText(`Colaborador: ${colaborador.nombre}`, CENTRO, y);
    y += 34;

    linea(ctx, y, C.gold);
    y += 34 + hueco; // hueco A
  } else {
    // ---------- Cabecera corta de las hojas que siguen ----------
    y = 80;
    ctx.font = "bold 18px 'Fraunces', serif";
    ctx.fillStyle = C.ink;
    ctx.fillText("Recibo de entrega", CENTRO, y);
    y += 24;
    ctx.font = "600 13px 'Inter', sans-serif";
    ctx.fillStyle = C.charcoal;
    ctx.fillText(`Colaborador: ${colaborador.nombre} · sigue`, CENTRO, y);
    y += 20;
    linea(ctx, y, C.gold);
    y += 34;
  }

  // ---------- Tabla de invitados ----------
  ctx.textAlign = "left";
  ctx.font = "bold 10px 'Inter', sans-serif";
  ctx.fillStyle = C.gold;
  ctx.fillText("INVITADO", X_IZQ, y);
  ctx.textAlign = "right";
  ctx.fillText("IMPORTE", X_DER, y);
  y += 10;
  linea(ctx, y, C.line);
  y += 20;

  if (vacia) {
    ctx.textAlign = "center";
    ctx.font = "italic 13px 'Inter', sans-serif";
    ctx.fillStyle = C.charcoal;
    ctx.fillText("(sin invitados con pago registrado)", CENTRO, y);
    y += ALTO_FILA;
  }
  for (const fila of filas) {
    // Fila cebra: una franja muy suave detrás de las filas pares, para
    // que el ojo siga la línea sin necesitar rayas verticales.
    if (fila.cebra) {
      ctx.fillStyle = conAlfa(C.gold, 0.07);
      ctx.fillRect(X_IZQ - 8, y - 15, X_DER - X_IZQ + 16, ALTO_FILA);
    }
    ctx.textAlign = "left";
    ctx.font = `${fila.cursiva ? "italic " : ""}12.5px 'Inter', sans-serif`;
    ctx.fillStyle = C.charcoal;
    ctx.fillText(fila.texto, X_IZQ, y);
    ctx.textAlign = "right";
    ctx.fillText(euros(fila.importe), X_DER, y);
    y += ALTO_FILA;
  }

  if (ultima) {
    y += 4;
    linea(ctx, y, C.line);
    y += 34 + hueco; // hueco B

    // ---------- Bloque de total ----------
    const ALTO_CAJA_TOTAL = 62;
    ctx.fillStyle = C.waxSuave;
    ctx.fillRect(X_IZQ, y - ALTO_CAJA_TOTAL / 2 - 6, X_DER - X_IZQ, ALTO_CAJA_TOTAL);
    ctx.textAlign = "center";
    ctx.font = "bold 12px 'Inter', sans-serif";
    ctx.fillStyle = C.wax;
    ctx.fillText("TOTAL ENTREGADO", CENTRO, y - 12);
    ctx.font = "bold 30px 'Fraunces', serif";
    ctx.fillText(euros(total + (propina > 0 ? propina : 0)), CENTRO, y + 22);
    y += ALTO_CAJA_TOTAL / 2 + 30 + hueco; // hueco C

    // ---------- Fecha y firma ----------
    ctx.font = "13px 'Inter', sans-serif";
    ctx.fillStyle = C.charcoal;
    ctx.fillText(`Fecha: ${formatearFecha(fechaISO) || fechaISO || "—"}`, CENTRO, y);
    y += 22;

    ctx.font = "italic 13px 'Inter', sans-serif";
    ctx.fillText(`Firmado: El anfitrión — ${evento?.nombre || ""}`, CENTRO, y);
  }

  // ---------- Pie de página ----------
  // A 10.5pt con 16pt entre líneas, siempre a la misma distancia del borde
  // inferior: todos los acuses cierran igual.
  const yPie1 = PAGINA_ALTO - 78;
  const yPie2 = yPie1 + 16;
  linea(ctx, yPie1 - 20, C.line);
  ctx.textAlign = "center";
  ctx.font = "italic 10.5px 'Inter', sans-serif";
  ctx.fillStyle = C.charcoal;
  ctx.globalAlpha = 0.75;
  ctx.fillText("Documento generado automáticamente por la app de invitados del evento", CENTRO, yPie1);
  ctx.fillText("como comprobante de la entrega — consérvalo para tu propia seguridad.", CENTRO, yPie2);
  if (hojas > 1) ctx.fillText(`Hoja ${hoja} de ${hojas}`, CENTRO, yPie2 + 18);
  ctx.globalAlpha = 1;

  return canvas;
}

// Las hojas del acuse. La propina (v85.9, él: «es parte de la
// contabilidad»): una fila más al pie de la tabla, y el total la incluye.
function dibujarHojasAcuse({ evento, colaborador, items, total, propina = 0, fechaISO }) {
  const filas = items.map((it, i) => ({ texto: `${it.apellido}, ${it.nombre}`, importe: it.importe, cursiva: false, cebra: i % 2 === 0 }));
  if (propina > 0) filas.push({ texto: "Propina", importe: propina, cursiva: true, cebra: false });
  const vacia = items.length === 0;
  const reparto = repartirFilas(filas.length + (vacia ? 1 : 0));
  // Con una sola hoja, el aire sobrante se reparte en 3 huecos (para que
  // un acuse de 3 invitados no tenga media hoja en blanco); con varias, no.
  const hueco = reparto.length === 1 ? calcularHuecoExtra(filas.length + (vacia ? 1 : 0)) : 0;
  const canvases = [];
  let desde = 0;
  reparto.forEach((cuantas, i) => {
    const suyas = vacia ? [] : filas.slice(desde, desde + cuantas);
    desde += cuantas;
    canvases.push(
      dibujarHoja({
        evento,
        colaborador,
        filas: suyas,
        primera: i === 0,
        ultima: i === reparto.length - 1,
        hoja: i + 1,
        hojas: reparto.length,
        hueco,
        total,
        propina,
        fechaISO,
        vacia: vacia && i === 0,
      })
    );
  });
  return canvases;
}

// Devuelve un data URL "data:application/pdf;base64,...." con el recibo
// en hojas A4 verticales reales, dibujadas 1:1 (sin escalar).
export async function generarPdfAcuse({ evento, colaborador, items, total, propina = 0, fechaISO }) {
  // 'Alex Brush' no se usa en ningún otro sitio de la app (a diferencia
  // de Fraunces/Inter, ya cargadas de sobra por el resto de la interfaz
  // antes de llegar aquí) -- sin cargarla explícitamente antes de
  // dibujar, el canvas la ignoraría en silencio y usaría una fuente de
  // reserva sin avisar (mismo gotcha que Fraunces en
  // generarImagenParaFamilia, ver VistaAnfitrion.jsx).
  try {
    await document.fonts.load("34px 'Alex Brush'");
  } catch (_) {
    // Sigue con la fuente de reserva si falla la carga.
  }
  const canvases = dibujarHojasAcuse({ evento, colaborador, items, total, propina, fechaISO });

  // jsPDF (con sus piezas de compresión) era casi la mitad de la app y se
  // descargaba SIEMPRE, también en el móvil de cada invitado que abre el
  // tablón. Solo hace falta aquí, al generar un acuse: se trae en este
  // momento (2026-09-18).
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  canvases.forEach((canvas, i) => {
    if (i > 0) pdf.addPage("a4", "portrait");
    // Comprimida (v93.2): sin «FAST» la hoja entera iba píxel a píxel, casi
    // 6 MB, y enviar el acuse desde el móvil tardaba un minuto o más. Así,
    // unos 160 KB por hoja, igual de nítida (no pierde nada).
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, PAGINA_ANCHO, PAGINA_ALTO, undefined, "FAST");
  });
  return pdf.output("datauristring"); // "data:application/pdf;base64,...."
}
