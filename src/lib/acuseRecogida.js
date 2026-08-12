// Asunto y cuerpo (breve) del email de acuse de recogida — el desglose
// por invitado, total, fecha y firma van en la IMAGEN adjunta (ver
// acuseImagen.js), no como texto en el cuerpo del email, a petición
// del usuario (2026-08-12).
export function construirAsuntoAcuse(evento) {
  return `Acuse de recogida — ${evento?.nombre || "evento"}`;
}

export function construirHtmlAcuse({ colaborador }) {
  return `
Hola ${colaborador.nombre},<br><br>
Adjunto tu acuse de recogida — comprobante de que hemos recibido de ti la cantidad
recaudada de tus invitados asignados. Consérvalo para tu propia seguridad.<br><br>
Gracias por tu ayuda.
`.trim();
}
