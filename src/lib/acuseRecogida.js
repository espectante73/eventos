// Construye el HTML del acuse de recogida de dinero que se manda por
// email al propio colaborador (comprobante de que entregó al anfitrión
// lo recaudado de sus invitados asignados, para su propia seguridad) —
// desglosado por invitado, con importe total, fecha y firma. Sin
// estado de React, igual que el resto de lib/.
import { formatearFecha } from "./formato";

const formatoEuro = (n) =>
  (typeof n === "number" ? n : parseFloat(n) || 0).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";

// `items`: [{ apellido, nombre, importe }, ...] ya ordenados.
export function construirAsuntoAcuse(evento) {
  return `Acuse de recogida — ${evento?.nombre || "evento"}`;
}

export function construirHtmlAcuse({ evento, colaborador, items, total, fechaISO }) {
  const filas = items
    .map((it) => `<li>${it.apellido}, ${it.nombre} — ${formatoEuro(it.importe)}</li>`)
    .join("");

  return `
Hola ${colaborador.nombre},<br><br>
Confirmamos que hemos recibido de ti la cantidad recaudada de tus invitados asignados. Desglose:
<ul>${filas}</ul>
<p style="font-size:18px;font-weight:700;">Total: ${formatoEuro(total)}</p>
<p>Fecha: ${formatearFecha(fechaISO) || fechaISO}</p>
<p style="margin-top:16px;"><i>Firmado: El anfitrión — ${evento?.nombre || ""}</i></p>
<br>
<small>Documento generado automáticamente por la app de invitados del evento, como comprobante de la entrega — consérvalo para tu propia seguridad.</small>
`.trim();
}
