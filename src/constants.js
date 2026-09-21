// Constantes de app compartidas entre App.jsx y los componentes bajo
// src/components/. Movida fuera de App.jsx en el reparto del 2026-08-08.
export const VERSION_APP = "38.7";

// Dirección del código de la app. La enseña "Mi cuenta" a quien tenga el
// permiso "Ver el código de la app" (lib/permisos.js).
// ⚠️ El repositorio es PÚBLICO: el permiso decide quién ve el enlace
// dentro de la app, no quién puede entrar a GitHub.
export const URL_REPOSITORIO = "https://github.com/espectante73/eventos";

// Panel de errores de la app en Sentry (ver lib/registroErrores.js). Solo
// lo ve el anfitrión, en Mi cuenta. Pide entrar con la cuenta de Sentry:
// el enlace no enseña nada a quien no la tenga.
export const URL_REGISTRO_ERRORES = "https://benito-farina.sentry.io/issues/";
