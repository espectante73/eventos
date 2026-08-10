// Sustituye a un <select> nativo para el botón "Abrir sección…" de la
// Portada. Motivo: en Safari, un <select> lo pinta el propio sistema
// operativo (menú nativo) y CSS no puede tocar sus colores — los
// <option style={...}> se ignoran por completo — así que sus opciones
// seguían viéndose en blanco/negro por defecto en vez de con los colores
// de la app (detectado el 2026-08-09). Aquí se controla el aspecto entero
// a mano, así se ve igual en cualquier navegador.
//
// Se renderiza con un portal a document.body: la Portada que lo contiene
// tiene overflow:hidden (por la imagen de cabecera) y recortaría la lista
// si se quedara dentro de ese contenedor — con el portal, la lista vive
// fuera de esa jerarquía y no se recorta.
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { C } from "../theme";
import { ORDEN_VENTANAS, ETIQUETAS_VENTANAS } from "./VentanaFlotante";

export function DesplegableSecciones({ abierto, toggle }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const botonRef = useRef(null);
  const listaRef = useRef(null);

  const abrir = () => {
    const r = botonRef.current.getBoundingClientRect();
    setPos({ bottom: window.innerHeight - r.top + 4, right: window.innerWidth - r.right });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const cerrarSiFuera = (e) => {
      if (botonRef.current?.contains(e.target) || listaRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", cerrarSiFuera);
    document.addEventListener("touchstart", cerrarSiFuera);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", cerrarSiFuera);
      document.removeEventListener("touchstart", cerrarSiFuera);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={botonRef}
        onClick={() => (open ? setOpen(false) : abrir())}
        className="absolute px-3 py-1.5 rounded text-sm font-medium"
        style={{ bottom: 8, right: 8, background: C.ink, color: C.paper, border: `1px solid ${C.ink}` }}
        title="Abre la sección elegida en una ventana flotante; puedes tener varias abiertas a la vez"
      >
        Abrir sección…
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={listaRef}
            className="fixed rounded overflow-y-auto"
            style={{
              bottom: pos.bottom,
              right: pos.right,
              background: C.ink,
              border: "1px solid rgba(239,233,222,0.2)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
              minWidth: 220,
              maxHeight: "60vh",
              zIndex: 9999,
            }}
          >
            {ORDEN_VENTANAS.map((clave) => (
              <button
                key={clave}
                onClick={() => {
                  toggle(clave);
                  setOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-sm"
                style={{ color: C.paper, background: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,233,222,0.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {abierto[clave] ? "✓ " : ""}
                {ETIQUETAS_VENTANAS[clave]}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
