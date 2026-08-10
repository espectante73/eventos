// Botón "Abrir sección…" de la Portada — usa el menú propio compartido
// (MenuFlotante.jsx) en vez de un <select> nativo, para que se vea igual
// en cualquier navegador (ver comentario en MenuFlotante.jsx).
//
// Desde el 2026-08-09 también incluye, arriba del todo y separado por una
// línea, el cambio de vista Anfitrión/colaborador — antes vivía en una
// barra ancha aparte en App.jsx. Al fusionarlo aquí, esa barra desapareció
// del todo: ver VistaColaborador.jsx para el menú equivalente (más corto,
// sin la lista de ventanas) que aparece ahí cuando el anfitrión está
// previsualizando a un colaborador.
import { Bell, Users, Settings, Save, Wallet, Mail, List, Utensils, Map, Gauge, History, Crown, UserCircle, ChevronLeft } from "lucide-react";
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

export function DesplegableSecciones({ abierto, toggle, colaboradores, onCambiarRol, anfitrionToken }) {
  const opcionesRol = [
    { id: "encabezado-vista", encabezado: "Ver como" },
    {
      id: "rol-anfitrion",
      etiqueta: "✓ Anfitrión",
      icono: Crown,
      onClick: () => onCambiarRol(anfitrionToken),
    },
    ...colaboradores.map((c) => ({
      id: `rol-${c.id}`,
      etiqueta: c.nombre,
      icono: UserCircle,
      onClick: () => onCambiarRol(c.id),
    })),
  ];

  const opcionesVentanas = [
    { id: "encabezado-ventanas", encabezado: "Ventanas", separador: true },
    ...ORDEN_VENTANAS.map((clave) => ({
      id: clave,
      etiqueta: (abierto[clave] ? "✓ " : "") + ETIQUETAS_VENTANAS[clave],
      icono: ICONOS_VENTANAS[clave],
      onClick: () => toggle(clave),
    })),
  ];

  return (
    <MenuFlotante
      anchor="left"
      opciones={[...opcionesRol, ...opcionesVentanas]}
      render={({ ref, toggle: abrirCerrar }) => (
        <button
          ref={ref}
          onClick={abrirCerrar}
          className="absolute flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium"
          style={{ bottom: 8, right: 8, background: C.ink, color: C.paper, border: `1px solid ${C.ink}` }}
          title="Abre la sección elegida en una ventana flotante, o cambia de vista; puedes tener varias ventanas abiertas a la vez"
        >
          <ChevronLeft size={14} style={{ opacity: 0.8 }} />
          Abrir sección…
        </button>
      )}
    />
  );
}
