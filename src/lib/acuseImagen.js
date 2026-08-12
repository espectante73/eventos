// Genera el acuse de recogida de dinero como PDF (jsPDF) para adjuntarlo
// al email al colaborador — a petición del usuario (2026-08-12): el
// desglose por invitado, el importe total, la fecha y la firma van en un
// documento adjunto, no como texto suelto en el cuerpo del email. Se
// dibuja igual que la imagen de invitación (canvas) y luego se estampa
// como una única página de PDF — así se reutiliza el mismo layout con
// alto dinámico según cuántos invitados tenga el desglose, sin duplicar
// la lógica de dibujo entre un formato y otro.
import { jsPDF } from "jspdf";
import { formatearFecha } from "./formato";

const formatoEuro = (n) =>
  (typeof n === "number" ? n : parseFloat(n) || 0).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";

// Dibuja el recibo en un <canvas> y devuelve { canvas, W, H }. Separado
// de la conversión a PDF para poder reutilizarlo si algún día hiciera
// falta también como imagen suelta.
function dibujarCanvasAcuse({ evento, colaborador, items, total, fechaISO }) {
  const W = 800;
  const ALTO_ITEM = 30;
  const ALTO_CABECERA = 250;
  const ALTO_PIE = 230;
  const H = ALTO_CABECERA + Math.max(items.length, 1) * ALTO_ITEM + ALTO_PIE;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#EFE9DE"; // C.paper
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#1F3A2E"; // C.ink
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, W - 56, H - 56);
  ctx.strokeStyle = "#B08D57"; // C.gold, marco interior fino
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  const xIzq = 80;
  const xDer = W - 80;
  let y = 100;

  ctx.textAlign = "center";
  ctx.fillStyle = "#1F3A2E";
  ctx.font = "bold 38px 'Fraunces', serif";
  ctx.fillText("Recibo de entrega", W / 2, y);
  y += 34;

  ctx.font = "20px 'Inter', sans-serif";
  ctx.fillStyle = "#2B2620";
  ctx.fillText(evento?.nombre || "Evento", W / 2, y);
  y += 46;

  ctx.font = "bold 20px 'Inter', sans-serif";
  ctx.fillText(`Colaborador: ${colaborador.nombre}`, W / 2, y);
  y += 40;

  ctx.font = "16px 'Inter', sans-serif";
  ctx.fillStyle = "#2B2620";
  if (items.length === 0) {
    ctx.textAlign = "center";
    ctx.font = "italic 16px 'Inter', sans-serif";
    ctx.fillText("(sin invitados con pago registrado)", W / 2, y);
    y += ALTO_ITEM;
  } else {
    items.forEach((it) => {
      ctx.textAlign = "left";
      ctx.font = "16px 'Inter', sans-serif";
      ctx.fillText(`${it.apellido}, ${it.nombre}`, xIzq, y);
      ctx.textAlign = "right";
      ctx.fillText(formatoEuro(it.importe), xDer, y);
      y += ALTO_ITEM;
    });
  }

  y += 14;
  ctx.strokeStyle = "#C9BFA9"; // C.line
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xIzq, y);
  ctx.lineTo(xDer, y);
  ctx.stroke();
  y += 54;

  ctx.textAlign = "center";
  ctx.font = "bold 42px 'Fraunces', serif";
  ctx.fillStyle = "#8C2F39"; // C.wax
  ctx.fillText(`Total: ${formatoEuro(total)}`, W / 2, y);
  y += 44;

  ctx.font = "16px 'Inter', sans-serif";
  ctx.fillStyle = "#2B2620";
  ctx.fillText(`Fecha: ${formatearFecha(fechaISO) || fechaISO || "—"}`, W / 2, y);
  y += 38;

  ctx.font = "italic 16px 'Inter', sans-serif";
  ctx.fillText(`Firmado: El anfitrión — ${evento?.nombre || ""}`, W / 2, y);
  y += 48;

  ctx.font = "italic 13px 'Inter', sans-serif";
  ctx.globalAlpha = 0.75;
  ctx.fillText("Documento generado automáticamente por la app de invitados del evento", W / 2, y);
  y += 19;
  ctx.fillText("como comprobante de la entrega — consérvalo para tu propia seguridad.", W / 2, y);
  ctx.globalAlpha = 1;

  return { canvas, W, H };
}

// Devuelve un data URL "data:application/pdf;base64,...." con el recibo
// en una única página, del mismo tamaño que el dibujo (en puntos, 1px =
// 1pt) para que no salga ni recortado ni con márgenes raros.
export async function generarPdfAcuse({ evento, colaborador, items, total, fechaISO }) {
  const { canvas, W, H } = dibujarCanvasAcuse({ evento, colaborador, items, total, fechaISO });
  const imagenPng = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: [W, H] });
  pdf.addImage(imagenPng, "PNG", 0, 0, W, H);
  return pdf.output("datauristring"); // "data:application/pdf;base64,...."
}
