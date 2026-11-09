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

// ?tablon=<token-del-tablon> — el enlace público de solo lectura que se
// comparte UNA vez en el grupo de WhatsApp de confirmados (ver
// VistaTablon.jsx / VentanaNovedades.jsx). A diferencia de ?rol=..., no
// identifica a nadie: cualquiera con el enlace ve lo mismo.
export function getTokenTablonFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get("tablon");
  } catch (_) {
    return null;
  }
}

// Misma fórmula usada por VistaAnfitrion.jsx y VistaColaborador.jsx para
// el botón "Novedades" de Portada.jsx -- centralizada aquí en vez de
// duplicada en los dos sitios, para que no puedan desincronizarse.
export function construirEnlaceTablon(urlPublica, token) {
  if (!token || !urlPublica) return "";
  return `${urlPublica.replace(/\/$/, "")}?tablon=${token}`;
}

// ?dj=<token> — «Canciones para bailar» para el DJ (v81): solo mirar, y
// además pide la clave que el anfitrión le da por teléfono (VistaDj.jsx).
export function getTokenDjFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get("dj");
  } catch (_) {
    return null;
  }
}

export function construirEnlaceDj(urlPublica, token) {
  if (!token || !urlPublica) return "";
  return `${urlPublica.replace(/\/$/, "")}?dj=${token}`;
}

// ?acreditar=<código> — el QR de la invitación (v83.2): lo lee en la entrada
// un acomodador con permiso (VistaAcreditar.jsx). Va siempre con un enlace,
// para que lo abra la cámara normal del móvil.
export function getCodigoAcreditarFromUrl() {
  try {
    return new URLSearchParams(window.location.search).get("acreditar");
  } catch (_) {
    return null;
  }
}

// El código de un QR leído con la cámara de la propia página (v83.8). Solo
// se saca el código: a la dirección que traiga el QR no se va nunca.
export function codigoAcreditarDe(texto) {
  return String(texto || "").match(/[?&]acreditar=([0-9a-z]+)/i)?.[1] || "";
}

export function construirEnlaceAcreditar(urlPublica, codigo) {
  const base = urlPublica || window.location.origin;
  return `${base.replace(/\/$/, "")}?acreditar=${codigo}`;
}
