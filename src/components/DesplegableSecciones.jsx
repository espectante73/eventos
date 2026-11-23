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
import { MenuFlotante, HALO } from "./MenuFlotante";
import { ICONOS_VENTANAS } from "../lib/iconosVentanas";
import { estructuraMenuAnfitrion } from "../lib/menuAnfitrion";

// QUÉ hay en el menú y en qué orden lo dice lib/menuAnfitrion.js, la misma
// pieza que dibuja el mapa de la app (v96.2). Aquí solo se le pone a cada
// entrada su icono (lib/iconosVentanas.js, los mismos que en la barra del
// móvil), su color y lo que hace al tocarla.

// El rojo de «Borrado total» (más fuerte: lo más irreversible) y el de
// «Modo pruebas» (él, con letra clara).
const ESTILO_PELIGRO = {
  fuerte: { fondo: C.peligro, color: C.paper },
  suave: { fondo: C.wax, color: C.paper },
};

// Los iconos que no son el de su ventana en la barra.
const ICONOS_PROPIOS = { "colaboradores-formularios": Eye, "invitados-lista": ICONOS_VENTANAS.invitados, miCuenta: UserCog };

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
  // Lo que no abre su ventana flotante de siempre (`toggle`): las que van en
  // su propia ventana del sistema (Novedades, Cronograma, Multimedia, la
  // Lista y, en el Mac, Acomodación) y «Mi cuenta». Esas no llevan el
  // dorado de «abierta»: se pueden cerrar con la X del sistema sin que este
  // menú se entere.
  const acciones = {
    novedades: { onClick: abrirNovedades },
    "config-cronograma": { onClick: abrirCronograma },
    musicaEvento: { onClick: abrirMusicaEvento },
    "invitados-lista": { onClick: abrirInvitados },
    ...(abrirMesas ? { mesas: { onClick: abrirMesas } } : {}),
    // «Mi cuenta» del anfitrión (v50.6), entre las demás.
    miCuenta: { onClick: abrirMiCuenta, ...ESTILO_MI_CUENTA },
  };
  // Formularios: el anfitrión y cada colaborador, para cambiar de vista y
  // ver su formulario (sustituye a la barra ancha que había en App.jsx).
  const formularios = () => [
    { id: "rol-anfitrion", etiqueta: "Anfitrión", icono: UserSolido, onClick: () => onCambiarRol(anfitrionToken) },
    ...colaboradores.map((c) => ({
      id: `rol-${c.id}`,
      etiqueta: c.nombre,
      icono: User,
      onClick: () => onCambiarRol(c.id),
      sello: c.id === miColaboradorId ? sello : 0,
    })),
  ];
  const vestir = (e) => {
    const base = { id: e.id, etiqueta: e.etiqueta, icono: ICONOS_PROPIOS[e.id] || ICONOS_VENTANAS[e.id] };
    // El sello marca el camino hasta tu formulario: Colaboradores →
    // Formularios → tu nombre.
    if (e.porColaborador) return { ...base, sello, submenu: formularios() };
    if (e.submenu) return { ...base, ...(e.id === "colaboradores" ? { sello } : {}), submenu: e.submenu.map(vestir) };
    return {
      ...base,
      ...(e.peligro ? ESTILO_PELIGRO[e.peligro] : {}),
      ...(acciones[e.id] || { marcado: Boolean(abierto[e.id]), onClick: () => toggle(e.id) }),
    };
  };
  const opciones = estructuraMenuAnfitrion({ conMiCuenta: Boolean(abrirMiCuenta) }).map(vestir);

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
