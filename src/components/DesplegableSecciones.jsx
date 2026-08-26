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
import {
  Bell,
  Users,
  Settings,
  Save,
  Wallet,
  Mail,
  List,
  Utensils,
  Map,
  Gauge,
  History,
  UserCog,
  Eye,
  User,
  Calendar,
  Euro,
  Globe,
  FileText,
  FlaskConical,
  RotateCcw,
  Trash2,
  Megaphone,
  Music,
  KeyRound,
  Clock3,
} from "lucide-react";
import { C } from "../theme";
import { UserSolido } from "./Widgets";
import { ORDEN_VENTANAS, ETIQUETAS_VENTANAS } from "./VentanaFlotante";
import { MenuFlotante } from "./MenuFlotante";

// Un icono por sección, para ubicarla de un vistazo en la lista.
const ICONOS_VENTANAS = {
  avisos: Bell,
  colaboradores: Users,
  configuracion: Settings,
  copiaSeguridad: Save,
  cuentas: Wallet,
  invitaciones: Mail,
  invitados: List,
  mesas: Utensils,
  novedades: Megaphone,
  permisos: KeyRound,
  plano: Map,
  progreso: Gauge,
  versiones: History,
};

// Submenú de "Configuración": cada parte se abre en su propia ventana,
// igual que antes — solo cambia cómo se llega hasta ella. "Modo
// pruebas" y "Borrado total" llevan su propio chip de fondo rojo (letra
// clara) de distinta intensidad: Borrado total es lo más irreversible
// de los dos, así que se ve más rojo — a petición del usuario,
// 2026-08-12.
const SUBMENU_CONFIGURACION = [
  { id: "config-datos-evento", etiqueta: "Datos evento", icono: Calendar },
  { id: "config-precios", etiqueta: "Precios", icono: Euro },
  { id: "config-url-web", etiqueta: "URL web", icono: Globe },
  { id: "config-email-anfitrion", etiqueta: "Email anfitrión", icono: Mail },
  { id: "config-plantillas-email", etiqueta: "Texto emails", icono: FileText },
  { id: "config-musica", etiqueta: "Fondo musical", icono: Music },
  { id: "config-cronograma", etiqueta: "Cronograma", icono: Clock3 },
  { id: "config-modo-pruebas", etiqueta: "Modo pruebas", icono: FlaskConical, fondo: C.wax, color: C.paper },
  { id: "config-zona-reinicio", etiqueta: "Reinicios", icono: RotateCcw },
  { id: "config-zona-peligro", etiqueta: "Borrado total", icono: Trash2, fondo: "#B00020", color: C.paper },
];

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
  posicion = { bottom: 8, right: 8 },
}) {
  const opciones = ORDEN_VENTANAS.map((clave) => {
    // Novedades abre una ventana de verdad del sistema operativo, no una
    // VentanaFlotante (ver lib/usePopupWindow.js) -- por eso no pasa por
    // el "toggle(clave)" genérico de las demás, y no lleva el prefijo
    // "✓ " (no hay ningún estado fiable de "abierta" que reflejar aquí:
    // la persona puede haberla cerrado a mano con la X del sistema
    // operativo sin que este menú se entere al momento).
    if (clave === "novedades") {
      return {
        id: clave,
        etiqueta: ETIQUETAS_VENTANAS[clave],
        icono: ICONOS_VENTANAS[clave],
        onClick: abrirNovedades,
      };
    }
    if (clave === "colaboradores") {
      return {
        id: clave,
        etiqueta: ETIQUETAS_VENTANAS[clave],
        icono: ICONOS_VENTANAS[clave],
        submenu: [
          {
            id: "colaboradores-datos",
            etiqueta: (abierto["colaboradores-datos"] ? "✓ " : "") + "Datos Colab.",
            icono: UserCog,
            onClick: () => toggle("colaboradores-datos"),
          },
          {
            id: "colaboradores-formularios",
            etiqueta: "Formularios",
            icono: Eye,
            submenu: [
              { id: "rol-anfitrion", etiqueta: "Anfitrión", icono: UserSolido, onClick: () => onCambiarRol(anfitrionToken) },
              ...colaboradores.map((c) => ({
                id: `rol-${c.id}`,
                etiqueta: c.nombre,
                icono: User,
                onClick: () => onCambiarRol(c.id),
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
        submenu: SUBMENU_CONFIGURACION.map((s) => ({
          id: s.id,
          etiqueta: (abierto[s.id] ? "✓ " : "") + s.etiqueta,
          icono: s.icono,
          color: s.color,
          fondo: s.fondo,
          onClick: () => toggle(s.id),
        })),
      };
    }
    return {
      id: clave,
      etiqueta: (abierto[clave] ? "✓ " : "") + ETIQUETAS_VENTANAS[clave],
      icono: ICONOS_VENTANAS[clave],
      onClick: () => toggle(clave),
    };
  });

  return (
    <MenuFlotante
      anchor="right"
      opciones={opciones}
      render={({ ref, toggle: abrirCerrar }) => (
        <button
          ref={ref}
          onClick={abrirCerrar}
          // Mismo aspecto que "Cerrar sesión" (Portada.jsx): .boton-flotante-imagen
          // (index.css) lleva el fondo/letra/relieve -- a petición del
          // usuario, los dos botones que flotan sobre la imagen deben
          // verse como un mismo par, no dos estilos distintos.
          className="boton-3d boton-flotante-imagen cristal-difuminado absolute px-4 py-3 rounded-full text-sm font-medium"
          style={posicion}
          title="Abre la sección elegida en una ventana flotante; puedes tener varias abiertas a la vez"
        >
          Abrir sección…
        </button>
      )}
    />
  );
}
