// Abre una ventana de verdad del sistema operativo (window.open), aparte
// de la pestaña del navegador -- a diferencia de VentanaFlotante (que
// solo se puede mover/agrandar dentro de la propia pestaña), esta se
// puede llevar a otro monitor o dejar al lado de WhatsApp Web.
//
// A petición del usuario, 2026-08-25 (ventana Novedades) -- primer uso
// de este patrón en el proyecto; el resto de ventanas siguen siendo
// VentanaFlotante normales.
//
// ⚠️ Root de React PROPIO para esa ventana, no un createPortal desde la
// pestaña principal. Se probó primero con createPortal (más sencillo) y
// los botones de la cabecera dejaron de responder -- causa real: React
// engancha sus escuchadores de eventos (el sistema de eventos
// sintéticos) en el contenedor raíz de LA PESTAÑA PRINCIPAL, no en
// `document`. Un portal solo mueve DÓNDE se pintan los nodos; los
// eventos nativos de clic siguen disparándose dentro del `document` de
// la ventana emergente, que es un documento COMPLETAMENTE distinto --
// nunca llegan a burbujear hasta el escuchador de la pestaña principal,
// así que React nunca se entera. Con un `createRoot()` propio dentro de
// esa otra ventana, sus escuchadores viven en el sitio correcto.
//
// ⚠️ `abrir()` debe llamarse de forma SÍNCRONA dentro del propio
// manejador de clic que lo dispara (nunca dentro de un useEffect, tras
// un await, etc.) -- si no, algunos navegadores (Safari sobre todo) no
// lo consideran una acción directa del usuario y bloquean la ventana
// emergente en silencio, sin ningún error que avisar.
import { useState, useRef, useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";

export function usePopupWindow({ nombreVentana, ancho = 480, alto = 720 }) {
  const [abierta, setAbierta] = useState(false);
  // Además de la ref (para comprobaciones internas de control como
  // ".closed"), se guarda también en estado -- así el propio objeto
  // `window` de la ventana emergente se puede pasar como prop al
  // contenido y usarse desde ahí (ver el porqué en el comentario grande
  // de "ventana.clipboard" más abajo, en el propio VentanaNovedades.jsx).
  const [ventana, setVentana] = useState(null);
  const ventanaRef = useRef(null);
  const raizRef = useRef(null);

  const cerrar = useCallback(() => {
    if (raizRef.current) {
      raizRef.current.unmount();
      raizRef.current = null;
    }
    if (ventanaRef.current && !ventanaRef.current.closed) {
      ventanaRef.current.close();
    }
    ventanaRef.current = null;
    setVentana(null);
    setAbierta(false);
  }, []);

  const abrir = useCallback(() => {
    if (ventanaRef.current && !ventanaRef.current.closed) {
      ventanaRef.current.focus();
      return true;
    }
    const ventana = window.open("", nombreVentana, `width=${ancho},height=${alto}`);
    if (!ventana) return false; // bloqueada por el navegador

    // ⚠️ La etiqueta "viewport" hay que ponerla A MANO aquí: esta
    // ventana arranca con un <head> completamente vacío y NO hereda la
    // de index.html. Sin ella, un móvil dibuja la página como si la
    // pantalla midiera ~980px y luego la encoge entera para que quepa
    // -- resultado: todo se ve diminuto, "como la versión de
    // escritorio", por muy grandes que sean los botones en el código.
    // Bug real reportado por el usuario el 2026-08-31 probando el mando
    // de Música del evento en el móvil; afecta por igual a Novedades,
    // Logística y Cronograma abiertas desde un teléfono.
    const metaViewport = ventana.document.createElement("meta");
    metaViewport.name = "viewport";
    metaViewport.content = "width=device-width, initial-scale=1";
    ventana.document.head.appendChild(metaViewport);

    // Copia las hojas de estilo ya cargadas (Tailwind + index.css,
    // compiladas por Vite en un único <link>, más cualquier <style> que
    // hubiera inyectado el propio navegador) -- sin esto, el contenido
    // se vería sin ningún estilo dentro de la ventana nueva, que
    // arranca con un document en blanco propio.
    document.querySelectorAll('link[rel="stylesheet"], style').forEach((nodo) => {
      ventana.document.head.appendChild(nodo.cloneNode(true));
    });
    ventana.document.body.style.margin = "0";
    ventana.document.body.style.height = "100vh";

    const div = ventana.document.createElement("div");
    // La clase la usa index.css para poder neutralizar esta altura al
    // IMPRIMIR: un contenedor de altura fija confina la impresión a una
    // sola página (el bug de "solo imprime hasta la letra G", 2026-08-29).
    div.className = "raiz-ventana-emergente";
    div.style.height = "100%";
    ventana.document.body.appendChild(div);
    raizRef.current = createRoot(div);

    // "beforeunload" cubre tanto que la persona cierre la ventana a mano
    // (la X del sistema operativo) como que se cierre sola por código
    // (cerrar(), más arriba) -- en los dos casos hay que soltar las
    // referencias para que abrir() sepa que ya no hay ninguna ventana
    // real detrás y pueda crear una nueva la próxima vez.
    ventana.addEventListener("beforeunload", () => {
      ventanaRef.current = null;
      raizRef.current = null;
      setVentana(null);
      setAbierta(false);
    });

    ventanaRef.current = ventana;
    setVentana(ventana);
    setAbierta(true);
    return true;
  }, [nombreVentana, ancho, alto]);

  // Vuelve a pintar el contenido en el root propio de esa ventana --
  // llamarlo cada vez que cambien los datos que le interesan (p.ej.
  // porque `data` se ha refrescado sola), mientras siga abierta.
  const actualizar = useCallback((hijos) => {
    if (raizRef.current) raizRef.current.render(hijos);
  }, []);

  // Si el componente que usa esto se desmonta del todo (p.ej. cierre de
  // sesión), la ventana emergente no debe quedar huérfana por su cuenta.
  useEffect(() => cerrar, [cerrar]);

  return { abrir, cerrar, actualizar, abierta, ventana };
}
