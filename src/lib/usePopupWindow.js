// Abre una ventana de verdad del sistema operativo (window.open), aparte
// de la pestaña del navegador -- a diferencia de VentanaFlotante (que
// solo se puede mover/agrandar dentro de la propia pestaña), esta se
// puede llevar a otro monitor o dejar al lado de WhatsApp Web. Deja
// renderizar contenido de React dentro con un portal (createPortal sobre
// el <div> que se crea en el document de esa otra ventana).
//
// A petición del usuario, 2026-08-25 (ventana Novedades) -- primer uso
// de este patrón en el proyecto; el resto de ventanas siguen siendo
// VentanaFlotante normales.
//
// ⚠️ `abrir()` debe llamarse de forma SÍNCRONA dentro del propio
// manejador de clic que lo dispara (nunca dentro de un useEffect, tras
// un await, etc.) -- si no, algunos navegadores (Safari sobre todo) no
// lo consideran una acción directa del usuario y bloquean la ventana
// emergente en silencio, sin ningún error que avisar.
import { useState, useRef, useCallback, useEffect } from "react";

export function usePopupWindow({ nombreVentana, ancho = 480, alto = 720 }) {
  const [contenedor, setContenedor] = useState(null);
  const ventanaRef = useRef(null);

  const cerrar = useCallback(() => {
    if (ventanaRef.current && !ventanaRef.current.closed) {
      ventanaRef.current.close();
    }
    ventanaRef.current = null;
    setContenedor(null);
  }, []);

  const abrir = useCallback(() => {
    if (ventanaRef.current && !ventanaRef.current.closed) {
      ventanaRef.current.focus();
      return true;
    }
    const ventana = window.open("", nombreVentana, `width=${ancho},height=${alto}`);
    if (!ventana) return false; // bloqueada por el navegador

    // Copia las hojas de estilo ya cargadas (Tailwind + index.css,
    // compiladas por Vite en un único <link>, más cualquier <style>
    // que hubiera inyectado el propio navegador) -- sin esto, el
    // contenido se vería sin ningún estilo dentro de la ventana nueva,
    // que arranca con un document en blanco propio.
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((nodo) => {
      ventana.document.head.appendChild(nodo.cloneNode(true));
    });
    ventana.document.body.style.margin = "0";
    ventana.document.body.style.height = "100vh";

    const div = ventana.document.createElement("div");
    div.style.height = "100%";
    ventana.document.body.appendChild(div);

    // "beforeunload" cubre tanto que la persona cierre la ventana a mano
    // (la X del sistema operativo) como que se cierre sola por código
    // (cerrar(), más abajo) -- en los dos casos hay que soltar la
    // referencia para que abrir() sepa que ya no hay ninguna ventana
    // real detrás y pueda crear una nueva la próxima vez.
    ventana.addEventListener("beforeunload", () => {
      ventanaRef.current = null;
      setContenedor(null);
    });

    ventanaRef.current = ventana;
    setContenedor(div);
    return true;
  }, [nombreVentana, ancho, alto]);

  // Si el componente que usa esto se desmonta del todo (p.ej. cierre de
  // sesión), la ventana emergente no debe quedar huérfana por su cuenta.
  useEffect(() => cerrar, [cerrar]);

  return { abrir, cerrar, contenedor };
}
