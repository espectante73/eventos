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
