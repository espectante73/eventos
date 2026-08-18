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
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft } from "lucide-react";
import { C } from "../theme";

// Margen mínimo respecto al borde de la ventana, y altura mínima aunque
// haya poco hueco (por debajo de esto, mejor dejar que se salga un poco
// que quedarse ilegible).
const MARGEN_BORDE = 12;
const ALTO_MINIMO = 120;

// Altura máxima real según el hueco disponible en pantalla, no un 60vh
// fijo: si el botón está cerca del borde, un límite fijo deja que el
// panel se salga igualmente por ese lado y las primeras opciones
// queden inalcanzables (detectado el 2026-08-09: con "Abrir sección…"
// cerca del borde superior, "Avisos" y "Colaboradores" — las primeras
// de la lista — quedaban fuera de la ventana sin forma de llegar a
// ellas). `ancladoY` es el borde fijo del panel (de dónde "cuelga");
// `creceHaciaArriba` indica hacia qué lado se extiende el resto.
function alturaMaximaDisponible(ancladoY, creceHaciaArriba) {
  const disponible = creceHaciaArriba
    ? ancladoY - MARGEN_BORDE
    : window.innerHeight - ancladoY - MARGEN_BORDE;
  return Math.max(ALTO_MINIMO, Math.min(disponible, window.innerHeight * 0.6));
}

// Corrección de última hora: la posición de apertura (arriba en
// alturaMaximaDisponible y en abrir()/abrirSubmenu()) se calcula ANTES de
// saber cuánto va a medir el panel de verdad (su ancho es "max-content",
// depende del texto). En pantallas estrechas eso podía dejar un submenú
// anidado abriéndose mayormente fuera de la pantalla por la izquierda
// (detectado el 2026-08-09 con "Formularios", en móvil) — aquí se mide
// el panel ya montado en el DOM y, si se sale por algún borde, se
// empuja de vuelta dentro sin más.
function useMantenerDentroDePantalla(activo, ref, pos, setPos) {
  useLayoutEffect(() => {
    if (!activo || !pos || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    if (pos.right !== undefined && rect.left < MARGEN_BORDE) {
      const ajuste = MARGEN_BORDE - rect.left;
      setPos((p) => (p ? { ...p, right: p.right - ajuste } : p));
    } else if (pos.left !== undefined && rect.right > window.innerWidth - MARGEN_BORDE) {
      const ajuste = rect.right - (window.innerWidth - MARGEN_BORDE);
      setPos((p) => (p ? { ...p, left: p.left - ajuste } : p));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, pos?.top, pos?.bottom, pos?.left, pos?.right]);
}

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
    setPos({
      top: r.top,
      right: window.innerWidth - r.left + 4,
      maxHeight: alturaMaximaDisponible(r.top, false), // crece hacia abajo desde r.top
    });
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

  useMantenerDentroDePantalla(abierto, panelRef, pos, setPos);

  if (opcion.encabezado) {
    return (
      <div
        className="px-3 pt-1 pb-0.5 text-xs uppercase"
        style={{ color: C.goldClaro, opacity: 0.7, letterSpacing: "0.06em" }}
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
          // Mismo contorno + relieve 3D que "Cerrar sesión" (boton-3d +
          // boton-flotante-imagen: borde, degradado propio, sombra que
          // crece al pasar el ratón) -- a petición del usuario, en vez
          // del simple resaltado plano que llevaba antes cada fila.
          // Redondeado como un botón de la portada (a petición del
          // usuario anterior): margen a los lados + radio grande, en vez
          // de una fila rectangular a todo lo ancho del panel.
          className="boton-3d boton-flotante-imagen flex items-center justify-between gap-3 text-left px-3 py-2 text-sm whitespace-nowrap"
          style={{
            color: C.goldClaro,
            ...(abierto ? { background: "rgba(239,233,222,0.12)" } : {}),
            margin: "2px 6px",
            width: "calc(100% - 12px)",
            borderRadius: 9999,
          }}
        >
          <span className="flex items-center gap-2">
            {opcion.icono && <opcion.icono size={19} style={{ flexShrink: 0, opacity: 0.85 }} />}
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
              className="panel-flotante-cristal cristal-difuminado fixed rounded-xl overflow-y-auto"
              style={{
                top: pos.top,
                right: pos.right,
                width: "max-content",
                maxWidth: "min(320px, calc(100vw - 2rem))",
                maxHeight: pos.maxHeight,
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

  // `opcion.fondo`: opciones "de peligro" (Modo pruebas, Borrado total)
  // llevan su propio chip de color de fondo (letra clara) en vez del
  // degradado normal de boton-flotante-imagen — ver DesplegableSecciones.jsx.
  // Se sigue aplicando por encima (inline gana a la clase), así que
  // conservan su color propio pero ganan el mismo contorno + relieve 3D.
  return (
    <button
      onClick={() => {
        opcion.onClick();
        cerrarTodo();
      }}
      // Mismo contorno + relieve 3D que "Cerrar sesión" (boton-3d +
      // boton-flotante-imagen) -- a petición del usuario. Redondeado
      // como un botón de la portada (a petición del usuario anterior):
      // margen a los lados + radio grande para TODAS las filas.
      className="boton-3d boton-flotante-imagen flex items-center gap-2 text-left px-3 py-2 text-sm whitespace-nowrap"
      style={{
        color: opcion.color || C.goldClaro,
        ...(opcion.fondo ? { background: opcion.fondo } : {}),
        margin: "2px 6px",
        width: "calc(100% - 12px)",
        borderRadius: 9999,
      }}
      onMouseEnter={(e) => {
        if (opcion.fondo) e.currentTarget.style.filter = "brightness(1.2)";
      }}
      onMouseLeave={(e) => {
        if (opcion.fondo) e.currentTarget.style.filter = "none";
      }}
    >
      {opcion.icono && <opcion.icono size={19} style={{ flexShrink: 0, opacity: 0.85 }} />}
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
    if (anchor === "right") {
      // Cuelga del borde superior del botón y crece hacia arriba.
      setPos({
        bottom: window.innerHeight - r.top + 4,
        right: window.innerWidth - r.right,
        maxHeight: alturaMaximaDisponible(r.top, true),
      });
    } else if (anchor === "left") {
      // Cuelga del borde superior del botón y crece hacia abajo.
      setPos({
        top: r.top,
        right: window.innerWidth - r.left + 4,
        maxHeight: alturaMaximaDisponible(r.top, false),
      });
    } else {
      // "bottom-left": cuelga del borde inferior del botón y crece hacia abajo.
      setPos({
        top: r.bottom + 4,
        left: r.left,
        maxHeight: alturaMaximaDisponible(r.bottom, false),
      });
    }
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

  useMantenerDentroDePantalla(open, listaRef, pos, setPos);

  return (
    <>
      {render({ ref: botonRef, open, toggle: () => (open ? setOpen(false) : abrir()) })}
      {open &&
        pos &&
        createPortal(
          <div
            ref={listaRef}
            data-menu-panel
            className="panel-flotante-cristal cristal-difuminado fixed rounded-xl overflow-y-auto"
            style={{
              ...pos,
              width: "max-content",
              maxWidth: "min(320px, calc(100vw - 2rem))",
              padding: "4px 0",
              zIndex: 9999,
            }}
          >
            {opciones.map((o) => (
              <FilaMenu key={o.id} opcion={o} cerrarTodo={() => setOpen(false)} />
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
