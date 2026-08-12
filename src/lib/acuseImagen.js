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
// es exactamente el tamaño final. El anfitrión confirmó que cada acuse
// lleva como mucho 12-14 invitados, así que el diseño da por hecho ese
// máximo (sitio de sobra) en vez de recalcular alturas dinámicas.
import { jsPDF } from "jspdf";
import { formatearFecha } from "./formato";

const formatoEuro = (n) =>
  (typeof n === "number" ? n : parseFloat(n) || 0).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";

// Medidas reales de un A4 vertical, en puntos (1pt = 1/72").
const PAGINA_ANCHO = 595.28;
const PAGINA_ALTO = 841.89;
const MARGEN = 50;
const X_IZQ = MARGEN;
const X_DER = PAGINA_ANCHO - MARGEN;
const CENTRO = PAGINA_ANCHO / 2;

// Paleta de la app (theme.js) -- repetida aquí en vez de importada porque
// este archivo dibuja en un <canvas> 2D, no en JSX/CSS.
const COLOR = {
  paper: "#EFE9DE",
  ink: "#1F3A2E",
  charcoal: "#2B2620",
  gold: "#B08D57",
  wax: "#8C2F39",
  line: "#C9BFA9",
  waxSuave: "#F0D9CE", // fondo del bloque de total
};

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

function calcularHuecoExtra(numItems) {
  const n = Math.max(numItems, 1);
  // Suma de TODOS los pasos del dibujo de más abajo hasta "Firmado"
  // incluido, con los 3 huecos repartibles puestos a su valor BASE (sin
  // repartir nada todavía) -- tiene que mantenerse a mano si cambian los
  // números del dibujo. En orden: 100 (inicio) + 34 (título) + 40
  // (subtítulo) + 34 (antes de la línea de cabecera) + 34 (hueco A,
  // base) + 10 (antes de la 2ª línea) + 20 (antes de la 1ª fila) + n*22
  // (filas) + 4 (antes de la 3ª línea) + 34 (hueco B, base) + 31 (medio
  // alto de la caja de total) + 30 (hueco C, base) + 22 (fecha→firma).
  const alturaNatural = 100 + 34 + 40 + 34 + 34 + 10 + 20 + n * 22 + 4 + 34 + 31 + 30 + 22;
  return Math.max(0, LIMITE_FOOTER - alturaNatural) / 3;
}

function dibujarCanvasAcuse({ evento, colaborador, items, total, fechaISO }) {
  const hueco = calcularHuecoExtra(items.length);
  const canvas = document.createElement("canvas");
  canvas.width = PAGINA_ANCHO * ESCALA_RESOLUCION;
  canvas.height = PAGINA_ALTO * ESCALA_RESOLUCION;
  const ctx = canvas.getContext("2d");
  ctx.scale(ESCALA_RESOLUCION, ESCALA_RESOLUCION);
  // A partir de aquí, todas las coordenadas están en pt reales de la
  // página (0..595.28 de ancho, 0..841.89 de alto) -- el font-size que
  // se ponga es el tamaño de letra final en el PDF, sin sorpresas.

  ctx.fillStyle = COLOR.paper;
  ctx.fillRect(0, 0, PAGINA_ANCHO, PAGINA_ALTO);
  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, PAGINA_ANCHO - 48, PAGINA_ALTO - 48);

  // ---------- Encabezado ----------
  // Antes las 3-4 líneas del encabezado llevaban gaps de 34/46/40px
  // sobre un dibujo que luego se encogía -- aquí van generosos y ya a
  // tamaño final, para que respiren de verdad.
  let y = 100;

  ctx.textAlign = "center";
  ctx.font = "bold 11px 'Inter', sans-serif";
  ctx.fillStyle = COLOR.gold;
  ctx.fillText((evento?.nombre || "EVENTO").toUpperCase(), CENTRO, y);
  y += 34;

  ctx.font = "bold 32px 'Fraunces', serif";
  ctx.fillStyle = COLOR.ink;
  ctx.fillText("Recibo de entrega", CENTRO, y);
  y += 40;

  ctx.font = "600 16px 'Inter', sans-serif";
  ctx.fillStyle = COLOR.charcoal;
  ctx.fillText(`Colaborador: ${colaborador.nombre}`, CENTRO, y);
  y += 34;

  ctx.strokeStyle = COLOR.gold;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X_IZQ, y);
  ctx.lineTo(X_DER, y);
  ctx.stroke();
  y += 34 + hueco; // hueco A

  // ---------- Tabla de invitados ----------
  // 22pt de alto por fila: con el máximo real (12-14 invitados por
  // acuse, confirmado por el usuario) el bloque de total/fecha/firma que
  // sigue después todavía cabe con margen antes del pie de página fijo.
  const ALTO_FILA = 22;

  ctx.textAlign = "left";
  ctx.font = "bold 10px 'Inter', sans-serif";
  ctx.fillStyle = COLOR.gold;
  ctx.fillText("INVITADO", X_IZQ, y);
  ctx.textAlign = "right";
  ctx.fillText("IMPORTE", X_DER, y);
  y += 10;

  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X_IZQ, y);
  ctx.lineTo(X_DER, y);
  ctx.stroke();
  y += 20;

  if (items.length === 0) {
    ctx.textAlign = "center";
    ctx.font = "italic 13px 'Inter', sans-serif";
    ctx.fillStyle = COLOR.charcoal;
    ctx.fillText("(sin invitados con pago registrado)", CENTRO, y);
    y += ALTO_FILA;
  } else {
    items.forEach((it, i) => {
      // Fila cebra: una franja muy suave detrás de las filas pares, para
      // que el ojo siga la línea sin necesitar rayas verticales.
      if (i % 2 === 0) {
        ctx.fillStyle = "rgba(176, 141, 87, 0.07)";
        ctx.fillRect(X_IZQ - 8, y - 15, X_DER - X_IZQ + 16, ALTO_FILA);
      }
      ctx.textAlign = "left";
      ctx.font = "12.5px 'Inter', sans-serif";
      ctx.fillStyle = COLOR.charcoal;
      ctx.fillText(`${it.apellido}, ${it.nombre}`, X_IZQ, y);
      ctx.textAlign = "right";
      ctx.fillText(formatoEuro(it.importe), X_DER, y);
      y += ALTO_FILA;
    });
  }

  y += 4;
  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X_IZQ, y);
  ctx.lineTo(X_DER, y);
  ctx.stroke();
  y += 34 + hueco; // hueco B

  // ---------- Bloque de total ----------
  const ALTO_CAJA_TOTAL = 62;
  ctx.fillStyle = COLOR.waxSuave;
  ctx.fillRect(X_IZQ, y - ALTO_CAJA_TOTAL / 2 - 6, X_DER - X_IZQ, ALTO_CAJA_TOTAL);
  ctx.textAlign = "center";
  ctx.font = "bold 12px 'Inter', sans-serif";
  ctx.fillStyle = COLOR.wax;
  ctx.fillText("TOTAL ENTREGADO", CENTRO, y - 12);
  ctx.font = "bold 30px 'Fraunces', serif";
  ctx.fillText(formatoEuro(total), CENTRO, y + 22);
  y += ALTO_CAJA_TOTAL / 2 + 30 + hueco; // hueco C

  // ---------- Fecha y firma ----------
  ctx.font = "13px 'Inter', sans-serif";
  ctx.fillStyle = COLOR.charcoal;
  ctx.fillText(`Fecha: ${formatearFecha(fechaISO) || fechaISO || "—"}`, CENTRO, y);
  y += 22;

  ctx.font = "italic 13px 'Inter', sans-serif";
  ctx.fillText(`Firmado: El anfitrión — ${evento?.nombre || ""}`, CENTRO, y);

  // ---------- Pie de página ----------
  // Antes iba a 13px pero DENTRO de un dibujo que luego se escalaba
  // ~0.64x, así que la letra real salía en torno a 8pt -- de ahí la
  // queja de "muy pequeña". Ahora, al dibujarse ya a tamaño final, 10.5pt
  // con buen interlineado (16pt entre líneas) se lee con comodidad.
  // Se ancla siempre a la misma distancia del borde inferior, para que
  // todos los acuses (con 2 o con 14 invitados) cierren igual.
  const yPie1 = PAGINA_ALTO - 78;
  const yPie2 = yPie1 + 16;

  ctx.strokeStyle = COLOR.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X_IZQ, yPie1 - 20);
  ctx.lineTo(X_DER, yPie1 - 20);
  ctx.stroke();

  ctx.font = "italic 10.5px 'Inter', sans-serif";
  ctx.fillStyle = COLOR.charcoal;
  ctx.globalAlpha = 0.75;
  ctx.fillText("Documento generado automáticamente por la app de invitados del evento", CENTRO, yPie1);
  ctx.fillText("como comprobante de la entrega — consérvalo para tu propia seguridad.", CENTRO, yPie2);
  ctx.globalAlpha = 1;

  return canvas;
}

// Devuelve un data URL "data:application/pdf;base64,...." con el recibo
// en una única página A4 vertical real, dibujada 1:1 (sin escalar).
export async function generarPdfAcuse({ evento, colaborador, items, total, fechaISO }) {
  const canvas = dibujarCanvasAcuse({ evento, colaborador, items, total, fechaISO });
  const imagenPng = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  pdf.addImage(imagenPng, "PNG", 0, 0, PAGINA_ANCHO, PAGINA_ALTO);
  return pdf.output("datauristring"); // "data:application/pdf;base64,...."
}
