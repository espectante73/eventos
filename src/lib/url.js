// Lectura/construcción del enlace mágico (?rol=...) — movida fuera de
// App.jsx en el reparto del 2026-08-08 (ver CLAUDE.md).
//
// buildLink() (construía ese enlace a mano para "Copiar enlace") se
// retiró el 2026-08-24: llevaba desde la Fase B (2026-08-12, enlace de
// colaborador retirado a favor del login) sin ninguna llamada real en la
// app, con su propio test pasando en verde igualmente -- detectado en un
// examen honesto del código a petición del usuario. Sustituida de
// verdad por `anfitrion_enviar_invitacion_login` (servidor) +
// getEmailCrearCuentaFromUrl (de aquí abajo).

export function getRolFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get("rol");
  } catch (_) {
    return null;
  }
}

// ?crear=<email> — abre el login directo en modo "Crear cuenta" con el
// email ya relleno (ver VistaLogin.jsx). Se usa en el enlace que se manda
// por email a un colaborador (anfitrion_enviar_invitacion_login), en vez
// del enlace-token que antes se copiaba a mano.
export function getEmailCrearCuentaFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get("crear");
  } catch (_) {
    return null;
  }
}
