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
  Crown,
  UserCircle,
  Calendar,
  Euro,
  Globe,
  FileText,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { C } from "../theme";
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
  plano: Map,
  progreso: Gauge,
  versiones: History,
};

// Submenú de "Configuración": cada parte se abre en su propia ventana,
// igual que antes — solo cambia cómo se llega hasta ella.
const SUBMENU_CONFIGURACION = [
  { id: "config-datos-evento", etiqueta: "Datos del evento", icono: Calendar },
  { id: "config-precios", etiqueta: "Precios", icono: Euro },
  { id: "config-url-web", etiqueta: "URL web", icono: Globe },
  { id: "config-email-anfitrion", etiqueta: "Email anfitrión", icono: Mail },
  { id: "config-plantillas-email", etiqueta: "Texto emails", icono: FileText },
  { id: "config-zona-reinicio", etiqueta: "Reinicios", icono: RotateCcw },
  { id: "config-zona-peligro", etiqueta: "Borrado total", icono: Trash2 },
];

export function DesplegableSecciones({ abierto, toggle, colaboradores, onCambiarRol, anfitrionToken }) {
  const opciones = ORDEN_VENTANAS.map((clave) => {
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
              { id: "rol-anfitrion", etiqueta: "Anfitrión", icono: Crown, onClick: () => onCambiarRol(anfitrionToken) },
              ...colaboradores.map((c) => ({
                id: `rol-${c.id}`,
                etiqueta: c.nombre,
                icono: UserCircle,
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
          className="absolute px-3 py-1.5 rounded text-sm font-medium"
          style={{ bottom: 8, right: 8, background: C.ink, color: C.paper, border: `1px solid ${C.ink}` }}
          title="Abre la sección elegida en una ventana flotante; puedes tener varias abiertas a la vez"
        >
          Abrir sección…
        </button>
      )}
    />
  );
}
