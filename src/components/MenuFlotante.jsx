// Menú desplegable propio (no un <select> nativo): fondo verde oscuro /
// letra papel, ancho ajustado al contenido, con icono opcional por
// opción. Construido para DesplegableSecciones.jsx (el motivo original:
// en Safari, un <select> nativo lo pinta el propio sistema operativo y
// CSS no puede tocar el color de sus opciones) y reutilizado luego por
// el selector de rol (App.jsx) y el "SECCIÓN" de Configuración
// (VistaAnfitrion.jsx) para que los tres se vean igual — ver CLAUDE.md:
// "si [la lógica] la usan dos o más, se queda en el cascarón / se
// comparte", mismo patrón aplicado aquí a un componente en vez de una
// función.
//
// Se renderiza con un portal a document.body para no quedar recortado
// por un overflow:hidden de algún ancestro (p.ej. la Portada, que lo
// tiene por la imagen de cabecera).
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { C } from "../theme";

// `render` recibe { ref, open, toggle } para que cada sitio dibuje su
// propio botón disparador (varían mucho: botón flotante, barra ancha de
// rol, botón pequeño en una cabecera) sin duplicar la lógica de
// abrir/cerrar/posicionar.
// `anchor`: "right" ancla el panel a la esquina inferior derecha del
// botón (cae hacia arriba), "bottom-left" lo abre justo debajo del
// botón pegado a su izquierda, "left" lo abre hacia el lado izquierdo
// del botón (mismo borde superior, sin caer arriba ni abajo).
export function MenuFlotante({ render, opciones, anchor = "right" }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const botonRef = useRef(null);
  const listaRef = useRef(null);

  const abrir = () => {
    const r = botonRef.current.getBoundingClientRect();
    setPos(
      anchor === "right"
        ? { bottom: window.innerHeight - r.top + 4, right: window.innerWidth - r.right }
        : anchor === "left"
        ? { top: r.top, right: window.innerWidth - r.left + 4 }
        : { top: r.bottom + 4, left: r.left }
    );
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
      {render({ ref: botonRef, open, toggle: () => (open ? setOpen(false) : abrir()) })}
      {open &&
        pos &&
        createPortal(
          <div
            ref={listaRef}
            className="fixed rounded overflow-y-auto"
            style={{
              ...pos,
              background: C.ink,
              border: "1px solid rgba(239,233,222,0.2)",
              boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
              width: "max-content",
              maxWidth: "min(320px, calc(100vw - 2rem))",
              maxHeight: "60vh",
              padding: "4px 0",
              zIndex: 9999,
            }}
          >
            {opciones.map((o) => (
              <div key={o.id}>
                {o.separador && (
                  <div style={{ borderTop: "1px solid rgba(239,233,222,0.15)", margin: "4px 0" }} />
                )}
                <button
                  onClick={() => {
                    o.onClick();
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm whitespace-nowrap"
                  style={{ color: C.paper, background: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,233,222,0.12)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {o.icono && <o.icono size={17} style={{ flexShrink: 0, opacity: 0.85 }} />}
                  <span>{o.etiqueta}</span>
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
