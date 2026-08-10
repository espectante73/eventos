// Menú desplegable propio (no un <select> nativo): fondo verde oscuro /
// letra papel, ancho ajustado al contenido, con icono opcional por
// opción y submenús anidados opcionales. Construido para
// DesplegableSecciones.jsx (el motivo original: en Safari, un <select>
// nativo lo pinta el propio sistema operativo y CSS no puede tocar el
// color de sus opciones) y reutilizado luego por el selector de rol
// (App.jsx) para que ambos se vean igual — ver CLAUDE.md: "si [la
// lógica] la usan dos o más, se queda en el cascarón / se comparte",
// mismo patrón aplicado aquí a un componente en vez de una función.
//
// Se renderiza con un portal a document.body para no quedar recortado
// por un overflow:hidden de algún ancestro (p.ej. la Portada, que lo
// tiene por la imagen de cabecera).
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft } from "lucide-react";
import { C } from "../theme";

// Una fila del panel: rótulo de grupo (no clicable), acción directa, o
// disparador de un submenú anidado (se abre hacia la izquierda de la
// propia fila, sin cerrar el panel padre — igual patrón que un menú de
// sistema operativo con flechas ">"/"‹").
function FilaMenu({ opcion, cerrarTodo }) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState(null);
  const filaRef = useRef(null);
  const panelRef = useRef(null);

  const abrirSubmenu = () => {
    const r = filaRef.current.getBoundingClientRect();
    setPos({ top: r.top, right: window.innerWidth - r.left + 4 });
    setAbierto(true);
  };

  useEffect(() => {
    if (!abierto) return;
    // Ojo: un submenú anidado vive en SU PROPIO portal (otro hijo directo
    // de document.body), no dentro del DOM del panel padre -- por eso no
    // basta con comprobar filaRef/panelRef (ver el mismo comentario, más
    // detallado, en MenuFlotante más abajo).
    const cerrarSiFuera = (e) => {
      if (filaRef.current?.contains(e.target) || e.target.closest?.("[data-menu-panel]")) return;
      setAbierto(false);
    };
    document.addEventListener("mousedown", cerrarSiFuera);
    document.addEventListener("touchstart", cerrarSiFuera);
    return () => {
      document.removeEventListener("mousedown", cerrarSiFuera);
      document.removeEventListener("touchstart", cerrarSiFuera);
    };
  }, [abierto]);

  if (opcion.encabezado) {
    return (
      <div
        className="px-3 pt-1 pb-0.5 text-xs uppercase"
        style={{ color: C.paper, opacity: 0.45, letterSpacing: "0.06em" }}
      >
        {opcion.encabezado}
      </div>
    );
  }

  if (opcion.submenu) {
    return (
      <div ref={filaRef}>
        <button
          onClick={abrirSubmenu}
          className="flex items-center justify-between gap-3 w-full text-left px-3 py-2 text-sm whitespace-nowrap"
          style={{ color: C.paper, background: abierto ? "rgba(239,233,222,0.12)" : "transparent" }}
          onMouseEnter={(e) => !abierto && (e.currentTarget.style.background = "rgba(239,233,222,0.12)")}
          onMouseLeave={(e) => !abierto && (e.currentTarget.style.background = "transparent")}
        >
          <span className="flex items-center gap-2">
            {opcion.icono && <opcion.icono size={17} style={{ flexShrink: 0, opacity: 0.85 }} />}
            {opcion.etiqueta}
          </span>
          <ChevronLeft size={13} style={{ opacity: 0.6, flexShrink: 0 }} />
        </button>
        {abierto &&
          pos &&
          createPortal(
            <div
              ref={panelRef}
              data-menu-panel
              className="fixed rounded overflow-y-auto"
              style={{
                top: pos.top,
                right: pos.right,
                background: C.ink,
                border: "1px solid rgba(239,233,222,0.2)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                width: "max-content",
                maxWidth: "min(320px, calc(100vw - 2rem))",
                maxHeight: "60vh",
                padding: "4px 0",
                zIndex: 10000,
              }}
            >
              {opcion.submenu.map((hijo) => (
                <FilaMenu key={hijo.id} opcion={hijo} cerrarTodo={cerrarTodo} />
              ))}
            </div>,
            document.body
          )}
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        opcion.onClick();
        cerrarTodo();
      }}
      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm whitespace-nowrap"
      style={{ color: C.paper, background: "transparent" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,233,222,0.12)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {opcion.icono && <opcion.icono size={17} style={{ flexShrink: 0, opacity: 0.85 }} />}
      <span>{opcion.etiqueta}</span>
    </button>
  );
}

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
    // Un submenú anidado (ver FilaMenu arriba) vive en SU PROPIO portal --
    // otro hijo directo de document.body, no un descendiente DOM de
    // listaRef -- así que un clic dentro de él no pasa el .contains() de
    // abajo aunque visualmente esté "dentro" de este menú. Sin el
    // data-menu-panel de refuerzo, ese clic se interpretaba como "fuera"
    // y cerraba TODO el árbol de menús antes de que el propio onClick del
    // hijo llegara a disparar -- por eso los submenús no abrían nada.
    const cerrarSiFuera = (e) => {
      if (botonRef.current?.contains(e.target) || e.target.closest?.("[data-menu-panel]")) return;
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
            data-menu-panel
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
                <FilaMenu opcion={o} cerrarTodo={() => setOpen(false)} />
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
