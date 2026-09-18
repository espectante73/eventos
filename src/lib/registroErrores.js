// Registro de errores con Sentry (2026-09-18).
//
// Antes, si a un colaborador le fallaba algo en su móvil, el anfitrión no se
// enteraba hasta que se lo contaban -- si se lo contaban. Ahora cada fallo
// llega solo, con la pantalla, el aparato y el error.
//
// ⚠️ PRIVACIDAD, decidido con el usuario: los avisos NO llevan datos de los
// invitados. La lista es de amigos y queda en el ámbito doméstico; que salga
// de ahí hacia un servicio externo, ni siquiera dentro de un informe de
// error, rompería esa idea. Por eso:
//   - `sendDefaultPii: false` (sin IP ni cabeceras del usuario);
//   - sin grabación de sesión ni rastreo de rendimiento (solo errores);
//   - `limpiarEvento` quita el usuario y TODAS las consultas de las URLs.
//     Lo segundo importa de verdad: el enlace del tablón lleva la llave
//     secreta en `?tablon=...`, y sin esto viajaría dentro de cada informe.
import * as Sentry from "@sentry/react";

// Quita todo lo que va detrás de "?" o "#". Pura, para poder probarla.
export function sinConsulta(url) {
  if (typeof url !== "string") return url;
  return url.split(/[?#]/)[0];
}

// Filtro final antes de enviar cualquier informe. Pura, para poder probarla.
export function limpiarEvento(evento) {
  if (!evento || typeof evento !== "object") return evento;
  const limpio = { ...evento };
  delete limpio.user;
  if (limpio.request) {
    limpio.request = { ...limpio.request, url: sinConsulta(limpio.request.url) };
    delete limpio.request.query_string;
    delete limpio.request.cookies;
    delete limpio.request.headers;
    delete limpio.request.data;
  }
  if (Array.isArray(limpio.breadcrumbs)) {
    limpio.breadcrumbs = limpio.breadcrumbs.map((b) => {
      if (!b || !b.data) return b;
      const data = { ...b.data };
      if (data.url) data.url = sinConsulta(data.url);
      if (data.from) data.from = sinConsulta(data.from);
      if (data.to) data.to = sinConsulta(data.to);
      return { ...b, data };
    });
  }
  return limpio;
}

export function iniciarRegistroErrores() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  // Sin dirección (clon local sin configurar, o un evento futuro que no lo
  // use), la app funciona igual y simplemente no avisa.
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    // Solo errores: nada de rendimiento ni de grabar la sesión.
    tracesSampleRate: 0,
    beforeSend: limpiarEvento,
    beforeBreadcrumb: (miga) => {
      // Los mensajes de consola pueden llevar datos de la app: fuera.
      if (miga?.category === "console") return null;
      return miga;
    },
  });
}

// Para los ErrorBoundary: informar de lo que ya han atrapado ellos.
export function informarError(error, extra) {
  try {
    Sentry.captureException(error, extra ? { extra } : undefined);
  } catch (_) {
    // El registro de errores nunca debe provocar otro error.
  }
}
