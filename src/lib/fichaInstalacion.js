// Mientras se ve un enlace que no pasa por la entrada de la app —el tablón
// (v85.2), las canciones del DJ (v88.4)—, su propia ficha de instalación
// (api/_manifest.js) y su nombre bajo el icono en el iPhone. Así «Añadir a
// pantalla de inicio», «Crear acceso directo» o «Instalar» abren ESE enlace
// y no la portada de la app (que pedía entrar). Al salir, se deja como
// estaba. UNA pieza para los dos (norma 7).
import { useEffect } from "react";

export function useFichaInstalacion(href, titulo) {
  useEffect(() => {
    if (!href) return undefined;
    const ficha = document.querySelector('link[rel="manifest"]');
    const nombre = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    const antes = { ficha: ficha?.getAttribute("href"), nombre: nombre?.getAttribute("content") };
    ficha?.setAttribute("href", href);
    nombre?.setAttribute("content", titulo);
    return () => {
      if (antes.ficha) ficha?.setAttribute("href", antes.ficha);
      if (antes.nombre) nombre?.setAttribute("content", antes.nombre);
    };
  }, [href, titulo]);
}

// Las direcciones de las fichas, en un solo sitio.
export const fichaDelTablon = (token, clave) =>
  token ? `/api/manifest?t=${encodeURIComponent(token)}${clave ? `&yo=${encodeURIComponent(clave)}` : ""}` : "";
export const fichaDelDj = (token) => (token ? `/api/manifest?dj=${encodeURIComponent(token)}` : "");
