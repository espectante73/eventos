// Botón "Abrir sección…" de la Portada — usa el menú propio compartido
// (MenuFlotante.jsx) en vez de un <select> nativo, para que se vea igual
// en cualquier navegador (ver comentario en MenuFlotante.jsx).
//
// "Colaboradores" y "Configuración" no abren directamente una ventana:
// despliegan su propio submenú anidado hacia la izquierda (igual patrón
// que un menú de sistema operativo), sin pasar por una ventana
// intermedia. Dentro de "Colaboradores":
// - "Datos Colab." abre la ventana de gestión de siempre (nombre, email,
//   invitación, relevo, eliminar, asignados).
// - "Formularios" NO abre ninguna ventana — despliega un tercer nivel con
//   Anfitrión + cada colaborador, para cambiar de vista y previsualizar
//   su formulario (sustituye a la barra ancha de arriba que existía
//   antes en App.jsx, ahora eliminada — reparto del 2026-08-09).
import { UserCog, Eye, User } from "lucide-react";
import { C } from "../theme";
import { UserSolido, Seal } from "./Widgets";
import { ORDEN_VENTANAS, ETIQUETAS_VENTANAS } from "./VentanaFlotante";
import { MenuFlotante, HALO } from "./MenuFlotante";

import { ICONOS_VENTANAS, FORMULARIO_INVITADO } from "../lib/iconosVentanas";

// Submenú de "Configuración": cada parte se abre en su propia ventana,
// igual que antes — solo cambia cómo se llega hasta ella. "Modo
// pruebas" y "Borrado total" llevan su propio chip de fondo rojo (letra
// clara) de distinta intensidad: Borrado total es lo más irreversible
// de los dos, así que se ve más rojo — a petición del usuario,
// 2026-08-12. Orden alfabético por etiqueta (no por fecha de creación
// ni por importancia) — a petición del usuario, 2026-08-26: así, al
// crecer, se sabe siempre dónde buscar algo sin tener que recordar en
// qué orden se fue añadiendo.
// Se exporta para que scripts/dibujar-mapa.test.js pueda comprobar que el
// plano de la aplicación (public/mapa-de-la-aplicacion.png) sigue listando
// las mismas secciones que el menú real.
// Los iconos, los de lib/iconosVentanas.js: los mismos en la barra del móvil.
export const SUBMENU_CONFIGURACION = [
  { id: "config-zona-peligro", etiqueta: "Borrado total", fondo: C.peligro, color: C.paper },
  { id: "config-cronograma", etiqueta: "Cronograma" },
  { id: "config-datos-evento", etiqueta: "Datos evento" },
  { id: "config-modo-pruebas", etiqueta: "Modo pruebas", fondo: C.wax, color: C.paper },
  { id: "permisos", etiqueta: "Permisos" },
  { id: "progreso", etiqueta: "Progreso" },
  { id: "config-zona-reinicio", etiqueta: "Reinicios" },
  { id: "versiones", etiqueta: "Versiones" },
].map((s) => ({ ...s, icono: ICONOS_VENTANAS[s.id] }));

// "Mi cuenta" es una línea especial, pero no de peligro (él, v51.3): relleno
// champán y letra verde, con el mismo contorno dorado que las demás. El
// rojo se queda para lo que borra (Borrado total, Modo pruebas). La misma
// en el menú del anfitrión y en el del colaborador (norma 7).
export const ESTILO_MI_CUENTA = { fondo: C.champanClaro, color: C.ink };

// `posicion`: dónde flota el botón dentro de su contenedor (por defecto,
// esquina inferior derecha) -- Portada.jsx lo reposiciona sobre la propia
// imagen ("a los pies de la pareja", a petición del usuario, 2026-08-12),
// manteniéndolo a la derecha a propósito: mejor alcance con el pulgar
// derecho en móvil (mismo criterio ya aplicado en Modo Pruebas).
export function DesplegableSecciones({
  abierto,
  toggle,
  colaboradores,
  onCambiarRol,
  anfitrionToken,
  abrirNovedades,
  abrirCronograma,
  abrirMusicaEvento,
  abrirInvitados,
  abrirMesas,
  // "Mi cuenta" del anfitrión vive aquí, entre las demás (v50.6). Abre la
  // ventana de siempre (MiCuenta.jsx). Sin sesión real no hay.
  abrirMiCuenta = null,
  // Las fichas incompletas del anfitrión como colaborador (v50.6), y a
  // cuál de los colaboradores corresponde: su línea en Formularios lo lleva.
  sello = 0,
  miColaboradorId = null,
  posicion = { bottom: 8, right: 8 },
}) {
  const opciones = ORDEN_VENTANAS.map((clave) => {
    // Novedades y Logística abren cada una una ventana de verdad del
    // sistema operativo, no una VentanaFlotante (ver lib/usePopupWindow.js)
    // -- por eso no pasan por el "toggle(clave)" genérico de las demás, y
    // no llevan el prefijo "✓ " (no hay ningún estado fiable de "abierta"
    // que reflejar aquí: la persona puede haberla cerrado a mano con la X
    // del sistema operativo sin que este menú se entere al momento).
    if (clave === "novedades") {
      return {
        id: clave,
        etiqueta: ETIQUETAS_VENTANAS[clave],
        icono: ICONOS_VENTANAS[clave],
        onClick: abrirNovedades,
      };
    }
    // La Lista de invitados abre en su propia ventana del sistema
    // (o dentro de la página en un aparato táctil): mismo caso que
    // Novedades, Logística y Música -- no pasa por el `toggle` genérico
    // y no lleva el "✓ " (no hay estado fiable de "sigue abierta": se
    // puede cerrar con la X del sistema sin que este menú se entere).
    // Dos opciones (él, v81.5): «Formulario» (antes «Añadir», v87.4), el de
    // «Nuevo invitado» sin abrir antes la Lista, y «Lista». Mismos iconos
    // que en la Lista (FORMULARIO_INVITADO).
    if (clave === "invitados") {
      return {
        id: clave,
        etiqueta: ETIQUETAS_VENTANAS[clave],
        icono: ICONOS_VENTANAS[clave],
        submenu: [
          { id: "nuevo-invitado", ...FORMULARIO_INVITADO, marcado: Boolean(abierto["nuevo-invitado"]), onClick: () => toggle("nuevo-invitado") },
          { id: "invitados-lista", etiqueta: "Lista", icono: ICONOS_VENTANAS[clave], onClick: abrirInvitados },
        ],
      };
    }
    // «Mesas y acomodación» (v74.6), igual: en el Mac, su propia ventana.
    if (clave === "mesas" && abrirMesas) {
      return {
        id: clave,
        etiqueta: ETIQUETAS_VENTANAS[clave],
        icono: ICONOS_VENTANAS[clave],
        onClick: abrirMesas,
      };
    }
    if (clave === "musicaEvento") {
      return {
        id: clave,
        etiqueta: ETIQUETAS_VENTANAS[clave],
        icono: ICONOS_VENTANAS[clave],
        onClick: abrirMusicaEvento,
      };
    }
    if (clave === "colaboradores") {
      return {
        id: clave,
        etiqueta: ETIQUETAS_VENTANAS[clave],
        icono: ICONOS_VENTANAS[clave],
        // El sello marca el camino hasta tu formulario: Colaboradores →
        // Formularios → tu nombre.
        sello,
        submenu: [
          // Un aviso al móvil de todo el equipo (v79). Por orden alfabético, la primera.
          {
            id: "avisar-equipo",
            etiqueta: "Avisar equipo",
            marcado: Boolean(abierto["avisar-equipo"]),
            icono: ICONOS_VENTANAS["avisar-equipo"],
            onClick: () => toggle("avisar-equipo"),
          },
          {
            id: "colaboradores-datos",
            etiqueta: "Datos Colab.",
            marcado: Boolean(abierto["colaboradores-datos"]),
            icono: ICONOS_VENTANAS["colaboradores-datos"],
            onClick: () => toggle("colaboradores-datos"),
          },
          {
            id: "colaboradores-formularios",
            etiqueta: "Formularios",
            icono: Eye,
            sello,
            submenu: [
              { id: "rol-anfitrion", etiqueta: "Anfitrión", icono: UserSolido, onClick: () => onCambiarRol(anfitrionToken) },
              ...colaboradores.map((c) => ({
                id: `rol-${c.id}`,
                etiqueta: c.nombre,
                icono: User,
                onClick: () => onCambiarRol(c.id),
                sello: c.id === miColaboradorId ? sello : 0,
              })),
            ],
          },
        ],
      };
    }
    if (clave === "configuracion") {
      return {
        id: clave,
        etiqueta: ETIQUETAS_VENTANAS[clave],
        icono: ICONOS_VENTANAS[clave],
        // "Cronograma" abre una ventana de verdad del sistema operativo
        // (ver lib/usePopupWindow.js), igual que Novedades/Logística --
        // a petición del usuario, 2026-08-29. Por eso no pasa por
        // "toggle(s.id)" ni lleva el visto de abierta (mismo motivo: no hay
        // estado fiable de "sigue abierta" que reflejar aquí).
        submenu: SUBMENU_CONFIGURACION.map((s) =>
          s.id === "config-cronograma"
            ? { id: s.id, etiqueta: s.etiqueta, icono: s.icono, onClick: abrirCronograma }
            : {
                id: s.id,
                etiqueta: s.etiqueta,
                marcado: Boolean(abierto[s.id]),
                icono: s.icono,
                color: s.color,
                fondo: s.fondo,
                onClick: () => toggle(s.id),
              }
        ),
      };
    }
    return {
      id: clave,
      etiqueta: ETIQUETAS_VENTANAS[clave],
      marcado: Boolean(abierto[clave]),
      icono: ICONOS_VENTANAS[clave],
      onClick: () => toggle(clave),
    };
  });

  if (abrirMiCuenta) {
    opciones.push({
      id: "miCuenta",
      etiqueta: "Mi cuenta",
      icono: UserCog,
      onClick: abrirMiCuenta,
      ...ESTILO_MI_CUENTA,
    });
  }
  // En orden alfabético por lo que se lee (él): «Acomodación» (v74.7) va
  // la primera aunque su ventana sea la de Mesas, y «Mi cuenta», entre
  // Invitados y Multimedia.
  opciones.sort((x, y) => x.etiqueta.localeCompare(y.etiqueta, "es"));

  return <BotonAbrirSeccion opciones={opciones} sello={sello} posicion={posicion} />;
}

// El botón "Abrir sección…" y su menú: UNA pieza para el anfitrión y el
// colaborador (él, v50.6: todos los botones en un solo sitio). `sello`:
// las fichas incompletas de quien lo usa, latiendo encima del botón para
// que se vean con todo cerrado. `posicion`: flota sobre la foto (el
// anfitrión); sin ella, va en la columna de la portada (el colaborador).
//
// Sobre la foto lleva detrás, también cerrado, el mismo velo claro que el
// menú abierto (él, v88.3): con la mano izquierda el botón cae sobre la
// parte verde de la portada, con texto, y sin él no se distinguía. Abierto,
// lo pone el menú (dos velos juntos se verían más blancos). Claro del todo
// hasta medio dedo alrededor del botón y desvaneciéndose a lo largo del
// dedo siguiente: con lo claro solo debajo del botón, apenas se veía.
// (HALO, en MenuFlotante: el mismo detrás de la barra del móvil.)

export function BotonAbrirSeccion({ opciones, sello = 0, posicion = null }) {
  return (
    <MenuFlotante
      anchor="right"
      veloEntero
      opciones={opciones}
      render={({ ref, open, toggle: abrirCerrar }) => {
        const boton = (
          <button
            ref={ref}
            onClick={abrirCerrar}
            // Mismo aspecto que "Cerrar sesión" (Portada.jsx): .boton-flotante-imagen
            // (index.css) lleva el fondo/letra/relieve -- a petición del
            // usuario, los dos botones que flotan sobre la imagen deben
            // verse como un mismo par, no dos estilos distintos.
            className="boton-3d boton-flotante-imagen cristal-difuminado relative flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium"
            title="Abre la sección elegida en una ventana flotante; puedes tener varias abiertas a la vez"
          >
            Abrir sección…
            <Seal count={sello} late />
          </button>
        );
        if (!posicion) return boton;
        return (
          <div className="absolute" style={posicion}>
            {!open && <span aria-hidden="true" data-halo-boton className="absolute pointer-events-none" style={HALO} />}
            {boton}
          </div>
        );
      }}
    />
  );
}
