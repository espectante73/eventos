// Lectura/construcción del enlace mágico (?rol=...) — movida fuera de
// App.jsx en el reparto del 2026-08-08 (ver CLAUDE.md).

export function getRolFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get("rol");
  } catch (_) {
    return null;
  }
}

export function buildLink(rolValue, urlPublica) {
  try {
    const base = urlPublica && urlPublica.trim() ? urlPublica.trim() : window.location.href;
    const url = new URL(base);
    url.searchParams.set("rol", rolValue);
    return url.toString();
  } catch (_) {
    return "";
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
