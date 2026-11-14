// Asunto y cuerpo (breve) del email de acuse de recogida — el desglose
// por invitado, total, fecha y firma van en la IMAGEN adjunta (ver
// acuseImagen.js), no como texto en el cuerpo del email, a petición
// del usuario (2026-08-12).
export function construirAsuntoAcuse(evento) {
  return `Acuse de recogida — ${evento?.nombre || "evento"}`;
}

// El cuerpo, en párrafos (v86, él: «que en la vista previa se vea el
// contenido del email»): el email los une con <br><br> y la vista previa
// los enseña tal cual. Una sola pieza: lo que se ve es lo que se envía.
export function parrafosAcuse({ colaborador }) {
  return [
    `Hola ${colaborador.nombre},`,
    "Adjunto tu acuse de recogida — comprobante de que hemos recibido de ti la cantidad recaudada de tus invitados asignados. Consérvalo para tu propia seguridad.",
    "Gracias por tu ayuda.",
  ];
}

export function construirHtmlAcuse({ colaborador }) {
  return parrafosAcuse({ colaborador }).join("<br><br>");
}
