// Modal bloqueante (ModalFlotante) y ventana flotante movible/redimensionable
// no bloqueante (VentanaFlotante) — la base de toda la navegación por
// secciones de la app (Mesas, Avisos, Configuración...). Movidas fuera de
// App.jsx en el reparto del 2026-08-08 (ver CLAUDE.md).
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { C } from "../theme";

// Ventana flotante genérica: independiente de qué secciones estén plegadas,
// para que Imprimir/Canciones/Alergias y los avisos de mesas funcionen siempre.
export function ModalFlotante({ titulo, onCerrar, children, acciones, colorTitulo }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCerrar]);

  // Un modal de verdad (con fondo oscurecido) tiene que quedar SIEMPRE por
  // delante de cualquier VentanaFlotante que ya estuviera abierta — si no,
  // en cuanto una ventana llevaba un rato usándose (z-index ya subido),
  // el modal se abría oculto detrás de ella. Se pide el mismo contador
  // compartido, así queda garantizado por encima de todo lo anterior.
  const [zIndex] = useState(() => ++contadorZIndexVentanas);

  return (
    <div
      // "modal-flotante-fondo"/"-caja"/"-cuerpo": sin efecto en pantalla
      // (son ganchos vacíos), solo existen para poder neutralizar estas
      // tres cajas durante la impresión -- ver @media print en
      // index.css. Necesario porque este modal se usa también para
      // imprimir listas potencialmente largas (Lista de invitados): sin
      // esto, el "position: fixed"/"overflow-y: auto" de aquí abajo
      // recortaba la impresión a una sola página. Bug real reportado
      // por el usuario, 2026-08-29 (ver también el comentario de
      // #zona-imprimible en index.css).
      className="fixed inset-0 flex items-center justify-center p-4 modal-flotante-fondo"
      style={{ background: "rgba(31,25,15,0.55)", zIndex }}
      onClick={onCerrar}
    >
      <div
        className="rounded-lg w-full flex flex-col modal-flotante-caja"
        style={{
          background: C.paper,
          border: `1px solid ${C.line}`,
          maxWidth: 720,
          maxHeight: "88vh",
          boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="panel-flotante-cristal flex items-center justify-between px-4 py-3 rounded-t-lg"
          style={{ borderBottom: "none" }}
        >
          <h3
            className="text-lg"
            style={{ fontFamily: "'Fraunces', serif", color: colorTitulo || C.goldClaro, fontWeight: 700 }}
          >
            {titulo}
          </h3>
          <button onClick={onCerrar} title="Cerrar" className="boton-3d rounded-full p-1.5" style={{ color: C.goldClaro }}>
            <X size={18} />
          </button>
        </div>
        <div className="p-4 modal-flotante-cuerpo" style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain" }}>
          {children}
        </div>
        {acciones && (
          <div
            className="flex items-center gap-2 px-4 py-3 flex-wrap"
            style={{ borderTop: `1px solid ${C.line}` }}
          >
            {acciones}
          </div>
        )}
      </div>
    </div>
  );
}

// Orden fijo de apertura en cascada — cada sección siempre aparece en el
// mismo sitio relativo, en vez de saltar de posición según el orden en que
// se abran.
// Orden alfabético (por la etiqueta visible, no por la clave interna) —
// así el desplegable es predecible según crece: siempre se sabe dónde
// buscar algo sin tener que recordar un grupo temático.
// Contador compartido por todas las VentanaFlotante para decidir cuál va
// por delante: cada vez que se toca o se abre una, sube y se lo queda ella.
let contadorZIndexVentanas = 50;

export const ORDEN_VENTANAS = [
  "avisos",
  "colaboradores",
  "configuracion",
  "copiaSeguridad",
  "cuentas",
  "invitaciones",
  "invitados",
  "logistica",
  "mesas",
  "musicaEvento",
  "novedades",
  "permisos",
  "plano",
  "progreso",
  "versiones",
];

// Etiquetas cortas (una palabra donde sea posible) -- son solo las del
// menú "Abrir sección..." (DesplegableSecciones.jsx); el título completo
// de cada ventana ya abierta se define aparte, en su propio fichero
// (p.ej. VentanaVersiones.jsx sigue titulándose "Versiones", pero
// VentanaPlano.jsx sigue titulándose "Plano de mesas" tal cual).
export const ETIQUETAS_VENTANAS = {
  progreso: "Progreso",
  colaboradores: "Colaboradores",
  mesas: "Mesas",
  plano: "Plano",
  invitaciones: "Invitaciones",
  invitados: "Invitados",
  cuentas: "Cuentas",
  copiaSeguridad: "Backup",
  configuracion: "Configuración",
  avisos: "Avisos",
  versiones: "Versiones",
  novedades: "Novedades",
  permisos: "Permisos",
  logistica: "Logística",
  musicaEvento: "Música",
};

// Ventana flotante independiente y no bloqueante: a diferencia de
// ModalFlotante, no oscurece el resto de la pantalla ni impide que haya
// varias abiertas a la vez — pensada para las secciones de administración
// que se abren desde el desplegable de navegación (Mesas, Invitaciones,
// Configuración...), donde puede interesar ver más de una a la vez.
// `ancho`: ancho inicial opcional (antes de que se redimensione a mano),
// para ventanas con muy poco contenido donde los 620px por defecto
// dejarían un hueco vacío enorme (p.ej. Precios, que son solo 4 campos
// de 1-2 cifras) — ver VentanaConfigPrecios.jsx.
// `subtitulo`: contenido opcional bajo el título, dentro de la propia
// cabecera (p.ej. VentanaProgreso.jsx: una fila de etiquetas + otra de
// números resaltados) -- a petición del usuario, 2026-08-18.
export function VentanaFlotante({ clave, titulo, onCerrar, children, acciones, extra, ancho, subtitulo }) {
  const idx = Math.min(Math.max(ORDEN_VENTANAS.indexOf(clave), 0), 4);
  // "left" fijo (no en cascada como antes): todas las ventanas nacen
  // alineadas al mismo borde izquierdo, a petición del usuario -- el
  // desplazamiento en cascada se queda solo en "top" (vertical), para
  // que abrir varias a la vez se siga viendo cuáles hay sin que se tapen
  // entre sí del todo.
  const posInicial = { top: 16 + idx * 20, left: 16 };
  const [pos, setPos] = useState(posInicial);
  // null = todavía sin redimensionar a mano: usa el tamaño por defecto.
  const [tam, setTam] = useState(null);
  // El z-index no depende de qué ventana sea, sino de cuál se tocó la
  // última — así la recién abierta (o la que se acaba de pulsar) queda
  // siempre por delante, en vez de que unas pocas queden ancladas arriba.
  const [zIndex, setZIndex] = useState(() => ++contadorZIndexVentanas);
  const traerAlFrente = () => setZIndex(++contadorZIndexVentanas);
  const ventanaRef = useRef(null);
  // Offset entre el punto donde se agarra la cabecera y la esquina de la
  // ventana — así no "salta" al primer píxel del ratón al empezar a arrastrar.
  const arrastre = useRef(null);
  const redimension = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCerrar]);

  useEffect(() => {
    const coords = (e) => (e.touches ? e.touches[0] : e);
    const mover = (e) => {
      const { clientX, clientY } = coords(e);
      if (arrastre.current) {
        setPos({
          left: Math.max(0, clientX - arrastre.current.dx),
          top: Math.max(0, clientY - arrastre.current.dy),
        });
      }
      if (redimension.current) {
        setTam({
          width: Math.max(280, redimension.current.anchoInicial + (clientX - redimension.current.x)),
          height: Math.max(200, redimension.current.altoInicial + (clientY - redimension.current.y)),
        });
      }
    };
    const soltar = () => {
      arrastre.current = null;
      redimension.current = null;
    };
    window.addEventListener("mousemove", mover);
    window.addEventListener("mouseup", soltar);
    window.addEventListener("touchmove", mover);
    window.addEventListener("touchend", soltar);
    return () => {
      window.removeEventListener("mousemove", mover);
      window.removeEventListener("mouseup", soltar);
      window.removeEventListener("touchmove", mover);
      window.removeEventListener("touchend", soltar);
    };
  }, []);

  const iniciarArrastre = (e) => {
    const { clientX, clientY } = e.touches ? e.touches[0] : e;
    arrastre.current = { dx: clientX - pos.left, dy: clientY - pos.top };
  };

  const iniciarRedimension = (e) => {
    const { clientX, clientY } = e.touches ? e.touches[0] : e;
    const rect = ventanaRef.current.getBoundingClientRect();
    redimension.current = { x: clientX, y: clientY, anchoInicial: rect.width, altoInicial: rect.height };
  };

  return (
    <div
      ref={ventanaRef}
      className="fixed rounded-lg flex flex-col"
      onMouseDownCapture={traerAlFrente}
      onTouchStartCapture={traerAlFrente}
      style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        // calc(100vw - 48px) (no 2rem/32px): con "left" ahora fijo en
        // 16px, esto deja un margen visible mayor a la derecha (32px) --
        // ventana claramente más estrecha que la pantalla, no pegada de
        // borde a borde, a petición del usuario.
        width: tam ? tam.width : ancho || "min(620px, calc(100vw - 48px))",
        height: tam ? tam.height : undefined,
        // 88vh (no 80vh): más aprovechado en una pantalla vertical de
        // móvil -- mismo valor que ya usa ModalFlotante, antes iban
        // distintos sin motivo real.
        maxHeight: tam ? undefined : "88vh",
        boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        top: pos.top,
        left: pos.left,
        zIndex,
        // Sin esto, un dedo arrastrando sobre el cuerpo de la ventana (no
        // la cabecera) podía "encadenar" el gesto de scroll hacia lo que
        // hay detrás en cuanto el contenido interno no tenía más recorrido
        // que desplazar -- se sentía como "arrastro la ventana y se mueve
        // otra cosa". `contain` corta esa cadena aquí mismo.
        overscrollBehavior: "contain",
      }}
    >
      <div
        className="panel-flotante-cristal rounded-t-lg cursor-move select-none"
        style={{ touchAction: "none" }}
        onMouseDown={iniciarArrastre}
        onTouchStart={iniciarArrastre}
      >
        <div className="flex items-start justify-between px-4 py-3">
          <h3
            className="text-lg"
            style={{ fontFamily: "'Fraunces', serif", color: C.goldClaro, fontWeight: 700 }}
          >
            {titulo}
          </h3>
          <div
            className="flex items-center gap-2"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {extra}
            <button onClick={onCerrar} title="Cerrar" className="boton-3d rounded-full p-1.5" style={{ color: C.goldClaro }}>
              <X size={18} />
            </button>
          </div>
        </div>
        {/* `subtitulo` en su propia fila, a ANCHO COMPLETO de la cabecera
            (no ya dentro del bloque del título, que solo mide lo que su
            contenido necesita) -- así, si el contenido de `subtitulo`
            necesita coincidir en ancho con algo del cuerpo (p.ej. la
            cabecera de columnas de la tabla de Invitados, con el mismo
            px-4/p-4 a los lados que usa el cuerpo), puede hacerlo de
            verdad. Antes vivía pegado al título, comprimido por los
            botones de la derecha -- a petición del usuario, 2026-08-18. */}
        {subtitulo && <div className="px-4 pb-3 -mt-1">{subtitulo}</div>}
      </div>
      <div className="p-4" style={{ flex: 1, overflowY: "auto" }}>
        {children}
      </div>
      {acciones && (
        <div
          className="flex items-center gap-2 px-4 py-3 flex-wrap"
          style={{ borderTop: `1px solid ${C.line}` }}
        >
          {acciones}
        </div>
      )}
      <div
        onMouseDown={iniciarRedimension}
        onTouchStart={iniciarRedimension}
        className="absolute"
        style={{ width: 18, height: 18, right: 2, bottom: 2, cursor: "nwse-resize", touchAction: "none" }}
        title="Arrastra para cambiar el tamaño"
      >
        <svg width="18" height="18" viewBox="0 0 16 16">
          <path d="M14 2 L2 14 M14 7 L7 14 M14 12 L12 14" stroke={C.line} strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}
