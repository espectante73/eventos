// El menú «Abrir sección…» del anfitrión: QUÉ hay en cada nivel, sin cómo
// se pinta ni qué hace al tocarlo. Una sola pieza (norma 7) para el menú
// (components/DesplegableSecciones.jsx, que le pone iconos y acciones) y
// para el mapa de la app (scripts/dibujar-mapa.mjs, que lo dibuja tal
// cual). El mapa llevaba su propia lista escrita a mano y se quedó atrás
// (él, v96.2: «cada vez que hagamos un cambio en la estructura, el mapa se
// redibuja»): le faltaban «Avisar equipo» y lo de dentro de «Invitados».
//
// ⚠️ Sin JSX y sin importar nada: también lo lee Node, sin Vite.

// Orden fijo de apertura en cascada — cada sección siempre aparece en el
// mismo sitio relativo, en vez de saltar de posición según el orden en que
// se abran.
// Orden alfabético (por la etiqueta visible, no por la clave interna) —
// así el desplegable es predecible según crece: siempre se sabe dónde
// buscar algo sin tener que recordar un grupo temático.

export const ORDEN_VENTANAS = [
  "aniversarios",
  "colaboradores",
  "configuracion",
  "cuentas",
  "diaEvento",
  // «Invitaciones» va dentro de «Invitados» (v96.1, él: «es un proceso
  // que surge después de haber atendido a todos los invitados»).
  "invitados",
  "mesas",
  "musicaEvento",
  // «Novedades» ya no va aquí: está dentro de Configuración (v96, él: «es
  // parte de algo que se puede editar o configurar»).
];

// Etiquetas cortas (una palabra donde sea posible) -- son solo las del
// menú "Abrir sección..." (DesplegableSecciones.jsx); el título completo
// de cada ventana ya abierta se define aparte, en su propio fichero
// (p.ej. VentanaVersiones.jsx sigue titulándose "Versiones").
//
// Incluye también las que ya NO son entradas de primer nivel pero
// siguen abriéndose como ventana desde el submenú de Configuración
// (Permisos, Backup): la etiqueta se usa igual al pintarlas.
export const ETIQUETAS_VENTANAS = {
  aniversarios: "Aniversarios",
  progreso: "Progreso",
  colaboradores: "Colaboradores",
  // «Acomodación» (él, v74.7): «Mesas y acomodación» no cabía en el botón.
  mesas: "Acomodación",
  invitaciones: "Invitaciones",
  invitados: "Invitados",
  // "Contabilidad" (antes "Cuentas"): se confundía con "Mi cuenta" (él, v51.3).
  cuentas: "Contabilidad",
  // Lo que se abre o se usa ese día: las llegadas y, después, las fotos (él, v66).
  diaEvento: "Día del evento",
  // Se abre desde «Día del evento», no desde «Abrir sección…» (él, v69.2).
  marcador: "Acreditación",
  configuracion: "Configuración",
  versiones: "Versiones",
  novedades: "Novedades",
  permisos: "Permisos",
  // "Multimedia" (antes "Música"): sonido hoy y vídeo después (él, v57.3).
  musicaEvento: "Multimedia",
};

// «Formulario» (él, v87.4; antes «Añadir»): el de «Nuevo invitado». Su
// icono va en lib/iconosVentanas.js (FORMULARIO_INVITADO).
export const ETIQUETA_FORMULARIO_INVITADO = "Formulario";

// Configuración: cada parte en su ventana. Orden alfabético (él): así, al
// crecer, se sabe dónde buscar. «Borrado total» y «Modo pruebas» llevan su
// rojo (`peligro`), más fuerte lo más irreversible (él).
export const SUBMENU_CONFIGURACION = [
  { id: "config-zona-peligro", etiqueta: "Borrado total", peligro: "fuerte" },
  { id: "config-cronograma", etiqueta: "Cronograma", aparte: true },
  { id: "config-datos-evento", etiqueta: "Datos evento" },
  { id: "config-modo-pruebas", etiqueta: "Modo pruebas", peligro: "suave" },
  // Del menú principal a Configuración (v96, él: «es parte de algo que se
  // puede editar o configurar»).
  { id: "novedades", etiqueta: "Novedades", aparte: true },
  { id: "permisos", etiqueta: "Permisos" },
  { id: "progreso", etiqueta: "Progreso" },
  { id: "config-zona-reinicio", etiqueta: "Reinicios" },
  { id: "versiones", etiqueta: "Versiones" },
];

const SUBMENUS = {
  colaboradores: [
    // Un aviso al móvil de todo el equipo (v79).
    { id: "avisar-equipo", etiqueta: "Avisar equipo" },
    { id: "colaboradores-datos", etiqueta: "Datos Colab." },
    // El tercer nivel: el anfitrión y cada colaborador, para ver su
    // formulario como lo ve esa persona.
    { id: "colaboradores-formularios", etiqueta: "Formularios", porColaborador: true },
  ],
  configuracion: SUBMENU_CONFIGURACION,
  // «Formulario» (v81.5), «Lista» y, desde v96.1, «Invitaciones» (él: «es
  // un proceso que surge después de haber atendido a todos los invitados»).
  invitados: [
    { id: "nuevo-invitado", etiqueta: ETIQUETA_FORMULARIO_INVITADO },
    { id: "invitaciones", etiqueta: ETIQUETAS_VENTANAS.invitaciones },
    { id: "invitados-lista", etiqueta: "Lista", aparte: true },
  ],
};

// En el ordenador se abren en su propia ventana del sistema (usePopupWindow
// o una página propia): el mapa las marca «ventana aparte».
const APARTE = new Set(["mesas", "musicaEvento"]);

const porEtiqueta = (a, b) => a.etiqueta.localeCompare(b.etiqueta, "es");

// El árbol del menú, en orden alfabético en cada nivel (él). Cada entrada:
// { id, etiqueta, submenu?, aparte?, peligro?, porColaborador? }.
// `porColaborador`: su submenú lo forman el anfitrión y cada colaborador.
// «Mi cuenta» solo con sesión de verdad (v50.6).
export function estructuraMenuAnfitrion({ conMiCuenta = true } = {}) {
  const nivel1 = ORDEN_VENTANAS.map((id) => ({
    id,
    etiqueta: ETIQUETAS_VENTANAS[id],
    ...(APARTE.has(id) ? { aparte: true } : {}),
    ...(SUBMENUS[id] ? { submenu: [...SUBMENUS[id]].sort(porEtiqueta) } : {}),
  }));
  if (conMiCuenta) nivel1.push({ id: "miCuenta", etiqueta: "Mi cuenta" });
  return nivel1.sort(porEtiqueta);
}
