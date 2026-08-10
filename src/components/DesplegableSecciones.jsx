// Botón "Abrir sección…" de la Portada — usa el menú propio compartido
// (MenuFlotante.jsx) en vez de un <select> nativo, para que se vea igual
// en cualquier navegador (ver comentario en MenuFlotante.jsx).
//
// "Colaboradores" y "Configuración" no abren directamente una ventana:
// despliegan su propio submenú anidado hacia la izquierda (igual patrón
// que un menú de sistema operativo), sin pasar por una ventana
// intermedia — antes "Configuración" era una ventana vacía que solo
// contenía otro desplegable ("SECCIÓN"); ahora ese paso se salta del
// todo. "Colaboradores" se dividió en dos ventanas reales (Datos Colab.
// / Formularios, ver VentanaColaboradoresDatos.jsx y
// VentanaColaboradoresFormularios.jsx) por el mismo motivo: son dos
// cosas distintas (quién es cada colaborador vs. qué invitados gestiona
// cada uno) que antes vivían mezcladas en una sola ventana.
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
  ClipboardList,
  Calendar,
  Tag,
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

// Submenú de "Colaboradores": las dos ventanas en las que se dividió.
const SUBMENU_COLABORADORES = [
  { id: "colaboradores-datos", etiqueta: "Datos Colab.", icono: UserCog },
  { id: "colaboradores-formularios", etiqueta: "Formularios", icono: ClipboardList },
];

// Submenú de "Configuración": cada parte se abre en su propia ventana,
// igual que antes — solo cambia cómo se llega hasta ella.
const SUBMENU_CONFIGURACION = [
  { id: "config-datos-evento", etiqueta: "Datos del evento", icono: Calendar },
  { id: "config-precios", etiqueta: "Precios", icono: Tag },
  { id: "config-url-web", etiqueta: "URL web", icono: Globe },
  { id: "config-email-anfitrion", etiqueta: "Email anfitrión", icono: Mail },
  { id: "config-plantillas-email", etiqueta: "Texto emails", icono: FileText },
  { id: "config-zona-reinicio", etiqueta: "Reinicios", icono: RotateCcw },
  { id: "config-zona-peligro", etiqueta: "Borrado total", icono: Trash2 },
];

export function DesplegableSecciones({ abierto, toggle }) {
  const submenu = (lista) =>
    lista.map((s) => ({
      id: s.id,
      etiqueta: (abierto[s.id] ? "✓ " : "") + s.etiqueta,
      icono: s.icono,
      onClick: () => toggle(s.id),
    }));

  const opciones = ORDEN_VENTANAS.map((clave) => {
    if (clave === "colaboradores") {
      return {
        id: clave,
        etiqueta: ETIQUETAS_VENTANAS[clave],
        icono: ICONOS_VENTANAS[clave],
        submenu: submenu(SUBMENU_COLABORADORES),
      };
    }
    if (clave === "configuracion") {
      return {
        id: clave,
        etiqueta: ETIQUETAS_VENTANAS[clave],
        icono: ICONOS_VENTANAS[clave],
        submenu: submenu(SUBMENU_CONFIGURACION),
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
