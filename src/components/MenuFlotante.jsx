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
import { X } from "lucide-react";
import { C, R, OP, S, T } from "../theme";
import { esZurdo } from "../lib/mano";
import { Seal } from "./Widgets";

// Margen mínimo respecto al borde de la ventana, y altura mínima aunque
// haya poco hueco (por debajo de esto, mejor dejar que se salga un poco
// que quedarse ilegible).
const MARGEN_BORDE = 12;
const ALTO_MINIMO = 120;
// Ancho fijo del panel (antes "max-content": cada panel se ajustaba solo
// a su propio contenido, así que el desplegable de "Abrir sección…" y
// cada submenú salían con un ancho distinto entre sí) -- a petición del
// usuario, ceñido a la etiqueta más larga de todo el menú con un margen
// pequeño, en vez de a cada panel por separado. Medido de verdad (no a
// ojo: un primer intento a 210px salió más ancho que antes, corregido
// aquí) con canvas.measureText a 14px -- "Colaboradores" es la más
// ancha en píxeles reales (91.8px, más ancha que "Email anfitrión" a
// pesar de tener menos letras), y encima lleva el icono de flecha del
// submenú de más -- icono(19) + gap(8) + texto(~92) + gap(12) +
// flecha(13) + padding horizontal del botón(24) + compensación del
// margen del botón(12) ≈ 180px, más un margen pequeño. -15px (seguía
// saliendo más ancho que antes de este repaso): 173px. -15px otra vez
// (a petición del usuario): 158px.
const ANCHO_PANEL = 158;
// Cuánto hay que mover el dedo para que un toque pase a ser un arrastre
// (panel persistente): por debajo, es un toque y la opción se usa.
const UMBRAL_ARRASTRE = 6;

// Dónde dejó cada uno el panel persistente, en este aparato.
function posicionGuardada(clave) {
  try {
    const p = JSON.parse(localStorage.getItem(`panel-${clave}`) || "null");
    return Number.isFinite(p?.top) && Number.isFinite(p?.left) ? p : null;
  } catch {
    return null;
  }
}
function guardarPosicion(clave, p) {
  try {
    localStorage.setItem(`panel-${clave}`, JSON.stringify(p));
  } catch {
    // Sin almacenamiento: la próxima vez sale junto al botón, nada más.
  }
}
// Ancho real de cada fila (el panel menos 6px de margen a cada lado).
// Exportado para que Mi cuenta use EXACTAMENTE la misma medida que el menú
// "Abrir sección…", en vez de una copia del número (2026-09-18).
export const ANCHO_FILA_MENU = ANCHO_PANEL - 12;

// Altura máxima real según el hueco disponible en pantalla, no un 60vh
// fijo: si el botón está cerca del borde, un límite fijo deja que el
// panel se salga igualmente por ese lado y las primeras opciones
// queden inalcanzables (detectado el 2026-08-09: con "Abrir sección…"
// cerca del borde superior, "Avisos" y "Colaboradores" — las primeras
// de la lista — quedaban fuera de la ventana sin forma de llegar a
// ellas). `ancladoY` es el borde fijo del panel (de dónde "cuelga");
// `creceHaciaArriba` indica hacia qué lado se extiende el resto.
// ⚠️ De qué VENTANA es este menú. Fallo real (2026-09-05): al llevar la
// Lista de invitados a una ventana propia del sistema, el botón
// "Acciones" dejó de hacer nada -- el panel se pintaba con un portal a
// `document.body`, y ese `document` es el de la PESTAÑA PRINCIPAL, no el
// de la ventana emergente, así que aparecía en la otra ventana, detrás.
// Igual con `window.innerWidth/innerHeight` (medidas de la pantalla
// equivocada) y con los escuchadores para cerrar al tocar fuera.
//
// En vez de pasar la ventana como prop por toda la app, se deduce del
// propio nodo al que se ancla el menú: `ownerDocument` siempre es el
// documento donde ESE nodo vive. Así funciona en cualquier ventana sin
// que quien lo use tenga que enterarse.
function realmDe(nodo) {
  const doc = nodo?.ownerDocument || document;
  return { doc, win: doc.defaultView || window };
}

function alturaMaximaDisponible(ancladoY, creceHaciaArriba, win = window) {
  const disponible = creceHaciaArriba
    ? ancladoY - MARGEN_BORDE
    : win.innerHeight - ancladoY - MARGEN_BORDE;
  return Math.max(ALTO_MINIMO, Math.min(disponible, win.innerHeight * 0.6));
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
    const { win } = realmDe(ref.current);
    if (pos.right !== undefined && rect.left < MARGEN_BORDE) {
      const ajuste = MARGEN_BORDE - rect.left;
      setPos((p) => (p ? { ...p, right: p.right - ajuste } : p));
    } else if (pos.left !== undefined && rect.right > win.innerWidth - MARGEN_BORDE) {
      const ajuste = rect.right - (win.innerWidth - MARGEN_BORDE);
      setPos((p) => (p ? { ...p, left: p.left - ajuste } : p));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, pos?.top, pos?.bottom, pos?.left, pos?.right]);
}

// El sello de una fila (`opcion.sello`: fichas incompletas, v51): a la
// derecha, como en "Abrir sección…", pero MONTADO sobre el final del texto
// (él, v51.2, excepción a propósito). Pegado detrás del texto, el borde del
// menú lo cortaba.
function SelloFila({ count }) {
  if (!count) return null;
  return (
    <span className="absolute right-2 top-1/2 -translate-y-1/2 flex">
      <Seal count={count} late />
    </span>
  );
}

// Una fila del panel: rótulo de grupo (no clicable), acción directa, o
// disparador de un submenú anidado (se abre hacia la izquierda de la
// propia fila, sin cerrar el panel padre — igual patrón que un menú de
// sistema operativo con flechas ">"/"‹").
// `abierto`/`onAbrir`/`onCerrarPropio`: el "cuál está abierto" ya NO es
// estado propio de cada fila (antes cada FilaMenu tenía su propio
// useState, así que dos filas HERMANAS con submenú -- p.ej. Colaboradores
// y Configuración -- podían quedar abiertas las dos a la vez y sus
// paneles se solapaban, tapándose una a otra sin forma de llegar a la de
// detrás; bug real reportado por el usuario, 2026-08-18). Ahora lo
// controla el padre (MenuFlotante o la propia FilaMenu con submenú, ver
// más abajo), que solo permite un id abierto por nivel -- abrir uno
// cierra automáticamente cualquier hermano que estuviera abierto.
function FilaMenu({ opcion, cerrarTodo, abierto, onAbrir, onCerrarPropio }) {
  const [pos, setPos] = useState(null);
  // Mismo mecanismo que arriba, pero para las hermanas DENTRO del propio
  // submenú de esta fila (p.ej. "Anfitrión"/cada colaborador, dentro de
  // "Formularios") -- se declara aquí incondicional (reglas de los Hooks)
  // aunque solo se use si opcion.submenu existe, más abajo.
  const [abiertoIdHijo, setAbiertoIdHijo] = useState(null);
  const filaRef = useRef(null);
  const panelRef = useRef(null);

  const abrirSubmenu = () => {
    const r = filaRef.current.getBoundingClientRect();
    const { doc, win } = realmDe(filaRef.current);
    // Móvil manejado con la izquierda (lib/mano.js): el submenú sale hacia
    // la DERECHA de la fila, en espejo, porque el menú entero está pegado
    // al borde izquierdo.
    const lado = esZurdo(doc) ? { left: r.right + 4 } : { right: win.innerWidth - r.left + 4 };
    setPos({
      top: r.top,
      ...lado,
      maxHeight: alturaMaximaDisponible(r.top, false, win), // crece hacia abajo desde r.top
    });
    onAbrir();
  };

  // Mismo criterio que en MenuFlotante: al cerrarse ESTE submenú, se
  // olvida cuál de sus propios hijos tenía a su vez un sub-submenú
  // abierto (p.ej. dentro de "Formularios").
  useEffect(() => {
    if (!abierto) setAbiertoIdHijo(null);
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    // Ojo: un submenú anidado vive en SU PROPIO portal (otro hijo directo
    // de document.body), no dentro del DOM del panel padre -- por eso no
    // basta con comprobar filaRef/panelRef (ver el mismo comentario, más
    // detallado, en MenuFlotante más abajo).
    const cerrarSiFuera = (e) => {
      if (filaRef.current?.contains(e.target) || e.target.closest?.("[data-menu-panel]")) return;
      onCerrarPropio();
    };
    const { doc } = realmDe(filaRef.current);
    doc.addEventListener("mousedown", cerrarSiFuera);
    doc.addEventListener("touchstart", cerrarSiFuera);
    return () => {
      doc.removeEventListener("mousedown", cerrarSiFuera);
      doc.removeEventListener("touchstart", cerrarSiFuera);
    };
  }, [abierto, onCerrarPropio]);

  useMantenerDentroDePantalla(abierto, panelRef, pos, setPos);

  if (opcion.encabezado) {
    return (
      <div
        className="px-3 pt-1 pb-0.5 text-xs uppercase"
        style={{ color: C.goldClaro, opacity: OP.secundario, letterSpacing: "0.06em" }}
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
          // Sin flecha (a petición del usuario, 2026-08-18: "a ver cómo
          // queda") -- ya no hace falta justify-between al no haber un
          // segundo elemento que empujar al extremo opuesto.
          className="boton-3d boton-flotante-imagen relative flex items-center gap-2 text-left px-3 py-2 text-sm whitespace-nowrap"
          style={{
            color: C.goldClaro,
            ...(abierto ? { background: "rgba(239,233,222,0.12)" } : {}),
            margin: "5px 6px",
            width: "calc(100% - 12px)",
            borderRadius: R.redondo,
          }}
        >
          {opcion.icono && <opcion.icono size={19} style={{ flexShrink: 0, opacity: OP.secundario }} />}
          {opcion.etiqueta}
          <SelloFila count={opcion.sello} />
        </button>
        {abierto &&
          pos &&
          createPortal(
            <div
              ref={panelRef}
              data-menu-panel
              // Sin panel-flotante-cristal/cristal-difuminado (a petición
              // del usuario): cada fila ya lleva su propio fondo/contorno
              // (boton-flotante-imagen), así que el contenedor no necesita
              // uno propio -- se ve el fondo real (la imagen de la
              // Portada) entre una fila y otra, en vez de un panel sólido.
              className="fixed rounded-xl overflow-y-auto"
              style={{
                top: pos.top,
                left: pos.left,
                right: pos.right,
                width: ANCHO_PANEL,
                maxWidth: "calc(100vw - 2rem)",
                maxHeight: pos.maxHeight,
                padding: "4px 0",
                zIndex: 10000,
              }}
            >
              {opcion.submenu.map((hijo) => (
                <FilaMenu
                  key={hijo.id}
                  opcion={hijo}
                  cerrarTodo={cerrarTodo}
                  abierto={abiertoIdHijo === hijo.id}
                  onAbrir={() => setAbiertoIdHijo(hijo.id)}
                  onCerrarPropio={() => setAbiertoIdHijo(null)}
                />
              ))}
            </div>,
            realmDe(filaRef.current).doc.body
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
      className="boton-3d boton-flotante-imagen relative flex items-center gap-2 text-left px-3 py-2 text-sm whitespace-nowrap"
      style={{
        color: opcion.color || C.goldClaro,
        ...(opcion.fondo ? { background: opcion.fondo } : {}),
        margin: "5px 6px",
        width: "calc(100% - 12px)",
        borderRadius: R.redondo,
      }}
      onMouseEnter={(e) => {
        if (opcion.fondo) e.currentTarget.style.filter = "brightness(1.2)";
      }}
      onMouseLeave={(e) => {
        if (opcion.fondo) e.currentTarget.style.filter = "none";
      }}
    >
      {opcion.icono && <opcion.icono size={19} style={{ flexShrink: 0, opacity: OP.secundario }} />}
      <span>{opcion.etiqueta}</span>
      <SelloFila count={opcion.sello} />
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
// `persistente` ({ titulo, clave }): el panel SE QUEDA ABIERTO mientras se
// trabaja (él, v58.5, las Acciones de Invitados). Tocar fuera o elegir una
// opción no lo cierra: solo su X o el mismo botón. Un toque en una opción
// la usa; mantener pulsado y mover lo arrastra, y recuerda dónde se dejó
// (`clave`). Vive DENTRO de la ventana que lo abre, no en <body>: así
// cerrarla lo cierra, y queda por debajo de sus preguntas y modales.
export function MenuFlotante({ render, opciones, anchor = "right", persistente = null }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  // Cuál de las filas de nivel superior tiene su submenú abierto (ver el
  // mismo mecanismo, más detallado, en el comentario de FilaMenu) --
  // p.ej. Colaboradores/Configuración, hermanas directas aquí.
  const [abiertoId, setAbiertoId] = useState(null);
  const botonRef = useRef(null);
  const listaRef = useRef(null);

  const abrir = () => {
    const r = botonRef.current.getBoundingClientRect();
    const { doc, win } = realmDe(botonRef.current);
    // Móvil manejado con la izquierda (lib/mano.js): todo en espejo. Los
    // botones que abren estos menús se han ido al borde izquierdo, así que
    // el panel tiene que crecer hacia la derecha en vez de hacia la izquierda.
    const zurdo = esZurdo(doc);
    if (anchor === "right") {
      // Cuelga del borde superior del botón y crece hacia arriba.
      setPos({
        bottom: win.innerHeight - r.top + 4,
        ...(zurdo ? { left: r.left } : { right: win.innerWidth - r.right }),
        maxHeight: alturaMaximaDisponible(r.top, true, win),
      });
    } else if (anchor === "left") {
      // Cuelga del borde superior del botón y crece hacia abajo.
      setPos({
        top: r.top,
        ...(zurdo ? { left: r.right + 4 } : { right: win.innerWidth - r.left + 4 }),
        maxHeight: alturaMaximaDisponible(r.top, false, win),
      });
    } else {
      // "bottom-left": cuelga del borde inferior del botón y crece hacia abajo.
      setPos({
        top: r.bottom + 4,
        ...(zurdo ? { right: win.innerWidth - r.right } : { left: r.left }),
        maxHeight: alturaMaximaDisponible(r.bottom, false, win),
      });
    }
    const guardada = persistente && posicionGuardada(persistente.clave);
    if (guardada) setPos((p) => ({ top: guardada.top, left: guardada.left, maxHeight: p?.maxHeight }));
    setOpen(true);
  };

  // ---------- El panel que se queda (persistente) ----------
  const arrastre = useRef(null);
  const acabaDeArrastrar = useRef(false);
  const dentroDeLaVentana = (top, left) => {
    const el = listaRef.current;
    const { win } = realmDe(el);
    const r = el.getBoundingClientRect();
    return {
      top: Math.min(Math.max(MARGEN_BORDE, top), Math.max(MARGEN_BORDE, win.innerHeight - r.height - MARGEN_BORDE)),
      left: Math.min(Math.max(MARGEN_BORDE, left), Math.max(MARGEN_BORDE, win.innerWidth - r.width - MARGEN_BORDE)),
    };
  };
  // Una posición guardada en otra pantalla más grande podría quedar fuera.
  useLayoutEffect(() => {
    if (!persistente || !open || !listaRef.current || pos?.top === undefined || pos?.left === undefined) return;
    const d = dentroDeLaVentana(pos.top, pos.left);
    if (d.top !== pos.top || d.left !== pos.left) setPos((p) => ({ ...p, ...d }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pos?.top, pos?.left]);
  const manejadoresArrastre = persistente
    ? {
        onPointerDown: (e) => {
          if (e.button > 0 || e.target.closest?.("[data-cerrar-panel]")) return;
          const r = listaRef.current.getBoundingClientRect();
          arrastre.current = { x: e.clientX, y: e.clientY, top: r.top, left: r.left, movido: false };
        },
        onPointerMove: (e) => {
          const a = arrastre.current;
          if (!a) return;
          const dx = e.clientX - a.x;
          const dy = e.clientY - a.y;
          if (!a.movido) {
            if (Math.hypot(dx, dy) < UMBRAL_ARRASTRE) return;
            a.movido = true;
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }
          setPos((p) => ({ ...dentroDeLaVentana(a.top + dy, a.left + dx), maxHeight: p?.maxHeight }));
        },
        onPointerUp: () => {
          const a = arrastre.current;
          arrastre.current = null;
          if (!a?.movido) return;
          acabaDeArrastrar.current = true;
          const r = listaRef.current.getBoundingClientRect();
          guardarPosicion(persistente.clave, { top: r.top, left: r.left });
        },
        onPointerCancel: () => (arrastre.current = null),
        // Soltar tras arrastrar no es elegir la opción que quedó debajo.
        onClickCapture: (e) => {
          if (!acabaDeArrastrar.current) return;
          acabaDeArrastrar.current = false;
          e.stopPropagation();
          e.preventDefault();
        },
      }
    : {};

  // Al cerrar el menú entero, se olvida cuál de las filas tenía su
  // submenú abierto -- si no, al reabrir esa fila quedaría con el estilo
  // de "abierto" puesto sin que su panel llegara a mostrarse (su propio
  // `pos` interno sí se reinicia solo, al ser una FilaMenu nueva).
  useEffect(() => {
    if (!open) setAbiertoId(null);
  }, [open]);

  useEffect(() => {
    // El persistente no se cierra al tocar fuera: solo su X o el botón.
    if (!open || persistente) return;
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
    const { doc, win } = realmDe(botonRef.current);
    doc.addEventListener("mousedown", cerrarSiFuera);
    doc.addEventListener("touchstart", cerrarSiFuera);
    win.addEventListener("keydown", onKey);
    return () => {
      doc.removeEventListener("mousedown", cerrarSiFuera);
      doc.removeEventListener("touchstart", cerrarSiFuera);
      win.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useMantenerDentroDePantalla(open, listaRef, pos, setPos);

  return (
    <>
      {render({ ref: botonRef, open, toggle: () => (open ? setOpen(false) : abrir()) })}
      {open && pos && persistente && (
        <div
          ref={listaRef}
          data-menu-panel
          className="fixed rounded-xl overflow-y-auto select-none"
          style={{
            ...pos,
            width: ANCHO_PANEL,
            maxWidth: "calc(100vw - 2rem)",
            // Por encima de la lista, por debajo de sus preguntas y modales.
            zIndex: 30,
            background: C.ink,
            border: `1px solid ${C.gold}`,
            boxShadow: S.flotanteOscura,
            touchAction: "none",
            cursor: "grab",
          }}
          {...manejadoresArrastre}
        >
          <div className="flex items-center justify-between pl-3 pr-1 pt-1">
            <span style={{ fontFamily: "'Fraunces', serif", color: C.goldClaro, fontWeight: 700, fontSize: T.normal }}>
              {persistente.titulo}
            </span>
            {/* La misma X que las ventanas de la app. Cierra el panel, nunca
                la ventana de detrás. */}
            <button
              data-cerrar-panel
              onClick={() => setOpen(false)}
              title="Cerrar"
              aria-label={`Cerrar ${persistente.titulo}`}
              className="boton-3d rounded-full p-1.5"
              style={{ color: C.goldClaro }}
            >
              <X size={18} />
            </button>
          </div>
          {opciones.map((o) => (
            <FilaMenu
              key={o.id}
              opcion={o}
              cerrarTodo={() => {}}
              abierto={abiertoId === o.id}
              onAbrir={() => setAbiertoId(o.id)}
              onCerrarPropio={() => setAbiertoId(null)}
            />
          ))}
        </div>
      )}
      {open &&
        pos &&
        !persistente &&
        createPortal(
          <div
            ref={listaRef}
            data-menu-panel
            // Sin panel-flotante-cristal/cristal-difuminado (a petición
            // del usuario): cada fila ya lleva su propio fondo/contorno
            // (boton-flotante-imagen), así que el contenedor no necesita
            // uno propio -- se ve el fondo real (la imagen de la
            // Portada) entre una fila y otra, en vez de un panel sólido.
            className="fixed rounded-xl overflow-y-auto"
            style={{
              ...pos,
              width: ANCHO_PANEL,
              maxWidth: "calc(100vw - 2rem)",
              padding: "4px 0",
              zIndex: 9999,
            }}
          >
            {opciones.map((o) => (
              <FilaMenu
                key={o.id}
                opcion={o}
                cerrarTodo={() => setOpen(false)}
                abierto={abiertoId === o.id}
                onAbrir={() => setAbiertoId(o.id)}
                onCerrarPropio={() => setAbiertoId(null)}
              />
            ))}
          </div>,
          realmDe(botonRef.current).doc.body
        )}
    </>
  );
}
